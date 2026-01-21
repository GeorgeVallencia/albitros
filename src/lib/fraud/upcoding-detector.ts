import { prisma } from '@/lib/prisma';
import { CPT_CODES, BillingCodeValidator } from '@/lib/billing/codes';
import { FraudType, RiskLevel } from '@prisma/client';

export interface UpcodingPattern {
  pattern: string;
  description: string;
  riskScore: number;
  indicators: string[];
}

export interface ProviderCodingProfile {
  providerId: string;
  averageComplexity: number;
  highLevelCodeFrequency: number;
  modifierUsage: Record<string, number>;
  specialtyBenchmarks: {
    averageCodeLevel: number;
    typicalModifiers: string[];
    riskFactors: string[];
  };
  deviationScore: number;
}

export interface UpcodingDetectionResult {
  isUpcoding: boolean;
  confidence: number;
  riskLevel: RiskLevel;
  patterns: UpcodingPattern[];
  providerProfile: ProviderCodingProfile;
  recommendations: string[];
  auditTriggers: string[];
}

export class UpcodingDetector {
  // Known upcoding patterns
  private static readonly UPCODING_PATTERNS: UpcodingPattern[] = [
    {
      pattern: 'CONSISTENT_HIGH_LEVEL',
      description: 'Provider consistently bills highest level E&M codes',
      riskScore: 75,
      indicators: ['99215_frequency > 0.6', '99205_frequency > 0.6', 'no_low_level_codes']
    },
    {
      pattern: 'TIME_DOCUMENTATION_MISMATCH',
      description: 'Billed time does not match documented complexity',
      riskScore: 80,
      indicators: ['high_code_without_documentation', 'time_inflation', 'complexity_exaggeration']
    },
    {
      pattern: 'MODIFIER_ABUSE',
      description: 'Excessive use of modifiers to increase reimbursement',
      riskScore: 65,
      indicators: ['modifier_59_abuse', 'modifier_25_abuse', 'modifier_57_abuse']
    },
    {
      pattern: 'SPECIALTY_DEVIATION',
      description: 'Coding patterns deviate significantly from specialty norms',
      riskScore: 70,
      indicators: ['specialty_benchmark_deviation', 'unusual_code_distribution', 'atypical_procedure_mix']
    },
    {
      pattern: 'BUNDLING_EVASION',
      description: 'Using modifiers to bypass bundling rules',
      riskScore: 85,
      indicators: ['excessive_modifier_59', 'procedure_splitting', 'unbundling_indicators']
    }
  ];

  /**
   * Detect upcoding patterns in a provider's claims
   */
  static async detectUpcoding(
    providerId: string,
    timeWindow: number = 90 // days
  ): Promise<UpcodingDetectionResult> {

    // Get provider's recent claims
    const claims = await this.getProviderClaims(providerId, timeWindow);

    if (claims.length === 0) {
      return this.createEmptyResult(providerId);
    }

    // Analyze provider coding profile
    const providerProfile = await this.analyzeProviderProfile(providerId, claims);

    // Detect specific upcoding patterns
    const detectedPatterns = await this.detectUpcodingPatterns(claims, providerProfile);

    // Calculate overall confidence and risk
    const { confidence, riskLevel } = this.calculateRiskMetrics(detectedPatterns);

    // Generate recommendations and audit triggers
    const recommendations = this.generateRecommendations(detectedPatterns, providerProfile);
    const auditTriggers = this.generateAuditTriggers(detectedPatterns, confidence);

    return {
      isUpcoding: confidence > 60,
      confidence,
      riskLevel,
      patterns: detectedPatterns,
      providerProfile,
      recommendations,
      auditTriggers
    };
  }

  /**
   * Analyze a specific claim for upcoding indicators
   */
  static async analyzeClaimForUpcoding(claimId: string): Promise<UpcodingDetectionResult> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        provider: true,
        claimLineItems: true,
        patient: true
      }
    });

    if (!claim) {
      throw new Error('Claim not found');
    }

    // Get provider profile for context
    const providerProfile = await this.analyzeProviderProfile(claim.providerId, [claim]);

    // Analyze this specific claim
    const detectedPatterns = await this.analyzeClaimUpcodingPatterns(claim, providerProfile);

    const { confidence, riskLevel } = this.calculateRiskMetrics(detectedPatterns);
    const recommendations = this.generateRecommendations(detectedPatterns, providerProfile);
    const auditTriggers = this.generateAuditTriggers(detectedPatterns, confidence);

    return {
      isUpcoding: confidence > 60,
      confidence,
      riskLevel,
      patterns: detectedPatterns,
      providerProfile,
      recommendations,
      auditTriggers
    };
  }

  /**
   * Get provider's claims within time window
   */
  private static async getProviderClaims(providerId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await prisma.claim.findMany({
      where: {
        providerId,
        createdAt: { gte: startDate }
      },
      include: {
        claimLineItems: true
      }
    });
  }

  /**
   * Analyze provider's coding profile
   */
  private static async analyzeProviderProfile(providerId: string, claims: any[]): Promise<ProviderCodingProfile> {
    // Calculate coding metrics
    const totalClaims = claims.length;
    const emCodes = claims.flatMap(claim =>
      claim.claimLineItems
        .filter(item => ['99201', '99202', '99203', '99204', '99205', '99211', '99212', '99213', '99214', '99215'].includes(item.procedureCode))
        .map(item => item.procedureCode)
    );

    // Calculate average complexity (1-5 scale for E&M codes)
    const complexityMap: Record<string, number> = {
      '99201': 1, '99202': 2, '99203': 3, '99204': 4, '99205': 5,
      '99211': 1, '99212': 2, '99213': 3, '99214': 4, '99215': 5
    };

    const complexities = emCodes.map(code => complexityMap[code] || 3);
    const averageComplexity = complexities.length > 0
      ? complexities.reduce((sum, c) => sum + c, 0) / complexities.length
      : 3;

    // Calculate high-level code frequency
    const highLevelCodes = emCodes.filter(code => ['99214', '99215', '99204', '99205'].length);
    const highLevelFrequency = emCodes.length > 0 ? highLevelCodes.length / emCodes.length : 0;

    // Analyze modifier usage
    const modifierUsage: Record<string, number> = {};
    const allModifiers = claims.flatMap(claim =>
      claim.claimLineItems.flatMap(item => [
        item.modifier1, item.modifier2, item.modifier3, item.modifier4
      ].filter(Boolean))
    );

    allModifiers.forEach(modifier => {
      modifierUsage[modifier] = (modifierUsage[modifier] || 0) + 1;
    });

    // Get provider specialty benchmarks
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    const specialtyBenchmarks = this.getSpecialtyBenchmarks(provider?.specialty || 'GENERAL_PRACTICE');

    // Calculate deviation score
    const deviationScore = this.calculateDeviationScore(averageComplexity, highLevelFrequency, modifierUsage, specialtyBenchmarks);

    return {
      providerId,
      averageComplexity,
      highLevelCodeFrequency: highLevelFrequency,
      modifierUsage,
      specialtyBenchmarks,
      deviationScore
    };
  }

  /**
   * Detect upcoding patterns in claims
   */
  private static async detectUpcodingPatterns(claims: any[], profile: ProviderCodingProfile): Promise<UpcodingPattern[]> {
    const detectedPatterns: UpcodingPattern[] = [];

    // Check each pattern
    for (const pattern of this.UPCODING_PATTERNS) {
      if (await this.evaluatePattern(pattern, claims, profile)) {
        detectedPatterns.push(pattern);
      }
    }

    return detectedPatterns;
  }

  /**
   * Analyze specific claim for upcoding
   */
  private static async analyzeClaimUpcodingPatterns(claim: any, profile: ProviderCodingProfile): Promise<UpcodingPattern[]> {
    const detectedPatterns: UpcodingPattern[] = [];
    const claims = [claim];

    for (const pattern of this.UPCODING_PATTERNS) {
      if (await this.evaluatePattern(pattern, claims, profile)) {
        detectedPatterns.push(pattern);
      }
    }

    return detectedPatterns;
  }

  /**
   * Evaluate if a pattern is present
   */
  private static async evaluatePattern(pattern: UpcodingPattern, claims: any[], profile: ProviderCodingProfile): Promise<boolean> {
    switch (pattern.pattern) {
      case 'CONSISTENT_HIGH_LEVEL':
        return profile.highLevelCodeFrequency > 0.6 && profile.averageComplexity > 4.2;

      case 'TIME_DOCUMENTATION_MISMATCH':
        return await this.checkTimeDocumentationMismatch(claims);

      case 'MODIFIER_ABUSE':
        return this.checkModifierAbuse(profile.modifierUsage);

      case 'SPECIALTY_DEVIATION':
        return profile.deviationScore > 70;

      case 'BUNDLING_EVASION':
        return await this.checkBundlingEvasion(claims);

      default:
        return false;
    }
  }

  /**
   * Check for time/documentation mismatches
   */
  private static async checkTimeDocumentationMismatch(claims: any[]): Promise<boolean> {
    // This would typically integrate with EHR systems
    // For now, use proxy indicators

    for (const claim of claims) {
      const highValueCodes = claim.claimLineItems.filter(item => {
        const cptCode = CPT_CODES[item.procedureCode];
        return cptCode && item.totalCost > cptCode.typicalRange.max * 1.5;
      });

      if (highValueCodes.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for modifier abuse
   */
  private static checkModifierAbuse(modifierUsage: Record<string, number>): boolean {
    const totalModifiers = Object.values(modifierUsage).reduce((sum, count) => sum + count, 0);

    if (totalModifiers === 0) return false;

    // Check for excessive modifier 59 (unbundling indicator)
    const modifier59Freq = (modifierUsage['59'] || 0) / totalModifiers;
    if (modifier59Freq > 0.3) return true;

    // Check for excessive modifier 25 (significant E&M service)
    const modifier25Freq = (modifierUsage['25'] || 0) / totalModifiers;
    if (modifier25Freq > 0.4) return true;

    return false;
  }

  /**
   * Check for bundling evasion
   */
  private static async checkBundlingEvasion(claims: any[]): Promise<boolean> {
    for (const claim of claims) {
      const lineItems = claim.claimLineItems;
      const procedureCodes = lineItems.map(item => item.procedureCode);

      // Use billing code validator to check unbundling
      const validation = BillingCodeValidator.validateCodeCombination(procedureCodes);

      if (validation.riskScore > 70) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get specialty benchmarks
   */
  private static getSpecialtyBenchmarks(specialty: string) {
    const benchmarks: Record<string, any> = {
      'GENERAL_PRACTICE': {
        averageCodeLevel: 3.2,
        typicalModifiers: ['25', '59'],
        riskFactors: ['HIGH_FREQUENCY_99215', 'EXCESSIVE_MODIFIERS']
      },
      'INTERNAL_MEDICINE': {
        averageCodeLevel: 3.5,
        typicalModifiers: ['25', '57'],
        riskFactors: ['COMPLEXITY_INFLATION', 'TIME_MISMATCH']
      },
      'CARDIOLOGY': {
        averageCodeLevel: 4.0,
        typicalModifiers: ['26', '59'],
        riskFactors: ['PROCEDURE_UPCODING', 'BUNDLING_EVASION']
      },
      'ORTHOPEDICS': {
        averageCodeLevel: 3.8,
        typicalModifiers: ['59', '78'],
        riskFactors: ['SURGICAL_UPCODING', 'UNBUNDLING']
      }
    };

    return benchmarks[specialty] || benchmarks['GENERAL_PRACTICE'];
  }

  /**
   * Calculate deviation score from benchmarks
   */
  private static calculateDeviationScore(
    avgComplexity: number,
    highLevelFreq: number,
    modifierUsage: Record<string, number>,
    benchmarks: any
  ): number {
    let deviation = 0;

    // Complexity deviation
    const complexityDeviation = Math.abs(avgComplexity - benchmarks.averageCodeLevel) * 20;
    deviation += Math.min(complexityDeviation, 40);

    // High-level code frequency deviation
    if (highLevelFreq > 0.4) {
      deviation += 30;
    }

    // Modifier usage deviation
    const unusualModifiers = Object.keys(modifierUsage).filter(mod =>
      !benchmarks.typicalModifiers.includes(mod)
    );
    deviation += unusualModifiers.length * 10;

    return Math.min(deviation, 100);
  }

  /**
   * Calculate overall risk metrics
   */
  private static calculateRiskMetrics(patterns: UpcodingPattern[]): { confidence: number; riskLevel: RiskLevel } {
    if (patterns.length === 0) {
      return { confidence: 0, riskLevel: RiskLevel.LOW };
    }

    // Calculate weighted confidence based on pattern risk scores
    const totalRiskScore = patterns.reduce((sum, pattern) => sum + pattern.riskScore, 0);
    const confidence = totalRiskScore / patterns.length;

    // Determine risk level
    let riskLevel: RiskLevel;
    if (confidence >= 80) riskLevel = RiskLevel.CRITICAL;
    else if (confidence >= 60) riskLevel = RiskLevel.HIGH;
    else if (confidence >= 40) riskLevel = RiskLevel.MEDIUM;
    else riskLevel = RiskLevel.LOW;

    return { confidence, riskLevel };
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(patterns: UpcodingPattern[], profile: ProviderCodingProfile): string[] {
    const recommendations: string[] = [];

    if (patterns.some(p => p.pattern === 'CONSISTENT_HIGH_LEVEL')) {
      recommendations.push('Review medical record documentation for high-level E&M codes');
      recommendations.push('Audit time spent with patients versus billed complexity');
    }

    if (patterns.some(p => p.pattern === 'MODIFIER_ABUSE')) {
      recommendations.push('Review modifier usage for medical necessity');
      recommendations.push('Educate on appropriate modifier application');
    }

    if (patterns.some(p => p.pattern === 'BUNDLING_EVASION')) {
      recommendations.push('Review bundling rules and appropriate use of modifier 59');
      recommendations.push('Consider compliance review for procedure coding');
    }

    if (profile.deviationScore > 70) {
      recommendations.push('Compare coding patterns with specialty peers');
      recommendations.push('Consider external coding audit');
    }

    return recommendations;
  }

  /**
   * Generate audit triggers
   */
  private static generateAuditTriggers(patterns: UpcodingPattern[], confidence: number): string[] {
    const triggers: string[] = [];

    if (confidence >= 80) {
      triggers.push('IMMEDIATE_AUDIT_REQUIRED');
      triggers.push('SUSPEND_PAYMENTS');
    } else if (confidence >= 60) {
      triggers.push('ENHANCED_MONITORING');
      triggers.push('DOCUMENTATION_REQUEST');
    }

    patterns.forEach(pattern => {
      triggers.push(pattern.pattern.toUpperCase() + '_DETECTED');
    });

    return triggers;
  }

  /**
   * Create empty result for providers with no claims
   */
  private static createEmptyResult(providerId: string): UpcodingDetectionResult {
    return {
      isUpcoding: false,
      confidence: 0,
      riskLevel: RiskLevel.LOW,
      patterns: [],
      providerProfile: {
        providerId,
        averageComplexity: 0,
        highLevelCodeFrequency: 0,
        modifierUsage: {},
        specialtyBenchmarks: this.getSpecialtyBenchmarks('GENERAL_PRACTICE'),
        deviationScore: 0
      },
      recommendations: ['No claims data available for analysis'],
      auditTriggers: []
    };
  }
}
