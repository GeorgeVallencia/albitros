
'use client';

import Link from "next/link";
import { Check, Shield, Zap, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-8 text-xl text-gray-600 max-w-3xl mx-auto">
            Custom plans built for your claims volume and fraud detection needs. 
            No hidden fees. Pay only for the fraud we help you prevent.
          </p>
        </div>
      </section>

      {/* Pricing Model Explanation */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Fraud Detection That Pays For Itself
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            Our fraud detection platform is tailored to mid-market and enterprise health insurers. Pricing is based on:
          </p>

          <div className="mt-16 grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="p-8 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Claims Volume</h3>
              <p className="mt-4 text-gray-600">
                Number of claims processed annually across your portfolio.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Fraud Types Covered</h3>
              <p className="mt-4 text-gray-600">
                Phantom billing, upcoding, unbundling, duplicate claims, and organized fraud detection.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Integration & Support</h3>
              <p className="mt-4 text-gray-600">
                API access, dedicated onboarding, SLA, and priority support levels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Single Call-to-Action Card */}
      <section className="py-20 px-6 bg-gray-100">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Get Your Custom Quote
          </h2>
          <p className="mt-6 text-xl text-gray-600">
            Most customers see ROI within the first 3–6 months through prevented fraudulent payouts alone. 
            Average savings exceed $50M annually.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition text-lg"
            >
              Request Pricing
            </Link>
            <Link
              href="https://calendly.com/georgevallencia" // Replace with your scheduling link
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-gray-300 text-gray-800 font-semibold rounded-xl hover:bg-gray-50 transition text-lg"
            >
              Book a Demo Call
            </Link>
          </div>

          <div className="mt-12 text-left max-w-2xl mx-auto">
            <p className="text-sm text-gray-500 font-medium mb-4">Every plan includes:</p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                Unlimited users & seats
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                Full API access and webhooks
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                SOC 2 Type II compliance & data encryption
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                99.9% uptime SLA
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                Dedicated customer success manager
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ or Trust Section (Optional) */}
      <section className="py-20 px-6 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-lg text-gray-600">
            No setup fees. No long-term contracts required. 
            Scale up or down as your needs change.
          </p>
        </div>
      </section>
    </div>
  );
}

// import Navbar from '@/components/Navbar';
// import { useState } from 'react';

// export default function PricingPage() {
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [billingCycle, setBillingCycle] = useState('monthly');

//   const handleSelectPlan = (planName) => {
//     setSelectedPlan(planName);
//     alert(`You selected the ${planName} plan! This would normally take you to the signup page.`);
//   };

//   const pricingPlans = [
//     {
//       name: 'Individual',
//       description: 'Perfect for personal projects and small-scale applications',
//       monthlyPrice: 15,
//       yearlyPrice: 200,
//       billing: 'Billed monthly or save 20% annually',
//       featured: false,
//       buttonText: 'Get Started',
//       features: [
//         'Up to 50,000 requests/month',
//         'Basic analytics dashboard',
//         'Community support',
//         'Standard API access',
//         '1 project included'
//       ]
//     },
//     {
//       name: 'Business',
//       description: 'Ideal for growing teams and production applications',
//       monthlyPrice: 1300,
//       yearlyPrice: 20000,
//       billing: 'Billed monthly or save 20% annually',
//       featured: true,
//       buttonText: 'Start Free Trial',
//       features: [
//         'Up to 500,000 requests/month',
//         'Advanced analytics & insights',
//         'Priority email support',
//         'Premium API features',
//         '10 projects included',
//         'Custom integrations',
//         'Team collaboration tools'
//       ]
//     },
//     {
//       name: 'Premium',
//       description: 'Enterprise-grade solution with dedicated support',
//       monthlyPrice: 7000,
//       yearlyPrice: 100000,
//       billing: 'Billed monthly or save 20% annually',
//       featured: false,
//       buttonText: 'Contact Sales',
//       features: [
//         'Unlimited requests',
//         'Enterprise analytics suite',
//         '24/7 dedicated support',
//         'Full API access + webhooks',
//         'Unlimited projects',
//         'White-label options',
//         'SLA guarantee (99.9% uptime)',
//         'Custom contract terms'
//       ]
//     }
//   ];

//   const getPrice = (plan) => {
//     const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
//     return `$${price.toLocaleString()}`;
//   };

//   const getPeriod = () => {
//     return billingCycle === 'monthly' ? '/mo' : '/yr';
//   };

//   return (
//     <div className="min-h-screen bg-white py-8 px-4">
//       <Navbar />
//       {/* Hero Section */}
//       <div className="text-center mb-12">
//         <h1 className="text-xl font-bold text-black mb-4">
//           Atomik Pricing
//         </h1>
//         <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
//           Choose the perfect plan for your needs. All plans include our core features with no hidden fees.
//         </p>

//         {/* Toggle Button */}
//         <div className="flex items-center justify-center gap-4">
//           <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-black' : 'text-gray-500'}`}>
//             Monthly
//           </span>
//           <button
//             onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
//             className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
//             style={{ backgroundColor: billingCycle === 'yearly' ? '#000000' : '#e5e7eb' }}
//           >
//             <span
//               className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300"
//               style={{ transform: billingCycle === 'yearly' ? 'translateX(28px)' : 'translateX(0)' }}
//             />
//           </button>
//           <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-black' : 'text-gray-500'}`}>
//             Yearly
//           </span>
//           <span className="ml-2 px-3 py-1 bg-black text-white text-xs font-semibold rounded-full">
//             Save 20%
//           </span>
//         </div>
//       </div>

//       {/* Pricing Cards */}
//       <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
//         {pricingPlans.map((plan) => (
//           <div
//             key={plan.name}
//             className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
//               plan.featured
//                 ? 'bg-black text-white border-4 border-black scale-105'
//                 : 'bg-white text-black border-2 border-gray-200 hover:border-black'
//             }`}
//           >
//             {/* Popular Badge */}
//             {plan.featured && (
//               <div className="absolute -top-3 -right-3 bg-white text-black px-4 py-1 rounded-full text-xs font-bold transform rotate-12 shadow-lg">
//                 POPULAR
//               </div>
//             )}

//             {/* Plan Name */}
//             <h2 className={`text-xl font-bold mb-2 ${plan.featured ? 'text-white' : 'text-black'}`}>
//               {plan.name}
//             </h2>

//             {/* Description */}
//             <p className={`text-sm mb-6 ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
//               {plan.description}
//             </p>

//             {/* Price */}
//             <div className="mb-2">
//               <span className={`text-3xl font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
//                 {getPrice(plan)}
//               </span>
//               <span className={`text-xl ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
//                 {getPeriod()}
//               </span>
//             </div>

//             {/* Billing Period */}
//             <p className={`text-sm mb-8 ${plan.featured ? 'text-gray-400' : 'text-gray-500'}`}>
//               {plan.billing}
//             </p>

//             {/* CTA Button */}
//             <button
//               onClick={() => handleSelectPlan(plan.name)}
//               className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 mb-8 ${
//                 plan.featured
//                   ? 'bg-white text-black cursor-pointer hover:bg-gray-100 hover:scale-105'
//                   : 'bg-white text-black cursor-pointer border-2 border-black hover:bg-black hover:text-white'
//               }`}
//             >
//               {plan.buttonText}
//             </button>

//             {/* Features List */}
//             <ul className="space-y-4">
//               {plan.features.map((feature, index) => (
//                 <li key={index} className="flex items-start gap-3">
//                   <span className={`font-bold flex-shrink-0 ${plan.featured ? 'text-white' : 'text-black'}`}>
//                     ✓
//                   </span>
//                   <span className={`text-sm ${plan.featured ? 'text-gray-200' : 'text-gray-700'}`}>
//                     {feature}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// 'use client';

// import { useState } from 'react';

// export default function PricingPage() {
//   const [selectedPlan, setSelectedPlan] = useState(null);

//   const handleSelectPlan = (planName) => {
//     setSelectedPlan(planName);
//     alert(`You selected the ${planName} plan! This would normally take you to the signup page.`);
//   };

//   const pricingPlans = [
//     {
//       name: 'Individual',
//       description: 'Perfect for personal projects and small-scale applications',
//       price: '$99',
//       period: '/mo',
//       billing: 'Free forever',
//       featured: false,
//       buttonText: 'Get Started',
//       features: [
//         'Up to 50,000 requests/month',
//         'Basic analytics dashboard',
//         'Community support',
//         'Standard API access',
//         '1 project included'
//       ]
//     },
//     {
//       name: 'Business',
//       description: 'Ideal for growing teams and production applications',
//       price: '$10,000',
//       period: '/mo',
//       billing: 'Billed monthly or save 20% annually',
//       featured: true,
//       buttonText: 'Start Free Trial',
//       features: [
//         'Up to 500,000 requests/month',
//         'Advanced analytics & insights',
//         'Priority email support',
//         'Premium API features',
//         '10 projects included',
//         'Custom integrations',
//         'Team collaboration tools'
//       ]
//     },
//     {
//       name: 'Premium',
//       description: 'Enterprise-grade solution with dedicated support',
//       price: '$50,000',
//       period: '/mo',
//       billing: 'Billed monthly or save 20% annually',
//       featured: false,
//       buttonText: 'Contact Sales',
//       features: [
//         'Unlimited requests',
//         'Enterprise analytics suite',
//         '24/7 dedicated support',
//         'Full API access + webhooks',
//         'Unlimited projects',
//         'White-label options',
//         'SLA guarantee (99.9% uptime)',
//         'Custom contract terms'
//       ]
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-white py-8 px-4">
//       {/* Hero Section */}
//       <div className="text-center mb-12">
//         <h1 className="text-5xl font-bold text-black mb-4">
//           Atomik Pricing
//         </h1>
//         <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//           Choose the perfect plan for your needs. All plans include our core features with no hidden fees.
//         </p>
//       </div>

//       {/* Pricing Cards */}
//       <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
//         {pricingPlans.map((plan) => (
//           <div
//             key={plan.name}
//             className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
//               plan.featured
//                 ? 'bg-black text-white border-4 border-black scale-105'
//                 : 'bg-white text-black border-2 border-gray-200 hover:border-black'
//             }`}
//           >
//             {/* Popular Badge */}
//             {plan.featured && (
//               <div className="absolute -top-3 -right-3 bg-white text-black px-4 py-1 rounded-full text-xs font-bold transform rotate-12 shadow-lg">
//                 POPULAR
//               </div>
//             )}

//             {/* Plan Name */}
//             <h2 className={`text-2xl font-bold mb-2 ${plan.featured ? 'text-white' : 'text-black'}`}>
//               {plan.name}
//             </h2>

//             {/* Description */}
//             <p className={`text-sm mb-6 ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
//               {plan.description}
//             </p>

//             {/* Price */}
//             <div className="mb-2">
//               <span className={`text-5xl font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
//                 {plan.price}
//               </span>
//               <span className={`text-xl ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
//                 {plan.period}
//               </span>
//             </div>

//             {/* Billing Period */}
//             <p className={`text-sm mb-8 ${plan.featured ? 'text-gray-400' : 'text-gray-500'}`}>
//               {plan.billing}
//             </p>

//             {/* CTA Button */}
//             <button
//               onClick={() => handleSelectPlan(plan.name)}
//               className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 mb-8 ${
//                 plan.featured
//                   ? 'bg-white text-black hover:bg-gray-100 hover:scale-105'
//                   : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'
//               }`}
//             >
//               {plan.buttonText}
//             </button>

//             {/* Features List */}
//             <ul className="space-y-4">
//               {plan.features.map((feature, index) => (
//                 <li key={index} className="flex items-start gap-3">
//                   <span className={`font-bold flex-shrink-0 ${plan.featured ? 'text-white' : 'text-black'}`}>
//                     ✓
//                   </span>
//                   <span className={`text-sm ${plan.featured ? 'text-gray-200' : 'text-gray-700'}`}>
//                     {feature}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }