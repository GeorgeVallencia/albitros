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
  username: z.string().min(3).max(32),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'])
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = enhancedSignupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user with default company
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        username: validatedData.username,
        role: validatedData.role,
        companyId: "cmkp22c010000xl8khllyt6g6", // Default company ID
        emailVerified: false
      }
    });

    // Create JWT and set session
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role
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

    setSessionCookie(token, response);
    return response;

  } catch (error) {
    console.error('Enhanced signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email or username already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
