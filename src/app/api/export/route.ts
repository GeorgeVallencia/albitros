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
    const type = searchParams.get('type') || 'claims'; // claims, providers, analytics, reports
    const format = searchParams.get('format') || 'csv'; // csv, json, xlsx
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y

    let data: any;
    let filename: string;
    let contentType: string;

    switch (type) {
      case 'claims':
        data = await getClaimsData(decoded.companyId, timeframe);
        filename = `claims-export-${timeframe}-${Date.now()}`;
        break;
      case 'providers':
        data = await getProvidersData(decoded.companyId, timeframe);
        filename = `providers-export-${timeframe}-${Date.now()}`;
        break;
      case 'analytics':
        data = await getAnalyticsData(decoded.companyId, timeframe);
        filename = `analytics-export-${timeframe}-${Date.now()}`;
        break;
      case 'reports':
        data = await getReportsData(decoded.companyId, timeframe);
        filename = `reports-export-${timeframe}-${Date.now()}`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid export type" },
          { status: 400 }
        );
    }

    if (format === 'json') {
      contentType = 'application/json';
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}.json"`
        }
      });
    } else if (format === 'csv') {
      contentType = 'text/csv';
      const csvData = convertToCSV(data, type);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    } else if (format === 'xlsx') {
      // In a real implementation, you'd use a library like xlsx
      return NextResponse.json(
        { error: "XLSX export not yet implemented" },
        { status: 501 }
      );
    }

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getClaimsData(companyId: string, timeframe: string) {
  const startDate = getDateRange(timeframe);
  
  const claims = await prisma.claim.findMany({
    where: {
      companyId,
      createdAt: { gte: startDate }
    },
    include: {
      patient: {
        select: { firstName: true, lastName: true, mrn: true }
      },
      provider: {
        select: { firstName: true, lastName: true, npi: true, specialty: true }
      },
      claimLineItems: {
        select: {
          procedureCode: true,
          units: true,
          unitCost: true,
          totalCost: true
        }
      },
      fraudAlerts: {
        select: {
          alertType: true,
          severity: true,
          confidence: true,
          description: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return claims.map(claim => ({
    claimNumber: claim.claimNumber,
    patientName: `${claim.patient?.firstName} ${claim.patient?.lastName}`,
    patientMRN: claim.patient?.mrn,
    providerName: `${claim.provider?.firstName} ${claim.provider?.lastName}`,
    providerNPI: claim.provider?.npi,
    providerSpecialty: claim.provider?.specialty,
    serviceDate: claim.serviceDate,
    billedAmount: claim.billedAmount,
    riskScore: claim.riskScore,
    riskLevel: claim.riskLevel,
    status: claim.status,
    isFlagged: claim.isFlagged,
    fraudTypes: claim.fraudTypes,
    lineItemsCount: claim.claimLineItems.length,
    totalLineItemsCost: claim.claimLineItems.reduce((sum, item) => sum + item.totalCost, 0),
    fraudAlertsCount: claim.fraudAlerts.length,
    createdAt: claim.createdAt
  }));
}

async function getProvidersData(companyId: string, timeframe: string) {
  const startDate = getDateRange(timeframe);
  
  const providers = await prisma.provider.findMany({
    where: {
      companyId,
      claims: {
        some: {
          createdAt: { gte: startDate }
        }
      }
    },
    include: {
      claims: {
        where: {
          createdAt: { gte: startDate }
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

  return providers.map(provider => {
    const claims = provider.claims;
    const totalClaims = claims.length;
    const flaggedClaims = claims.filter(c => c.isFlagged).length;
    const totalBilled = claims.reduce((sum, c) => sum + c.billedAmount, 0);
    const avgRiskScore = claims.reduce((sum, c) => sum + (c.riskScore || 0), 0) / totalClaims;
    
    return {
      providerId: provider.id,
      providerName: `${provider.firstName} ${provider.lastName}`,
      npi: provider.npi,
      specialty: provider.specialty,
      email: provider.email,
      phone: provider.phone,
      totalClaims,
      flaggedClaims,
      fraudRate: totalClaims > 0 ? (flaggedClaims / totalClaims) * 100 : 0,
      avgRiskScore: avgRiskScore || 0,
      totalBilled,
      riskLevel: getRiskLevel(avgRiskScore || 0),
      createdAt: provider.createdAt
    };
  });
}

async function getAnalyticsData(companyId: string, timeframe: string) {
  const startDate = getDateRange(timeframe);
  
  const [
    totalClaims,
    flaggedClaims,
    approvedClaims,
    totalBilled,
    fraudByType,
    riskDistribution,
    monthlyTrends
  ] = await Promise.all([
    prisma.claim.count({
      where: { companyId, createdAt: { gte: startDate } }
    }),
    prisma.claim.count({
      where: { companyId, isFlagged: true, createdAt: { gte: startDate } }
    }),
    prisma.claim.count({
      where: { companyId, status: 'APPROVED', createdAt: { gte: startDate } }
    }),
    prisma.claim.aggregate({
      where: { companyId, createdAt: { gte: startDate } },
      _sum: { billedAmount: true }
    }),
    prisma.fraudAlert.groupBy({
      by: ['alertType'],
      where: {
        claim: {
          companyId,
          createdAt: { gte: startDate }
        }
      },
      _count: true
    }),
    prisma.claim.groupBy({
      by: ['riskLevel'],
      where: {
        companyId,
        createdAt: { gte: startDate },
        riskLevel: { not: null }
      },
      _count: true
    }),
    getMonthlyTrends(companyId, startDate, new Date())
  ]);

  return {
    summary: {
      totalClaims,
      flaggedClaims,
      approvedClaims,
      fraudRate: totalClaims > 0 ? (flaggedClaims / totalClaims) * 100 : 0,
      approvalRate: totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0,
      totalBilled: totalBilled._sum.billedAmount || 0,
      estimatedSavings: flaggedClaims * 1500
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
  };
}

async function getReportsData(companyId: string, timeframe: string) {
  const startDate = getDateRange(timeframe);
  
  const [
    batchJobs,
    totalUsers,
    activeUsers,
    apiUsage
  ] = await Promise.all([
    prisma.batchJob.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({
      where: { companyId }
    }),
    prisma.user.count({
      where: {
        companyId,
        lastLoginAt: { gte: startDate }
      }
    }),
    // In a real implementation, you'd get this from your API logs
    Promise.resolve({
      totalCalls: Math.floor(Math.random() * 100000),
      averageResponseTime: 150,
      errorRate: 0.02
    })
  ]);

  return {
    batchJobs: batchJobs.map(job => ({
      id: job.id,
      totalClaims: job.totalClaims,
      processedClaims: job.processedClaims,
      successCount: job.successCount,
      errorCount: job.errorCount,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt
    })),
    users: {
      total: totalUsers,
      active: activeUsers
    },
    api: apiUsage,
    period: {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString()
    }
  };
}

function convertToCSV(data: any[], type: string): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return String(value);
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

function getDateRange(timeframe: string): Date {
  const now = new Date();
  
  switch (timeframe) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

async function getMonthlyTrends(companyId: string, startDate: Date, endDate: Date) {
  // This would be similar to the analytics implementation
  return [];
}

function getRiskLevel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
