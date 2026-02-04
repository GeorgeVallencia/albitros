import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'MISSING'
  };

  return NextResponse.json({
    message: 'Environment check',
    envVars,
    timestamp: new Date().toISOString()
  });
}
