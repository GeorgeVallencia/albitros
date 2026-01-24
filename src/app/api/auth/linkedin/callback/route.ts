import { NextRequest, NextResponse } from 'next/server';
import { createJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Verify state from cookie
  const storedState = request.cookies.get('linkedin_oauth_state')?.value;

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${error}`);
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=invalid_state`);
  }

  try {
    // Exchange authorization code for access token
    const clientId = process.env.LINKEDIN_OAUTH_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_OAUTH_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn OAuth credentials not configured');
    }

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    // Get user info from LinkedIn
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      throw new Error('Failed to get user profile');
    }

    // Get email address separately
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const emailData = await emailResponse.json();

    // Handle LinkedIn email response format
    let email = null;
    if (emailData.elements && emailData.elements.length > 0) {
      email = emailData.elements[0]['handle~']?.emailAddress;
    }

    if (!email) {
      throw new Error('Failed to get user email from LinkedIn');
    }

    // Extract name from LinkedIn response
    const firstName = profileData.firstName?.localized?.en_US || profileData.firstName || '';
    const lastName = profileData.lastName?.localized?.en_US || profileData.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email },
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
          email,
          fullName,
          username: email.split('@')[0],
          emailVerified: true,
          role: 'MEMBER',
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
          fullName: user.fullName || fullName,
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
    response.cookies.delete('linkedin_oauth_state');

    return response;

  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`);
  }
}
