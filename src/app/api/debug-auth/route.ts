import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("insurmap_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('JWT decoded:', decoded);

    // Check all users in database
    const allUsers = await (prisma as any).user.findMany({
      select: { id: true, email: true, fullName: true }
    });
    console.log('All users:', allUsers);

    // Try to find the specific user
    const user = await (prisma as any).user.findUnique({
      where: { id: decoded.sub },
      select: { companyId: true }
    });

    console.log('Looking for user with ID:', decoded.sub);
    console.log('Found user:', user);

    return NextResponse.json({
      decoded,
      allUsers,
      foundUser: user,
      message: user ? "User found" : "User not found"
    });

  } catch (error: any) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message
    }, { status: 500 });
  }
}
