import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UsageMonitor } from '@/lib/rate-limiter';
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
    const timeframe = searchParams.get('timeframe') || 'month'; // day, week, month, year

    // Get usage from memory monitor
    const memoryUsage = UsageMonitor.getCompanyUsage(decoded.companyId);

    // Get additional usage data from database
    const [totalClaims, totalBilled, activeUsers] = await Promise.all([
      prisma.claim.count({
        where: {
          companyId: decoded.companyId,
          createdAt: {
            gte: getDateRange(timeframe)
          }
        }
      }),
      prisma.claim.aggregate({
        where: {
          companyId: decoded.companyId,
          createdAt: {
            gte: getDateRange(timeframe)
          }
        },
        _sum: { billedAmount: true }
      }),
      prisma.user.count({
        where: {
          companyId: decoded.companyId,
          lastLoginAt: {
            gte: getDateRange(timeframe)
          }
        }
      })
    ]);

    // Get API usage statistics (in a real implementation, you'd store this in database)
    const apiUsage = {
      claims: memoryUsage.endpoints['/api/claims'] || { daily: 0, monthly: 0, total: 0 },
      batch: memoryUsage.endpoints['/api/claims/batch'] || { daily: 0, monthly: 0, total: 0 },
      analytics: memoryUsage.endpoints['/api/analytics'] || { daily: 0, monthly: 0, total: 0 },
      dashboard: memoryUsage.endpoints['/api/dashboard'] || { daily: 0, monthly: 0, total: 0 }
    };

    const totalApiCalls = Object.values(apiUsage).reduce((sum, usage) => sum + usage[getTimeframeKey(timeframe)], 0);

    return NextResponse.json({
      success: true,
      timeframe,
      period: {
        startDate: getDateRange(timeframe).toISOString(),
        endDate: new Date().toISOString()
      },
      usage: {
        claims: {
          total: totalClaims,
          flagged: await prisma.claim.count({
            where: {
              companyId: decoded.companyId,
              isFlagged: true,
              createdAt: {
                gte: getDateRange(timeframe)
              }
            }
          }),
          approved: await prisma.claim.count({
            where: {
              companyId: decoded.companyId,
              status: 'APPROVED',
              createdAt: {
                gte: getDateRange(timeframe)
              }
            }
          }),
          totalBilled: totalBilled._sum.billedAmount || 0
        },
        api: {
          totalCalls: totalApiCalls,
          endpoints: apiUsage,
          averageResponseTime: 150, // In a real implementation, you'd track this
          errorRate: 0.02 // In a real implementation, you'd calculate this
        },
        users: {
          active: activeUsers,
          total: await prisma.user.count({
            where: { companyId: decoded.companyId }
          })
        },
        performance: {
          averageProcessingTime: 2.5, // In a real implementation, you'd track this
          uptime: 99.9,
          storageUsed: await getStorageUsage(decoded.companyId)
        }
      }
    });

  } catch (error) {
    console.error("Usage monitoring error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getDateRange(timeframe: string): Date {
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function getTimeframeKey(timeframe: string): string {
  switch (timeframe) {
    case 'day': return 'daily';
    case 'week': return 'daily'; // Use daily for week
    case 'month': return 'monthly';
    case 'year': return 'monthly'; // Use monthly for year
    default: return 'monthly';
  }
}

async function getStorageUsage(companyId: string): number {
  // In a real implementation, you'd calculate actual storage usage
  // This could include database size, file storage, etc.
  return Math.random() * 1000000000; // Random bytes for demo
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { action } = body;

    if (action === 'export_usage_report') {
      // Generate usage report
      const reportData = await generateUsageReport(decoded.companyId);
      
      return NextResponse.json({
        success: true,
        report: reportData,
        downloadUrl: `/api/monitoring/usage-report?companyId=${decoded.companyId}`
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Usage monitoring action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateUsageReport(companyId: string): any {
  const now = new Date();
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalClaims,
    flaggedClaims,
    totalUsers,
    apiCalls
  ] = await Promise.all([
    prisma.claim.count({
      where: {
        companyId,
        createdAt: { gte: lastMonth }
      }
    }),
    prisma.claim.count({
      where: {
        companyId,
        isFlagged: true,
        createdAt: { gte: lastMonth }
      }
    }),
    prisma.user.count({
      where: { companyId }
    }),
    // In a real implementation, you'd get this from your API logs
    Promise.resolve(Math.floor(Math.random() * 100000))
  ]);

  return {
    period: {
      startDate: lastMonth.toISOString(),
      endDate: now.toISOString()
    },
    summary: {
      totalClaims,
      flaggedClaims,
      fraudRate: totalClaims > 0 ? (flaggedClaims / totalClaims) * 100 : 0,
      totalUsers,
      apiCalls,
      estimatedSavings: flaggedClaims * 1500 // Average savings per flagged claim
    },
    recommendations: [
      "Consider increasing API limits for high-volume periods",
      "Review providers with high fraud rates",
      "Implement additional monitoring for suspicious patterns"
    ]
  };
}
