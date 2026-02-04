import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Create the default company that signup expects
    const company = await (prisma as any).company.create({
      data: {
        id: "cmkp22c010000xl8khllyt6g6", // Same ID as in signup
        name: "Default Company",
        domain: "default.com",
        industry: "INSURANCE",
        size: "SMALL",
        claimsVolume: "UNDER_10K",
        isActive: true,
        settings: {
          fraudDetection: {
            enabled: true,
            sensitivity: "MEDIUM"
          }
        }
      }
    });

    console.log('Created default company:', company);

    return NextResponse.json({
      message: "Default company created successfully",
      company
    });

  } catch (error: any) {
    console.error('Error creating default company:', error);
    return NextResponse.json({
      error: 'Failed to create default company',
      message: error.message
    }, { status: 500 });
  }
}
