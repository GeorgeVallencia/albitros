 "use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";

const defaultInputs = {
  monthlyClaims: 500000,
  avgClaimValue: 350,
  fraudRate: 0.03,
  catchRate: 0.65,
  falsePositiveRate: 0.05,
};

export default function ROICalculatorPage() {
  const [inputs, setInputs] = useState(defaultInputs);

  const results = useMemo(() => {
    const fraudExposure = inputs.monthlyClaims * inputs.avgClaimValue * inputs.fraudRate;
    const recovered = fraudExposure * inputs.catchRate;
    const falsePositiveCost = inputs.monthlyClaims * inputs.avgClaimValue * inputs.falsePositiveRate * 0.1; // assume 10% manual rework cost
    const netSavings = recovered - falsePositiveCost;
    const annualized = netSavings * 12;
    return { fraudExposure, recovered, falsePositiveCost, netSavings, annualized };
  }, [inputs]);

  const handleNumberChange = (field: keyof typeof inputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 px-6 bg-gray-50 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm uppercase tracking-widest font-semibold text-black">ROI Calculator</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900">Estimate savings with Albitros</h1>
            <p className="mt-4 text-lg text-gray-700">Plug in your claims volume and fraud assumptions to see potential impact. We’ll refine these numbers with your historical data in a pilot.</p>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10">
            <div className="p-6 border rounded-2xl shadow-sm bg-gray-50 space-y-5">
              <h2 className="text-xl font-semibold text-gray-900">Inputs</h2>
              <div className="space-y-4">
                <InputField
                  label="Monthly claims volume"
                  value={inputs.monthlyClaims}
                  suffix="claims"
                  onChange={(v) => handleNumberChange("monthlyClaims", v)}
                />
                <InputField
                  label="Average claim value"
                  value={inputs.avgClaimValue}
                  prefix="$"
                  onChange={(v) => handleNumberChange("avgClaimValue", v)}
                />
                <InputField
                  label="Estimated fraud/abuse rate"
                  value={inputs.fraudRate * 100}
                  suffix="%"
                  onChange={(v) => handleNumberChange("fraudRate", v / 100)}
                />
                <InputField
                  label="Detection catch rate"
                  value={inputs.catchRate * 100}
                  suffix="%"
                  onChange={(v) => handleNumberChange("catchRate", v / 100)}
                />
                <InputField
                  label="False positive rate on reviews"
                  value={inputs.falsePositiveRate * 100}
                  suffix="%"
                  onChange={(v) => handleNumberChange("falsePositiveRate", v / 100)}
                />
              </div>
              <button
                onClick={() => setInputs(defaultInputs)}
                className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 text-gray-900 font-semibold hover:bg-gray-100 transition"
              >
                Reset to defaults
              </button>
            </div>

            <div className="p-6 border rounded-2xl shadow-sm bg-gray-900 text-white space-y-5">
              <h2 className="text-xl font-semibold">Projected impact</h2>
              <Stat label="Monthly fraud exposure" value={results.fraudExposure} />
              <Stat label="Recovered per month" value={results.recovered} highlight />
              <Stat label="Ops cost from false positives" value={results.falsePositiveCost} negative />
              <Stat label="Net savings per month" value={results.netSavings} highlight />
              <Stat label="Annualized savings" value={results.annualized} highlight big />
              <p className="text-sm text-gray-300">Assumptions: 10% of false positive claim value as rework/appeal cost. We refine these with your actual processes.</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/contact"
                  className="flex-1 min-w-[200px] px-4 py-3 text-center rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
                >
                  Review with our team
                </a>
                <a
                  href="/how-it-works"
                  className="flex-1 min-w-[200px] px-4 py-3 text-center rounded-xl border border-gray-500 text-white font-semibold hover:bg-gray-800 transition"
                >
                  See how we calculate lift
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, highlight, negative, big }: { label: string; value: number; highlight?: boolean; negative?: boolean; big?: boolean }) {
  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return (
    <div className={`p-4 rounded-xl border ${highlight ? "border-green-400 bg-green-50 text-gray-900" : negative ? "border-red-300 bg-red-50 text-red-900" : "border-gray-800 bg-gray-800/60 text-white"}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className={`mt-1 font-bold ${big ? "text-3xl" : "text-2xl"}`}>
        ${formatted}
      </p>
    </div>
  );
}

function InputField({ label, value, prefix, suffix, onChange }: { label: string; value: number; prefix?: string; suffix?: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-2 flex items-center border rounded-xl bg-white px-3 py-2">
        {prefix && <span className="text-gray-500 mr-2">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 outline-none bg-transparent text-gray-900"
          min={0}
          step="0.01"
        />
        {suffix && <span className="text-gray-500 ml-2">{suffix}</span>}
      </div>
    </label>
  );
}
