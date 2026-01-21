import { NextResponse } from 'next/server';
import { InvestigationManager } from '@/lib/workflow/investigation-manager';
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
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.priority || !body.fraudTypes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create investigation
    const investigation = await InvestigationManager.createInvestigation({
      claimId: body.claimId,
      providerId: body.providerId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      fraudTypes: body.fraudTypes,
      createdBy: decoded.id,
      assignedTo: body.assignedTo,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined
    });

    return NextResponse.json({
      success: true,
      investigation
    });

  } catch (error) {
    console.error("Investigation creation error:", error);
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
    const status = searchParams.get('status') as any;
    const priority = searchParams.get('priority') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
    const fraudTypes = searchParams.get('fraudTypes')?.split(',').filter(Boolean);
    const search = searchParams.get('search') || undefined;

    // Search investigations
    const investigations = await InvestigationManager.searchInvestigations(decoded.companyId, {
      status,
      priority,
      assignedTo,
      dateFrom,
      dateTo,
      fraudTypes: fraudTypes as any[],
      search
    });

    return NextResponse.json({
      success: true,
      investigations
    });

  } catch (error) {
    console.error("Investigations fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
