import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ssoConfigSchema = z.object({
  provider: z.enum(['saml', 'oidc', 'azure-ad', 'okta']),
  config: z.object({
    entityId: z.string().optional(),
    ssoUrl: z.string().url(),
    certificate: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    issuer: z.string().optional(),
    authorizationUrl: z.string().url().optional(),
    tokenUrl: z.string().url().optional(),
    userInfoUrl: z.string().url().optional(),
    scopes: z.array(z.string()).optional()
  }),
  mappings: z.object({
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string().optional(),
    department: z.string().optional()
  })
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = ssoConfigSchema.parse(body);

    // In a real implementation, you'd get companyId from authenticated user
    const companyId = "cmkp22c010000xl8khllyt6g6"; // Default company ID

    // Check if SSO config already exists for this company
    const existingConfig = await prisma.ssoConfig.findFirst({
      where: { companyId }
    });

    let ssoConfig;
    if (existingConfig) {
      // Update existing config
      ssoConfig = await prisma.ssoConfig.update({
        where: { id: existingConfig.id },
        data: {
          provider: validatedData.provider,
          config: validatedData.config,
          mappings: validatedData.mappings,
          isActive: true,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new config
      ssoConfig = await prisma.ssoConfig.create({
        data: {
          companyId,
          provider: validatedData.provider,
          config: validatedData.config,
          mappings: validatedData.mappings,
          isActive: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      ssoConfig: {
        id: ssoConfig.id,
        provider: ssoConfig.provider,
        isActive: ssoConfig.isActive,
        createdAt: ssoConfig.createdAt
      }
    });

  } catch (error: any) {
    console.error('SSO config error:', error);

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
    const companyId = "cmkp22c010000xl8khllyt6g6"; // Default company ID

    const ssoConfig = await prisma.ssoConfig.findFirst({
      where: { companyId },
      select: {
        id: true,
        provider: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
        // Don't return sensitive config data in GET request
      }
    });

    return NextResponse.json({
      success: true,
      ssoConfig
    });

  } catch (error) {
    console.error('SSO config fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
