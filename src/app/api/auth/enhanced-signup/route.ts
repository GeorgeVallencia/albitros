import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generalRateLimit } from '@/lib/rate-limit';
import { withRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { createJWT, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().min(2),
  companySize: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
  claimsVolume: z.enum([
    'UNDER_10K',
    'BETWEEN_10K_50K',
    'BETWEEN_50K_100K',
    'BETWEEN_100K_500K',
    'OVER_500K'
  ])
});

export const POST = withRateLimit(generalRateLimit)(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create company first
    const company = await prisma.company.create({
      data: {
        name: validatedData.companyName,
        size: validatedData.companySize,
        claimsVolume: validatedData.claimsVolume
      }
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        username: validatedData.email.split('@')[0], // Generate username from email
        companyId: company.id,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      }
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      template: 'email-verification',
      data: {
        username: user.fullName,
        verificationUrl
      }
    });

    // Log signup
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: 'USER_SIGNUP',
        resource: 'AUTH',
        details: {
          email: user.email,
          companyName: company.name
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: false
      }
    });

  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Verify email endpoint
export const PUT = withRateLimit(generalRateLimit)(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { token } = z.object({ token: z.string() }).parse(body);

    // Find user with valid verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date()
        }
      },
      include: { company: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    // Log verification
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'EMAIL_VERIFIED',
        resource: 'AUTH',
        details: { email: user.email },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    // Auto-login after verification
    const sessionToken = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    const response = NextResponse.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: true,
        role: user.role
      }
    });

    setSessionCookie(sessionToken, response);

    return response;

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Resend verification email
export const PATCH = withRateLimit(generalRateLimit)(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      }
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      template: 'email-verification',
      data: {
        username: user.fullName,
        verificationUrl
      }
    });

    return NextResponse.json({
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
