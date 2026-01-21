import Navbar from "@/components/Navbar";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Is Albitros HIPAA compliant?",
    a: "We operate with HIPAA-aligned controls: PHI minimization, encryption in transit/at rest, RBAC/SSO, audit logging, and BAA support. SOC 2 is in progress with mapped controls.",
  },
  {
    q: "How do you integrate with our systems?",
    a: "We ingest claims via EDI 837/835, HL7/FHIR for clinical context, PDFs for supporting docs, and webhooks/file-drop for phased rollout. We can push outcomes back to SIU tools and core admin systems.",
  },
  {
    q: "How accurate is the fraud detection?",
    a: "In pilots we prioritize SIU queues with 95%+ precision by combining rules, graph risk, and anomaly detection. Thresholds are tuned with your historical outcomes to balance catch rate and false positives.",
  },
  {
    q: "How quickly can we see results?",
    a: "Most teams see value in 4-6 weeks: week 1 data onboarding, week 2-3 tuning and parallel scoring, week 4 live holds/denials with investigator packet automation.",
  },
  {
    q: "What happens after a claim is flagged?",
    a: "We generate an investigator packet with factor attribution, evidence snippets, and recommended actions. Claims can be auto-held, denied, or routed to SIU queues with reasons attached.",
  },
  {
    q: "Do you support post-payment recovery?",
    a: "Yes. We run retro audits on historical claims, surface high-confidence overpayments, and package recovery evidence to accelerate take-backs and appeals handling.",
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 px-6 bg-gray-50 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm uppercase tracking-widest font-semibold text-black">FAQ</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900">Answers for risk, compliance, and SIU teams</h1>
            <p className="mt-4 text-lg text-gray-700">If you don’t see what you need, we’ll cover it live.</p>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((item) => (
              <details key={item.q} className="group border rounded-2xl p-4 shadow-sm">
                <summary className="flex items-center justify-between cursor-pointer text-left">
                  <span className="text-lg font-semibold text-gray-900">{item.q}</span>
                  <Plus className="w-5 h-5 text-gray-500 group-open:rotate-45 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-700 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
