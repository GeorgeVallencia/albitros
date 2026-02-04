import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createJWT, setSessionCookie } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const companyId = searchParams.get('companyId');

    if (!provider || !companyId) {
      return NextResponse.json(
        { error: 'Provider and companyId are required' },
        { status: 400 }
      );
    }

    // Get SSO configuration
    const ssoConfig = await prisma.ssoConfig.findFirst({
      where: {
        companyId,
        provider: provider.toUpperCase(),
        isActive: true
      }
    });

    if (!ssoConfig) {
      return NextResponse.json(
        { error: 'SSO configuration not found' },
        { status: 404 }
      );
    }

    // Generate SAML request or OIDC authorization URL based on provider
    let authUrl: string;

    if (provider.toLowerCase() === 'saml') {
      authUrl = generateSAMLRequest(ssoConfig);
    } else {
      authUrl = generateOIDCAuthorizationUrl(ssoConfig);
    }

    // Redirect to SSO provider
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('SSO login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// SAML SSO callback handler
export async function POST(request: Request) {
  try {
    const body = await request.formData();
    const samlResponse = body.get('SAMLResponse') as string;
    const relayState = body.get('RelayState') as string;

    if (!samlResponse) {
      return NextResponse.json(
        { error: 'SAMLResponse is required' },
        { status: 400 }
      );
    }

    // Parse and validate SAML response
    const samlData = await parseSAMLResponse(samlResponse);
    
    // Get SSO configuration
    const ssoConfig = await prisma.ssoConfig.findFirst({
      where: {
        companyId: samlData.companyId,
        provider: 'SAML',
        isActive: true
      }
    });

    if (!ssoConfig) {
      return NextResponse.json(
        { error: 'SSO configuration not found' },
        { status: 404 }
      );
    }

    // Create or update user based on SAML data
    const user = await createOrUpdateUserFromSSO(samlData, ssoConfig);

    // Create JWT and set session
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });

    // Set session cookie
    setSessionCookie(response, token);

    return response;

  } catch (error) {
    console.error('SAML callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OIDC callback handler
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { code, state, provider, companyId } = body;

    if (!code || !provider || !companyId) {
      return NextResponse.json(
        { error: 'Code, provider, and companyId are required' },
        { status: 400 }
      );
    }

    // Get SSO configuration
    const ssoConfig = await prisma.ssoConfig.findFirst({
      where: {
        companyId,
        provider: provider.toUpperCase(),
        isActive: true
      }
    });

    if (!ssoConfig) {
      return NextResponse.json(
        { error: 'SSO configuration not found' },
        { status: 404 }
      );
    }

    // Exchange authorization code for tokens
    const tokenData = await exchangeCodeForTokens(code, ssoConfig);
    
    // Get user info from OIDC provider
    const userInfo = await getOIDCUserInfo(tokenData.access_token, ssoConfig);

    // Create or update user based on OIDC data
    const user = await createOrUpdateUserFromOIDC(userInfo, ssoConfig);

    // Create JWT and set session
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });

    // Set session cookie
    setSessionCookie(response, token);

    return response;

  } catch (error) {
    console.error('OIDC callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateSAMLRequest(ssoConfig: any): string {
  // In a real implementation, you'd use a SAML library like 'passport-saml'
  // This is a simplified version
  const samlRequest = crypto.randomBytes(32).toString('base64');
  const relayState = crypto.randomBytes(16).toString('hex');
  
  const config = ssoConfig.config;
  return `${config.ssoUrl}?SAMLRequest=${encodeURIComponent(samlRequest)}&RelayState=${relayState}`;
}

function generateOIDCAuthorizationUrl(ssoConfig: any): string {
  const config = ssoConfig.config;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/sso/callback`,
    scope: config.scopes?.join(' ') || 'openid profile email',
    state: crypto.randomBytes(16).toString('hex')
  });

  return `${config.authorizationUrl}?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string, ssoConfig: any): Promise<any> {
  const config = ssoConfig.config;
  
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/sso/callback`,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}

async function getOIDCUserInfo(accessToken: string, ssoConfig: any): Promise<any> {
  const config = ssoConfig.config;
  
  const response = await fetch(config.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

async function parseSAMLResponse(samlResponse: string): Promise<any> {
  // In a real implementation, you'd use a SAML library to parse the response
  // This is a simplified version
  const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');
  
  // Extract user data from SAML response (simplified)
  return {
    email: 'user@example.com', // Extract from actual SAML response
    firstName: 'John',
    lastName: 'Doe',
    companyId: 'cmkp22c010000xl8khllyt6g6'
  };
}

async function createOrUpdateUserFromSSO(samlData: any, ssoConfig: any): Promise<any> {
  const mappings = ssoConfig.mappings;
  
  // Check if user already exists
  let user = await prisma.user.findFirst({
    where: { email: samlData.email }
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: samlData.email,
        fullName: `${samlData.firstName} ${samlData.lastName}`,
        username: samlData.email.split('@')[0],
        passwordHash: '', // SSO users don't have passwords
        role: mappings.role || 'MEMBER',
        companyId: ssoConfig.companyId,
        emailVerified: true,
        mfaEnabled: false // SSO provides MFA at provider level
      }
    });
  } else {
    // Update existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: `${samlData.firstName} ${samlData.lastName}`,
        lastLoginAt: new Date()
      }
    });
  }

  return user;
}

async function createOrUpdateUserFromOIDC(userInfo: any, ssoConfig: any): Promise<any> {
  const mappings = ssoConfig.mappings;
  
  // Extract user data using mappings
  const email = userInfo[mappings.email];
  const firstName = userInfo[mappings.firstName];
  const lastName = userInfo[mappings.lastName];
  
  // Check if user already exists
  let user = await prisma.user.findFirst({
    where: { email }
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email,
        fullName: `${firstName} ${lastName}`,
        username: email.split('@')[0],
        passwordHash: '', // SSO users don't have passwords
        role: mappings.role || 'MEMBER',
        companyId: ssoConfig.companyId,
        emailVerified: true,
        mfaEnabled: false // SSO provides MFA at provider level
      }
    });
  } else {
    // Update existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: `${firstName} ${lastName}`,
        lastLoginAt: new Date()
      }
    });
  }

  return user;
}
