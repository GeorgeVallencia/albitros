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

    // Fetch properties for the authenticated user
    const properties = await prisma.property.findMany({
      where: { userId: decoded.id },
      select: {
        id: true,
        address: true,
        latitude: true,
        longitude: true,
        propertyType: true,
        status: true,
        estimatedValue: true,
        riskScore: true,
        riskFactors: true,
        notes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data to match MapView component expectations
    const formattedProperties = properties.map(property => ({
      id: property.id,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      property_type: property.propertyType,
      status: property.status,
      estimated_value: property.estimatedValue,
      risk_score: property.riskScore,
      risk_factors: property.riskFactors || {},
      notes: property.notes,
      created_at: property.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch properties" }, 
      { status: 500 }
    );
  }
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
    const {
      address,
      latitude,
      longitude,
      property_type,
      estimated_value,
      notes
    } = body;

    // Create new property
    const property = await prisma.property.create({
      data: {
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        propertyType: property_type,
        estimatedValue: estimated_value ? parseFloat(estimated_value) : null,
        notes,
        userId: decoded.id,
        riskScore: 0, // Will be updated by risk assessment
        status: 'active'
      },
    });

    // Return formatted property
    const formattedProperty = {
      id: property.id,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      property_type: property.propertyType,
      status: property.status,
      estimated_value: property.estimatedValue,
      risk_score: property.riskScore,
      risk_factors: property.riskFactors || {},
      notes: property.notes,
      created_at: property.createdAt.toISOString(),
    };

    return NextResponse.json(formattedProperty, { status: 201 });
  } catch (error) {
    console.error('Create property error:', error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
