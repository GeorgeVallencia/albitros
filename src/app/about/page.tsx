import Link from "next/link";
import { Shield, Lock, Award, Users, Cpu, ClipboardList, BookOpen, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";

const team = [
  {
    name: "Aisha Mwangi",
    title: "Co-founder & CEO",
    bio: "Former head of SIU at a 5M-member health plan; led $120M in recoveries and built payer fraud playbooks.",
    creds: "CFE, ex-McKinsey healthcare ops",
  },
  {
    name: "David Kim",
    title: "Co-founder & CTO",
    bio: "Built real-time risk systems at a top EDI network; 15 years in ML infra and claims processing at scale.",
    creds: "PhD ML, ex-Stripe Risk",
  },
  {
    name: "Lilian Otieno, RN",
    title: "Clinical Lead",
    bio: "Registered nurse and coding specialist; designs clinical context rules and reviews model explanations.",
    creds: "RN, CPC, CCS",
  },
  {
    name: "Carlos Rivera",
    title: "Head of Security & Compliance",
    bio: "Security leader who delivered HIPAA/SOC 2 programs for healthtech vendors and TPAs.",
    creds: "CISSP, HITRUST experience",
  },
];

const advisors = [
  "Former CMS fraud analytics director",
  "Ex-SIU leader at national payer",
  "Academic advisor in healthcare ML and graph analytics",
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest font-semibold text-black">About Albitros</p>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 mt-3">
            Built by SIU leaders, clinicians, and ML engineers to stop fraud.
          </h1>
          <p className="text-xs text-gray-600 max-w-3xl mx-auto">
            We’ve lived the pain of rising loss ratios, slow investigations, and regulator scrutiny. Albitros combines payer-grade security, clinical context, and explainable AI to eliminate fraud while speeding clean payouts.
          </p>
        </div>
      </section>

      {/* Mission & Proof */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10 items-start">
          <div className="p-6 border rounded-2xl shadow-sm bg-gray-50">
            <Shield className="w-8 h-8 text-black" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Mission</h3>
            <p className="text-xs text-gray-700">Restore trust in healthcare payments by stopping fraud before payout and recovering dollars already lost.</p>
          </div>
          <div className="p-6 border rounded-2xl shadow-sm bg-gray-50">
            <Award className="w-8 h-8 text-black" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">What we've done</h3>
            <ul className="text-xs text-gray-700">
              <li>Recovered or prevented $100M+ across payer programs our team led.</li>
              <li>Delivered inline fraud checks with sub-second latency on millions of claims/day.</li>
              <li>Designed SIU workflows adopted by national and regional plans.</li>
            </ul>
          </div>
          <div className="p-6 border rounded-2xl shadow-sm bg-gray-50">
            <Lock className="w-8 h-8 text-black" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">How we build</h3>
            <ul className="text-xs text-gray-700">
              <li>HIPAA-aligned data handling, encryption in transit/at rest.</li>
              <li>SOC 2 controls in progress with mapped policies and evidence.</li>
              <li>RBAC, SSO/SAML, audit logging, and PHI minimization by default.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-semibold text-black">Team</p>
            <h2 className="text-xl font-bold text-gray-900 mt-2">Operators from payers, SIU, and ML</h2>
            <p className="text-xs text-gray-700">We blend clinical judgment, fraud investigation rigor, and production-grade ML.</p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {team.map((member) => (
              <div key={member.name} className="p-6 bg-white border rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="text-xl font-semibold text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-600">{member.title}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700">{member.bio}</p>
                <p className="text-xs text-gray-500">{member.creds}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisors */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-black" />
            <h3 className="text-xl font-bold text-gray-900">Advisors</h3>
          </div>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {advisors.map((item) => (
              <div key={item} className="p-4 border rounded-xl shadow-sm bg-gray-50 text-gray-800 text-xs">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance & Trust */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-300">Trust & Compliance</p>
            <h2 className="text-xl font-bold mt-3">Built for regulated healthcare environments.</h2>
            <p className="text-xs text-gray-200">Security, auditability, and PHI minimization are core design requirements—not add-ons.</p>
            <ul className="text-xs text-gray-200">
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 mt-1" />
                <span>HIPAA-aligned controls and BAAs available.</span>
              </li>
              <li className="flex items-start gap-3">
                <ClipboardList className="w-5 h-5 mt-1" />
                <span>SOC 2 Type II in progress with mapped policies and evidence collection.</span>
              </li>
              <li className="flex items-start gap-3">
                <Cpu className="w-5 h-5 mt-1" />
                <span>Isolation, encryption (TLS 1.2+, AES-256), secrets management, and DLP on uploads.</span>
              </li>
            </ul>
          </div>
          <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-xl p-4 text-center">
                <p className="font-semibold text-xl">HIPAA</p>
                <p className="text-xs text-gray-500 mt-1">Aligned controls</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="font-semibold text-xl">SOC 2</p>
                <p className="text-xs text-gray-500 mt-1">In progress</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="font-semibold text-xl">SSO / SAML</p>
                <p className="text-xs text-gray-500 mt-1">Okta, Azure AD</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="font-semibold text-xl">Audit Logs</p>
                <p className="text-xs text-gray-500 mt-1">Exportable, immutable</p>
              </div>
            </div>
            <div className="mt-6 bg-gray-50 border rounded-xl p-4 text-xs">
              <p className="font-semibold text-gray-900">Data handling</p>
              <p className="text-gray-600 mt-1">PHI minimization, role-scoped environments, least-privilege access, zero-retention options for sensitive payloads.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white text-center">
        <h2 className="text-xl font-bold text-gray-900">Meet the team and see pilot results.</h2>
        <p className="text-xs text-gray-700">Schedule 30 minutes to review security, compliance, and how we'll tune models with your historical outcomes.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition text-xs"
          >
            Schedule a demo
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border border-gray-300 text-gray-900 font-semibold hover:bg-gray-100 transition text-xs"
          >
            See how we work
          </Link>
        </div>
      </section>
    </div>
  );
}