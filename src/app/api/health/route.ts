import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import logger from '@/lib/logger';

const prisma = new PrismaClient();

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: 'connected',
        email: process.env.SMTP_USER ? 'configured' : 'not configured',
        sentry: process.env.SENTRY_DSN ? 'configured' : 'not configured',
      },
      uptime: process.uptime()
    };

    logger.info('Health check passed', healthData);

    return NextResponse.json(healthData);

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    logger.error('Health check failed:', {
      error: error.message,
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error.message,
      services: {
        database: 'disconnected',
        email: process.env.SMTP_USER ? 'configured' : 'not configured',
        sentry: process.env.SENTRY_DSN ? 'configured' : 'not configured',
      }
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}
