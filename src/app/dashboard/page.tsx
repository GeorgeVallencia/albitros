'use client';
import { useState, useEffect } from 'react';
import { MapPin, TrendingUp, AlertTriangle, Shield, DollarSign, Activity, RefreshCw, AlertCircle } from 'lucide-react';

interface DashboardStats {
  total_properties: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  average_risk_score: number;
  total_estimated_value: number;
}

interface RecentActivity {
  address: string;
  risk_score: number;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  recent_activity: RecentActivity[];
}

export default function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching dashboard data...');
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (response.status === 404) {
          setError('API endpoint not found. Please check your API setup.');
        } else if (response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          const errorText = await response.text();
          setError(`Error ${response.status}: ${errorText}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Dashboard data received:', data);

      // Validate data structure
      if (!data.stats) {
        setError('Invalid data format received from server.');
        setLoading(false);
        return;
      }

      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error. Please check your connection or API server.');
      } else {
        setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development/testing
  const useMockData = () => {
    const mockData: DashboardData = {
      stats: {
        total_properties: 15,
        high_risk_count: 3,
        medium_risk_count: 7,
        low_risk_count: 5,
        average_risk_score: 45,
        total_estimated_value: 2500000,
      },
      recent_activity: [
        {
          address: "123 Main St, Nairobi",
          risk_score: 75,
          created_at: new Date().toISOString(),
        },
        {
          address: "456 Oak Ave, Mombasa",
          risk_score: 35,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          address: "789 Pine Rd, Kisumu",
          risk_score: 60,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
    };
    setDashboardData(mockData);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return 'text-red-600 bg-red-50';
    if (score > 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLabel = (score: number) => {
    if (score > 70) return 'High Risk';
    if (score > 40) return 'Medium Risk';
    return 'Low Risk';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-xs text-gray-600">Loading dashboard data...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-semibold text-red-800">Error Loading Dashboard</h3>
          </div>
          <p className="text-xs text-red-700 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={fetchDashboardData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={useMockData}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs"
            >
              Use Mock Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center text-xs text-gray-500">
          No data available. Please try refreshing or contact support.
        </div>
      </div>
    );
  }

  const { stats, recent_activity } = dashboardData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-xs text-gray-600">Monitor your property portfolio and risk exposure</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-xs"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Properties */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Properties</p>
              <p className="text-xl font-bold text-gray-900">{stats.total_properties}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Average Risk Score */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Average Risk Score</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(stats.average_risk_score || 0)}
              </p>
              <p className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${getRiskColor(stats.average_risk_score || 0)}`}>
                {getRiskLabel(stats.average_risk_score || 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* High Risk Properties */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">High Risk Properties</p>
              <p className="text-xl font-bold text-red-600">{stats.high_risk_count}</p>
              <p className="text-xs text-gray-500">
                {stats.total_properties > 0
                  ? `${Math.round((stats.high_risk_count / stats.total_properties) * 100)}% of portfolio`
                  : '0% of portfolio'
                }
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Total Portfolio Value */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Portfolio Value</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.total_estimated_value || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Risk Distribution and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium">Low Risk (0-40)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{stats.low_risk_count} properties</span>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{
                      width: stats.total_properties > 0
                        ? `${(stats.low_risk_count / stats.total_properties) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-xs font-medium">Medium Risk (41-70)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{stats.medium_risk_count} properties</span>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-300"
                    style={{
                      width: stats.total_properties > 0
                        ? `${(stats.medium_risk_count / stats.total_properties) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium">High Risk (71-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{stats.high_risk_count} properties</span>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{
                      width: stats.total_properties > 0
                        ? `${(stats.high_risk_count / stats.total_properties) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">Recent Properties</h3>
          </div>

          {recent_activity.length > 0 ? (
            <div className="space-y-3">
              {recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {activity.address}
                    </p>
                    <p className="text-xs text-gray-500">
                      Added {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(activity.risk_score)}`}>
                    {activity.risk_score}/100
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-xs">No properties added yet</p>
              <p className="text-xs text-gray-400">Start by adding properties on the map</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/map"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Add Properties</p>
              <p className="text-xs text-gray-600">Click on map to add new properties</p>
            </div>
          </a>

          <a
            href="/dashboard/map?filter=high-risk"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Review High Risk</p>
              <p className="text-xs text-gray-600">Check properties needing attention</p>
            </div>
          </a>

          <a
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Analytics</p>
              <p className="text-xs text-gray-600">Detailed portfolio insights</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}