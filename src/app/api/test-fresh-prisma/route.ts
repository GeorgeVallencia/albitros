import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    // Create fresh Prisma client instance
    const freshPrisma = new PrismaClient();
    
    console.log('Fresh Prisma client created');
    console.log('Available models:', Object.keys(freshPrisma));
    
    // Test claim model
    const claimModel = (freshPrisma as any).claim;
    console.log('Claim model exists:', !!claimModel);
    
    if (claimModel) {
      const count = await claimModel.count();
      return NextResponse.json({
        message: 'Fresh Prisma client works',
        claimCount: count,
        availableModels: Object.keys(freshPrisma)
      });
    } else {
      return NextResponse.json({
        error: 'Claim model not found in fresh client',
        availableModels: Object.keys(freshPrisma)
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Fresh Prisma test error:', error);
    return NextResponse.json({
      error: 'Fresh Prisma test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
