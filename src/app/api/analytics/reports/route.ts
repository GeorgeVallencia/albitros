import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  companyId: string;
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
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y
    const reportType = searchParams.get('type') || 'overview'; // overview, trends, providers

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (reportType === 'overview') {
      return await getOverviewReport(decoded.companyId, startDate, now);
    } else if (reportType === 'trends') {
      return await getTrendsReport(decoded.companyId, startDate, now);
    } else if (reportType === 'providers') {
      return await getProvidersReport(decoded.companyId, startDate, now);
    }

  } catch (error) {
    console.error("Analytics report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getOverviewReport(companyId: string, startDate: Date, endDate: Date) {
  const [
    totalClaims,
    flaggedClaims,
    approvedClaims,
    totalBilled,
    fraudByType,
    riskDistribution,
    monthlyTrends
  ] = await Promise.all([
    // Total claims in period
    prisma.claim.count({
      where: {
        companyId,
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    
    // Flagged claims
    prisma.claim.count({
      where: {
        companyId,
        isFlagged: true,
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    
    // Approved claims
    prisma.claim.count({
      where: {
        companyId,
        status: 'APPROVED',
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    
    // Total billed amount
    prisma.claim.aggregate({
      where: {
        companyId,
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { billedAmount: true }
    }),
    
    // Fraud types distribution
    prisma.fraudAlert.groupBy({
      by: ['alertType'],
      where: {
        claim: {
          companyId,
          createdAt: { gte: startDate, lte: endDate }
        }
      },
      _count: true
    }),
    
    // Risk level distribution
    prisma.claim.groupBy({
      by: ['riskLevel'],
      where: {
        companyId,
        createdAt: { gte: startDate, lte: endDate },
        riskLevel: { not: null }
      },
      _count: true
    }),
    
    // Monthly trends
    getMonthlyTrends(companyId, startDate, endDate)
  ]);

  const fraudRate = totalClaims > 0 ? (flaggedClaims / totalClaims) * 100 : 0;
  const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;

  return NextResponse.json({
    success: true,
    reportType: 'overview',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    summary: {
      totalClaims,
      flaggedClaims,
      approvedClaims,
      fraudRate: Math.round(fraudRate * 100) / 100,
      approvalRate: Math.round(approvalRate * 100) / 100,
      totalBilled: totalBilled._sum.billedAmount || 0,
      estimatedSavings: flaggedClaims * 1500 // Average savings per flagged claim
    },
    fraudByType: fraudByType.map(item => ({
      type: item.alertType,
      count: item._count
    })),
    riskDistribution: riskDistribution.map(item => ({
      level: item.riskLevel,
      count: item._count
    })),
    monthlyTrends
  });
}

async function getTrendsReport(companyId: string, startDate: Date, endDate: Date) {
  const trends = await getMonthlyTrends(companyId, startDate, endDate);
  
  // Calculate trend analysis
  const trendAnalysis = calculateTrendAnalysis(trends);

  return NextResponse.json({
    success: true,
    reportType: 'trends',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    trends,
    analysis: trendAnalysis
  });
}

async function getProvidersReport(companyId: string, startDate: Date, endDate: Date) {
  const providers = await prisma.provider.findMany({
    where: {
      companyId,
      claims: {
        some: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }
    },
    include: {
      claims: {
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        include: {
          fraudAlerts: true
        }
      },
      _count: {
        select: { claims: true }
      }
    }
  });

  const providerRiskScores = providers.map(provider => {
    const claims = provider.claims;
    const totalClaims = claims.length;
    const flaggedClaims = claims.filter(c => c.isFlagged).length;
    const totalBilled = claims.reduce((sum, c) => sum + c.billedAmount, 0);
    const avgRiskScore = claims.reduce((sum, c) => sum + (c.riskScore || 0), 0) / totalClaims;
    const fraudTypes = new Set();
    
    claims.forEach(claim => {
      claim.fraudAlerts.forEach(alert => {
        fraudTypes.add(alert.alertType);
      });
    });

    return {
      providerId: provider.id,
      providerName: `${provider.firstName} ${provider.lastName}`,
      npi: provider.npi,
      specialty: provider.specialty,
      totalClaims,
      flaggedClaims,
      fraudRate: totalClaims > 0 ? (flaggedClaims / totalClaims) * 100 : 0,
      avgRiskScore: Math.round(avgRiskScore * 100) / 100,
      totalBilled,
      riskLevel: getRiskLevel(avgRiskScore),
      fraudTypes: Array.from(fraudTypes),
      lastActivity: claims.length > 0 ? Math.max(...claims.map(c => c.createdAt.getTime())) : null
    };
  });

  // Sort by risk score (highest first)
  providerRiskScores.sort((a, b) => b.avgRiskScore - a.avgRiskScore);

  return NextResponse.json({
    success: true,
    reportType: 'providers',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    providers: providerRiskScores,
    summary: {
      totalProviders: providers.length,
      highRiskProviders: providerRiskScores.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length,
      avgProviderRiskScore: providerRiskScores.reduce((sum, p) => sum + p.avgRiskScore, 0) / providerRiskScores.length
    }
  });
}

async function getMonthlyTrends(companyId: string, startDate: Date, endDate: Date) {
  // Get monthly aggregated data
  const monthlyData = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as total_claims,
      COUNT(CASE WHEN "isFlagged" = true THEN 1 END) as flagged_claims,
      COUNT(CASE WHEN "status" = 'APPROVED' THEN 1 END) as approved_claims,
      AVG("riskScore") as avg_risk_score,
      SUM("billedAmount") as total_billed
    FROM "claims" 
    WHERE "companyId" = ${companyId} 
      AND "createdAt" >= ${startDate} 
      AND "createdAt" <= ${endDate}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  ` as any[];

  return monthlyData.map((item: any) => ({
    month: item.month,
    totalClaims: parseInt(item.total_claims),
    flaggedClaims: parseInt(item.flagged_claims),
    approvedClaims: parseInt(item.approved_claims),
    fraudRate: item.total_claims > 0 ? (item.flagged_claims / item.total_claims) * 100 : 0,
    avgRiskScore: parseFloat(item.avg_risk_score) || 0,
    totalBilled: parseFloat(item.total_billed) || 0
  }));
}

function calculateTrendAnalysis(trends: any[]) {
  if (trends.length < 2) {
    return { trend: 'insufficient_data', changePercent: 0 };
  }

  const recent = trends[trends.length - 1];
  const previous = trends[trends.length - 2];
  
  const fraudRateChange = previous.fraudRate > 0 
    ? ((recent.fraudRate - previous.fraudRate) / previous.fraudRate) * 100 
    : 0;

  const volumeChange = previous.totalClaims > 0
    ? ((recent.totalClaims - previous.totalClaims) / previous.totalClaims) * 100
    : 0;

  return {
    fraudRateTrend: fraudRateChange > 5 ? 'increasing' : fraudRateChange < -5 ? 'decreasing' : 'stable',
    fraudRateChange: Math.round(fraudRateChange * 100) / 100,
    volumeTrend: volumeChange > 10 ? 'increasing' : volumeChange < -10 ? 'decreasing' : 'stable',
    volumeChange: Math.round(volumeChange * 100) / 100,
    riskScoreTrend: recent.avgRiskScore > previous.avgRiskScore ? 'increasing' : 'decreasing',
    riskScoreChange: Math.round((recent.avgRiskScore - previous.avgRiskScore) * 100) / 100
  };
}

function getRiskLevel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
