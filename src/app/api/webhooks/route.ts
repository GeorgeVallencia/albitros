import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'claim.flagged',
    'claim.approved', 
    'claim.rejected',
    'fraud.alert.created',
    'provider.risk.changed'
  ])),
  secret: z.string().min(8),
  active: z.boolean().default(true)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = webhookSchema.parse(body);

    // In a real implementation, you'd get companyId from authenticated user
    const companyId = "cmkp22c010000xl8khllyt6g6"; // Default company ID

    const webhook = await prisma.webhook.create({
      data: {
        ...validatedData,
        companyId
      }
    });

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt
      }
    });

  } catch (error: any) {
    console.error('Webhook creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = "cmkp22c010000xl8khllyt6g6"; // Default company ID

    const webhooks = await prisma.webhook.findMany({
      where: { companyId },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
        lastTriggered: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      webhooks
    });

  } catch (error) {
    console.error('Webhook fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
