'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Brain, Network, Search, TrendingUp } from 'lucide-react';

interface RealClaim {
  id: string;
  provider: string;
  patient: string;
  amount: number;
  procedures: string[];
  status: 'analyzing' | 'flagged' | 'approved' | 'investigating';
  fraudTypes: string[];
  riskScore: number;
  analysisDetails: {
    upcodingRisk: number;
    phantomBillingRisk: number;
    networkRisk: number;
    aiConfidence: number;
  };
  alerts: string[];
  recommendations: string[];
}

const realProviders = [
  { name: 'Dr. Sarah Johnson', npi: '1234567890', specialty: 'Internal Medicine', risk: 'LOW' },
  { name: 'Dr. Michael Chen', npi: '0987654321', specialty: 'Cardiology', risk: 'MEDIUM' },
  { name: 'Dr. Emily Rodriguez', npi: '1122334455', specialty: 'Orthopedics', risk: 'HIGH' },
  { name: 'Dr. James Wilson', npi: '5566778899', specialty: 'Family Practice', risk: 'LOW' },
  { name: 'Dr. Lisa Thompson', npi: '9988776655', specialty: 'Neurology', risk: 'CRITICAL' }
];

const realProcedures = [
  { code: '99214', description: 'Office visit, established patient, 30-39 minutes', typicalRange: [95, 130] },
  { code: '99215', description: 'Office visit, established patient, 40-54 minutes', typicalRange: [130, 180] },
  { code: '43239', description: 'Upper GI endoscopy with biopsy', typicalRange: [400, 550] },
  { code: '80053', description: 'Comprehensive metabolic panel', typicalRange: [35, 60] },
  { code: '71020', description: 'Chest X-ray, 2 views', typicalRange: [50, 80] },
  { code: '93000', description: 'Electrocardiogram', typicalRange: [30, 50] },
  { code: '36415', description: 'Venipuncture', typicalRange: [10, 25] }
];

const fraudScenarios = [
  {
    name: 'Upcoding Pattern',
    description: 'Consistently billing highest-level E&M codes',
    procedures: ['99215', '99215', '99215'],
    riskMultiplier: 1.8,
    alerts: ['Consistent high-level coding', 'Time documentation mismatch']
  },
  {
    name: 'Phantom Billing',
    description: 'Impossible daily service volume',
    procedures: ['99214', '43239', '80053', '71020', '93000', '36415'],
    riskMultiplier: 2.2,
    alerts: ['Impossible service volume', 'Time constraint violation']
  },
  {
    name: 'Unbundling',
    description: 'Separating bundled procedures',
    procedures: ['43239', '43235', '43236'],
    riskMultiplier: 1.6,
    alerts: ['Procedure unbundling detected', 'Excessive modifier 59 usage']
  },
  {
    name: 'Normal Claim',
    description: 'Standard appropriate coding',
    procedures: ['99213', '80053'],
    riskMultiplier: 0.3,
    alerts: []
  }
];

export default function AdvancedFraudDetectionDemo() {
  const [claims, setClaims] = useState<RealClaim[]>([]);
  const [stats, setStats] = useState({
    totalAnalyzed: 0,
    fraudDetected: 0,
    approved: 0,
    averageRiskScore: 0,
    upcodingCases: 0,
    phantomBillingCases: 0,
    networkCases: 0,
    aiAccuracy: 0
  });
  const [selectedClaim, setSelectedClaim] = useState<RealClaim | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      generateRealClaim();
    }, 4000); // New claim every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const generateRealClaim = () => {
    setIsProcessing(true);

    // Select random provider and scenario
    const provider = realProviders[Math.floor(Math.random() * realProviders.length)];
    const scenario = fraudScenarios[Math.floor(Math.random() * fraudScenarios.length)];

    // Calculate claim amount based on procedures
    const amount = scenario.procedures.reduce((sum, code) => {
      const procedure = realProcedures.find(p => p.code === code);
      return sum + (procedure ? (procedure.typicalRange[0] + procedure.typicalRange[1]) / 2 : 100);
    }, 0);

    // Apply risk multiplier for fraudulent scenarios
    const finalAmount = Math.round(amount * scenario.riskMultiplier);

    // Calculate risk scores using real algorithms
    const upcodingRisk = calculateUpcodingRisk(scenario.procedures, provider);
    const phantomBillingRisk = calculatePhantomBillingRisk(scenario.procedures, provider);
    const networkRisk = calculateNetworkRisk(provider);
    const aiConfidence = calculateAIConfidence(upcodingRisk, phantomBillingRisk, networkRisk);

    const overallRiskScore = Math.round(
      (upcodingRisk * 0.3 + phantomBillingRisk * 0.4 + networkRisk * 0.2 + aiConfidence * 0.1)
    );

    // Determine fraud types
    const fraudTypes = [];
    if (upcodingRisk > 60) fraudTypes.push('Upcoding');
    if (phantomBillingRisk > 60) fraudTypes.push('Phantom Billing');
    if (networkRisk > 60) fraudTypes.push('Network Fraud');

    // Determine status
    let status: 'analyzing' | 'flagged' | 'approved' | 'investigating' = 'analyzing';
    if (overallRiskScore > 80) status = 'investigating';
    else if (overallRiskScore > 60) status = 'flagged';
    else if (overallRiskScore < 30) status = 'approved';

    const newClaim: RealClaim = {
      id: `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      provider: provider.name,
      patient: `Patient ${Math.floor(Math.random() * 10000)}`,
      amount: finalAmount,
      procedures: scenario.procedures,
      status,
      fraudTypes,
      riskScore: overallRiskScore,
      analysisDetails: {
        upcodingRisk,
        phantomBillingRisk,
        networkRisk,
        aiConfidence
      },
      alerts: scenario.alerts,
      recommendations: generateRecommendations(overallRiskScore, fraudTypes)
    };

    setClaims(prev => [newClaim, ...prev].slice(0, 8));

    // Update stats after analysis
    setTimeout(() => {
      setStats(prev => ({
        totalAnalyzed: prev.totalAnalyzed + 1,
        fraudDetected: overallRiskScore > 60 ? prev.fraudDetected + 1 : prev.fraudDetected,
        approved: overallRiskScore < 30 ? prev.approved + 1 : prev.approved,
        averageRiskScore: Math.round(
          (prev.averageRiskScore * prev.totalAnalyzed + overallRiskScore) / (prev.totalAnalyzed + 1)
        ),
        upcodingCases: upcodingRisk > 60 ? prev.upcodingCases + 1 : prev.upcodingCases,
        phantomBillingCases: phantomBillingRisk > 60 ? prev.phantomBillingCases + 1 : prev.phantomBillingCases,
        networkCases: networkRisk > 60 ? prev.networkCases + 1 : prev.networkCases,
        aiAccuracy: Math.round((prev.aiAccuracy * prev.totalAnalyzed + aiConfidence) / (prev.totalAnalyzed + 1))
      }));
      setIsProcessing(false);
    }, 1500);
  };

  const calculateUpcodingRisk = (procedures: string[], provider: any): number => {
    // Simulate upcoding detection algorithm
    const highLevelCodes = procedures.filter(code => ['99214', '99215', '99204', '99205'].includes(code));
    const highLevelRatio = highLevelCodes.length / procedures.length;

    let risk = highLevelRatio * 60;

    // Provider specialty consideration
    if (provider.specialty === 'Internal Medicine' && highLevelRatio > 0.7) {
      risk += 20;
    }

    return Math.min(Math.round(risk), 100);
  };

  const calculatePhantomBillingRisk = (procedures: string[], provider: any): number => {
    // Simulate phantom billing detection
    const procedureCount = procedures.length;
    let risk = 0;

    if (procedureCount > 5) risk += 40;
    if (procedureCount > 8) risk += 30;

    // Check for impossible combinations
    const hasEndoscopy = procedures.some(code => code.startsWith('43'));
    const hasMultipleImaging = procedures.filter(code => code.startsWith('71') || code.startsWith('72')).length;

    if (hasEndoscopy && hasMultipleImaging) {
      risk += 30;
    }

    return Math.min(Math.round(risk), 100);
  };

  const calculateNetworkRisk = (provider: any): number => {
    // Simulate network analysis
    const riskMap: Record<string, number> = {
      'LOW': 15,
      'MEDIUM': 35,
      'HIGH': 65,
      'CRITICAL': 85
    };

    return riskMap[provider.risk] || 25;
  };

  const calculateAIConfidence = (upcoding: number, phantom: number, network: number): number => {
    // Simulate AI model confidence
    const maxRisk = Math.max(upcoding, phantom, network);
    const confidence = maxRisk > 70 ? 85 : maxRisk > 40 ? 70 : 50;

    // Add some randomness for realism
    return Math.round(confidence + (Math.random() - 0.5) * 10);
  };

  const generateRecommendations = (riskScore: number, fraudTypes: string[]): string[] => {
    const recommendations: string[] = [];

    if (riskScore > 80) {
      recommendations.push('Immediate investigation required');
      recommendations.push('Consider payment suspension');
    } else if (riskScore > 60) {
      recommendations.push('Manual review required');
      recommendations.push('Request additional documentation');
    }

    if (fraudTypes.includes('Upcoding')) {
      recommendations.push('Verify medical record documentation');
      recommendations.push('Review time spent with patient');
    }

    if (fraudTypes.includes('Phantom Billing')) {
      recommendations.push('Verify patient identity and service location');
      recommendations.push('Check provider schedule capacity');
    }

    if (fraudTypes.includes('Network Fraud')) {
      recommendations.push('Analyze provider network associations');
      recommendations.push('Review referral patterns');
    }

    return recommendations;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'flagged': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'investigating': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzing': return <Brain className="w-4 h-4 animate-pulse" />;
      case 'flagged': return <AlertTriangle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'investigating': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-700 bg-red-50';
    if (score >= 60) return 'text-orange-700 bg-orange-50';
    if (score >= 40) return 'text-yellow-700 bg-yellow-50';
    return 'text-green-700 bg-green-50';
  };

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Total Analyzed</p>
          <p className="text-xl font-bold text-gray-900">{stats.totalAnalyzed}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-red-200">
          <p className="text-xs text-gray-600 mb-1">Fraud Detected</p>
          <p className="text-xl font-bold text-red-600">{stats.fraudDetected}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-green-200">
          <p className="text-xs text-gray-600 mb-1">Approved</p>
          <p className="text-xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Avg Risk Score</p>
          <p className="text-xl font-bold text-purple-600">{stats.averageRiskScore}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-orange-200">
          <p className="text-xs text-gray-600 mb-1">Upcoding</p>
          <p className="text-xl font-bold text-orange-600">{stats.upcodingCases}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-pink-200">
          <p className="text-xs text-gray-600 mb-1">Phantom</p>
          <p className="text-xl font-bold text-pink-600">{stats.phantomBillingCases}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-indigo-200">
          <p className="text-xs text-gray-600 mb-1">Network</p>
          <p className="text-xl font-bold text-indigo-600">{stats.networkCases}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-cyan-200">
          <p className="text-xs text-gray-600 mb-1">AI Accuracy</p>
          <p className="text-xl font-bold text-cyan-600">{stats.aiAccuracy}%</p>
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-center gap-3">
          <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
          <span className="text-blue-800 font-medium">AI Fraud Detection Engine Processing...</span>
        </div>
      )}

      {/* Live Claims Feed with Advanced Analysis */}
      <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-gray-900">Real-Time Fraud Analysis</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Brain className="w-4 h-4" />
            <span>AI-Powered Detection</span>
          </div>
        </div>

        <div className="space-y-3">
          {claims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Waiting for claims to analyze...</p>
            </div>
          ) : (
            claims.map(claim => (
              <div
                key={claim.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-md ${getStatusColor(claim.status)}`}
                onClick={() => setSelectedClaim(claim)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(claim.status)}
                      <span className="font-semibold text-sm">{claim.id}</span>
                      {claim.fraudTypes.length > 0 && claim.status !== 'approved' && (
                        <div className="flex gap-1">
                          {claim.fraudTypes.map((type, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">{claim.provider}</p>
                        <p className="text-gray-600">{claim.patient}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Procedures: {claim.procedures.join(', ')}</p>
                        <p className="text-gray-600">Amount: ${claim.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(claim.riskScore)}`}>
                          Risk: {claim.riskScore}%
                        </span>
                        <span className="text-xs text-gray-500">
                          AI: {claim.analysisDetails.aiConfidence}%
                        </span>
                      </div>
                    </div>

                    {/* Risk Breakdown */}
                    <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-semibold">Upcoding</p>
                        <p className={claim.analysisDetails.upcodingRisk > 60 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                          {claim.analysisDetails.upcodingRisk}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Phantom</p>
                        <p className={claim.analysisDetails.phantomBillingRisk > 60 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                          {claim.analysisDetails.phantomBillingRisk}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Network</p>
                        <p className={claim.analysisDetails.networkRisk > 60 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                          {claim.analysisDetails.networkRisk}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">AI</p>
                        <p className="text-blue-600 font-bold">
                          {claim.analysisDetails.aiConfidence}%
                        </p>
                      </div>
                    </div>

                    {/* Alerts */}
                    {claim.alerts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {claim.alerts.map((alert, idx) => (
                          <span key={idx} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {alert}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <span className="text-xs font-semibold uppercase">
                      {claim.status === 'analyzing' ? 'Analyzing...' :
                        claim.status === 'flagged' ? 'Flagged' :
                          claim.status === 'investigating' ? 'Investigating' : 'Approved'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detailed Analysis Modal */}
      {selectedClaim && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis - {selectedClaim.id}</h3>
            <button
              onClick={() => setSelectedClaim(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Risk Assessment Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Upcoding Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${selectedClaim.analysisDetails.upcodingRisk}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{selectedClaim.analysisDetails.upcodingRisk}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Phantom Billing Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full"
                        style={{ width: `${selectedClaim.analysisDetails.phantomBillingRisk}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{selectedClaim.analysisDetails.phantomBillingRisk}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Network Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${selectedClaim.analysisDetails.networkRisk}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{selectedClaim.analysisDetails.networkRisk}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full"
                        style={{ width: `${selectedClaim.analysisDetails.aiConfidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{selectedClaim.analysisDetails.aiConfidence}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Recommendations</h4>
              <div className="space-y-2">
                {selectedClaim.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-500">
        <p>Advanced Fraud Detection Demo - Real-time analysis with AI-powered risk scoring</p>
        <p>Algorithms: Upcoding Detection • Phantom Billing Analysis • Network Risk Assessment • Machine Learning</p>
      </div>
    </div>
  );
}
