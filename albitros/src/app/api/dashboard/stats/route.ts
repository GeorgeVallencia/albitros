import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export async function GET() {
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

    // Fetch dashboard statistics
    const [
      totalProperties,
      highRiskProperties,
      mediumRiskProperties,
      lowRiskProperties,
      avgRiskScore,
      totalValue,
      recentActivity
    ] = await Promise.all([
      // Total properties count
      prisma.property.count({
        where: { userId: decoded.id }
      }),
      
      // High risk properties (71-100)
      prisma.property.count({
        where: { 
          userId: decoded.id,
          riskScore: { gte: 71 }
        }
      }),
      
      // Medium risk properties (41-70)
      prisma.property.count({
        where: { 
          userId: decoded.id,
          riskScore: { gte: 41, lte: 70 }
        }
      }),
      
      // Low risk properties (0-40)
      prisma.property.count({
        where: { 
          userId: decoded.id,
          riskScore: { lte: 40 }
        }
      }),
      
      // Average risk score
      prisma.property.aggregate({
        where: { userId: decoded.id },
        _avg: { riskScore: true }
      }),
      
      // Total estimated value
      prisma.property.aggregate({
        where: { userId: decoded.id },
        _sum: { estimatedValue: true }
      }),
      
      // Recent activity (last 10 properties)
      prisma.property.findMany({
        where: { userId: decoded.id },
        select: {
          address: true,
          riskScore: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const stats = {
      total_properties: totalProperties,
      high_risk_count: highRiskProperties,
      medium_risk_count: mediumRiskProperties,
      low_risk_count: lowRiskProperties,
      average_risk_score: avgRiskScore._avg.riskScore || 0,
      total_estimated_value: totalValue._sum.estimatedValue || 0
    };

    const recent_activity = recentActivity.map(property => ({
      address: property.address,
      risk_score: property.riskScore,
      created_at: property.createdAt.toISOString()
    }));

    return NextResponse.json({
      stats,
      recent_activity
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}