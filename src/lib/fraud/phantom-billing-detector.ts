import { prisma } from '@/lib/prisma';
import { FraudType, RiskLevel } from '@prisma/client';

export interface PhantomBillingPattern {
  pattern: string;
  description: string;
  riskScore: number;
  indicators: string[];
}

export interface VolumeAnalysis {
  maxDailyCapacity: number;
  claimedDailyVolume: number;
  volumeExceeded: boolean;
  excessPercentage: number;
  suspiciousDates: string[];
}

export interface GeographicAnalysis {
  providerLocation: { lat: number; lng: number };
  serviceLocations: { lat: number; lng: number; address: string }[];
  maxDistance: number;
  suspiciousLocations: string[];
  geographicAnomalies: string[];
}

export interface TimeConflictAnalysis {
  overlappingServices: Array<{
    date: Date;
    timeSlot: string;
    conflictingClaims: string[];
    patientCount: number;
  }>;
  conflictScore: number;
  timeImpossibilities: string[];
}

export interface PatientProviderAnalysis {
  newPatientRatio: number;
  returningPatientRatio: number;
  patientAgeDistribution: { range: string; count: number }[];
  suspiciousPatientPatterns: string[];
  identityVerificationFlags: string[];
}

export interface PhantomBillingDetectionResult {
  isPhantomBilling: boolean;
  confidence: number;
  riskLevel: RiskLevel;
  patterns: PhantomBillingPattern[];
  volumeAnalysis: VolumeAnalysis;
  geographicAnalysis: GeographicAnalysis;
  timeConflictAnalysis: TimeConflictAnalysis;
  patientAnalysis: PatientProviderAnalysis;
  recommendations: string[];
  auditTriggers: string[];
}

export class PhantomBillingDetector {
  // Known phantom billing patterns
  private static readonly PHANTOM_BILLING_PATTERNS: PhantomBillingPattern[] = [
    {
      pattern: 'IMPOSSIBLE_VOLUME',
      description: 'Provider claims impossible number of services per day',
      riskScore: 95,
      indicators: ['daily_capacity_exceeded', 'unrealistic_productivity', 'time_constraint_violation']
    },
    {
      pattern: 'GEOGRAPHIC_ANOMALY',
      description: 'Services billed from impossible locations',
      riskScore: 85,
      indicators: ['location_mismatch', 'distance_impossibility', 'travel_time_conflict']
    },
    {
      pattern: 'TIME_CONFLICT',
      description: 'Overlapping service times that are physically impossible',
      riskScore: 90,
      indicators: ['simultaneous_services', 'time_travel_conflict', 'schedule_impossibility']
    },
    {
      pattern: 'PATIENT_IDENTITY_FRAUD',
      description: 'Suspicious patient demographics or identity patterns',
      riskScore: 75,
      indicators: ['fake_patients', 'identity_theft', 'unusual_demographics']
    },
    {
      pattern: 'PATTERN_ANOMALY',
      description: 'Billing patterns deviate from normal provider behavior',
      riskScore: 70,
      indicators: ['statistical_outliers', 'behavioral_deviation', 'unusual_patterns']
    }
  ];

  /**
   * Detect phantom billing patterns for a provider
   */
  static async detectPhantomBilling(
    providerId: string,
    timeWindow: number = 90 // days
  ): Promise<PhantomBillingDetectionResult> {

    // Get provider's recent claims
    const claims = await this.getProviderClaims(providerId, timeWindow);

    if (claims.length === 0) {
      return this.createEmptyResult(providerId);
    }

    // Perform various analyses
    const volumeAnalysis = await this.analyzeVolume(claims, providerId);
    const geographicAnalysis = await this.analyzeGeographicPatterns(claims, providerId);
    const timeConflictAnalysis = await this.analyzeTimeConflicts(claims);
    const patientAnalysis = await this.analyzePatientPatterns(claims);

    // Detect specific phantom billing patterns
    const detectedPatterns = await this.detectPhantomBillingPatterns(
      claims,
      volumeAnalysis,
      geographicAnalysis,
      timeConflictAnalysis,
      patientAnalysis
    );

    // Calculate overall confidence and risk
    const { confidence, riskLevel } = this.calculateRiskMetrics(detectedPatterns);

    // Generate recommendations and audit triggers
    const recommendations = this.generateRecommendations(detectedPatterns, {
      volumeAnalysis,
      geographicAnalysis,
      timeConflictAnalysis,
      patientAnalysis
    });
    const auditTriggers = this.generateAuditTriggers(detectedPatterns, confidence);

    return {
      isPhantomBilling: confidence > 70,
      confidence,
      riskLevel,
      patterns: detectedPatterns,
      volumeAnalysis,
      geographicAnalysis,
      timeConflictAnalysis,
      patientAnalysis,
      recommendations,
      auditTriggers
    };
  }

  /**
   * Analyze a specific claim for phantom billing indicators
   */
  static async analyzeClaimForPhantomBilling(claimId: string): Promise<PhantomBillingDetectionResult> {
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

    // Analyze this specific claim
    const claims = [claim];
    const volumeAnalysis = await this.analyzeVolume(claims, claim.providerId);
    const geographicAnalysis = await this.analyzeGeographicPatterns(claims, claim.providerId);
    const timeConflictAnalysis = await this.analyzeTimeConflicts(claims);
    const patientAnalysis = await this.analyzePatientPatterns(claims);

    const detectedPatterns = await this.detectPhantomBillingPatterns(
      claims,
      volumeAnalysis,
      geographicAnalysis,
      timeConflictAnalysis,
      patientAnalysis
    );

    const { confidence, riskLevel } = this.calculateRiskMetrics(detectedPatterns);
    const recommendations = this.generateRecommendations(detectedPatterns, {
      volumeAnalysis,
      geographicAnalysis,
      timeConflictAnalysis,
      patientAnalysis
    });
    const auditTriggers = this.generateAuditTriggers(detectedPatterns, confidence);

    return {
      isPhantomBilling: confidence > 70,
      confidence,
      riskLevel,
      patterns: detectedPatterns,
      volumeAnalysis,
      geographicAnalysis,
      timeConflictAnalysis,
      patientAnalysis,
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
        claimLineItems: true,
        patient: true
      }
    });
  }

  /**
   * Analyze service volume for impossibility
   */
  private static async analyzeVolume(claims: any[], providerId: string): Promise<VolumeAnalysis> {
    // Get provider details to estimate capacity
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });

    // Calculate maximum daily capacity based on provider type
    const maxDailyCapacity = this.calculateMaxDailyCapacity(provider?.providerType || 'PHYSICIAN');

    // Group claims by service date
    const dailyVolume: Record<string, number> = {};
    claims.forEach(claim => {
      const dateKey = claim.serviceDate.toISOString().split('T')[0];
      dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + claim.claimLineItems.reduce((sum: number, item: any) => sum + item.units, 0);
    });

    // Find suspicious dates
    const suspiciousDates: string[] = [];
    let maxClaimedVolume = 0;

    Object.entries(dailyVolume).forEach(([date, volume]) => {
      if (volume > maxDailyCapacity) {
        suspiciousDates.push(date);
        maxClaimedVolume = Math.max(maxClaimedVolume, volume);
      }
    });

    const averageDailyVolume = Object.values(dailyVolume).reduce((sum, vol) => sum + vol, 0) / Object.keys(dailyVolume).length;
    const excessPercentage = maxDailyCapacity > 0 ? ((maxClaimedVolume - maxDailyCapacity) / maxDailyCapacity) * 100 : 0;

    return {
      maxDailyCapacity,
      claimedDailyVolume: maxClaimedVolume,
      volumeExceeded: maxClaimedVolume > maxDailyCapacity,
      excessPercentage,
      suspiciousDates
    };
  }

  /**
   * Analyze geographic patterns
   */
  private static async analyzeGeographicPatterns(claims: any[], providerId: string): Promise<GeographicAnalysis> {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { latitude: true, longitude: true, address: true }
    });

    if (!provider || !provider.latitude || !provider.longitude) {
      return {
        providerLocation: { lat: 0, lng: 0 },
        serviceLocations: [],
        maxDistance: 0,
        suspiciousLocations: [],
        geographicAnomalies: ['Provider location not available']
      };
    }

    const providerLocation = { lat: provider.latitude, lng: provider.longitude };

    // Extract service locations from claims (simplified - would normally come from claim data)
    const serviceLocations: { lat: number; lng: number; address: string }[] = [];
    const suspiciousLocations: string[] = [];
    const geographicAnomalies: string[] = [];

    // For demo purposes, use some sample locations
    // In reality, this would come from patient addresses or facility locations
    claims.forEach(claim => {
      if (claim.patient && claim.patient.city && claim.patient.state) {
        // This would normally geocode patient addresses
        // For now, just flag as needing verification
        if (claim.patient.city !== provider.city) {
          suspiciousLocations.push(`Service for patient ${claim.patient.firstName} ${claim.patient.lastName} in ${claim.patient.city}, ${claim.patient.state}`);
        }
      }
    });

    // Calculate maximum distance (simplified)
    const maxDistance = suspiciousLocations.length > 0 ? 50 : 0; // miles

    if (suspiciousLocations.length > claims.length * 0.3) {
      geographicAnomalies.push('High percentage of out-of-area services');
    }

    return {
      providerLocation,
      serviceLocations,
      maxDistance,
      suspiciousLocations,
      geographicAnomalies
    };
  }

  /**
   * Analyze time conflicts
   */
  private static async analyzeTimeConflicts(claims: any[]): Promise<TimeConflictAnalysis> {
    const overlappingServices: Array<{
      date: Date;
      timeSlot: string;
      conflictingClaims: string[];
      patientCount: number;
    }> = [];
    const timeImpossibilities: string[] = [];

    // Group claims by date and check for overlapping services
    const claimsByDate: Record<string, any[]> = {};
    claims.forEach(claim => {
      const dateKey = claim.serviceDate.toISOString().split('T')[0];
      claimsByDate[dateKey] = claimsByDate[dateKey] || [];
      claimsByDate[dateKey].push(claim);
    });

    // Check each date for time conflicts
    Object.entries(claimsByDate).forEach(([date, dateClaims]) => {
      if (dateClaims.length > 1) {
        // Simplified time conflict detection
        // In reality, this would use actual service times
        const totalUnits = dateClaims.reduce((sum, claim) =>
          sum + claim.claimLineItems.reduce((itemSum: number, item: any) => itemSum + item.units, 0), 0
        );

        // If a provider claims to have performed more than 8 hours of services in one day
        if (totalUnits > 8) {
          overlappingServices.push({
            date: new Date(date),
            timeSlot: 'FULL_DAY',
            conflictingClaims: dateClaims.map(c => c.id),
            patientCount: new Set(dateClaims.map(c => c.patientId)).size
          });

          timeImpossibilities.push(`Impossible service volume on ${date}: ${totalUnits} units claimed`);
        }
      }
    });

    const conflictScore = overlappingServices.length > 0 ? 90 : 0;

    return {
      overlappingServices,
      conflictScore,
      timeImpossibilities
    };
  }

  /**
   * Analyze patient patterns
   */
  private static async analyzePatientPatterns(claims: any[]): Promise<PatientProviderAnalysis> {
    const patients = new Map<string, any>();

    claims.forEach(claim => {
      if (!patients.has(claim.patientId)) {
        patients.set(claim.patientId, {
          ...claim.patient,
          claimCount: 0,
          totalClaims: 0
        });
      }

      const patient = patients.get(claim.patientId)!;
      patient.claimCount += 1;
      patient.totalClaims += claim.claimLineItems.reduce((sum: number, item: any) => sum + item.units, 0);
    });

    const patientArray = Array.from(patients.values());
    const totalPatients = patientArray.length;

    // Calculate new vs returning patient ratios
    const newPatients = patientArray.filter(p => p.claimCount === 1).length;
    const newPatientRatio = totalPatients > 0 ? newPatients / totalPatients : 0;
    const returningPatientRatio = 1 - newPatientRatio;

    // Analyze age distribution
    const ageDistribution = this.calculateAgeDistribution(patientArray);

    // Identify suspicious patterns
    const suspiciousPatientPatterns: string[] = [];
    const identityVerificationFlags: string[] = [];

    // Check for unusually high new patient ratio
    if (newPatientRatio > 0.8) {
      suspiciousPatientPatterns.push('Unusually high new patient ratio');
    }

    // Check for patients with minimal information
    const minimalInfoPatients = patientArray.filter(p =>
      !p.dateOfBirth || !p.address || !p.phoneNumber
    );

    if (minimalInfoPatients.length > totalPatients * 0.2) {
      identityVerificationFlags.push('High percentage of patients with incomplete information');
    }

    // Check for suspicious age patterns
    const veryElderly = patientArray.filter(p => {
      if (!p.dateOfBirth) return false;
      const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
      return age > 95;
    });

    if (veryElderly.length > totalPatients * 0.1) {
      suspiciousPatientPatterns.push('Unusual concentration of very elderly patients');
    }

    return {
      newPatientRatio,
      returningPatientRatio,
      ageDistribution,
      suspiciousPatientPatterns,
      identityVerificationFlags
    };
  }

  /**
   * Detect phantom billing patterns
   */
  private static async detectPhantomBillingPatterns(
    claims: any[],
    volumeAnalysis: VolumeAnalysis,
    geographicAnalysis: GeographicAnalysis,
    timeConflictAnalysis: TimeConflictAnalysis,
    patientAnalysis: PatientProviderAnalysis
  ): Promise<PhantomBillingPattern[]> {
    const detectedPatterns: PhantomBillingPattern[] = [];

    for (const pattern of this.PHANTOM_BILLING_PATTERNS) {
      if (await this.evaluatePhantomPattern(pattern, {
        volumeAnalysis,
        geographicAnalysis,
        timeConflictAnalysis,
        patientAnalysis
      })) {
        detectedPatterns.push(pattern);
      }
    }

    return detectedPatterns;
  }

  /**
   * Evaluate if a phantom billing pattern is present
   */
  private static async evaluatePhantomPattern(
    pattern: PhantomBillingPattern,
    analyses: {
      volumeAnalysis: VolumeAnalysis;
      geographicAnalysis: GeographicAnalysis;
      timeConflictAnalysis: TimeConflictAnalysis;
      patientAnalysis: PatientProviderAnalysis;
    }
  ): Promise<boolean> {
    switch (pattern.pattern) {
      case 'IMPOSSIBLE_VOLUME':
        return analyses.volumeAnalysis.volumeExceeded && analyses.volumeAnalysis.excessPercentage > 50;

      case 'GEOGRAPHIC_ANOMALY':
        return analyses.geographicAnalysis.suspiciousLocations.length > 5 ||
          analyses.geographicAnalysis.maxDistance > 100;

      case 'TIME_CONFLICT':
        return analyses.timeConflictAnalysis.conflictScore > 70;

      case 'PATIENT_IDENTITY_FRAUD':
        return analyses.patientAnalysis.identityVerificationFlags.length > 0 ||
          analyses.patientAnalysis.newPatientRatio > 0.9;

      case 'PATTERN_ANOMALY':
        return analyses.patientAnalysis.suspiciousPatientPatterns.length > 2;

      default:
        return false;
    }
  }

  /**
   * Calculate maximum daily capacity for provider type
   */
  private static calculateMaxDailyCapacity(providerType: string): number {
    const capacityMap: Record<string, number> = {
      'PHYSICIAN': 32, // 8 hours × 4 patients per hour
      'HOSPITAL': 200, // Hospital capacity
      'CLINIC': 80, // Multi-provider clinic
      'LABORATORY': 150, // Lab processing capacity
      'THERAPIST': 24, // 8 hours × 3 patients per hour
      'DURABLE_MEDICAL_EQUIPMENT': 50 // Equipment deliveries
    };

    return capacityMap[providerType] || 32;
  }

  /**
   * Calculate age distribution
   */
  private static calculateAgeDistribution(patients: any[]): { range: string; count: number }[] {
    const ageRanges = [
      { range: '0-18', min: 0, max: 18 },
      { range: '19-35', min: 19, max: 35 },
      { range: '36-50', min: 36, max: 50 },
      { range: '51-65', min: 51, max: 65 },
      { range: '66-80', min: 66, max: 80 },
      { range: '80+', min: 81, max: 150 }
    ];

    return ageRanges.map(range => ({
      range: range.range,
      count: patients.filter(p => {
        if (!p.dateOfBirth) return false;
        const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
        return age >= range.min && age <= range.max;
      }).length
    }));
  }

  /**
   * Calculate overall risk metrics
   */
  private static calculateRiskMetrics(patterns: PhantomBillingPattern[]): { confidence: number; riskLevel: RiskLevel } {
    if (patterns.length === 0) {
      return { confidence: 0, riskLevel: RiskLevel.LOW };
    }

    const totalRiskScore = patterns.reduce((sum, pattern) => sum + pattern.riskScore, 0);
    const confidence = totalRiskScore / patterns.length;

    let riskLevel: RiskLevel;
    if (confidence >= 85) riskLevel = RiskLevel.CRITICAL;
    else if (confidence >= 70) riskLevel = RiskLevel.HIGH;
    else if (confidence >= 50) riskLevel = RiskLevel.MEDIUM;
    else riskLevel = RiskLevel.LOW;

    return { confidence, riskLevel };
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    patterns: PhantomBillingPattern[],
    analyses: any
  ): string[] {
    const recommendations: string[] = [];

    if (analyses.volumeAnalysis.volumeExceeded) {
      recommendations.push('Verify provider schedule and capacity');
      recommendations.push('Audit time and attendance records');
    }

    if (analyses.geographicAnalysis.suspiciousLocations.length > 0) {
      recommendations.push('Verify service locations and patient addresses');
      recommendations.push('Check for travel time feasibility');
    }

    if (analyses.timeConflictAnalysis.conflictScore > 70) {
      recommendations.push('Review appointment scheduling system');
      recommendations.push('Verify actual service times');
    }

    if (analyses.patientAnalysis.identityVerificationFlags.length > 0) {
      recommendations.push('Verify patient identities and documentation');
      recommendations.push('Check for stolen patient information');
    }

    patterns.forEach(pattern => {
      switch (pattern.pattern) {
        case 'IMPOSSIBLE_VOLUME':
          recommendations.push('Conduct capacity audit');
          break;
        case 'GEOGRAPHIC_ANOMALY':
          recommendations.push('Geographic verification required');
          break;
        case 'TIME_CONFLICT':
          recommendations.push('Schedule verification needed');
          break;
        case 'PATIENT_IDENTITY_FRAUD':
          recommendations.push('Patient identity verification audit');
          break;
      }
    });

    return recommendations;
  }

  /**
   * Generate audit triggers
   */
  private static generateAuditTriggers(patterns: PhantomBillingPattern[], confidence: number): string[] {
    const triggers: string[] = [];

    if (confidence >= 85) {
      triggers.push('IMMEDIATE_INVESTIGATION_REQUIRED');
      triggers.push('PAYMENT_SUSPENSION');
    } else if (confidence >= 70) {
      triggers.push('URGENT_AUDIT');
      triggers.push('ENHANCED_MONITORING');
    }

    patterns.forEach(pattern => {
      triggers.push(pattern.pattern.toUpperCase() + '_DETECTED');
    });

    return triggers;
  }

  /**
   * Create empty result for providers with no claims
   */
  private static createEmptyResult(providerId: string): PhantomBillingDetectionResult {
    return {
      isPhantomBilling: false,
      confidence: 0,
      riskLevel: RiskLevel.LOW,
      patterns: [],
      volumeAnalysis: {
        maxDailyCapacity: 32,
        claimedDailyVolume: 0,
        volumeExceeded: false,
        excessPercentage: 0,
        suspiciousDates: []
      },
      geographicAnalysis: {
        providerLocation: { lat: 0, lng: 0 },
        serviceLocations: [],
        maxDistance: 0,
        suspiciousLocations: [],
        geographicAnomalies: []
      },
      timeConflictAnalysis: {
        overlappingServices: [],
        conflictScore: 0,
        timeImpossibilities: []
      },
      patientAnalysis: {
        newPatientRatio: 0,
        returningPatientRatio: 0,
        ageDistribution: [],
        suspiciousPatientPatterns: [],
        identityVerificationFlags: []
      },
      recommendations: ['No claims data available for analysis'],
      auditTriggers: []
    };
  }
}
