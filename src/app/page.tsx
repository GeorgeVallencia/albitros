import Link from "next/link";
import { Shield, FileText, BarChart3, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import EnhancedMapView from "@/components/MapView";
import FraudDetectionDemo from "@/components/FraudDetectionDemo";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Navbar />
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-24 px-6 bg-gray-50">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
          Stop Healthcare Fraud<br />Before It Costs You Millions.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl">
          AI-powered fraud detection that catches phantom billing, upcoding, unbundling, and organized fraud rings before payout - saving health insurers millions while maintaining compliance.
        </p>
          {/* <EnhancedMapView /> */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-800 font-medium hover:bg-gray-100 transition"
          >
            Learn More
          </Link>
        </div>
      </section>
      {/* Interactive Map Section */}
      <section className="py-12 px-6 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              See Fraud Patterns Detected in Real Time
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our AI analyzes millions of claims in real time to identify suspicious patterns, anomalies, and fraudulent schemes before they result in payouts.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <FraudDetectionDemo />
          </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-black">95%+</p>
              <p className="mt-2 text-gray-600">Fraud Detection Accuracy</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-black">$50M+</p>
              <p className="mt-2 text-gray-600">Average Annual Savings</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-black">&lt;1s</p>
              <p className="mt-2 text-gray-600">Real-Time Fraud Flagging</p>
            </div>
          </div>
          </div>
      </section>

      {/* Features Section */}
      <section id='features' className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Comprehensive Healthcare Fraud Detection
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Detect and prevent all types of healthcare fraud with explainable, auditable AI designed specifically for health insurers.
          </p>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-3 max-w-6xl mx-auto">
          <div className="p-8 border rounded-2xl shadow-sm hover:shadow-md transition">
            <Shield className="w-10 h-10 text-red-600" />
            <h3 className="mt-6 text-xl text-black font-semibold">Phantom Billing Detection</h3>
            <p className="mt-2 text-gray-600">
              Identify claims for services never rendered, procedures that never happened, and ghost patients. Our AI cross-references provider records, patient histories, and treatment patterns to catch phantom billing schemes.
            </p>
          </div>

          <div className="p-8 border rounded-2xl shadow-sm hover:shadow-md transition">
            <FileText className="w-10 h-10 text-orange-600" />
            <h3 className="mt-6 text-xl text-black font-semibold">Upcoding & Unbundling</h3>
            <p className="mt-2 text-gray-600">
              Detect inflated billing codes, procedures billed at higher reimbursement rates than justified, and services improperly separated to maximize payments. Stop revenue leakage before payout.
            </p>
          </div>

          <div className="p-8 border rounded-2xl shadow-sm hover:shadow-md transition">
            <BarChart3 className="w-10 h-10 text-purple-600" />
            <h3 className="mt-6 text-xl text-black font-semibold">Organized Fraud Rings</h3>
            <p className="mt-2 text-gray-600">
              Uncover coordinated fraud schemes across multiple providers, facilities, and patients. Our network analysis identifies suspicious patterns and connections that manual review would miss.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gray-900 text-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to Stop Healthcare Fraud?
        </h2>
        <p className="mt-4 text-lg text-gray-300">
          Join leading health insurers protecting their bottom line with AI-powered fraud detection.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/contact"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            Talk to Us
          </Link>
        </div>
      </section>
    </div>
  );
}
