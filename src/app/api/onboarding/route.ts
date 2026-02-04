import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createJWT, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const onboardingSchema = z.object({
  step: z.enum(['company', 'admin', 'preferences', 'complete']),
  data: z.object({
    // Company info
    companyName: z.string().min(2).optional(),
    companySize: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
    claimsVolume: z.enum(['UNDER_10K', 'BETWEEN_10K_50K', 'BETWEEN_50K_100K', 'BETWEEN_100K_500K', 'OVER_500K']).optional(),
    industry: z.string().optional(),
    website: z.string().url().optional(),
    
    // Admin info
    adminEmail: z.string().email().optional(),
    adminFirstName: z.string().min(2).optional(),
    adminLastName: z.string().min(2).optional(),
    adminPassword: z.string().min(8).optional(),
    
    // Preferences
    timezone: z.string().optional(),
    currency: z.string().default('USD'),
    dateFormat: z.string().default('MM/DD/YYYY'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      webhook: z.boolean().default(false)
    }).optional(),
    
    // Integration preferences
    integrationType: z.enum(['api', 'file', 'both']).default('api'),
    webhookUrl: z.string().url().optional(),
    ssoEnabled: z.boolean().default(false)
  }).optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = onboardingSchema.parse(body);

    let result;

    switch (validatedData.step) {
      case 'company':
        result = await handleCompanyStep(validatedData.data);
        break;
      case 'admin':
        result = await handleAdminStep(validatedData.data);
        break;
      case 'preferences':
        result = await handlePreferencesStep(validatedData.data);
        break;
      case 'complete':
        result = await handleCompleteStep(validatedData.data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid onboarding step' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      step: validatedData.step,
      result
    });

  } catch (error: any) {
    console.error('Onboarding error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get onboarding session data
    const session = await getOnboardingSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Onboarding session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCompanyStep(data: any) {
  // Check if company already exists
  const existingCompany = await prisma.company.findFirst({
    where: {
      OR: [
        { name: data.companyName },
        // In a real implementation, you might check by domain or other identifiers
      ]
    }
  });

  if (existingCompany) {
    throw new Error('Company already exists');
  }

  // Create company
  const company = await prisma.company.create({
    data: {
      name: data.companyName,
      size: data.companySize,
      claimsVolume: data.claimsVolume
    }
  });

  // Generate session ID for onboarding flow
  const sessionId = generateSessionId();
  
  // Store onboarding session (in a real implementation, you'd use Redis or database)
  await storeOnboardingSession(sessionId, {
    companyId: company.id,
    step: 'company',
    data
  });

  return {
    companyId: company.id,
    sessionId,
    nextStep: 'admin'
  };
}

async function handleAdminStep(data: any) {
  const { sessionId } = data;
  const session = await getOnboardingSession(sessionId);

  if (!session) {
    throw new Error('Invalid session');
  }

  // Check if admin user already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: data.adminEmail }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.adminPassword, 12);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email: data.adminEmail,
      passwordHash,
      fullName: `${data.adminFirstName} ${data.adminLastName}`,
      username: data.adminEmail.split('@')[0],
      role: 'ADMIN',
      companyId: session.companyId,
      emailVerified: true
    }
  });

  // Update session
  await updateOnboardingSession(sessionId, {
    ...session,
    step: 'admin',
    adminId: user.id,
    data
  });

  return {
    userId: user.id,
    nextStep: 'preferences'
  };
}

async function handlePreferencesStep(data: any) {
  const { sessionId } = data;
  const session = await getOnboardingSession(sessionId);

  if (!session) {
    throw new Error('Invalid session');
  }

  // Store preferences (in a real implementation, you'd save these to the company/user settings)
  await updateOnboardingSession(sessionId, {
    ...session,
    step: 'preferences',
    preferences: data
  });

  return {
    nextStep: 'complete'
  };
}

async function handleCompleteStep(data: any) {
  const { sessionId } = data;
  const session = await getOnboardingSession(sessionId);

  if (!session) {
    throw new Error('Invalid session');
  }

  // Create JWT for admin user
  const token = await createJWT({
    sub: session.adminId,
    email: session.data.adminEmail,
    role: 'ADMIN',
    fullName: `${session.data.adminFirstName} ${session.data.adminLastName}`
  });

  // Set up initial data for the company
  await setupInitialCompanyData(session.companyId, session);

  // Clean up session
  await deleteOnboardingSession(sessionId);

  const response = NextResponse.json({
    success: true,
    message: 'Onboarding completed successfully',
    redirectUrl: '/dashboard'
  });

  // Set session cookie
  setSessionCookie(response, token);

  return response;
}

async function setupInitialCompanyData(companyId: string, session: any) {
  // Create sample patients and providers for demonstration
  const samplePatients = [
    { firstName: 'John', lastName: 'Doe', mrn: 'PAT001' },
    { firstName: 'Jane', lastName: 'Smith', mrn: 'PAT002' },
    { firstName: 'Bob', lastName: 'Johnson', mrn: 'PAT003' }
  ];

  const sampleProviders = [
    { firstName: 'Dr. Sarah', lastName: 'Wilson', npi: '1234567890', specialty: 'Family Medicine' },
    { firstName: 'Dr. Michael', lastName: 'Brown', npi: '0987654321', specialty: 'Cardiology' },
    { firstName: 'Dr. Emily', lastName: 'Davis', npi: '5678901234', specialty: 'Orthopedics' }
  ];

  // Create sample patients
  for (const patient of samplePatients) {
    await prisma.patient.create({
      data: {
        ...patient,
        companyId
      }
    });
  }

  // Create sample providers
  for (const provider of sampleProviders) {
    await prisma.provider.create({
      data: {
        ...provider,
        companyId
      }
    });
  }

  // Create welcome audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPANY_ONBOARDING_COMPLETED',
      resource: 'Company',
      details: {
        companyName: session.data.companyName,
        adminEmail: session.data.adminEmail,
        onboardingDate: new Date().toISOString()
      },
      userId: session.adminId,
      companyId
    }
  });
}

// Session management functions (in a real implementation, you'd use Redis or database)
const onboardingSessions = new Map();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function storeOnboardingSession(sessionId: string, data: any): Promise<void> {
  onboardingSessions.set(sessionId, {
    ...data,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });
}

async function getOnboardingSession(sessionId: string): Promise<any> {
  const session = onboardingSessions.get(sessionId);
  
  if (!session || new Date() > session.expiresAt) {
    onboardingSessions.delete(sessionId);
    return null;
  }
  
  return session;
}

async function updateOnboardingSession(sessionId: string, data: any): Promise<void> {
  const existing = await getOnboardingSession(sessionId);
  if (existing) {
    onboardingSessions.set(sessionId, {
      ...existing,
      ...data,
      updatedAt: new Date()
    });
  }
}

async function deleteOnboardingSession(sessionId: string): Promise<void> {
  onboardingSessions.delete(sessionId);
}

// Clean up expired sessions periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = new Date();
    for (const [sessionId, session] of onboardingSessions.entries()) {
      if (now > session.expiresAt) {
        onboardingSessions.delete(sessionId);
      }
    }
  }, 60 * 60 * 1000); // Check every hour
}
