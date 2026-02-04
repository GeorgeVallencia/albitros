'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Building2, User, Settings, Rocket, Eye, EyeOff } from 'lucide-react';

interface OnboardingData {
  companyName: string;
  companySize: string;
  claimsVolume: string;
  industry: string;
  website: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
  integrationType: string;
  webhookUrl: string;
  ssoEnabled: boolean;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingData>({
    companyName: '',
    companySize: 'SMALL',
    claimsVolume: 'UNDER_10K',
    industry: '',
    website: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: '',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      sms: false,
      webhook: false
    },
    integrationType: 'api',
    webhookUrl: '',
    ssoEnabled: false
  });

  const steps = [
    { title: 'Company Info', icon: Building2, description: 'Tell us about your organization' },
    { title: 'Admin Account', icon: User, description: 'Create your administrator account' },
    { title: 'Preferences', icon: Settings, description: 'Configure your settings' },
    { title: 'Complete', icon: Rocket, description: 'Review and finish setup' }
  ];

  useEffect(() => {
    // Check if there's an existing session
    const urlParams = new URLSearchParams(window.location.search);
    const existingSessionId = urlParams.get('sessionId');
    if (existingSessionId) {
      setSessionId(existingSessionId);
      loadSessionData(existingSessionId);
    }
  }, []);

  const loadSessionData = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/onboarding?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          setFormData(prev => ({ ...prev, ...data.session.data }));
          // Set step based on session
          const stepIndex = steps.findIndex(step => step.title.toLowerCase().replace(' ', '') === data.session.step);
          if (stepIndex >= 0) setCurrentStep(stepIndex);
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    setError(null);

    try {
      const stepName = steps[currentStep].title.toLowerCase().replace(' ', '');
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: stepName,
          data: formData,
          sessionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Step failed');
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      if (stepName === 'complete') {
        // Onboarding complete, redirect to dashboard
        window.location.href = data.redirectUrl;
      } else {
        setCurrentStep(prev => prev + 1);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Company Info
        return formData.companyName.trim() !== '' && 
               formData.companySize !== '' && 
               formData.claimsVolume !== '';
      case 1: // Admin Account
        return formData.adminEmail.trim() !== '' && 
               formData.adminFirstName.trim() !== '' && 
               formData.adminLastName.trim() !== '' && 
               formData.adminPassword.length >= 8;
      case 2: // Preferences
        return true; // All preferences have defaults
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Acme Insurance"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Company Size *</label>
                <select
                  value={formData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="SMALL">Small (1-50 employees)</option>
                  <option value="MEDIUM">Medium (51-200 employees)</option>
                  <option value="LARGE">Large (200+ employees)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Annual Claims Volume *</label>
                <select
                  value={formData.claimsVolume}
                  onChange={(e) => handleInputChange('claimsVolume', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="UNDER_10K">Under 10,000</option>
                  <option value="BETWEEN_10K_50K">10,000 - 50,000</option>
                  <option value="BETWEEN_50K_100K">50,000 - 100,000</option>
                  <option value="BETWEEN_100K_500K">100,000 - 500,000</option>
                  <option value="OVER_500K">Over 500,000</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Healthcare Insurance"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Admin Email *</label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="admin@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.adminFirstName}
                  onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.adminLastName}
                  onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.adminPassword}
                  onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Date Format</label>
                <select
                  value={formData.dateFormat}
                  onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Notifications</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.email}
                    onChange={(e) => handleInputChange('notifications', { ...formData.notifications, email: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.sms}
                    onChange={(e) => handleInputChange('notifications', { ...formData.notifications, sms: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">SMS notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.webhook}
                    onChange={(e) => handleInputChange('notifications', { ...formData.notifications, webhook: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Webhook notifications</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Integration Type</label>
              <select
                value={formData.integrationType}
                onChange={(e) => handleInputChange('integrationType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="api">API Integration</option>
                <option value="file">File Upload</option>
                <option value="both">Both API and File</option>
              </select>
            </div>

            {formData.notifications.webhook && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="https://your-webhook-url.com"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Go!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Your Albitros account is configured and ready to detect healthcare fraud.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Summary</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div><strong>Company:</strong> {formData.companyName}</div>
                <div><strong>Admin:</strong> {formData.adminFirstName} {formData.adminLastName} ({formData.adminEmail})</div>
                <div><strong>Company Size:</strong> {formData.companySize}</div>
                <div><strong>Claims Volume:</strong> {formData.claimsVolume}</div>
                <div><strong>Integration:</strong> {formData.integrationType}</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">What's Next?</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li>• Access your dashboard to view analytics</li>
                <li>• Start submitting claims for fraud analysis</li>
                <li>• Configure webhooks for real-time alerts</li>
                <li>• Invite team members to collaborate</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-400 border-gray-300'
                }`}>
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`ml-8 w-full sm:hidden ${
                    index < currentStep ? 'bg-black' : 'bg-gray-300'
                  } h-0.5`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{steps[currentStep].title}</h2>
            <p className="text-sm text-gray-600 mt-1">{steps[currentStep].description}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={loading || !validateCurrentStep()}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : currentStep === steps.length - 1 ? (
                'Complete Setup'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
