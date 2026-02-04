import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface WebhookEvent {
  event: string;
  data: any;
  companyId: string;
}

export class WebhookService {
  /**
   * Trigger webhooks for a specific event
   */
  static async triggerWebhooks(eventData: WebhookEvent) {
    try {
      // Find active webhooks for this company and event
      const webhooks = await prisma.webhook.findMany({
        where: {
          companyId: eventData.companyId,
          active: true,
          events: {
            has: eventData.event
          }
        }
      });

      // Trigger each webhook in parallel
      const webhookPromises = webhooks.map(webhook => 
        this.sendWebhook(webhook, eventData)
      );

      await Promise.allSettled(webhookPromises);

      // Update last triggered timestamp
      await prisma.webhook.updateMany({
        where: {
          id: { in: webhooks.map(w => w.id) }
        },
        data: {
          lastTriggered: new Date()
        }
      });

    } catch (error) {
      console.error('Webhook trigger error:', error);
    }
  }

  /**
   * Send webhook to specific URL
   */
  private static async sendWebhook(webhook: any, eventData: WebhookEvent) {
    try {
      const payload = {
        id: crypto.randomUUID(),
        event: eventData.event,
        data: eventData.data,
        timestamp: new Date().toISOString(),
        company: webhook.companyId
      };

      // Generate signature
      const signature = this.generateSignature(payload, webhook.secret);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Albitros-Webhooks/1.0',
          'X-Albitros-Signature': signature,
          'X-Albitros-Event': eventData.event
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
        // In production, you'd want to implement retry logic here
      }

      return response;

    } catch (error) {
      console.error('Webhook delivery error:', error);
      throw error;
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private static generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature (for incoming webhook verification)
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(JSON.parse(payload), secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Helper method to trigger claim-related events
   */
  static async triggerClaimEvent(claim: any, event: 'claim.flagged' | 'claim.approved' | 'claim.rejected') {
    await this.triggerWebhooks({
      event,
      data: {
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        patientId: claim.patientId,
        providerId: claim.providerId,
        riskScore: claim.riskScore,
        riskLevel: claim.riskLevel,
        status: claim.status,
        fraudTypes: claim.fraudTypes,
        billedAmount: claim.billedAmount,
        createdAt: claim.createdAt
      },
      companyId: claim.companyId
    });
  }

  /**
   * Helper method to trigger fraud alert events
   */
  static async triggerFraudAlertEvent(alert: any, claim: any) {
    await this.triggerWebhooks({
      event: 'fraud.alert.created',
      data: {
        alertId: alert.id,
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        alertType: alert.alertType,
        severity: alert.severity,
        confidence: alert.confidence,
        description: alert.description,
        details: alert.details,
        providerId: claim.providerId,
        createdAt: alert.createdAt
      },
      companyId: claim.companyId
    });
  }

  /**
   * Helper method to trigger provider risk events
   */
  static async triggerProviderRiskEvent(provider: any, riskData: any) {
    await this.triggerWebhooks({
      event: 'provider.risk.changed',
      data: {
        providerId: provider.id,
        providerName: `${provider.firstName} ${provider.lastName}`,
        npi: provider.npi,
        previousRiskScore: riskData.previousRiskScore,
        newRiskScore: riskData.newRiskScore,
        riskLevel: riskData.riskLevel,
        flaggedClaims: riskData.flaggedClaims,
        totalClaims: riskData.totalClaims,
        changedAt: new Date().toISOString()
      },
      companyId: provider.companyId
    });
  }
}
