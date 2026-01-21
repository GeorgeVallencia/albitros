import { prisma } from '@/lib/prisma';

// Define enums locally since they're not properly exported from Prisma
enum FraudType {
  PHANTOM_BILLING,
  UPDATING,
  UNBUNDLING,
  DUPLICATE_CLAIM,
  KICKBACKS,
  UNNECESSARY_SERVICES,
  MISREPRESENTED_SERVICES,
  ORGANIZED_FRAUD
}

enum RiskLevel {
  LOW,
  MEDIUM,
  HIGH,
  CRITICAL
}

export interface ProviderNode {
  id: string;
  npi: string;
  name: string;
  specialty: string;
  address: string;
  totalClaims: number;
  flaggedClaims: number;
  totalBilled: number;
  riskScore: number;
  connections: number;
  suspiciousConnections: number;
}

export interface ProviderConnection {
  provider1Id: string;
  provider2Id: string;
  relationshipType: string;
  strength: number;
  claimFrequency: number;
  totalAmount: number;
  riskScore: number;
  isSuspicious: boolean;
  indicators: string[];
}

export interface NetworkCluster {
  id: string;
  providers: ProviderNode[];
  connections: ProviderConnection[];
  clusterRiskScore: number;
  suspiciousPatterns: string[];
  fraudIndicators: string[];
  totalBilled: number;
  flaggedClaims: number;
}

export interface NetworkAnalysisResult {
  totalProviders: number;
  suspiciousClusters: NetworkCluster[];
  highRiskProviders: ProviderNode[];
  suspiciousConnections: ProviderConnection[];
  fraudRings: Array<{
    providers: string[];
    pattern: string;
    confidence: number;
    totalAmount: number;
  }>;
  recommendations: string[];
  auditTriggers: string[];
}

export class ProviderNetworkAnalyzer {
  // Suspicious relationship types
  private static readonly SUSPICIOUS_RELATIONSHIPS = [
    'SHARED_ADDRESS',
    'SHARED_PHONE',
    'SHARED_FACILITY',
    'REFERRAL_LOOP',
    'EXCESSIVE_REFERRALS',
    'PATTERN_MATCHING'
  ];

  // Fraud ring patterns
  private static readonly FRAUD_RING_PATTERNS = [
    {
      name: 'REFERRAL_MILL',
      description: 'Circular referral patterns for unnecessary services',
      indicators: ['CIRCULAR_REFERRALS', 'HIGH_VOLUME_REFERRALS', 'UNNECESSARY_SERVICES'],
      minProviders: 3,
      riskScore: 90
    },
    {
      name: 'SHARED_FACILITY_SCHEME',
      description: 'Multiple providers using same facility for fraudulent billing',
      indicators: ['SHARED_ADDRESS', 'COORDINATED_BILLING', 'PATTERN_ANOMALIES'],
      minProviders: 4,
      riskScore: 85
    },
    {
      name: 'KICKBACK_RING',
      description: 'Provider network with illegal referral payments',
      indicators: ['REFERRAL_CONCENTRATION', 'HIGH_VALUE_SERVICES', 'PATIENT_SHARING'],
      minProviders: 2,
      riskScore: 95
    },
    {
      name: 'IDENTITY_THEFT_RING',
      description: 'Organized group using stolen patient identities',
      indicators: ['FAKE_PATIENTS', 'GEOGRAPHIC_SPREAD', 'COORDINATED_BILLING'],
      minProviders: 3,
      riskScore: 88
    }
  ];

  /**
   * Analyze provider network for suspicious patterns
   */
  static async analyzeProviderNetwork(companyId: string, timeWindow: number = 180): Promise<NetworkAnalysisResult> {
    // Get all providers with recent activity
    const providers = await this.getActiveProviders(companyId, timeWindow);

    if (providers.length === 0) {
      return this.createEmptyResult();
    }

    // Build provider nodes
    const providerNodes = await this.buildProviderNodes(providers);

    // Analyze connections between providers
    const connections = await this.analyzeProviderConnections(providers, timeWindow);

    // Identify suspicious clusters
    const clusters = await this.identifySuspiciousClusters(providerNodes, connections);

    // Detect fraud rings
    const fraudRings = await this.detectFraudRings(clusters, connections);

    // Get high-risk providers
    const highRiskProviders = providerNodes.filter(p => p.riskScore > 70);

    // Get suspicious connections
    const suspiciousConnections = connections.filter(c => c.isSuspicious);

    // Generate recommendations and audit triggers
    const recommendations = this.generateRecommendations(clusters, fraudRings, highRiskProviders);
    const auditTriggers = this.generateAuditTriggers(clusters, fraudRings);

    return {
      totalProviders: providers.length,
      suspiciousClusters: clusters,
      highRiskProviders,
      suspiciousConnections,
      fraudRings,
      recommendations,
      auditTriggers
    };
  }

  /**
   * Analyze specific provider's network connections
   */
  static async analyzeProviderNetworkDetails(providerId: string, timeWindow: number = 180): Promise<{
    provider: ProviderNode;
    connections: ProviderConnection[];
    clusters: NetworkCluster[];
    riskAssessment: {
      networkRiskScore: number;
      suspiciousConnections: number;
      fraudRingInvolvement: boolean;
      recommendations: string[];
    };
  }> {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        claims: {
          where: {
            createdAt: { gte: new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000) }
          }
        }
      }
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Build provider node
    const providerNode = await this.buildProviderNode(provider);

    // Get connected providers
    const connectedProviders = await this.getConnectedProviders(providerId, timeWindow);
    const allProviders = [provider, ...connectedProviders];

    // Analyze connections
    const connections = await this.analyzeProviderConnections(allProviders, timeWindow);
    const providerConnections = connections.filter(c =>
      c.provider1Id === providerId || c.provider2Id === providerId
    );

    // Identify clusters
    const providerNodes = await this.buildProviderNodes(allProviders);
    const clusters = await this.identifySuspiciousClusters(providerNodes, connections);
    const providerClusters = clusters.filter(cluster =>
      cluster.providers.some(p => p.id === providerId)
    );

    // Calculate network risk assessment
    const suspiciousConnections = providerConnections.filter(c => c.isSuspicious).length;
    const networkRiskScore = this.calculateNetworkRiskScore(providerNode, providerConnections, providerClusters);
    const fraudRingInvolvement = providerClusters.some(cluster =>
      cluster.clusterRiskScore > 80
    );

    const recommendations = this.generateProviderRecommendations(
      providerNode,
      providerConnections,
      providerClusters
    );

    return {
      provider: providerNode,
      connections: providerConnections,
      clusters: providerClusters,
      riskAssessment: {
        networkRiskScore,
        suspiciousConnections,
        fraudRingInvolvement,
        recommendations
      }
    };
  }

  /**
   * Get active providers within time window
   */
  private static async getActiveProviders(companyId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await prisma.provider.findMany({
      where: {
        companyId,
        claims: {
          some: {
            createdAt: { gte: startDate }
          }
        }
      },
      include: {
        claims: {
          where: {
            createdAt: { gte: startDate }
          },
          include: {
            claimLineItems: true,
            patient: true
          }
        }
      }
    });
  }

  /**
   * Build provider nodes with metrics
   */
  private static async buildProviderNodes(providers: any[]): Promise<ProviderNode[]> {
    return Promise.all(providers.map(async provider => this.buildProviderNode(provider)));
  }

  /**
   * Build single provider node
   */
  private static async buildProviderNode(provider: any): Promise<ProviderNode> {
    const totalClaims = provider.claims?.length || 0;
    const flaggedClaims = provider.claims?.filter((c: any) => c.isFlagged).length || 0;
    const totalBilled = provider.claims?.reduce((sum: number, claim: any) =>
      sum + parseFloat(claim.billedAmount.toString()), 0
    ) || 0;

    // Calculate individual risk score
    const riskScore = totalClaims > 0 ? (flaggedClaims / totalClaims) * 100 : 0;

    return {
      id: provider.id,
      npi: provider.npi,
      name: `${provider.firstName} ${provider.lastName}`,
      specialty: provider.specialty || 'UNKNOWN',
      address: provider.address || '',
      totalClaims,
      flaggedClaims,
      totalBilled,
      riskScore,
      connections: 0, // Will be updated when analyzing connections
      suspiciousConnections: 0 // Will be updated when analyzing connections
    };
  }

  /**
   * Analyze connections between providers
   */
  private static async analyzeProviderConnections(providers: any[], timeWindow: number): Promise<ProviderConnection[]> {
    const connections: ProviderConnection[] = [];
    const providerMap = new Map(providers.map(p => [p.id, p]));

    // Analyze each provider pair
    for (let i = 0; i < providers.length; i++) {
      for (let j = i + 1; j < providers.length; j++) {
        const provider1 = providers[i];
        const provider2 = providers[j];

        const connection = await this.analyzeProviderPair(provider1, provider2, timeWindow);
        if (connection) {
          connections.push(connection);
        }
      }
    }

    return connections;
  }

  /**
   * Analyze relationship between two providers
   */
  private static async analyzeProviderPair(provider1: any, provider2: any, timeWindow: number): Promise<ProviderConnection | null> {
    const relationshipTypes: string[] = [];
    const indicators: string[] = [];
    let strength = 0;
    let claimFrequency = 0;
    let totalAmount = 0;

    // Check for shared address
    if (provider1.address && provider2.address && provider1.address === provider2.address) {
      relationshipTypes.push('SHARED_ADDRESS');
      strength += 30;
      indicators.push('Same business address');
    }

    // Check for shared phone
    if (provider1.phoneNumber && provider2.phoneNumber && provider1.phoneNumber === provider2.phoneNumber) {
      relationshipTypes.push('SHARED_PHONE');
      strength += 25;
      indicators.push('Same phone number');
    }

    // Check for patient sharing
    const provider1Patients = new Set(provider1.claims?.map((c: any) => c.patientId) || []);
    const provider2Patients = new Set(provider2.claims?.map((c: any) => c.patientId) || []);
    const sharedPatients = [...provider1Patients].filter(patientId => provider2Patients.has(patientId));

    if (sharedPatients.length > 0) {
      relationshipTypes.push('SHARED_PATIENTS');
      strength += Math.min(sharedPatients.length * 5, 40);
      indicators.push(`${sharedPatients.length} shared patients`);
    }

    // Check for referral patterns
    const referralFrequency = await this.analyzeReferralPatterns(provider1, provider2);
    if (referralFrequency > 5) {
      relationshipTypes.push('HIGH_REFERRAL_FREQUENCY');
      strength += Math.min(referralFrequency * 3, 35);
      indicators.push(`${referralFrequency} referrals between providers`);
    }

    // Check for coordinated billing patterns
    const coordinationScore = await this.analyzeCoordinationPatterns(provider1, provider2);
    if (coordinationScore > 0.7) {
      relationshipTypes.push('COORDINATED_BILLING');
      strength += 30;
      indicators.push('Coordinated billing patterns detected');
    }

    // Calculate metrics
    claimFrequency = sharedPatients.length + referralFrequency;
    totalAmount = this.calculateConnectionAmount(provider1, provider2);

    // Determine if suspicious
    const isSuspicious = strength > 50 || relationshipTypes.some(type =>
      this.SUSPICIOUS_RELATIONSHIPS.includes(type)
    );

    // Calculate risk score
    const riskScore = Math.min(strength + (isSuspicious ? 20 : 0), 100);

    if (relationshipTypes.length === 0) {
      return null;
    }

    return {
      provider1Id: provider1.id,
      provider2Id: provider2.id,
      relationshipType: relationshipTypes.join(', '),
      strength,
      claimFrequency,
      totalAmount,
      riskScore,
      isSuspicious,
      indicators
    };
  }

  /**
   * Identify suspicious clusters of providers
   */
  private static async identifySuspiciousClusters(
    providerNodes: ProviderNode[],
    connections: ProviderConnection[]
  ): Promise<NetworkCluster[]> {
    const clusters: NetworkCluster[] = [];
    const processedProviders = new Set<string>();

    // Find clusters using connected components
    for (const provider of providerNodes) {
      if (processedProviders.has(provider.id)) continue;

      const cluster = this.buildCluster(provider, providerNodes, connections, processedProviders);
      if (cluster && cluster.clusterRiskScore > 60) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Build a cluster from a starting provider
   */
  private static buildCluster(
    startProvider: ProviderNode,
    allProviders: ProviderNode[],
    connections: ProviderConnection[],
    processedProviders: Set<string>
  ): NetworkCluster | null {
    const clusterProviders: ProviderNode[] = [];
    const clusterConnections: ProviderConnection[] = [];
    const toProcess = [startProvider.id];
    const visited = new Set<string>();

    while (toProcess.length > 0) {
      const currentId = toProcess.pop()!;

      if (visited.has(currentId) || processedProviders.has(currentId)) continue;

      visited.add(currentId);
      processedProviders.add(currentId);

      const provider = allProviders.find(p => p.id === currentId);
      if (provider) {
        clusterProviders.push(provider);
      }

      // Find connected providers
      const connectedConnections = connections.filter(c =>
        c.provider1Id === currentId || c.provider2Id === currentId
      );

      for (const connection of connectedConnections) {
        clusterConnections.push(connection);

        const nextId = connection.provider1Id === currentId ? connection.provider2Id : connection.provider1Id;

        if (!visited.has(nextId) && connection.strength > 30) {
          toProcess.push(nextId);
        }
      }
    }

    if (clusterProviders.length < 2) {
      return null;
    }

    // Calculate cluster metrics
    const totalBilled = clusterProviders.reduce((sum, p) => sum + p.totalBilled, 0);
    const flaggedClaims = clusterProviders.reduce((sum, p) => sum + p.flaggedClaims, 0);
    const avgRiskScore = clusterProviders.reduce((sum, p) => sum + p.riskScore, 0) / clusterProviders.length;
    const suspiciousConnectionCount = clusterConnections.filter(c => c.isSuspicious).length;

    const clusterRiskScore = Math.max(
      avgRiskScore,
      (suspiciousConnectionCount / clusterConnections.length) * 100,
      (flaggedClaims / (clusterProviders.reduce((sum, p) => sum + p.totalClaims, 0) || 1)) * 100
    );

    // Identify suspicious patterns
    const suspiciousPatterns = this.identifyClusterPatterns(clusterProviders, clusterConnections);
    const fraudIndicators = this.identifyFraudIndicators(clusterProviders, clusterConnections);

    return {
      id: `cluster-${clusterProviders[0].id}`,
      providers: clusterProviders,
      connections: clusterConnections,
      clusterRiskScore,
      suspiciousPatterns,
      fraudIndicators,
      totalBilled,
      flaggedClaims
    };
  }

  /**
   * Detect fraud rings
   */
  private static async detectFraudRings(
    clusters: NetworkCluster[],
    connections: ProviderConnection[]
  ): Promise<Array<{
    providers: string[];
    pattern: string;
    confidence: number;
    totalAmount: number;
  }>> {
    const fraudRings: Array<{
      providers: string[];
      pattern: string;
      confidence: number;
      totalAmount: number;
    }> = [];

    for (const cluster of clusters) {
      for (const pattern of this.FRAUD_RING_PATTERNS) {
        if (await this.matchesFraudRingPattern(cluster, pattern)) {
          fraudRings.push({
            providers: cluster.providers.map(p => p.id),
            pattern: pattern.name,
            confidence: pattern.riskScore,
            totalAmount: cluster.totalBilled
          });
        }
      }
    }

    return fraudRings;
  }

  /**
   * Check if cluster matches fraud ring pattern
   */
  private static async matchesFraudRingPattern(cluster: NetworkCluster, pattern: any): Promise<boolean> {
    if (cluster.providers.length < pattern.minProviders) return false;

    const matchingIndicators = pattern.indicators.filter((indicator: string) =>
      cluster.fraudIndicators.includes(indicator)
    );

    return matchingIndicators.length >= 2;
  }

  /**
   * Helper methods
   */
  private static async analyzeReferralPatterns(provider1: any, provider2: any): Promise<number> {
    // Simplified referral analysis
    // In reality, this would analyze actual referral data
    const provider1Patients = new Set(provider1.claims?.map((c: any) => c.patientId) || []);
    const provider2Patients = new Set(provider2.claims?.map((c: any) => c.patientId) || []);

    return [...provider1Patients].filter(patientId => provider2Patients.has(patientId)).length;
  }

  private static async analyzeCoordinationPatterns(provider1: any, provider2: any): Promise<number> {
    // Simplified coordination analysis
    // In reality, this would use more sophisticated pattern matching
    const provider1Dates = provider1.claims?.map((c: any) => c.serviceDate.toISOString().split('T')[0]) || [];
    const provider2Dates = provider2.claims?.map((c: any) => c.serviceDate.toISOString().split('T')[0]) || [];

    const commonDates = provider1Dates.filter((date: string) => provider2Dates.includes(date));
    return commonDates.length > 0 ? 0.8 : 0;
  }

  private static calculateConnectionAmount(provider1: any, provider2: any): number {
    const provider1Total = provider1.claims?.reduce((sum: number, claim: any) =>
      sum + parseFloat(claim.billedAmount.toString()), 0
    ) || 0;

    const provider2Total = provider2.claims?.reduce((sum: number, claim: any) =>
      sum + parseFloat(claim.billedAmount.toString()), 0
    ) || 0;

    return provider1Total + provider2Total;
  }

  private static identifyClusterPatterns(providers: ProviderNode[], connections: ProviderConnection[]): string[] {
    const patterns: string[] = [];

    if (providers.length > 5) {
      patterns.push('LARGE_NETWORK');
    }

    const highRiskProviders = providers.filter(p => p.riskScore > 70).length;
    if (highRiskProviders > providers.length * 0.5) {
      patterns.push('HIGH_RISK_CONCENTRATION');
    }

    const suspiciousConnections = connections.filter(c => c.isSuspicious).length;
    if (suspiciousConnections > connections.length * 0.6) {
      patterns.push('SUSPICIOUS_NETWORK_STRUCTURE');
    }

    return patterns;
  }

  private static identifyFraudIndicators(providers: ProviderNode[], connections: ProviderConnection[]): string[] {
    const indicators: string[] = [];

    connections.forEach(connection => {
      connection.indicators.forEach(indicator => {
        if (!indicators.includes(indicator)) {
          indicators.push(indicator);
        }
      });
    });

    return indicators;
  }

  private static calculateNetworkRiskScore(
    provider: ProviderNode,
    connections: ProviderConnection[],
    clusters: NetworkCluster[]
  ): number {
    const suspiciousConnectionScore = connections.filter(c => c.isSuspicious).length * 10;
    const clusterRiskScore = clusters.length > 0 ? Math.max(...clusters.map(c => c.clusterRiskScore)) : 0;
    const connectionCountScore = Math.min(connections.length * 2, 30);

    return Math.min(
      provider.riskScore + suspiciousConnectionScore + clusterRiskScore + connectionCountScore,
      100
    );
  }

  private static generateRecommendations(
    clusters: NetworkCluster[],
    fraudRings: any[],
    highRiskProviders: ProviderNode[]
  ): string[] {
    const recommendations: string[] = [];

    if (fraudRings.length > 0) {
      recommendations.push('Immediate investigation of potential fraud rings');
      recommendations.push('Consider coordinated audit approach');
    }

    if (clusters.length > 0) {
      recommendations.push('Review provider clusters for coordinated fraud');
      recommendations.push('Analyze referral patterns within clusters');
    }

    if (highRiskProviders.length > 0) {
      recommendations.push(`Enhanced monitoring of ${highRiskProviders.length} high-risk providers`);
      recommendations.push('Consider targeted audits for high-risk providers');
    }

    return recommendations;
  }

  private static generateAuditTriggers(clusters: NetworkCluster[], fraudRings: any[]): string[] {
    const triggers: string[] = [];

    if (fraudRings.length > 0) {
      triggers.push('FRAUD_RING_DETECTED');
      triggers.push('COORDINATED_INVESTIGATION_REQUIRED');
    }

    if (clusters.length > 0) {
      triggers.push('SUSPICIOUS_CLUSTER_FOUND');
    }

    clusters.forEach(cluster => {
      if (cluster.clusterRiskScore > 80) {
        triggers.push('HIGH_RISK_CLUSTER_ALERT');
      }
    });

    return triggers;
  }

  private static generateProviderRecommendations(
    provider: ProviderNode,
    connections: ProviderConnection[],
    clusters: NetworkCluster[]
  ): string[] {
    const recommendations: string[] = [];

    if (provider.riskScore > 70) {
      recommendations.push('Individual provider audit recommended');
    }

    if (connections.filter(c => c.isSuspicious).length > 3) {
      recommendations.push('Review provider relationships and associations');
    }

    if (clusters.length > 0) {
      recommendations.push('Investigate cluster membership and network effects');
    }

    return recommendations;
  }

  private static async getConnectedProviders(providerId: string, timeWindow: number): Promise<any[]> {
    // Simplified - would normally use network analysis algorithms
    return [];
  }

  private static createEmptyResult(): NetworkAnalysisResult {
    return {
      totalProviders: 0,
      suspiciousClusters: [],
      highRiskProviders: [],
      suspiciousConnections: [],
      fraudRings: [],
      recommendations: ['No provider data available for analysis'],
      auditTriggers: []
    };
  }
}
