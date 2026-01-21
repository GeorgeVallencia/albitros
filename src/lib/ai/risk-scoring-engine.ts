import { openai, anthropic, googleAI, AI_MODELS, AI_SETTINGS } from '@/lib/ai/config';
import { prisma } from '@/lib/prisma';
import { UpcodingDetector } from '@/lib/fraud/upcoding-detector';
import { PhantomBillingDetector } from '@/lib/fraud/phantom-billing-detector';
import { ProviderNetworkAnalyzer } from '@/lib/network/provider-network-analyzer';

export interface RiskFactors {
  // Provider-specific factors
  providerHistory: {
    totalClaims: number;
    flaggedClaims: number;
    flagRate: number;
    averageClaimValue: number;
    riskTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  };

  // Claim-specific factors
  claimCharacteristics: {
    totalAmount: number;
    complexity: number;
    unusualCodes: string[];
    timeDocumentation: number;
    bundlingRisk: number;
  };

  // Patient-specific factors
  patientProfile: {
    age: number;
    newPatient: boolean;
    chronicConditions: number;
    visitFrequency: number;
    geographicAnomalies: number;
  };

  // Network factors
  networkRisk: {
    suspiciousConnections: number;
    clusterMembership: boolean;
    fraudRingIndicators: string[];
    referralAnomalies: number;
  };

  // Behavioral factors
  behavioralPatterns: {
    billingFrequency: number;
    timePatterns: number;
    codeDistribution: number;
    modifierUsage: number;
  };
}

export interface RiskScore {
  overallScore: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: {
    providerRisk: number;
    claimRisk: number;
    patientRisk: number;
    networkRisk: number;
    behavioralRisk: number;
  };
  keyDrivers: string[];
  recommendations: string[];
  auditTriggers: string[];
}

export interface MLModelPrediction {
  model: string;
  prediction: number;
  confidence: number;
  features: Record<string, number>;
  explanation: string[];
}

export class RiskScoringEngine {
  // Risk factor weights
  private static readonly RISK_WEIGHTS = {
    providerHistory: 0.25,
    claimCharacteristics: 0.30,
    patientProfile: 0.15,
    networkRisk: 0.20,
    behavioralPatterns: 0.10
  };

  // Risk thresholds
  private static readonly RISK_THRESHOLDS = {
    LOW: { min: 0, max: 30 },
    MEDIUM: { min: 31, max: 60 },
    HIGH: { min: 61, max: 80 },
    CRITICAL: { min: 81, max: 100 }
  };

  /**
   * Calculate comprehensive risk score for a claim
   */
  static async calculateClaimRisk(claimId: string): Promise<RiskScore> {
    // Get claim data
    const claim = await this.getClaimData(claimId);

    // Extract risk factors
    const riskFactors = await this.extractRiskFactors(claim);

    // Calculate individual risk components
    const providerRisk = await this.calculateProviderRisk(claim.providerId, riskFactors);
    const claimRisk = await this.calculateClaimRisk(claim, riskFactors);
    const patientRisk = await this.calculatePatientRisk(claim.patientId, riskFactors);
    const networkRisk = await this.calculateNetworkRisk(claim.providerId, riskFactors);
    const behavioralRisk = await this.calculateBehavioralRisk(claim.providerId, riskFactors);

    // Apply machine learning models
    const mlPredictions = await this.runMLModels(riskFactors);

    // Calculate weighted overall score
    const overallScore = this.calculateWeightedScore({
      providerRisk,
      claimRisk,
      patientRisk,
      networkRisk,
      behavioralRisk
    });

    // Enhance with ML predictions
    const enhancedScore = this.enhanceWithML(overallScore, mlPredictions);

    // Determine risk level and generate insights
    const riskLevel = this.determineRiskLevel(enhancedScore.overallScore);
    const keyDrivers = this.identifyKeyDrivers(riskFactors, enhancedScore);
    const recommendations = this.generateRecommendations(riskLevel, keyDrivers, riskFactors);
    const auditTriggers = this.generateAuditTriggers(riskLevel, enhancedScore);

    return {
      ...enhancedScore,
      riskLevel,
      keyDrivers,
      recommendations,
      auditTriggers
    };
  }

  /**
   * Calculate real-time risk score during claim submission
   */
  static async calculateRealTimeRisk(claimSubmission: any): Promise<{
    riskScore: number;
    riskLevel: string;
    immediateActions: string[];
    processingRecommendation: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'INVESTIGATE';
  }> {
    // Quick risk assessment for real-time processing
    const riskFactors = await this.extractRealTimeRiskFactors(claimSubmission);

    // Calculate simplified risk score
    const quickScore = await this.calculateQuickRiskScore(riskFactors);

    const riskLevel = this.determineRiskLevel(quickScore);

    // Determine immediate actions
    const immediateActions = this.getImmediateActions(riskLevel, quickScore);
    const processingRecommendation = this.getProcessingRecommendation(riskLevel, quickScore);

    return {
      riskScore: quickScore,
      riskLevel,
      immediateActions,
      processingRecommendation
    };
  }

  /**
   * Batch risk scoring for multiple claims
   */
  static async batchRiskScoring(claimIds: string[]): Promise<Map<string, RiskScore>> {
    const results = new Map<string, RiskScore>();

    // Process claims in parallel batches
    const batchSize = 10;
    for (let i = 0; i < claimIds.length; i += batchSize) {
      const batch = claimIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (claimId) => {
        try {
          const riskScore = await this.calculateClaimRisk(claimId);
          return { claimId, riskScore };
        } catch (error) {
          console.error(`Error calculating risk for claim ${claimId}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(result => {
        if (result) {
          results.set(result.claimId, result.riskScore);
        }
      });
    }

    return results;
  }

  /**
   * Get claim data with all necessary relationships
   */
  private static async getClaimData(claimId: string) {
    return await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        provider: {
          include: {
            claims: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // 6 months
                }
              }
            }
          }
        },
        patient: {
          include: {
            claims: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        },
        claimLineItems: true,
        fraudAlerts: true
      }
    });
  }

  /**
   * Extract comprehensive risk factors
   */
  private static async extractRiskFactors(claim: any): Promise<RiskFactors> {
    // Provider history analysis
    const providerHistory = await this.analyzeProviderHistory(claim.provider);

    // Claim characteristics analysis
    const claimCharacteristics = await this.analyzeClaimCharacteristics(claim);

    // Patient profile analysis
    const patientProfile = await this.analyzePatientProfile(claim.patient);

    // Network risk analysis
    const networkRisk = await this.analyzeNetworkRisk(claim.providerId);

    // Behavioral patterns analysis
    const behavioralPatterns = await this.analyzeBehavioralPatterns(claim.provider);

    return {
      providerHistory,
      claimCharacteristics,
      patientProfile,
      networkRisk,
      behavioralPatterns
    };
  }

  /**
   * Extract real-time risk factors for quick assessment
   */
  private static async extractRealTimeRiskFactors(claimSubmission: any): Promise<Partial<RiskFactors>> {
    // Simplified analysis for real-time processing
    const claimCharacteristics = {
      totalAmount: claimSubmission.lineItems.reduce((sum: number, item: any) => sum + (item.unitCost * item.units), 0),
      complexity: claimSubmission.lineItems.length,
      unusualCodes: claimSubmission.lineItems.filter((item: any) => this.isUnusualCode(item.procedureCode)),
      timeDocumentation: 0, // Would need EHR integration
      bundlingRisk: this.assessBundlingRisk(claimSubmission.lineItems)
    };

    return {
      claimCharacteristics
    };
  }

  /**
   * Calculate individual risk components
   */
  private static async calculateProviderRisk(providerId: string, factors: RiskFactors): Promise<number> {
    const history = factors.providerHistory;
    let risk = 0;

    // Flag rate impact
    risk += history.flagRate * 50;

    // Risk trend impact
    if (history.riskTrend === 'DETERIORATING') risk += 20;
    else if (history.riskTrend === 'IMPROVING') risk -= 10;

    // Average claim value impact
    if (history.averageClaimValue > 1000) risk += 15;

    return Math.min(Math.max(risk, 0), 100);
  }

  private static async calculateClaimRisk(claim: any, factors: RiskFactors): Promise<number> {
    const characteristics = factors.claimCharacteristics;
    let risk = 0;

    // Amount-based risk
    if (characteristics.totalAmount > 5000) risk += 30;
    else if (characteristics.totalAmount > 2000) risk += 15;

    // Complexity risk
    risk += Math.min(characteristics.complexity * 3, 25);

    // Unusual codes risk
    risk += characteristics.unusualCodes.length * 10;

    // Bundling risk
    risk += characteristics.bundlingRisk * 20;

    return Math.min(Math.max(risk, 0), 100);
  }

  private static async calculatePatientRisk(patientId: string, factors: RiskFactors): Promise<number> {
    const profile = factors.patientProfile;
    let risk = 0;

    // Age-based risk
    if (profile.age > 85 || profile.age < 1) risk += 15;

    // New patient risk
    if (profile.newPatient) risk += 10;

    // Chronic conditions risk
    risk += Math.min(profile.chronicConditions * 2, 20);

    // Visit frequency risk
    if (profile.visitFrequency > 50) risk += 20;

    // Geographic anomalies
    risk += profile.geographicAnomalies * 15;

    return Math.min(Math.max(risk, 0), 100);
  }

  private static async calculateNetworkRisk(providerId: string, factors: RiskFactors): Promise<number> {
    const network = factors.networkRisk;
    let risk = 0;

    // Suspicious connections
    risk += network.suspiciousConnections * 8;

    // Cluster membership
    if (network.clusterMembership) risk += 25;

    // Fraud ring indicators
    risk += network.fraudRingIndicators.length * 15;

    // Referral anomalies
    risk += network.referralAnomalies * 10;

    return Math.min(Math.max(risk, 0), 100);
  }

  private static async calculateBehavioralRisk(providerId: string, factors: RiskFactors): Promise<number> {
    const patterns = factors.behavioralPatterns;
    let risk = 0;

    // Billing frequency
    if (patterns.billingFrequency > 100) risk += 20;

    // Time patterns
    risk += patterns.timePatterns * 15;

    // Code distribution
    risk += patterns.codeDistribution * 15;

    // Modifier usage
    risk += patterns.modifierUsage * 10;

    return Math.min(Math.max(risk, 0), 100);
  }

  /**
   * Run machine learning models for enhanced prediction
   */
  private static async runMLModels(riskFactors: RiskFactors): Promise<MLModelPrediction[]> {
    const predictions: MLModelPrediction[] = [];

    try {
      // OpenAI GPT model for pattern recognition
      const openaiPrediction = await this.runOpenAIModel(riskFactors);
      if (openaiPrediction) predictions.push(openaiPrediction);

      // Anthropic Claude for clinical context
      const claudePrediction = await this.runClaudeModel(riskFactors);
      if (claudePrediction) predictions.push(claudePrediction);

      // Google AI for statistical analysis
      const googlePrediction = await this.runGoogleModel(riskFactors);
      if (googlePrediction) predictions.push(googlePrediction);

    } catch (error) {
      console.error('Error running ML models:', error);
    }

    return predictions;
  }

  /**
   * Run OpenAI model for fraud detection
   */
  private static async runOpenAIModel(riskFactors: RiskFactors): Promise<MLModelPrediction | null> {
    try {
      const prompt = this.buildAIPrompt(riskFactors);

      const response = await openai.chat.completions.create({
        model: AI_MODELS.GPT4,
        messages: [
          {
            role: 'system',
            content: 'You are an expert healthcare fraud detection analyst. Analyze the provided risk factors and return a fraud probability score (0-100) with explanation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: AI_SETTINGS.TEMPERATURE
      });

      const content = response.choices[0]?.message?.content || '';
      const score = this.extractScoreFromResponse(content);

      return {
        model: 'OpenAI-GPT4',
        prediction: score,
        confidence: 0.85,
        features: this.extractFeatures(riskFactors),
        explanation: this.extractExplanations(content)
      };

    } catch (error) {
      console.error('OpenAI model error:', error);
      return null;
    }
  }

  /**
   * Run Anthropic Claude model
   */
  private static async runClaudeModel(riskFactors: RiskFactors): Promise<MLModelPrediction | null> {
    try {
      const prompt = this.buildAIPrompt(riskFactors);

      const response = await anthropic.messages.create({
        model: AI_MODELS.CLAUDE_3_SONNET,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const score = this.extractScoreFromResponse(content);

      return {
        model: 'Anthropic-Claude3',
        prediction: score,
        confidence: 0.88,
        features: this.extractFeatures(riskFactors),
        explanation: this.extractExplanations(content)
      };

    } catch (error) {
      console.error('Claude model error:', error);
      return null;
    }
  }

  /**
   * Run Google AI model
   */
  private static async runGoogleModel(riskFactors: RiskFactors): Promise<MLModelPrediction | null> {
    try {
      const prompt = this.buildAIPrompt(riskFactors);

      const model = googleAI.getGenerativeModel({ model: AI_MODELS.GEMINI_PRO });
      const response = await model.generateContent(prompt);

      const content = response.response.text() || '';
      const score = this.extractScoreFromResponse(content);

      return {
        model: 'Google-Gemini',
        prediction: score,
        confidence: 0.82,
        features: this.extractFeatures(riskFactors),
        explanation: this.extractExplanations(content)
      };

    } catch (error) {
      console.error('Google AI model error:', error);
      return null;
    }
  }

  /**
   * Helper methods
   */
  private static calculateWeightedScore(scores: {
    providerRisk: number;
    claimRisk: number;
    patientRisk: number;
    networkRisk: number;
    behavioralRisk: number;
  }): RiskScore {
    const overallScore =
      scores.providerRisk * this.RISK_WEIGHTS.providerHistory +
      scores.claimRisk * this.RISK_WEIGHTS.claimCharacteristics +
      scores.patientRisk * this.RISK_WEIGHTS.patientProfile +
      scores.networkRisk * this.RISK_WEIGHTS.networkRisk +
      scores.behavioralRisk * this.RISK_WEIGHTS.behavioralPatterns;

    return {
      overallScore,
      confidence: 0.75, // Base confidence without ML
      riskLevel: 'MEDIUM', // Will be updated
      breakdown: scores,
      keyDrivers: [],
      recommendations: [],
      auditTriggers: []
    };
  }

  private static enhanceWithML(baseScore: RiskScore, predictions: MLModelPrediction[]): RiskScore {
    if (predictions.length === 0) return baseScore;

    // Weighted average of ML predictions
    const mlScore = predictions.reduce((sum, pred) =>
      sum + (pred.prediction * pred.confidence), 0
    ) / predictions.reduce((sum, pred) => sum + pred.confidence, 0);

    // Combine base score with ML predictions
    const enhancedScore = (baseScore.overallScore * 0.6) + (mlScore * 0.4);

    return {
      ...baseScore,
      overallScore: enhancedScore,
      confidence: Math.min(baseScore.confidence + 0.15, 0.95)
    };
  }

  private static determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= this.RISK_THRESHOLDS.CRITICAL.min) return 'CRITICAL';
    if (score >= this.RISK_THRESHOLDS.HIGH.min) return 'HIGH';
    if (score >= this.RISK_THRESHOLDS.MEDIUM.min) return 'MEDIUM';
    return 'LOW';
  }

  private static identifyKeyDrivers(factors: RiskFactors, score: RiskScore): string[] {
    const drivers: string[] = [];

    if (factors.providerHistory.flagRate > 0.3) {
      drivers.push('High provider flag rate');
    }

    if (factors.claimCharacteristics.totalAmount > 5000) {
      drivers.push('High claim amount');
    }

    if (factors.networkRisk.suspiciousConnections > 5) {
      drivers.push('Suspicious network connections');
    }

    if (factors.behavioralPatterns.billingFrequency > 100) {
      drivers.push('Unusual billing frequency');
    }

    return drivers;
  }

  private static generateRecommendations(riskLevel: string, keyDrivers: string[], factors: RiskFactors): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'CRITICAL') {
      recommendations.push('Immediate investigation required');
      recommendations.push('Consider payment suspension');
    } else if (riskLevel === 'HIGH') {
      recommendations.push('Manual review required');
      recommendations.push('Request additional documentation');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('Enhanced monitoring recommended');
    }

    // Specific recommendations based on key drivers
    keyDrivers.forEach(driver => {
      if (driver.includes('flag rate')) {
        recommendations.push('Review provider history and patterns');
      }
      if (driver.includes('network')) {
        recommendations.push('Analyze provider network associations');
      }
      if (driver.includes('frequency')) {
        recommendations.push('Verify billing patterns and capacity');
      }
    });

    return recommendations;
  }

  private static generateAuditTriggers(riskLevel: string, score: RiskScore): string[] {
    const triggers: string[] = [];

    if (riskLevel === 'CRITICAL') {
      triggers.push('CRITICAL_RISK_ALERT');
      triggers.push('IMMEDIATE_AUDIT_REQUIRED');
    } else if (riskLevel === 'HIGH') {
      triggers.push('HIGH_RISK_DETECTED');
      triggers.push('MANUAL_REVIEW_NEEDED');
    }

    if (score.overallScore > 90) {
      triggers.push('EXTREME_RISK_SCORE');
    }

    return triggers;
  }

  // Additional helper methods (simplified implementations)
  private static async analyzeProviderHistory(provider: any): Promise<any> {
    const claims = provider.claims || [];
    const flaggedClaims = claims.filter((c: any) => c.isFlagged).length;

    return {
      totalClaims: claims.length,
      flaggedClaims,
      flagRate: claims.length > 0 ? flaggedClaims / claims.length : 0,
      averageClaimValue: claims.reduce((sum: number, c: any) => sum + parseFloat(c.billedAmount.toString()), 0) / claims.length,
      riskTrend: 'STABLE' // Simplified
    };
  }

  private static async analyzeClaimCharacteristics(claim: any): Promise<any> {
    return {
      totalAmount: parseFloat(claim.billedAmount.toString()),
      complexity: claim.claimLineItems?.length || 0,
      unusualCodes: [],
      timeDocumentation: 0,
      bundlingRisk: 0
    };
  }

  private static async analyzePatientProfile(patient: any): Promise<any> {
    const age = patient.dateOfBirth ?
      new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 0;

    return {
      age,
      newPatient: (patient.claims?.length || 0) === 1,
      chronicConditions: 0,
      visitFrequency: patient.claims?.length || 0,
      geographicAnomalies: 0
    };
  }

  private static async analyzeNetworkRisk(providerId: string): Promise<any> {
    return {
      suspiciousConnections: 0,
      clusterMembership: false,
      fraudRingIndicators: [],
      referralAnomalies: 0
    };
  }

  private static async analyzeBehavioralPatterns(providerId: string): Promise<any> {
    return {
      billingFrequency: 0,
      timePatterns: 0,
      codeDistribution: 0,
      modifierUsage: 0
    };
  }

  private static calculateQuickRiskScore(factors: Partial<RiskFactors>): number {
    const characteristics = factors.claimCharacteristics;
    if (!characteristics) return 10;

    let score = 10; // Base score

    if (characteristics.totalAmount > 5000) score += 30;
    if (characteristics.totalAmount > 2000) score += 15;
    score += Math.min(characteristics.complexity * 3, 25);
    score += characteristics.unusualCodes.length * 10;
    score += characteristics.bundlingRisk * 20;

    return Math.min(score, 100);
  }

  private static getImmediateActions(riskLevel: string, score: number): string[] {
    const actions: string[] = [];

    if (riskLevel === 'CRITICAL') {
      actions.push('Flag for immediate investigation');
      actions.push('Hold payment');
    } else if (riskLevel === 'HIGH') {
      actions.push('Queue for manual review');
      actions.push('Request documentation');
    }

    return actions;
  }

  private static getProcessingRecommendation(riskLevel: string, score: number): 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'INVESTIGATE' {
    if (riskLevel === 'CRITICAL') return 'INVESTIGATE';
    if (riskLevel === 'HIGH') return 'MANUAL_REVIEW';
    if (riskLevel === 'MEDIUM') return 'MANUAL_REVIEW';
    return 'AUTO_APPROVE';
  }

  private static isUnusualCode(code: string): boolean {
    // Simplified check for unusual codes
    const unusualCodes = ['99999', '99998', '99997'];
    return unusualCodes.includes(code);
  }

  private static assessBundlingRisk(lineItems: any[]): number {
    // Simplified bundling risk assessment
    return lineItems.length > 5 ? 0.7 : 0.3;
  }

  private static buildAIPrompt(factors: RiskFactors): string {
    return `
Analyze these healthcare claim risk factors and provide a fraud probability score (0-100):

Provider History:
- Flag Rate: ${factors.providerHistory.flagRate}%
- Average Claim Value: $${factors.providerHistory.averageClaimValue}
- Risk Trend: ${factors.providerHistory.riskTrend}

Claim Characteristics:
- Total Amount: $${factors.claimCharacteristics.totalAmount}
- Complexity: ${factors.claimCharacteristics.complexity}
- Bundling Risk: ${factors.claimCharacteristics.bundlingRisk}

Patient Profile:
- Age: ${factors.patientProfile.age}
- New Patient: ${factors.patientProfile.newPatient}
- Visit Frequency: ${factors.patientProfile.visitFrequency}

Network Risk:
- Suspicious Connections: ${factors.networkRisk.suspiciousConnections}
- Cluster Membership: ${factors.networkRisk.clusterMembership}

Return a JSON format with:
{
  "score": 0-100,
  "reasoning": "explanation of key factors",
  "confidence": 0-100
}
    `;
  }

  private static extractScoreFromResponse(content: string): number {
    const match = content.match(/"score":\s*(\d+)/);
    return match ? parseInt(match[1]) : 50;
  }

  private static extractFeatures(factors: RiskFactors): Record<string, number> {
    return {
      flagRate: factors.providerHistory.flagRate,
      claimAmount: factors.claimCharacteristics.totalAmount,
      complexity: factors.claimCharacteristics.complexity,
      patientAge: factors.patientProfile.age,
      suspiciousConnections: factors.networkRisk.suspiciousConnections
    };
  }

  private static extractExplanations(content: string): string[] {
    const reasoningMatch = content.match(/"reasoning":\s*"([^"]+)"/);
    return reasoningMatch ? [reasoningMatch[1]] : [];
  }
}
