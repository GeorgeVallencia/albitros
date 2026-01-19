'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Claim {
  id: string;
  provider: string;
  amount: number;
  type: string;
  status: 'analyzing' | 'flagged' | 'approved';
  fraudType?: string;
  riskScore?: number;
}

const fraudTypes = [
  'Phantom Billing',
  'Upcoding',
  'Unbundling',
  'Duplicate Claim',
  'Normal'
];

const providers = [
  'Memorial Hospital',
  'City Medical Center',
  'Valley Clinic',
  'Summit Healthcare',
  'Riverside Urgent Care',
  'Mountain View Surgery',
  'Lakeside Family Practice'
];

const claimTypes = [
  'Office Visit',
  'Surgery',
  'Lab Work',
  'Imaging',
  'Emergency Care',
  'Physical Therapy',
  'Diagnostic Test'
];

export default function FraudDetectionDemo() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState({
    totalAnalyzed: 0,
    fraudDetected: 0,
    approved: 0,
    amountSaved: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Generate a new claim
      const isFraud = Math.random() > 0.7; // 30% fraud rate for demo
      const amount = Math.floor(Math.random() * 50000) + 500;
      const fraudTypeIndex = Math.floor(Math.random() * (fraudTypes.length - 1));
      
      const newClaim: Claim = {
        id: `CLM-${Date.now()}`,
        provider: providers[Math.floor(Math.random() * providers.length)],
        amount,
        type: claimTypes[Math.floor(Math.random() * claimTypes.length)],
        status: 'analyzing',
        fraudType: isFraud ? fraudTypes[fraudTypeIndex] : undefined,
        riskScore: isFraud ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 10
      };

      setClaims(prev => [newClaim, ...prev].slice(0, 6));

      // After 1 second, update the claim status
      setTimeout(() => {
        setClaims(prev => prev.map(c => {
          if (c.id === newClaim.id) {
            const status = isFraud ? 'flagged' : 'approved';
            return { ...c, status };
          }
          return c;
        }));

        // Update stats
        setStats(prev => ({
          totalAnalyzed: prev.totalAnalyzed + 1,
          fraudDetected: isFraud ? prev.fraudDetected + 1 : prev.fraudDetected,
          approved: !isFraud ? prev.approved + 1 : prev.approved,
          amountSaved: isFraud ? prev.amountSaved + amount : prev.amountSaved
        }));
      }, 1000);

    }, 2500); // New claim every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'flagged': return 'bg-red-100 text-red-800 border-red-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzing': return <Shield className="w-4 h-4 animate-pulse" />;
      case 'flagged': return <XCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="w-full">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Analyzed</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyzed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-red-200">
          <p className="text-sm text-gray-600 mb-1">Fraud Detected</p>
          <p className="text-2xl font-bold text-red-600">{stats.fraudDetected}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-green-200">
          <p className="text-sm text-gray-600 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Amount Saved</p>
          <p className="text-2xl font-bold text-purple-600">${(stats.amountSaved / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Live Claims Feed */}
      <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-900">Live Claims Analysis</h3>
        </div>

        <div className="space-y-3">
          {claims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Waiting for claims...
            </div>
          ) : (
            claims.map(claim => (
              <div
                key={claim.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${getStatusColor(claim.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(claim.status)}
                      <span className="font-semibold text-sm">{claim.id}</span>
                      {claim.fraudType && claim.status === 'flagged' && (
                        <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {claim.fraudType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-1">{claim.provider} - {claim.type}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span>Amount: ${claim.amount.toLocaleString()}</span>
                      {claim.riskScore && (
                        <span className={claim.riskScore > 60 ? 'text-red-700 font-bold' : ''}>
                          Risk Score: {claim.riskScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold uppercase">
                      {claim.status === 'analyzing' ? 'Analyzing...' : 
                       claim.status === 'flagged' ? 'Fraud Detected' : 'Approved'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          * Demo simulation - Claims are generated for demonstration purposes
        </p>
      </div>
    </div>
  );
}
