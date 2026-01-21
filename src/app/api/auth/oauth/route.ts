import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// OAuth configuration
const OAUTH_CONFIG = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    redirectUri: process.env.NEXT_PUBLIC_APP_URL + '/auth/google/callback',
    scope: 'openid email profile'
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)',
    clientId: process.env.LINKEDIN_OAUTH_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_OAUTH_CLIENT_SECRET!,
    redirectUri: process.env.NEXT_PUBLIC_APP_URL + '/auth/linkedin/callback',
    scope: 'r_liteprofile r_emailaddress'
  }
};

// Google OAuth
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider');

  if (!provider || !OAUTH_CONFIG[provider as keyof typeof OAUTH_CONFIG]) {
    return NextResponse.json(
      { error: 'Invalid OAuth provider' },
      { status: 400 }
    );
  }

  const config = OAUTH_CONFIG[provider as keyof typeof OAUTH_CONFIG];

  // Generate state parameter for security
  const state = crypto.randomUUID();

  // Store state in session/cookie for verification
  const response = NextResponse.redirect(
    `${config.authUrl}?` + new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state,
      access_type: 'offline',
      prompt: 'consent'
    })
  );

  // Set state cookie
  response.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10 minutes
  });

  return response;
}

// OAuth callback handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, code, state } = z.object({
      provider: z.enum(['google', 'linkedin']),
      code: z.string(),
      state: z.string()
    }).parse(body);

    const config = OAUTH_CONFIG[provider];

    // Verify state parameter
    const storedState = req.cookies.get(`oauth_state_${provider}`)?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(config.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();

    // Normalize user data based on provider
    const normalizedUser = normalizeUserData(provider, userData);

    // Find or create user
    const user = await findOrCreateOAuthUser(normalizedUser, provider);

    // Create session
    const sessionToken = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    const response = NextResponse.json({
      message: 'OAuth login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        provider: provider
      }
    });

    // Set session cookie
    response.cookies.set('insurmap_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    // Clear state cookie
    response.cookies.set(`oauth_state_${provider}`, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    // Log successful OAuth login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OAUTH_LOGIN_SUCCESS',
        resource: 'AUTH',
        details: { provider },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return response;

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth authentication failed' },
      { status: 500 }
    );
  }
}

// Normalize user data from different OAuth providers
function normalizeUserData(provider: string, userData: any) {
  switch (provider) {
    case 'google':
      return {
        email: userData.email,
        fullName: userData.name,
        firstName: userData.given_name,
        lastName: userData.family_name,
        avatar: userData.picture,
        verified: userData.verified_email
      };

    case 'linkedin':
      return {
        email: userData.emailAddress,
        fullName: `${userData.firstName.localized.en_US} ${userData.lastName.localized.en_US}`,
        firstName: userData.firstName.localized.en_US,
        lastName: userData.lastName.localized.en_US,
        avatar: null,
        verified: true
      };

    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

// Find existing user or create new one for OAuth
async function findOrCreateOAuthUser(normalizedUser: any, provider: string) {
  // First, try to find user by email
  let user = await prisma.user.findUnique({
    where: { email: normalizedUser.email }
  });

  if (user) {
    // User exists, update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    return user;
  }

  // Create new user
  // For OAuth users, we need to create a company or assign to a default one
  const defaultCompany = await prisma.company.findFirst();

  if (!defaultCompany) {
    throw new Error('No company found to assign OAuth user');
  }

  user = await prisma.user.create({
    data: {
      email: normalizedUser.email,
      fullName: normalizedUser.fullName,
      username: normalizedUser.email.split('@')[0],
      passwordHash: '', // OAuth users don't have passwords
      emailVerified: normalizedUser.verified,
      companyId: defaultCompany.id,
      role: 'MEMBER' // Default role for OAuth users
    }
  });

  // Log new user creation
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      companyId: defaultCompany.id,
      action: 'OAUTH_USER_CREATED',
      resource: 'AUTH',
      details: {
        provider,
        email: user.email,
        fullName: user.fullName
      }
    }
  });

  return user;
}

// Helper function to create JWT (import from auth)
async function createJWT(session: any) {
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  return await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}
