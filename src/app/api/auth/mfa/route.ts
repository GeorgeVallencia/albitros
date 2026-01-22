import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createJWT, setSessionCookie } from '@/lib/auth';
import { authRateLimit } from '@/lib/rate-limit';
import { withRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { sendEmail } from '@/lib/email';

const setupMFASchema = z.object({
  password: z.string().min(1)
});

const verifyMFASchema = z.object({
  token: z.string().length(6),
  backupCode: z.string().optional()
});

const disableMFASchema = z.object({
  password: z.string().min(1),
  token: z.string().length(6)
});

// Generate MFA secret and QR code
export const POST = withRateLimit(authRateLimit)(async (req: NextRequest) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { password } = setupMFASchema.parse(body);

    // Get user and verify password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password (you'll need to import bcrypt)
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    const issuer = 'Albitros';
    const label = `${issuer} (${user.email})`;
    const otpauthUrl = authenticator.keyuri(user.email, issuer, secret);

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        backupCodes
      }
    });

    // Log setup initiation
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_SETUP_INITIATED',
        resource: 'AUTH',
        details: { backupCodesCount: backupCodes.length },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataURL,
      backupCodes,
      message: 'Save your backup codes securely. They will not be shown again.'
    });

  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Verify and enable MFA
export const PUT = withRateLimit(authRateLimit)(async (req: NextRequest) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token, backupCode } = verifyMFASchema.parse(body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA setup not initiated' },
        { status: 400 }
      );
    }

    let isValid = false;

    // Try TOTP token first
    if (token) {
      try {
        isValid = authenticator.verify({
          token,
          secret: user.mfaSecret
        });
      } catch (error) {
        console.error('TOTP verification error:', error);
      }
    }

    // Try backup code if TOTP failed
    if (!isValid && backupCode && user.backupCodes.length > 0) {
      isValid = user.backupCodes.includes(backupCode.toUpperCase());

      if (isValid) {
        // Remove used backup code
        const updatedBackupCodes = user.backupCodes.filter(
          code => code !== backupCode.toUpperCase()
        );

        await prisma.user.update({
          where: { id: userId },
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

    // Enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true }
    });

    // Log successful MFA enable
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_ENABLED',
        resource: 'AUTH',
        details: { method: backupCode ? 'BACKUP_CODE' : 'TOTP' },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'MFA enabled successfully',
      mfaEnabled: true
    });

  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Disable MFA
export const DELETE = withRateLimit(authRateLimit)(async (req: NextRequest) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { password, token } = disableMFASchema.parse(body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    // Verify TOTP token if MFA is enabled
    if (user.mfaEnabled && user.mfaSecret) {
      try {
        const tokenValid = authenticator.verify({
          token,
          secret: user.mfaSecret
        });

        if (!tokenValid) {
          return NextResponse.json(
            { error: 'Invalid authentication code' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('TOTP verification error:', error);
        return NextResponse.json(
          { error: 'Invalid authentication code' },
          { status: 400 }
        );
      }
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: []
      }
    });

    // Log MFA disable
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_DISABLED',
        resource: 'AUTH',
        details: {},
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'MFA disabled successfully',
      mfaEnabled: false
    });

  } catch (error) {
    console.error('MFA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
