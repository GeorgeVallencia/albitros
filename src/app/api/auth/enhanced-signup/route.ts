import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createJWT, setSessionCookie } from '@/lib/auth';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// Dynamic import to avoid TypeScript module resolution issues
let emailService: any;
try {
  emailService = require('@/lib/email').emailService;
} catch (error) {
  console.warn('Email service not available:', error);
  emailService = {
    sendWelcomeEmail: async () => true,
    sendPasswordResetEmail: async () => true
  };
}

const prisma = new PrismaClient();

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

    // Debug: Log the received body
    console.log('Enhanced signup received body:', JSON.stringify(body, null, 2));

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

    // Ensure default company exists
    const defaultCompanyId = "cmkp22c010000xl8khllyt6g6";
    let company = await (prisma as any).company.findUnique({
      where: { id: defaultCompanyId }
    });

    if (!company) {
      // Create default company if it doesn't exist
      company = await (prisma as any).company.create({
        data: {
          id: defaultCompanyId,
          name: validatedData.company || "Default Company",
          size: validatedData.companySize || "SMALL",
          claimsVolume: validatedData.claimsVolume || "UNDER_10K"
        }
      });
      console.log('Created default company:', company);
    }

    // Create user with default company
    const user = await (prisma as any).user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        username: username,
        role: 'MEMBER', // Default role for new users
        companyId: defaultCompanyId,
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

    // Set session cookie using the proper function
    await setSessionCookie(token);

    return response;

  } catch (error: any) {
    console.error('Enhanced signup error:', error);

    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.issues);
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.issues,
          fields: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        },
        { status: 400 }
      );
    }

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Catch any other unexpected errors
    console.error('Unexpected signup error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred during signup'
      },
      { status: 500 }
    );
  }
}
