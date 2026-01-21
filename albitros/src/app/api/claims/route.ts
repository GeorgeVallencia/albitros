import { NextResponse } from 'next/server';
import { ClaimProcessor, ClaimSubmission } from '@/lib/claims/processor';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

    // Parse request body
    const body: ClaimSubmission = await request.json();

    // Validate required fields
    if (!body.patientId || !body.providerId || !body.serviceDate || !body.lineItems) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate line items
    if (!Array.isArray(body.lineItems) || body.lineItems.length === 0) {
      return NextResponse.json(
        { error: "At least one line item is required" },
        { status: 400 }
      );
    }

    // Process the claim
    const result = await ClaimProcessor.processClaim(body, decoded.companyId);

    return NextResponse.json({
      success: true,
      claimId: result.claimId,
      analysis: {
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        fraudTypes: result.fraudTypes,
        alerts: result.alerts,
        recommendations: result.recommendations,
        approved: result.approved
      }
    });

  } catch (error) {
    console.error("Claim processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const providerId = searchParams.get('providerId');

    // Build where clause
    const where: any = { companyId: decoded.companyId };

    if (status) {
      where.status = status;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    // Get claims with pagination
    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, mrn: true }
          },
          provider: {
            select: { id: true, firstName: true, lastName: true, npi: true }
          },
          claimLineItems: {
            select: {
              id: true,
              procedureCode: true,
              units: true,
              totalCost: true,
              isUnbundled: true,
              isUpcoded: true,
              riskScore: true
            }
          },
          fraudAlerts: {
            select: {
              id: true,
              alertType: true,
              severity: true,
              confidence: true,
              description: true,
              isResolved: true
            }
          },
          _count: {
            select: { fraudAlerts: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.claim.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: claims,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Claims fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
