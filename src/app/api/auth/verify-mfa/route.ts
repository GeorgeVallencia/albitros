import { createJWT, setSessionCookie, verifyJWT, getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authRateLimit } from '@/lib/rate-limit';
import { withRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';

const mfaVerificationSchema = z.object({
  token: z.string().length(6),
  backupCode: z.string().optional()
});

// Verify MFA during login
export const POST = withRateLimit(authRateLimit)(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { token, backupCode } = mfaVerificationSchema.parse(body);

    // Get the temporary session that contains user info after password verification
    const tempToken = req.cookies.get('temp_mfa_session')?.value;

    if (!tempToken) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    // Verify temporary session
    let tempSession;
    try {
      tempSession = await verifyJWT(tempToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: tempSession.sub }
    });

    if (!user || !user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA not enabled for this account' },
        { status: 400 }
      );
    }

    let isValid = false;
    let method = 'TOTP';

    // Try TOTP token first
    if (token) {
      try {
        isValid = authenticator.verify({
          token,
          secret: user.mfaSecret!
        });
      } catch (error) {
        console.error('TOTP verification error:', error);
      }
    }

    // Try backup code if TOTP failed
    if (!isValid && backupCode && user.backupCodes.length > 0) {
      isValid = user.backupCodes.includes(backupCode.toUpperCase());
      method = 'BACKUP_CODE';

      if (isValid) {
        // Remove used backup code
        const updatedBackupCodes = user.backupCodes.filter(
          code => code !== backupCode.toUpperCase()
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { backupCodes: updatedBackupCodes }
        });
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Create permanent session
    const sessionToken = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    // Create response
    const response = NextResponse.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mfaEnabled: user.mfaEnabled
      }
    });

    // Set permanent session cookie
    setSessionCookie(sessionToken, response);

    // Clear temporary session
    response.cookies.set('temp_mfa_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    // Log successful MFA verification
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'MFA_VERIFICATION_SUCCESS',
        resource: 'AUTH',
        details: { method },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return response;

  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Check MFA status for authenticated user
export const GET = async (req: NextRequest) => {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        backupCodes: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mfaEnabled: user.mfaEnabled,
      backupCodesCount: user.backupCodes?.length || 0,
      hasBackupCodes: (user.backupCodes?.length || 0) > 0
    });

  } catch (error) {
    console.error('MFA status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
