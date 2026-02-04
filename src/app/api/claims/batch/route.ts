import { NextRequest, NextResponse } from 'next/server';
import { ClaimProcessor } from '@/lib/claims/processor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const batchClaimSchema = z.object({
  claims: z.array(z.object({
    patientId: z.string(),
    providerId: z.string(),
    serviceDate: z.string(),
    lineItems: z.array(z.object({
      procedureCode: z.string(),
      modifiers: z.array(z.string()).optional(),
      units: z.number(),
      unitCost: z.number(),
      diagnosisCodes: z.array(z.string())
    })).min(1)
  })).min(1).max(1000), // Limit batch size to prevent abuse
  options: z.object({
    continueOnError: z.boolean().default(false),
    notifyOnCompletion: z.boolean().default(false)
  }).optional()
});

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  companyId: string;
}

export async function POST(request: Request) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify JWT
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = batchClaimSchema.parse(body);

    // Create batch job record
    const batchJob = await prisma.batchJob.create({
      data: {
        companyId: decoded.companyId,
        totalClaims: validatedData.claims.length,
        status: 'PROCESSING',
        options: validatedData.options || {}
      }
    });

    // Process claims asynchronously
    processBatchClaims(batchJob.id, validatedData.claims, decoded.companyId, validatedData.options);

    return NextResponse.json({
      success: true,
      batchId: batchJob.id,
      totalClaims: validatedData.claims.length,
      status: 'PROCESSING',
      message: 'Batch job started. Use the batch ID to check progress.'
    });

  } catch (error: any) {
    console.error("Batch claim submission error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const where: any = { companyId: decoded.companyId };
    if (status) {
      where.status = status;
    }

    const [batchJobs, total] = await Promise.all([
      prisma.batchJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.batchJob.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: batchJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Batch jobs fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processBatchClaims(
  batchId: string, 
  claims: any[], 
  companyId: string, 
  options: any = {}
) {
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const errors: any[] = [];

  try {
    // Update batch job status to processing
    await prisma.batchJob.update({
      where: { id: batchId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    // Process claims in batches of 50 to manage memory
    const batchSize = 50;
    for (let i = 0; i < claims.length; i += batchSize) {
      const batch = claims.slice(i, i + batchSize);
      
      for (const claimData of batch) {
        try {
          // Convert date string to Date object
          const processedClaimData = {
            ...claimData,
            serviceDate: new Date(claimData.serviceDate)
          };

          const result = await ClaimProcessor.processClaim(processedClaimData, companyId);
          successCount++;
          
          // Store individual claim result
          await prisma.batchClaimResult.create({
            data: {
              batchJobId: batchId,
              claimId: result.claimId,
              status: 'SUCCESS',
              riskScore: result.riskScore,
              approved: result.approved,
              processingTime: Date.now() // This would be actual processing time
            }
          });

        } catch (error: any) {
          errorCount++;
          errors.push({
            claimIndex: processedCount,
            error: error.message,
            claimData: claimData
          });

          // Store error result
          await prisma.batchClaimResult.create({
            data: {
              batchJobId: batchId,
              claimId: `error_${processedCount}`,
              status: 'ERROR',
              errorMessage: error.message,
              processingTime: Date.now()
            }
          });

          if (!options.continueOnError) {
            throw error; // Stop processing on first error if not continuing
          }
        }

        processedCount++;

        // Update progress every 10 claims
        if (processedCount % 10 === 0) {
          await prisma.batchJob.update({
            where: { id: batchId },
            data: {
              processedClaims: processedCount,
              successCount,
              errorCount
            }
          });
        }
      }
    }

    // Final update
    await prisma.batchJob.update({
      where: { id: batchId },
      data: {
        status: errorCount === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
        processedClaims: processedCount,
        successCount,
        errorCount,
        completedAt: new Date(),
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error: any) {
    // Update batch job with failure status
    await prisma.batchJob.update({
      where: { id: batchId },
      data: {
        status: 'FAILED',
        processedClaims: processedCount,
        successCount,
        errorCount,
        completedAt: new Date(),
        errors: [{ error: error.message }]
      }
    });
  }
}
