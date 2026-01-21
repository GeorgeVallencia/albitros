'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      // Success → redirect to dashboard or home
      window.location.href = "/dashboard"; // or "/" if no dashboard yet
    } catch (err) {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Left: Value Proposition */}
        <div className="bg-black text-white p-10 md:p-16 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Start Stopping Fraud<br />
            and Paying Claims Faster
          </h1>
          <p className="mt-8 text-lg text-gray-200">
            Get early access to Albitross — the AI platform helping insurers 
            detect fraud in real-time and automate instant payouts for valid claims.
          </p>

          <ul className="mt-10 space-y-4 text-gray-100">
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              Real-time fraud detection across all lines of insurance
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              Instant auto-approval and payout for clean claims
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              Enterprise-grade security and compliance
            </li>
          </ul>
        </div>

        {/* Right: Signup Form */}
        <div className="p-10 md:p-16">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-3 text-gray-600">
              Sign up to request a demo and discuss custom pricing for your team.
            </p>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Work Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="jane@insuranceco.com"
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  placeholder="Acme Insurance"
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="claimsVolume" className="block text-sm font-medium text-gray-700">
                  Approx. Annual Claims Volume
                </label>
                <select
                  id="claimsVolume"
                  name="claimsVolume"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select range</option>
                  <option value="<10k">Under 10,000</option>
                  <option value="10k-50k">10,000 – 50,000</option>
                  <option value="50k-100k">50,000 – 100,000</option>
                  <option value="100k-500k">100,000 – 500,000</option>
                  <option value="500k+">Over 500,000</option>
                </select>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Create a strong password"
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
              >
                {loading ? "Creating Account..." : "Request Demo Access"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="font-medium text-black hover:underline">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

