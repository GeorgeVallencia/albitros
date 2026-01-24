import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createJWT, setSessionCookie } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

const enhancedSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  company: z.string().min(2),
  companySize: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
  claimsVolume: z.enum([
    'UNDER_10K',
    'BETWEEN_10K_50K',
    'BETWEEN_50K_100K',
    'BETWEEN_100K_500K',
    'OVER_500K'
  ])
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = enhancedSignupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Generate username from email
    const username = validatedData.email.split('@')[0];

    // Create user with default company
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        username: username,
        role: 'MEMBER', // Default role for new users
        companyId: "cmkp22c010000xl8khllyt6g6", // Default company ID
        emailVerified: false
      }
    });

    // Create JWT and set session
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    const response = NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        emailVerified: false
      }
    });

    // Set session cookie on the response
    response.cookies.set("insurmap_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error('Enhanced signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
