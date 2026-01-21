import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authRateLimit } from '@/lib/rate-limit';
import { withRateLimit } from '@/lib/rate-limit';
import { createJWT, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginAttemptSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

export const POST = withRateLimit(authRateLimit)(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Validate input
    const parsed = loginAttemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsed.data;

    // Find user with account lockout info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        authAttempts: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      // Record failed attempt for non-existent user
      await recordFailedAttempt(email, 'INVALID_EMAIL');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockoutRemaining = user.lockedUntil
        ? Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60))
        : 0;

      if (lockoutRemaining > 0) {
        return NextResponse.json(
          {
            error: `Account locked. Try again in ${lockoutRemaining} minutes.`,
            locked: true,
            lockoutRemaining
          },
          { status: 423 }
        );
      } else {
        // Unlock account if lockout period has passed
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isLocked: false,
            lockedUntil: null
          }
        });
      }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Please verify your email before logging in.',
          emailNotVerified: true
        },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      await handleFailedLogin(user);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    // Successful login - clear failed attempts
    await clearFailedAttempts(user.id);

    // Create session token
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
        mfaEnabled: user.mfaEnabled
      }
    });

    // Set session cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    response.cookies.set('insurmap_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge
    });

    // Log successful login
    await logAuthEvent(user.id, 'LOGIN_SUCCESS', {
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

async function handleFailedLogin(user: any) {
  const now = new Date();

  // Record failed attempt
  await prisma.authAttempt.create({
    data: {
      userId: user.id,
      email: user.email,
      success: false,
      reason: 'INVALID_PASSWORD',
      ipAddress: 'unknown', // Would be extracted from request
      userAgent: 'unknown'
    }
  });

  // Get recent failed attempts
  const recentFailures = await prisma.authAttempt.count({
    where: {
      userId: user.id,
      success: false,
      createdAt: {
        gte: new Date(now.getTime() - 60 * 60 * 1000) // Last hour
      }
    }
  });

  // Lock account after 5 failed attempts
  if (recentFailures >= 5) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isLocked: true,
        lockedUntil: new Date(now.getTime() + 30 * 60 * 1000) // Lock for 30 minutes
      }
    });
  }
}

async function recordFailedAttempt(email: string, reason: string) {
  await prisma.authAttempt.create({
    data: {
      email,
      success: false,
      reason,
      ipAddress: 'unknown',
      userAgent: 'unknown'
    }
  });
}

async function clearFailedAttempts(userId: string) {
  await prisma.authAttempt.deleteMany({
    where: { userId }
  });
}

async function logAuthEvent(userId: string, event: string, metadata: any) {
  await prisma.auditLog.create({
    data: {
      userId,
      action: event,
      resource: 'AUTH',
      metadata,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent
    }
  });
}
