'use client';

import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";

export default function APIDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAPISpec();
  }, []);

  const fetchAPISpec = async () => {
    try {
      const response = await fetch('/api/docs');
      if (!response.ok) {
        throw new Error('Failed to fetch API documentation');
      }
      const data = await response.json();
      setSpec(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-xs text-gray-600">Loading API documentation...</p>
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
              onClick={fetchAPISpec}
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
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs uppercase tracking-widest font-semibold text-black">API Documentation</p>
            <h1 className="mt-3 text-xl font-bold text-gray-900">Albitros Fraud Detection API</h1>
            <p className="mt-4 text-xs text-gray-700 max-w-3xl mx-auto">
              Complete API documentation for integrating healthcare claims fraud detection into your systems. 
              Includes endpoints for claim submission, analysis, and dashboard analytics.
            </p>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            {/* Quick Links */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 Submit Claims</h3>
                <p className="text-xs text-gray-600 mb-3">POST /api/claims</p>
                <p className="text-xs text-gray-700">Submit healthcare claims for real-time fraud analysis and risk scoring.</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Retrieve Claims</h3>
                <p className="text-xs text-gray-600 mb-3">GET /api/claims</p>
                <p className="text-xs text-gray-700">List and filter claims with pagination and risk level filtering.</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📈 Dashboard Stats</h3>
                <p className="text-xs text-gray-600 mb-3">GET /api/dashboard/stats</p>
                <p className="text-xs text-gray-700">Get aggregated analytics and fraud detection metrics.</p>
              </div>
            </div>

            {/* Authentication */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🔐 Authentication</h3>
              <p className="text-xs text-gray-700 mb-4">
                All API endpoints require JWT authentication. Include your bearer token in the Authorization header:
              </p>
              <code className="block p-3 bg-gray-900 text-green-400 rounded text-xs font-mono">
                Authorization: Bearer &lt;your_jwt_token&gt;
              </code>
            </div>

            {/* API Spec Display */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">📚 OpenAPI Specification</h3>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'albitros-api-spec.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-xs"
                >
                  Download JSON
                </button>
              </div>
              
              <div className="bg-white rounded-lg border p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-700 overflow-x-auto">
                  <code>{JSON.stringify(spec, null, 2)}</code>
                </pre>
              </div>
            </div>

            {/* Code Examples */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💻 Code Examples</h3>
              
              <div className="space-y-6">
                {/* Submit Claim Example */}
                <div className="border rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Submit a Claim for Analysis</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Request:</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`POST /api/claims
Content-Type: application/json
Authorization: Bearer <your_jwt_token>

{
  "patientId": "pat_123456",
  "providerId": "prov_789012",
  "serviceDate": "2024-01-15T00:00:00Z",
  "lineItems": [
    {
      "procedureCode": "99213",
      "modifiers": ["25"],
      "units": 1,
      "unitCost": 150.00,
      "diagnosisCodes": ["J45.909", "Z01.419"]
    }
  ]
}`}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Response:</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "claimId": "clm_123456",
  "analysis": {
    "riskScore": 25,
    "riskLevel": "LOW",
    "fraudTypes": [],
    "alerts": [],
    "recommendations": ["Auto-approved for payment"],
    "approved": true
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* JavaScript SDK Example */}
                <div className="border rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">JavaScript Integration</h4>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`class AlbitrosAPI {
  constructor(apiKey, baseUrl = 'https://api.albitros.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async submitClaim(claimData) {
    const response = await fetch(\`\${this.baseUrl}/api/claims\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.apiKey}\`
      },
      body: JSON.stringify(claimData)
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }

  async getClaims(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(\`\${this.baseUrl}/api/claims?\${params}\`, {
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`
      }
    });

    return response.json();
  }
}

// Usage
const albitros = new AlbitrosAPI('your_jwt_token');

const claim = await albitros.submitClaim({
  patientId: 'pat_123456',
  providerId: 'prov_789012',
  serviceDate: '2024-01-15T00:00:00Z',
  lineItems: [{
    procedureCode: '99213',
    modifiers: ['25'],
    units: 1,
    unitCost: 150.00,
    diagnosisCodes: ['J45.909']
  }]
});

console.log('Risk Score:', claim.analysis.riskScore);
console.log('Approved:', claim.analysis.approved);`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Rate Limits */}
            <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">⚡ Rate Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium text-gray-900">Standard Plan</p>
                  <p className="text-gray-700">1,000 requests per hour</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Enterprise Plan</p>
                  <p className="text-gray-700">10,000 requests per hour</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
