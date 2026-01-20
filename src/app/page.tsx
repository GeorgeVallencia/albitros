import Link from "next/link";
import { Shield, FileText, BarChart3, Users, Lock, CheckCircle2, Sparkles, Workflow, LineChart, BadgeCheck, Zap, ClipboardCheck, Building2, HeartPulse, AlertTriangle, Clock, ArrowRight, ShieldCheck, Award } from "lucide-react";
import { TrendingUp, DollarSign, } from "lucide-react";
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
          Stop Healthcare Fraud<br />Before It Hits Your Loss Ratio.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl">
          Albitros is the healthcare fraud platform that flags phantom billing, upcoding, unbundling, and fraud rings in real time—so you pay the right claims and protect every dollar.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/contact"
            className="px-8 py-4 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition text-lg"
          >
            Schedule a Demo
          </Link>
          <Link
            href="/roi"
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-800 font-medium hover:bg-gray-100 transition"
          >
            Calculate ROI
          </Link>
          <Link
            href="/how-it-works"
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-800 font-medium hover:bg-gray-100 transition"
          >
            See How It Works
          </Link>
          <Link
            href="#roi-calculator"
            className="px-8 py-4 rounded-xl border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-100 transition text-lg"
          >
            Calculate Your Savings
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="bg-white border rounded-2xl p-4 text-left shadow-sm">
            <p className="text-3xl font-bold text-black">$100B+</p>
            <p className="text-gray-600 text-sm mt-1">annual US healthcare fraud exposure (NHCAA)</p>
          </div>
          <div className="bg-white border rounded-2xl p-4 text-left shadow-sm">
            <p className="text-3xl font-bold text-black">2-5%</p>
            <p className="text-gray-600 text-sm mt-1">of claims are fraudulent or abusive on average</p>
          </div>
          <div className="bg-white border rounded-2xl p-4 text-left shadow-sm">
            <p className="text-3xl font-bold text-black">3-10x</p>
            <p className="text-gray-600 text-sm mt-1">typical ROI from proactive fraud elimination</p>
          </div>
        </div>
        {/* Trust strip */}
        <div className="mt-10 w-full max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-wide text-gray-500">
            <span className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full">
              <ShieldCheck className="w-4 h-4 text-green-600" /> HIPAA-aligned
            </span>
            <span className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full">
              <Lock className="w-4 h-4 text-gray-700" /> SOC 2 in progress
            </span>
            <span className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full">
              <Users className="w-4 h-4 text-purple-600" /> SIU-led design
            </span>
            <span className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full">
              <Award className="w-4 h-4 text-amber-500" /> Advisor bench: ex-CMS, national SIU
            </span>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm uppercase tracking-widest font-semibold text-red-600">The Stakes</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">Healthcare fraud is eroding margins and trust.</h2>
            <p className="mt-4 text-lg text-gray-700 leading-relaxed">
              Fraud costs US healthcare over $100B annually. Insurers lose 2-5% of claims to phantom billing, upcoding, unbundling, and organized rings. Manual review cannot keep up with volume, leading to leakage, delayed payouts, and unhappy members.
            </p>
            <ul className="mt-6 space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                <span>Rising loss ratios from sophisticated provider networks and AI-generated documentation.</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-1" />
                <span>Weeks-long investigations slow valid payouts and frustrate members.</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-1" />
                <span>Regulators expect auditable decisions and HIPAA-grade security.</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-50 border rounded-2xl p-8 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">Example Impact</p>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Monthly claims volume</span>
                <span>500k</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Estimated fraud/abuse rate</span>
                <span>3%</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Exposure per month</span>
                <span className="font-semibold text-gray-900">$15M</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Recovered with AI detection (65%)</span>
                <span className="font-semibold text-green-700">$9.8M</span>
              </div>
            </div>
            <Link
              href="/roi"
              className="mt-6 inline-flex items-center gap-2 text-black font-semibold hover:underline"
            >
              Run your ROI model
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Albitros */}
      <section id="why" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm uppercase tracking-widest font-semibold text-black">Why Albitros</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">Purpose-built to outpace modern healthcare fraud.</h2>
            <p className="mt-4 text-lg text-gray-700">We combine clinical context, provider behavior, network analysis, and document integrity checks to stop fraud before payout.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Multi-modal detection</h3>
              <p className="mt-2 text-gray-600">Claims, EHR context, provider history, geospatial signals, and document forensics scored together for higher precision.</p>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <Workflow className="w-8 h-8 text-blue-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Actionable workflows</h3>
              <p className="mt-2 text-gray-600">Auto-routes suspect claims to SIU queues, generates investigator packets, and pushes status back to core admin systems.</p>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <LineChart className="w-8 h-8 text-green-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Explainable AI</h3>
              <p className="mt-2 text-gray-600">Every decision is auditable with factor attribution, thresholds, and data lineage to satisfy regulators and internal audit.</p>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <Shield className="w-8 h-8 text-red-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Compliance-first</h3>
              <p className="mt-2 text-gray-600">HIPAA-aligned data handling, encryption in transit/at rest, RBAC, SSO, and audit logging by default.</p>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <ClipboardCheck className="w-8 h-8 text-orange-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Fast go-live</h3>
              <p className="mt-2 text-gray-600">Pre-built rules and starter models with EDI/HL7/FHIR adapters mean you see lift in weeks, not quarters.</p>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <Building2 className="w-8 h-8 text-indigo-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Built with payers</h3>
              <p className="mt-2 text-gray-600">Co-designed with SIU leads, medical directors, and claims ops teams to fit existing processes—not disrupt them.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Problem Statement Section */}
      <section className="py-20 px-6 bg-red-50 border-y-4 border-red-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Healthcare Fraud is a $100+ Billion Crisis
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Every year, fraudulent healthcare claims drain billions from the system, driving up premiums 
              and delaying legitimate care. Traditional manual review catches less than 10% of sophisticated fraud.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 mt-16">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-4xl font-bold text-red-600 mb-2">$100B+</p>
              <p className="text-gray-700 font-medium">Lost to Healthcare Fraud Annually in US</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-4xl font-bold text-red-600 mb-2">3-10%</p>
              <p className="text-gray-700 font-medium">Of Total Healthcare Spending is Fraudulent</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-4xl font-bold text-red-600 mb-2">&lt;10%</p>
              <p className="text-gray-700 font-medium">Detection Rate with Manual Review</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-4xl font-bold text-red-600 mb-2">$300+</p>
              <p className="text-gray-700 font-medium">Added to Average Family Premium Yearly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map + Live Demo */}
      <section className="py-20 px-6 bg-white"/>
      {/* Interactive Map Section */}
      <section className="py-12 px-6 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              See Fraud Patterns Detected in Real Time
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Live simulation of how Albitros flags anomalies across claims, providers, and geography.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <FraudDetectionDemo />
          </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-black">95%+</p>
              <p className="mt-2 text-gray-600">precision on prioritized fraud queues</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-black">$50M+</p>
              <p className="mt-2 text-gray-600">annualized savings modeled across pilots</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-black">&lt;1s</p>
              <p className="mt-2 text-gray-600">decision latency for inline claim checks</p>
            </div>
          </div>
          </div>
      </section>

      {/* Fraud Scenarios */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Real fraud scenarios we catch daily</h2>
            <p className="mt-4 text-lg text-gray-700">From subtle code creep to cross-network collusion, Albitros surfaces the why, not just the score.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-semibold text-gray-900">Upcoding & Unbundling</h3>
              </div>
              <p className="mt-3 text-gray-600">Detects CPT/HCPCS code inflation and unnecessary unbundling against clinical context and peer providers.</p>
              <p className="mt-2 text-sm text-gray-500">Signals: code frequency drift, incompatible code groups, provider outliers, documentation mismatches.</p>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">Organized Fraud Rings</h3>
              </div>
              <p className="mt-3 text-gray-600">Graph links providers, patients, facilities, and devices to uncover coordinated claims submissions.</p>
              <p className="mt-2 text-sm text-gray-500">Signals: shared addresses, shared NPI clusters, synchronized submission times, abnormal referral loops.</p>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-semibold text-gray-900">Phantom Billing</h3>
              </div>
              <p className="mt-3 text-gray-600">Flags services never rendered by checking schedule capacity, patient history, and geo plausibility.</p>
              <p className="mt-2 text-sm text-gray-500">Signals: impossible volumes per clinician, address anomalies, device location vs. claim site.</p>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <HeartPulse className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-semibold text-gray-900">Post-payment recovery</h3>
              </div>
              <p className="mt-3 text-gray-600">Retro audits to recoup overpayments with investigator-ready packets and audit trails.</p>
              <p className="mt-2 text-sm text-gray-500">Signals: historical drift, payer rules updates, appeal probability models.</p>
            </div>
          </div>
          </div>
          </section>
      {/* Why Albitros - Differentiation */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Leading Insurers Choose Albitros
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another AI vendor. Our platform is purpose-built for healthcare fraud detection 
              with proprietary technology that outperforms legacy systems and manual review.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
              <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">95%+ Detection Accuracy</h3>
              <p className="text-gray-700 mb-4">
                Our multi-layered AI models analyze claims against 200+ fraud indicators, cross-referencing 
                provider histories, treatment patterns, and billing anomalies in real-time.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Pattern recognition across 50M+ historical claims</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Real-time provider network analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Continuous learning from fraud investigations</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
              <Shield className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Explainable & Auditable</h3>
              <p className="text-gray-700 mb-4">
                Every fraud flag comes with detailed reasoning, evidence, and audit trails. No black box decisions.
                Full compliance with regulatory requirements and internal review processes.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Detailed fraud reasoning for every flag</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Complete audit trails for compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Integration with existing claims systems</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
              <Award className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Built by Healthcare Experts</h3>
              <p className="text-gray-700 mb-4">
                Our team includes former healthcare fraud investigators, claims processors, and ML researchers 
                who've spent decades understanding how fraud actually works.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>20+ years combined fraud investigation experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>PhDs in machine learning & healthcare analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Partnerships with major academic institutions</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl">
              <DollarSign className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Proven ROI in 90 Days</h3>
              <p className="text-gray-700 mb-4">
                Our beta customers saw positive ROI within the first quarter, with fraud detection rates 
                increasing 10x compared to manual review.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>Average $47M saved in first year</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>10x improvement in fraud detection rate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>60% reduction in false positives</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Comprehensive Healthcare Fraud Detection
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Detect and prevent all types of healthcare fraud with explainable, auditable AI designed specifically for health insurers.
          </p>
        </div>
      </section>

      {/* Case Studies / Results */}
      <section id="case-studies" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm uppercase tracking-widest font-semibold text-black">Results</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">Early program outcomes</h2>
            <p className="mt-4 text-lg text-gray-700">Anonymized beta programs with regional payers and TPAs.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="p-6 border rounded-2xl shadow-sm bg-gray-50">
              <BadgeCheck className="w-8 h-8 text-green-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">42% reduction</h3>
              <p className="mt-2 text-gray-600">drop in fraudulent payouts in 90 days after inline claim scoring and SIU routing.</p>
              <p className="mt-3 text-sm text-gray-500">Payer: 1M lives, Southeast US</p>
            </div>
            <div className="p-6 border rounded-2xl shadow-sm bg-gray-50">
              <Zap className="w-8 h-8 text-yellow-500" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">8x faster</h3>
              <p className="mt-2 text-gray-600">investigation packet creation with automated evidence, notes, and citations.</p>
              <p className="mt-3 text-sm text-gray-500">Payer: TPA, national employer plans</p>
            </div>
            <div className="p-6 border rounded-2xl shadow-sm bg-gray-50">
              <LineChart className="w-8 h-8 text-blue-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">$18.6M annualized</h3>
              <p className="mt-2 text-gray-600">projected savings from combined pre-pay denials and post-pay recoveries.</p>
              <p className="mt-3 text-sm text-gray-500">Payer: Regional plan, Midwest</p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition"
            >
              See pilot results
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Team Snapshot */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm uppercase tracking-widest font-semibold text-black">Team</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Built by SIU, clinical, and ML leaders</h2>
            <p className="mt-4 text-lg text-gray-700">Operators who have recovered $100M+ and run fraud programs at scale.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="p-5 bg-white border rounded-2xl shadow-sm">
              <p className="text-lg font-semibold text-gray-900">Aisha Mwangi</p>
              <p className="text-sm text-gray-600">CEO — ex-SIU head, recovered $120M</p>
              <p className="mt-2 text-sm text-gray-700">CFE; led payer fraud playbooks for 5M-member plan.</p>
            </div>
            <div className="p-5 bg-white border rounded-2xl shadow-sm">
              <p className="text-lg font-semibold text-gray-900">David Kim, PhD</p>
              <p className="text-sm text-gray-600">CTO — ML risk systems at EDI scale</p>
              <p className="mt-2 text-sm text-gray-700">Built real-time scoring for millions of claims/day; ex-Stripe Risk.</p>
            </div>
            <div className="p-5 bg-white border rounded-2xl shadow-sm">
              <p className="text-lg font-semibold text-gray-900">Lilian Otieno, RN</p>
              <p className="text-sm text-gray-600">Clinical Lead — coding & documentation integrity</p>
              <p className="mt-2 text-sm text-gray-700">RN, CPC, CCS; designs clinical rules and reviews model explanations.</p>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-600">
            Advisors: former CMS fraud analytics director, ex-national SIU leader, academic healthcare ML/graph specialist.
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition"
            >
              Meet the team
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section id="security" className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm uppercase tracking-widest font-semibold text-gray-300">Security & Compliance</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-4">Built for regulated healthcare environments.</h2>
            <p className="mt-4 text-lg text-gray-200">HIPAA-aligned data handling, SOC 2 readiness, least-privilege access, and full audit trails keep your risk team and regulators confident.</p>
            <ul className="mt-6 space-y-3 text-gray-200">
              <li className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-white mt-1" />
                <span>Encryption in transit and at rest (TLS 1.2+, AES-256), isolated environments, and secrets management.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white mt-1" />
                <span>RBAC, SSO/SAML, audit logging, and PHI minimization baked into workflows.</span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-white mt-1" />
                <span>Explainable decisions with factor attribution and exportable evidence packets.</span>
              </li>
            </ul>
          </div>
          <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-xl p-4 text-center">
                <p className="font-semibold">HIPAA</p>
                <p className="text-sm text-gray-500 mt-1">Aligned controls</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="font-semibold">SOC 2</p>
                <p className="text-sm text-gray-500 mt-1">In progress</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="font-semibold">SSO / SAML</p>
                <p className="text-sm text-gray-500 mt-1">Okta, Azure AD</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="font-semibold">Audit Logs</p>
                <p className="text-sm text-gray-500 mt-1">Exportable, immutable</p>
              </div>
            </div>
            <div className="mt-6 bg-gray-50 border rounded-xl p-4 text-sm">
              <p className="font-semibold text-gray-900">Data handling</p>
              <p className="text-gray-600 mt-1">PHI minimization, role-scoped environments, DLP on uploads, and zero-retention options for sensitive payloads.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-widest font-semibold text-gray-300">Financial Impact</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">Know your savings before you deploy.</h2>
          <p className="mt-4 text-lg text-gray-200">Run a 3-minute ROI model with your claims volume, average loss ratio, and fraud rates to see projected savings.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/roi"
              className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
            >
              Open ROI Calculator
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl border border-gray-400 text-white font-semibold hover:bg-white hover:text-black transition"
            >
              Talk with SIU Specialist
            </Link>
          </div>
        </div>
      </section>

      {/* Beta Program Results / Case Studies */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proven Results from Our Beta Program
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real outcomes from health insurers who deployed Albitros in production.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl border-2 border-gray-200">
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-semibold mb-2">REGIONAL HEALTH INSURER</p>
                <p className="text-3xl font-bold text-gray-900">$47M Saved</p>
                <p className="text-sm text-gray-600 mt-2">In First 12 Months</p>
              </div>
              <p className="text-gray-700 italic mb-4">
                "Albitros detected a phantom billing ring involving 12 providers that our manual review 
                team missed for over 2 years. The system paid for itself in the first month."
              </p>
              <p className="text-sm font-semibold text-gray-900">— VP of Fraud Prevention</p>
              <div className="mt-6 pt-6 border-t border-gray-300">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">1.2M</p>
                    <p className="text-gray-600">Claims Analyzed</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">847</p>
                    <p className="text-gray-600">Fraud Cases Found</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border-2 border-gray-200">
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-semibold mb-2">NATIONAL MEDICARE ADVANTAGE</p>
                <p className="text-3xl font-bold text-gray-900">94% Accuracy</p>
                <p className="text-sm text-gray-600 mt-2">On Upcoding Detection</p>
              </div>
              <p className="text-gray-700 italic mb-4">
                "The explainability feature was crucial for our compliance team. Every fraud flag came with 
                clear evidence we could present to providers and auditors."
              </p>
              <p className="text-sm font-semibold text-gray-900">— Chief Compliance Officer</p>
              <div className="mt-6 pt-6 border-t border-gray-300">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">3.8M</p>
                    <p className="text-gray-600">Claims Analyzed</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">65%</p>
                    <p className="text-gray-600">False Positive Reduction</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border-2 border-gray-200">
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-semibold mb-2">MULTI-STATE MEDICAID MCO</p>
                <p className="text-3xl font-bold text-gray-900">10x Increase</p>
                <p className="text-sm text-gray-600 mt-2">In Fraud Detection Rate</p>
              </div>
              <p className="text-gray-700 italic mb-4">
                "We went from catching 50-60 fraud cases per year manually to over 500 in the first 6 months 
                with Albitros. The network analysis feature is game-changing."
              </p>
              <p className="text-sm font-semibold text-gray-900">— Director of SIU</p>
              <div className="mt-6 pt-6 border-t border-gray-300">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">2.1M</p>
                    <p className="text-gray-600">Claims Analyzed</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">532</p>
                    <p className="text-gray-600">Fraud Cases Found</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Security & Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your data security and regulatory compliance are our top priorities.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-md text-center border-2 border-blue-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">HIPAA Compliant</h3>
              <p className="text-sm text-gray-600">Full compliance with healthcare privacy regulations</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center border-2 border-green-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">SOC 2 Type II</h3>
              <p className="text-sm text-gray-600">In Progress - Expected Q2 2026</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center border-2 border-purple-100">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AES-256 Encryption</h3>
              <p className="text-sm text-gray-600">Data encrypted at rest and in transit</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center border-2 border-orange-100">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">99.9% Uptime SLA</h3>
              <p className="text-sm text-gray-600">Enterprise reliability guarantee</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Additional Security Features</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span>Role-based access control (RBAC)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span>Multi-factor authentication (MFA)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span>Comprehensive audit logging</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span>Regular security penetration testing</span>
                </li>
              </ul>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span>Data residency options (US, EU)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span>Annual third-party security audits</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span>Business continuity & disaster recovery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span>Dedicated security team 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Ready to stop fraud and pay clean claims faster?
        </h2>
        <p className="mt-4 text-lg text-gray-700">
          Schedule a 30-minute session to see pilot results, compliance controls, and integration paths.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/contact"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition"
          >
            Schedule a Demo
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-900 font-semibold hover:bg-gray-100 transition"
          >
            View FAQs
          </Link>
        </div>
      </section>
    </div>
  );
}
