import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signupBaseSchema } from "@/lib/validation";
import { createJWT, setSessionCookie } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const role = body?.role as UserRole;
    if (!role) {
      return NextResponse.json({ error: "Role required" }, { status: 400 });
    }

    // Validate with base schema
    const parsed = signupBaseSchema.parse(body);

    // Validate role is one of the allowed UserRole values
    if (!["ADMIN", "MEMBER", "VIEWER"].includes(parsed.role)) {
      return NextResponse.json({ error: "Invalid role. Must be ADMIN, MEMBER, or VIEWER" }, { status: 400 });
    }

    // Ensure unique email + username
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: parsed.email } }),
      prisma.user.findUnique({ where: { username: parsed.username } }),
    ]);

    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    if (existingUsername) {
      return NextResponse.json({ error: "Username already in use" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(parsed.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        username: parsed.username,
        passwordHash,
        fullName: parsed.fullName,
        role: parsed.role,
        companyId: "default-company-id", // TODO: Handle company assignment properly
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
      },
    });

    // Create JWT + set cookie
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user,
      message: "User created successfully"
    }, { status: 201 });

  } catch (err: any) {
    console.error("Signup error:", {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    // Handle Zod validation errors
    if (err?.issues && Array.isArray(err.issues)) {
      const validationError = err.issues[0];
      return NextResponse.json({
        error: `Validation failed: ${validationError.message}`,
        field: validationError.path?.[0]
      }, { status: 400 });
    }

    // Handle Prisma unique constraint errors
    if (err?.code === 'P2002') {
      const target = err?.meta?.target;
      if (target?.includes('email')) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
      if (target?.includes('username')) {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: "Resource already exists" }, { status: 409 });
    }

    // Handle Prisma foreign key constraint errors
    if (err?.code === 'P2003') {
      return NextResponse.json({ error: "Invalid company reference" }, { status: 400 });
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Handle bcrypt errors
    if (err?.message?.includes('bcrypt')) {
      return NextResponse.json({ error: "Password processing failed" }, { status: 500 });
    }

    // Generic error for unexpected issues
    return NextResponse.json({
      error: "Internal server error",
      requestId: crypto.randomUUID()
    }, { status: 500 });
  }
}
