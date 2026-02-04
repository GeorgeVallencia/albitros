import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  companyId: string;
}

export async function GET(
  request: Request,
  { params }: { params: { batchId: string } }
) {
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

    const batchId = params.batchId;

    // Get batch job details
    const batchJob = await prisma.batchJob.findFirst({
      where: {
        id: batchId,
        companyId: decoded.companyId
      },
      include: {
        claimResults: {
          take: 10, // Show last 10 results
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { claimResults: true }
        }
      }
    });

    if (!batchJob) {
      return NextResponse.json(
        { error: "Batch job not found" },
        { status: 404 }
      );
    }

    // Calculate progress percentage
    const progressPercentage = batchJob.totalClaims > 0 
      ? Math.round((batchJob.processedClaims / batchJob.totalClaims) * 100)
      : 0;

    // Calculate estimated time remaining
    let estimatedTimeRemaining = null;
    if (batchJob.status === 'PROCESSING' && batchJob.startedAt) {
      const elapsedMs = Date.now() - batchJob.startedAt.getTime();
      const avgTimePerClaim = elapsedMs / batchJob.processedClaims;
      const remainingClaims = batchJob.totalClaims - batchJob.processedClaims;
      estimatedTimeRemaining = Math.round(avgTimePerClaim * remainingClaims);
    }

    return NextResponse.json({
      success: true,
      batchJob: {
        id: batchJob.id,
        status: batchJob.status,
        totalClaims: batchJob.totalClaims,
        processedClaims: batchJob.processedClaims,
        successCount: batchJob.successCount,
        errorCount: batchJob.errorCount,
        progressPercentage,
        estimatedTimeRemaining,
        startedAt: batchJob.startedAt,
        completedAt: batchJob.completedAt,
        createdAt: batchJob.createdAt,
        totalResults: batchJob._count.claimResults,
        recentResults: batchJob.claimResults,
        errors: batchJob.errors
      }
    });

  } catch (error) {
    console.error("Batch job status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { batchId: string } }
) {
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

    const batchId = params.batchId;

    // Only allow cancellation of processing jobs
    const batchJob = await prisma.batchJob.findFirst({
      where: {
        id: batchId,
        companyId: decoded.companyId,
        status: 'PROCESSING'
      }
    });

    if (!batchJob) {
      return NextResponse.json(
        { error: "Batch job not found or cannot be cancelled" },
        { status: 404 }
      );
    }

    // Update job status to cancelled
    await prisma.batchJob.update({
      where: { id: batchId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [{ error: 'Cancelled by user' }]
      }
    });

    return NextResponse.json({
      success: true,
      message: "Batch job cancelled successfully"
    });

  } catch (error) {
    console.error("Batch job cancellation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
