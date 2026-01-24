import { NextRequest, NextResponse } from 'next/server';
import { createJWT, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Verify state from cookie
  const storedState = request.cookies.get('oauth_state')?.value;

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${error}`);
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=invalid_state`);
  }

  try {
    // Exchange authorization code for access token
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!user) {
      // Create a default company for OAuth users
      let company = await prisma.company.findFirst({
        where: { name: 'OAuth Users' },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: 'OAuth Users',
            size: 'SMALL',
          },
        });
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          email: userData.email,
          fullName: userData.name,
          username: userData.email.split('@')[0],
          emailVerified: true,
          role: 'MEMBER', // Use correct UserRole enum
          passwordHash: '', // OAuth users don't have passwords
          companyId: company.id,
        },
      });
    } else {
      // Update user info if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          fullName: user.fullName || userData.name,
        },
      });
    }

    // Create JWT and set session
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    return response;

  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`);
  }
}
