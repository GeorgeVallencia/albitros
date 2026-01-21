import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  signupBaseSchema,
  signupUnderwriterSchema,
  signupBrokerSchema,
  signupInsurerSchema,
  signupClaimsSchema,
  signupReinsurerSchema,
} from "@/lib/validation";
import { createJWT, setSessionCookie } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const role = body?.role as Role;
    if (!role) {
      return NextResponse.json({ error: "Role required" }, { status: 400 });
    }

    // Pick correct schema
    let parsed: any;
    switch (role) {
      case "UNDERWRITER":
        parsed = signupUnderwriterSchema.parse(body);
        break;
      case "BROKER":
        parsed = signupBrokerSchema.parse(body);
        break;
      case "INSURER":
        parsed = signupInsurerSchema.parse(body);
        break;
      case "CLAIMS":
        parsed = signupClaimsSchema.parse(body);
        break;
      case "REINSURER":
        parsed = signupReinsurerSchema.parse(body);
        break;
      default:
        parsed = signupBaseSchema.parse(body);
    }

    // Ensure unique email + username
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: parsed.email } }),
      prisma.user.findUnique({ where: { username: parsed.username } }),
    ]);

    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    if (existingUsername) {
      return NextResponse.json({ error: "Username already in use" }, { status: 400 });
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
        organization: parsed.organization ?? null,
        industry: parsed.industry ?? null,
        specialtyLine: parsed.specialtyLine ?? null,
        yearsExp: parsed.yearsExp ?? null,
        avgClaimsPerMonth: parsed.avgClaimsPerMonth ?? null,
        reinsurerType: parsed.reinsurerType ?? null,
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

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("Signup error:", err);
    if (err?.issues) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
