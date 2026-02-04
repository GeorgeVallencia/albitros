import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing Prisma models...');

    // Test if we can access the claim model
    console.log('Prisma object:', prisma);
    console.log('Prisma keys:', Object.keys(prisma));

    // Check if claim model exists
    const claimModel = (prisma as any).claim;
    console.log('Claim model:', claimModel);

    if (!claimModel) {
      return NextResponse.json({
        error: 'Claim model not found',
        availableModels: Object.keys(prisma),
        prismaType: typeof prisma
      }, { status: 500 });
    }

    // Test a simple query
    const claimCount = await claimModel.count();
    console.log('Claim count:', claimCount);

    return NextResponse.json({
      message: 'Prisma test successful',
      claimCount,
      availableModels: Object.keys(prisma)
    });

  } catch (error: any) {
    console.error('Prisma test error:', error);
    return NextResponse.json({
      error: 'Prisma test failed',
      message: error.message,
      stack: error.stack,
      availableModels: Object.keys(prisma)
    }, { status: 500 });
  }
}
