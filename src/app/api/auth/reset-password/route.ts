import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Simple rate limiting using in-memory store
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // 3 requests per hour

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = `reset-password:${identifier}`;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const data = rateLimitStore.get(key);

  if (now > data.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (data.count >= RATE_LIMIT_MAX) {
    return false;
  }

  data.count++;
  return true;
}

// Request password reset
export async function POST(req: NextRequest) {
  try {
    // Simple rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again in 1 hour.' },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const emailResult = forgotPasswordSchema.safeParse(body);
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: emailResult.data.email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpiry
      }
    });

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        template: 'password-reset',
        data: {
          username: user.fullName || user.email,
          resetUrl,
          expiryHours: 1
        }
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Don't expose email errors to user, but log them
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Log the event
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          resource: 'AUTH',
          details: {
            email: user.email
          },
          ipAddress: ip
        }
      });
    } catch (logError) {
      console.error('Failed to log audit event:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reset password with token
export async function PUT(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const resetResult = resetPasswordSchema.safeParse(body);
    if (!resetResult.success) {
      return NextResponse.json(
        { error: resetResult.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { token, password } = resetResult.data;

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        // Clear failed attempts on password reset
        isLocked: false,
        lockedUntil: null
      }
    });

    // Clear any existing auth attempts
    try {
      await prisma.authAttempt.deleteMany({
        where: { userId: user.id }
      });
    } catch (clearError) {
      console.error('Failed to clear auth attempts:', clearError);
      // Don't fail the request if this fails
    }

    // Log the event
    try {
      const ip = req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown';

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_COMPLETED',
          resource: 'AUTH',
          details: {},
          ipAddress: ip
        }
      });
    } catch (logError) {
      console.error('Failed to log audit event:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      message: 'Password reset successfully. Please log in with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
