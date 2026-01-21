import { prisma } from '@/lib/prisma';
import { BillingCodeValidator, CPT_CODES, FRAUD_PATTERNS } from '@/lib/billing/codes';
import { FraudType, RiskLevel, ClaimStatus } from '@prisma/client';

export interface ClaimSubmission {
  patientId: string;
  providerId: string;
  serviceDate: Date;
  lineItems: {
    procedureCode: string;
    modifiers: string[];
    units: number;
    unitCost: number;
    diagnosisCodes: string[];
  }[];
}

export interface ClaimAnalysisResult {
  claimId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  fraudTypes: FraudType[];
  alerts: FraudAlert[];
  recommendations: string[];
  approved: boolean;
}

export interface FraudAlert {
  type: FraudType;
  severity: RiskLevel;
  confidence: number;
  description: string;
  details: any;
}

export class ClaimProcessor {
  /**
   * Process a new claim submission and run fraud detection
   */
  static async processClaim(submission: ClaimSubmission, companyId: string): Promise<ClaimAnalysisResult> {
    // Create the claim record
    const claim = await prisma.claim.create({
      data: {
        claimNumber: this.generateClaimNumber(),
        patientId: submission.patientId,
        providerId: submission.providerId,
        companyId,
        serviceDate: submission.serviceDate,
        billedAmount: submission.lineItems.reduce((sum, item) => sum + (item.unitCost * item.units), 0),
        status: ClaimStatus.PENDING
      },
      include: {
        patient: true,
        provider: true,
        claimLineItems: true
      }
    });

    // Create claim line items
    const lineItems = await Promise.all(
      submission.lineItems.map(item =>
        prisma.claimLineItem.create({
          data: {
            claimId: claim.id,
            procedureCode: item.procedureCode,
            modifier1: item.modifiers[0],
            modifier2: item.modifiers[1],
            modifier3: item.modifiers[2],
            modifier4: item.modifiers[3],
            units: item.units,
            unitCost: item.unitCost,
            totalCost: item.unitCost * item.units,
            diagnosisCode1: item.diagnosisCodes[0],
            diagnosisCode2: item.diagnosisCodes[1],
            diagnosisCode3: item.diagnosisCodes[2],
            diagnosisCode4: item.diagnosisCodes[3]
          }
        })
      )
    );

    // Run fraud detection analysis
    const analysis = await this.analyzeClaim(claim, lineItems);

    // Update claim with analysis results
    await prisma.claim.update({
      where: { id: claim.id },
      data: {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        fraudTypes: analysis.fraudTypes,
        isFlagged: analysis.riskScore > 70,
        status: analysis.approved ? ClaimStatus.APPROVED : ClaimStatus.FLAGGED_FOR_FRAUD
      }
    });

    // Create fraud alerts if any detected
    if (analysis.alerts.length > 0) {
      await Promise.all(
        analysis.alerts.map(alert =>
          prisma.fraudAlert.create({
            data: {
              claimId: claim.id,
              providerId: submission.providerId,
              alertType: alert.type,
              severity: alert.severity,
              confidence: alert.confidence,
              description: alert.description,
              details: alert.details,
              detectionModel: 'ClaimProcessor-v1'
            }
          })
        )
      );
    }

    return {
      ...analysis,
      claimId: claim.id
    };
  }

  /**
   * Analyze a claim for fraud indicators
   */
  static async analyzeClaim(claim: any, lineItems: any[]): Promise<Omit<ClaimAnalysisResult, 'claimId'>> {
    const alerts: FraudAlert[] = [];
    let totalRiskScore = 0;
    const detectedFraudTypes: FraudType[] = [];

    // 1. Check for upcoding
    const upcodingAnalysis = this.detectUpcoding(claim, lineItems);
    if (upcodingAnalysis.riskScore > 0) {
      alerts.push(upcodingAnalysis);
      totalRiskScore = Math.max(totalRiskScore, upcodingAnalysis.confidence);
      detectedFraudTypes.push(FraudType.UPDATING);
    }

    // 2. Check for unbundling
    const unbundlingAnalysis = this.detectUnbundling(lineItems);
    if (unbundlingAnalysis.riskScore > 0) {
      alerts.push(unbundlingAnalysis);
      totalRiskScore = Math.max(totalRiskScore, unbundlingAnalysis.confidence);
      detectedFraudTypes.push(FraudType.UNBUNDLING);
    }

    // 3. Check for phantom billing
    const phantomAnalysis = await this.detectPhantomBilling(claim, lineItems);
    if (phantomAnalysis.riskScore > 0) {
      alerts.push(phantomAnalysis);
      totalRiskScore = Math.max(totalRiskScore, phantomAnalysis.confidence);
      detectedFraudTypes.push(FraudType.PHANTOM_BILLING);
    }

    // 4. Check for duplicate claims
    const duplicateAnalysis = await this.detectDuplicateClaims(claim);
    if (duplicateAnalysis.riskScore > 0) {
      alerts.push(duplicateAnalysis);
      totalRiskScore = Math.max(totalRiskScore, duplicateAnalysis.confidence);
      detectedFraudTypes.push(FraudType.DUPLICATE_CLAIM);
    }

    // 5. Provider pattern analysis
    const providerRisk = await this.analyzeProviderPatterns(claim.providerId);
    totalRiskScore = Math.max(totalRiskScore, providerRisk);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(totalRiskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(alerts, riskLevel);

    // Auto-approve low risk claims
    const approved = totalRiskScore < 30 && alerts.length === 0;

    return {
      riskScore: totalRiskScore,
      riskLevel,
      fraudTypes: detectedFraudTypes,
      alerts,
      recommendations,
      approved
    };
  }

  /**
   * Detect upcoding patterns
   */
  private static detectUpcoding(claim: any, lineItems: any[]): FraudAlert {
    let riskScore = 0;
    const reasons: string[] = [];

    // Check for consistent high-level coding
    const highLevelCodes = lineItems.filter(item =>
      ['99214', '99215', '99205', '99204', '99203'].includes(item.procedureCode)
    );

    if (highLevelCodes.length > 0 && highLevelCodes.length === lineItems.length) {
      riskScore += 40;
      reasons.push('All services billed at high complexity levels');
    }

    // Check for inappropriate modifier usage
    const modifier59Abuse = lineItems.filter(item =>
      item.modifier1 === '59' || item.modifier2 === '59'
    );

    if (modifier59Abuse.length > 2) {
      riskScore += 30;
      reasons.push('Excessive use of modifier 59 (unbundling indicator)');
    }

    // Check for time-based procedure abuse
    const timeBasedCodes = lineItems.filter(item =>
      ['99213', '99214', '99215'].includes(item.procedureCode)
    );

    for (const item of timeBasedCodes) {
      const cptCode = CPT_CODES[item.procedureCode];
      if (cptCode && item.totalCost > cptCode.typicalRange.max) {
        riskScore += 25;
        reasons.push(`Excessive charge for ${item.procedureCode}`);
      }
    }

    return {
      type: FraudType.UPDATING,
      severity: this.determineRiskLevel(riskScore),
      confidence: Math.min(riskScore, 100),
      description: 'Potential upcoding detected',
      details: { reasons, highValueCodes: highLevelCodes.map(i => i.procedureCode) }
    };
  }

  /**
   * Detect unbundling patterns
   */
  private static detectUnbundling(lineItems: any[]): FraudAlert {
    const procedureCodes = lineItems.map(item => item.procedureCode);
    const validation = BillingCodeValidator.validateCodeCombination(procedureCodes);

    if (validation.riskScore > 50) {
      return {
        type: FraudType.UNBUNDLING,
        severity: this.determineRiskLevel(validation.riskScore),
        confidence: validation.riskScore,
        description: 'Potential unbundling of procedures',
        details: { warnings: validation.warnings, codes: procedureCodes }
      };
    }

    return {
      type: FraudType.UNBUNDLING,
      severity: RiskLevel.LOW,
      confidence: 0,
      description: 'No unbundling detected',
      details: {}
    };
  }

  /**
   * Detect phantom billing patterns
   */
  private static async detectPhantomBilling(claim: any, lineItems: any[]): FraudAlert {
    let riskScore = 0;
    const reasons: string[] = [];

    // Check for impossible volume
    const dailyVolume = lineItems.reduce((sum, item) => sum + item.units, 0);
    if (dailyVolume > 50) { // Arbitrary threshold for impossible daily volume
      riskScore += 60;
      reasons.push('Impossible service volume for single day');
    }

    // Check for geographic anomalies (if provider location is known)
    if (claim.provider.latitude && claim.provider.longitude) {
      // This would integrate with geospatial analysis
      // For now, just a placeholder
      const geographicRisk = await this.checkGeographicAnomalies(claim);
      riskScore += geographicRisk;
      if (geographicRisk > 30) {
        reasons.push('Geographic anomaly detected');
      }
    }

    // Check for patient-provider time conflicts
    const timeConflict = await this.checkTimeConflicts(claim);
    if (timeConflict > 40) {
      riskScore += timeConflict;
      reasons.push('Potential time conflict with other providers');
    }

    return {
      type: FraudType.PHANTOM_BILLING,
      severity: this.determineRiskLevel(riskScore),
      confidence: Math.min(riskScore, 100),
      description: 'Potential phantom billing detected',
      details: { reasons, dailyVolume, geographicRisk, timeConflict }
    };
  }

  /**
   * Detect duplicate claims
   */
  private static async detectDuplicateClaims(claim: any): Promise<FraudAlert> {
    // Check for identical claims within last 30 days
    const duplicates = await prisma.claim.findMany({
      where: {
        providerId: claim.providerId,
        patientId: claim.patientId,
        serviceDate: claim.serviceDate,
        billedAmount: claim.billedAmount,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        id: { not: claim.id }
      }
    });

    if (duplicates.length > 0) {
      return {
        type: FraudType.DUPLICATE_CLAIM,
        severity: RiskLevel.HIGH,
        confidence: 90,
        description: 'Duplicate claim detected',
        details: { duplicateCount: duplicates.length, duplicateIds: duplicates.map(d => d.id) }
      };
    }

    return {
      type: FraudType.DUPLICATE_CLAIM,
      severity: RiskLevel.LOW,
      confidence: 0,
      description: 'No duplicates found',
      details: {}
    };
  }

  /**
   * Analyze provider's historical patterns
   */
  private static async analyzeProviderPatterns(providerId: string): Promise<number> {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        claims: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
            }
          }
        }
      }
    });

    if (!provider || provider.claims.length === 0) return 0;

    // Calculate provider's flag rate
    const flaggedClaims = provider.claims.filter(claim => claim.isFlagged).length;
    const flagRate = flaggedClaims / provider.claims.length;

    // High flag rate increases risk
    if (flagRate > 0.3) return 50;
    if (flagRate > 0.2) return 30;
    if (flagRate > 0.1) return 15;

    return 0;
  }

  /**
   * Determine risk level based on score
   */
  private static determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 40) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(alerts: FraudAlert[], riskLevel: RiskLevel): string[] {
    const recommendations: string[] = [];

    if (riskLevel === RiskLevel.CRITICAL) {
      recommendations.push('Immediate investigation required');
      recommendations.push('Consider payment suspension');
      recommendations.push('SIU team notification');
    } else if (riskLevel === RiskLevel.HIGH) {
      recommendations.push('Manual review required');
      recommendations.push('Additional documentation requested');
    } else if (riskLevel === RiskLevel.MEDIUM) {
      recommendations.push('Enhanced monitoring recommended');
      recommendations.push('Verify provider credentials');
    }

    // Specific recommendations based on alert types
    for (const alert of alerts) {
      switch (alert.type) {
        case FraudType.UPDATING:
          recommendations.push('Review medical record documentation');
          recommendations.push('Verify time spent with patient');
          break;
        case FraudType.UNBUNDLING:
          recommendations.push('Check for appropriate use of modifier 59');
          recommendations.push('Review bundling rules');
          break;
        case FraudType.PHANTOM_BILLING:
          recommendations.push('Verify patient identity and service location');
          recommendations.push('Check provider schedule');
          break;
        case FraudType.DUPLICATE_CLAIM:
          recommendations.push('Review claim submission history');
          recommendations.push('Check for system errors');
          break;
      }
    }

    return recommendations;
  }

  /**
   * Helper methods (placeholders for now)
   */
  private static generateClaimNumber(): string {
    return 'CLM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  private static async checkGeographicAnomalies(claim: any): Promise<number> {
    // Placeholder for geospatial analysis
    return 0;
  }

  private static async checkTimeConflicts(claim: any): Promise<number> {
    // Placeholder for schedule analysis
    return 0;
  }
}
