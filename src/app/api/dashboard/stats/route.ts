import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

// Create fresh Prisma client instance
const prisma = new PrismaClient();

interface JWTPayload {
  sub: string;          // user id
  email: string;
  role: string;
  fullName?: string;
}

export async function GET() {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("insurmap_session")?.value;

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

    // Get user's companyId
    const user = await (prisma as any).user.findUnique({
      where: { id: decoded.sub },
      select: { companyId: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch dashboard statistics
    const [
      totalClaimsResult,
      highRiskClaimsResult,
      mediumRiskClaimsResult,
      lowRiskClaimsResult,
      avgRiskScoreResult,
      totalBilledAmountResult,
      fraudDetectedClaimsResult,
      approvedClaimsResult,
      recentActivityResult
    ] = await Promise.all([
      // Total claims count
      (prisma as any).claim.count({
        where: { companyId: user.companyId }
      }),

      // High risk claims (71-100)
      (prisma as any).claim.count({
        where: {
          companyId: user.companyId,
          riskScore: { gte: 71 }
        }
      }),

      // Medium risk claims (41-70)
      (prisma as any).claim.count({
        where: {
          companyId: user.companyId,
          riskScore: { gte: 41, lte: 70 }
        }
      }),

      // Low risk claims (0-40)
      (prisma as any).claim.count({
        where: {
          companyId: user.companyId,
          riskScore: { lte: 40 }
        }
      }),

      // Average risk score
      (prisma as any).claim.aggregate({
        where: { companyId: user.companyId },
        _avg: { riskScore: true }
      }),

      // Total billed amount
      (prisma as any).claim.aggregate({
        where: { companyId: user.companyId },
        _sum: { billedAmount: true }
      }),

      // Fraud detected claims
      (prisma as any).claim.count({
        where: {
          companyId: user.companyId,
          isFlagged: true
        }
      }),

      // Approved claims
      (prisma as any).claim.count({
        where: {
          companyId: user.companyId,
          status: 'APPROVED'
        }
      }),

      // Recent activity (last 10 claims)
      (prisma as any).claim.findMany({
        where: { companyId: user.companyId },
        include: {
          patient: {
            select: { firstName: true, lastName: true }
          },
          provider: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Safely extract values with fallbacks
    const totalClaims = totalClaimsResult || 0;
    const highRiskClaims = highRiskClaimsResult || 0;
    const mediumRiskClaims = mediumRiskClaimsResult || 0;
    const lowRiskClaims = lowRiskClaimsResult || 0;
    const avgRiskScore = avgRiskScoreResult?._avg?.riskScore || 0;
    const totalBilledAmount = totalBilledAmountResult?._sum?.billedAmount || 0;
    const fraudDetectedClaims = fraudDetectedClaimsResult || 0;
    const approvedClaims = approvedClaimsResult || 0;
    const recentActivity = (recentActivityResult || []).map((claim: any) => ({
      id: claim.id,
      claim_number: claim.claimNumber,
      patient_name: `${claim.patient?.firstName || ''} ${claim.patient?.lastName || ''}`.trim(),
      provider_name: `${claim.provider?.firstName || ''} ${claim.provider?.lastName || ''}`.trim(),
      risk_score: claim.riskScore || 0,
      status: claim.status,
      created_at: claim.createdAt?.toISOString() || new Date().toISOString()
    }));

    const stats = {
      total_claims: totalClaims,
      high_risk_count: highRiskClaims,
      medium_risk_count: mediumRiskClaims,
      low_risk_count: lowRiskClaims,
      average_risk_score: avgRiskScore,
      total_billed_amount: totalBilledAmount,
      fraud_detected_count: fraudDetectedClaims,
      approved_count: approvedClaims
    };

    return NextResponse.json({
      stats,
      recent_activity: recentActivity
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      meta: error.meta
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard statistics',
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}