import { Shield, Workflow, Layers, Radar, Network, ClipboardCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const steps = [
  {
    title: "Ingest & Normalize",
    description: "Secure ingestion of claims (EDI 837), EHR context (HL7/FHIR), provider data, documents, and device/location signals. PHI minimization and field-level encryption applied on entry.",
    icon: Layers,
  },
  {
    title: "Score & Explain",
    description: "Multi-model ensemble scores per claim: NLP document integrity, rules for compliance, anomaly detection, provider peer benchmarking, graph risk for collusion, and clinical consistency checks.",
    icon: Radar,
  },
  {
    title: "Route & Act",
    description: "Inline decisions for clean claims, hold/deny for high-risk, and SIU queues for review. Generates investigator packets with evidence, citations, and factor attributions.",
    icon: Workflow,
  },
  {
    title: "Learn & Improve",
    description: "Feedback from SIU outcomes, appeals, and recoveries retrains thresholds and boosts precision. Governance guardrails keep changes auditable and reversible.",
    icon: Network,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-sm uppercase tracking-widest font-semibold text-black">How It Works</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900">From data to action in four steps</h1>
            <p className="mt-4 text-lg text-gray-700">
              Albitros combines deterministic rules, ML models, and graph analytics to stop fraud pre-pay and recover post-pay—without slowing valid claims.
            </p>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
            {steps.map((step) => (
              <div key={step.title} className="p-6 border rounded-2xl shadow-sm bg-gray-50">
                <step.icon className="w-8 h-8 text-black" />
                <h3 className="mt-4 text-2xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-3 text-gray-700 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-6 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
            <div className="bg-white text-gray-900 rounded-2xl p-6 shadow">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-black" />
                <h3 className="text-xl font-semibold">Controls</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li>HIPAA-aligned processing and PHI minimization</li>
                <li>RBAC, SSO/SAML, MFA, and audit trails</li>
                <li>Data retention policies with zero-retention options</li>
              </ul>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-6 shadow">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6 text-black" />
                <h3 className="text-xl font-semibold">Integrations</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li>EDI 837/835, HL7/FHIR, X12, PDF/DICOM ingest</li>
                <li>Outbound to SIU case tools, core admin, and CRM</li>
                <li>Webhook and file-drop options for phased rollout</li>
              </ul>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-6 shadow">
              <div className="flex items-center gap-3">
                <Workflow className="w-6 h-6 text-black" />
                <h3 className="text-xl font-semibold">Outcomes</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li>High-precision pre-pay holds and denials</li>
                <li>Investigator-ready evidence packets</li>
                <li>Continuous lift from feedback and appeals data</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900">See it with your data</h2>
            <p className="mt-4 text-lg text-gray-700">Run a pilot on a sampled claims set and compare decisions, lift, and investigator time saved.</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/contact" className="px-6 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition flex items-center gap-2">
                Book a pilot review
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/roi" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-900 font-semibold hover:bg-gray-100 transition">
                Estimate ROI
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
