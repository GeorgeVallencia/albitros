import Link from "next/link";
import { Shield, Zap, HeartHandshake, Users, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
            Stopping Healthcare Fraud with AI
          </h1>
          <p className="mt-8 text-xl text-gray-600 max-w-3xl mx-auto">
            We build advanced AI platforms that detect and prevent healthcare fraud including phantom billing, 
            upcoding, unbundling, and organized fraud schemes — protecting insurers from billions in fraudulent payouts.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <div className="flex flex-col justify-center">
            <HeartHandshake className="w-12 h-12 text-black mb-6" />
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              To eliminate healthcare fraud that costs the industry billions annually. We detect phantom billing, 
              upcoding, unbundling, duplicate claims, and organized fraud rings before they result in payouts — 
              making healthcare more efficient, fair, and trustworthy for everyone.
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <Zap className="w-12 h-12 text-black mb-6" />
            <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              A healthcare system with near-zero fraud losses where every dollar goes to legitimate care — 
              reducing costs, lowering premiums, and delivering better outcomes for patients and insurers alike.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do / Our Two Platforms */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            How Our AI Detects Healthcare Fraud
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            Our platform uses advanced machine learning to identify fraudulent patterns across all types of healthcare fraud, 
            with industry-leading accuracy and full audit trails.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Phantom Billing */}
          <div className="bg-white p-10 rounded-2xl shadow-md hover:shadow-xl transition">
            <Shield className="w-14 h-14 text-red-600 mx-auto mb-8" />
            <h3 className="text-2xl font-semibold text-gray-900">
              Phantom Billing
            </h3>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Detects claims for services never rendered, procedures that didn't happen, and ghost patients. 
              Cross-references provider records, patient histories, and treatment patterns.
            </p>
            <ul className="mt-8 space-y-4 text-left text-gray-600">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Identifies fake patient records</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Verifies service delivery</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Catches billing for no-shows</span>
              </li>
            </ul>
          </div>

          {/* Upcoding & Unbundling */}
          <div className="bg-white p-10 rounded-2xl shadow-md hover:shadow-xl transition">
            <FileText className="w-14 h-14 text-orange-600 mx-auto mb-8" />
            <h3 className="text-2xl font-semibold text-gray-900">
              Upcoding & Unbundling
            </h3>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Identifies inflated billing codes and services improperly separated to maximize reimbursement. 
              Compares against treatment standards and proper coding practices.
            </p>
            <ul className="mt-8 space-y-4 text-left text-gray-600">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Flags inflated procedure codes</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Detects improper unbundling</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Validates code justification</span>
              </li>
            </ul>
          </div>

          {/* Fraud Rings */}
          <div className="bg-white p-10 rounded-2xl shadow-md hover:shadow-xl transition">
            <Users className="w-14 h-14 text-purple-600 mx-auto mb-8" />
            <h3 className="text-2xl font-semibold text-gray-900">
              Organized Fraud Rings
            </h3>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Uncovers coordinated schemes across providers, facilities, and patients. 
              Network analysis identifies suspicious connections manual review would miss.
            </p>
            <ul className="mt-8 space-y-4 text-left text-gray-600">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Maps provider networks</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Identifies coordinated patterns</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Tracks suspicious referrals</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Team / Values */}
      <section className="py-20 px-6 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <Shield className="w-12 h-12 text-black mx-auto mb-8" />
          <h2 className="text-4xl font-bold text-gray-900">Built by Experts in AI & Healthcare</h2>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            Our team brings decades of experience in healthcare claims processing, fraud investigation, 
            and cutting-edge machine learning. We're driven by technology that makes healthcare 
            more efficient, fair, and protects billions in fraudulent losses.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold">
          Ready to Stop Healthcare Fraud?
        </h2>
        <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
          Let's discuss how our AI platform can protect your organization from fraudulent claims.
        </p>
        <div className="mt-10">
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}