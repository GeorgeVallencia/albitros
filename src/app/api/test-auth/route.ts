import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';

export async function GET() {
  try {
    console.log('Test auth endpoint called');

    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("insurmap_session")?.value;

    console.log('Token found:', !!token);
    console.log('Token value:', token?.substring(0, 20) + '...');

    if (!token) {
      return NextResponse.json(
        { error: "No token found" },
        { status: 401 }
      );
    }

    // Verify JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log('Token decoded successfully:', decoded);

      return NextResponse.json({
        message: "Authentication successful",
        user: decoded
      });
    } catch (jwtError: any) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json(
        {
          error: 'Invalid token',
          jwtError: jwtError.message || 'Unknown JWT error'
        },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
