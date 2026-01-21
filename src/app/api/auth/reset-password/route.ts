import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { passwordResetRateLimit } from '@/lib/rate-limit';
import { withRateLimit } from '@/lib/rate-limit';
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

// Request password reset
export const POST = withRateLimit(passwordResetRateLimit)(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email }
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
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      template: 'password-reset',
      data: {
        username: user.fullName || user.email,
        resetUrl,
        expiryHours: 1
      }
    });

    // Log the event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'AUTH',
        details: {
          email: user.email
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

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
});

// Reset password with token
export const PUT = withRateLimit(passwordResetRateLimit)(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

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
    await prisma.authAttempt.deleteMany({
      where: { userId: user.id }
    });

    // Log the event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'AUTH',
        details: {},
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

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
});
