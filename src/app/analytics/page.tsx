'use client';

import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Users, DollarSign, Calendar, Download } from 'lucide-react';

interface ReportData {
  reportType: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary?: {
    totalClaims: number;
    flaggedClaims: number;
    approvedClaims: number;
    fraudRate: number;
    approvalRate: number;
    totalBilled: number;
    estimatedSavings: number;
  };
  fraudByType?: Array<{ type: string; count: number }>;
  riskDistribution?: Array<{ level: string; count: number }>;
  monthlyTrends?: Array<{
    month: string;
    totalClaims: number;
    flaggedClaims: number;
    approvedClaims: number;
    fraudRate: number;
    avgRiskScore: number;
    totalBilled: number;
  }>;
  trends?: any[];
  analysis?: any;
  providers?: Array<{
    providerId: string;
    providerName: string;
    npi: string;
    specialty: string;
    totalClaims: number;
    flaggedClaims: number;
    fraudRate: number;
    avgRiskScore: number;
    totalBilled: number;
    riskLevel: string;
    fraudTypes: string[];
  }>;
}

export default function AnalyticsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState('overview');
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchReportData();
  }, [reportType, timeframe]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/reports?type=${reportType}&timeframe=${timeframe}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-xs text-gray-600">Loading analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-600 mb-2">Error</p>
            <p className="text-xs text-gray-600">{error}</p>
            <button
              onClick={fetchReportData}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-xs"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-black">Analytics</p>
                <h1 className="mt-3 text-xl font-bold text-gray-900">Fraud Detection Reports</h1>
                <p className="mt-4 text-xs text-gray-700">
                  Comprehensive analytics and insights for your fraud detection performance.
                </p>
              </div>
              <div className="flex gap-3">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="overview">Overview</option>
                  <option value="trends">Trends</option>
                  <option value="providers">Providers</option>
                </select>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(reportData, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const exportFileDefaultName = `fraud-report-${reportType}-${timeframe}.json`;
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                  }}
                  className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Report Content */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            {reportType === 'overview' && reportData?.summary && (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <p className="text-xs font-medium text-gray-600">Total Claims</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalClaims.toLocaleString()}</p>
                  </div>
                  
                  <div className="p-6 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <p className="text-xs font-medium text-gray-600">Flagged Claims</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{reportData.summary.flaggedClaims.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{reportData.summary.fraudRate}% fraud rate</p>
                  </div>
                  
                  <div className="p-6 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <p className="text-xs font-medium text-gray-600">Approved Claims</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{reportData.summary.approvedClaims.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{reportData.summary.approvalRate}% approval rate</p>
                  </div>
                  
                  <div className="p-6 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <p className="text-xs font-medium text-gray-600">Estimated Savings</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(reportData.summary.estimatedSavings)}</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Fraud Types */}
                  {reportData.fraudByType && (
                    <div className="p-6 border rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Fraud Types Distribution</h3>
                      <div className="space-y-3">
                        {reportData.fraudByType.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">{item.type.replace('_', ' ')}</span>
                            <span className="text-xs font-medium text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Distribution */}
                  {reportData.riskDistribution && (
                    <div className="p-6 border rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
                      <div className="space-y-3">
                        {reportData.riskDistribution.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">{item.level}</span>
                            <span className="text-xs font-medium text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {reportType === 'providers' && reportData?.providers && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Provider Risk Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NPI</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Claims</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flagged</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Risk Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.providers.map((provider, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                            {provider.providerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            {provider.npi || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {provider.totalClaims}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {provider.flaggedClaims}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {provider.fraudRate.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {provider.avgRiskScore}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(provider.riskLevel)}`}>
                              {provider.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'trends' && reportData?.monthlyTrends && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Trends Analysis</h3>
                {reportData.analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getTrendIcon(reportData.analysis.fraudRateTrend)}
                        <p className="text-xs font-medium text-gray-600">Fraud Rate Trend</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{reportData.analysis.fraudRateChange}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getTrendIcon(reportData.analysis.volumeTrend)}
                        <p className="text-xs font-medium text-gray-600">Volume Trend</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{reportData.analysis.volumeChange}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getTrendIcon(reportData.analysis.riskScoreTrend)}
                        <p className="text-xs font-medium text-gray-600">Risk Score Trend</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{reportData.analysis.riskScoreChange}</p>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Claims</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flagged</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Risk Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Billed</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.monthlyTrends.map((trend, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {new Date(trend.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {trend.totalClaims.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {trend.flaggedClaims.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {trend.fraudRate.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {trend.avgRiskScore.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                            {formatCurrency(trend.totalBilled)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
