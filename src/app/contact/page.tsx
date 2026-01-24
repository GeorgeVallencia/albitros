'use client';

import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    interest: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        return;
      }

      setSuccess(true);
      setForm({ name: '', email: '', company: '', interest: '', message: '' });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Get in Touch
          </h1>
          <p className="text-xs text-gray-600 max-w-3xl mx-auto">
            Ready to stop fraud and pay claims instantly? Let’s talk about how our AI platforms
            can transform your insurance operations.
          </p>
        </div>
      </section>

      {/* Contact Info + Form Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          {/* Contact Details */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-8">
              Contact Us
            </h2>
            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <div className="bg-gray-100 p-4 rounded-xl">
                  <Mail className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <Link
                    href="mailto:hello@yourcompany.com"
                    className="text-xs text-gray-600 hover:text-black transition"
                  >
                    hello@albitross.com
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="bg-gray-100 p-4 rounded-xl">
                  <Phone className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Phone</p>
                  <Link
                    href="tel:+15551234567"
                    className="text-xs text-gray-600 hover:text-black transition"
                  >
                    +254 (708) 822-212
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="bg-gray-100 p-4 rounded-xl">
                  <MapPin className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Location</p>
                  <p className="text-xs text-gray-600">
                    Riverside Square, 84 Riverside Dr, Nairobi<br />
                    Kenya
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Typical Response Time
              </h2>
              <p className="text-xs text-gray-600">
                We usually reply within 24 hours on business days.
                For urgent inquiries, feel free to call us directly.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-2xl p-10">
            <h2 className="text-xl font-bold text-gray-900 mb-8">
              Send Us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-xs font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  placeholder="Acme Insurance"
                />
              </div>

              <div>
                <label htmlFor="interest" className="block text-xs font-medium text-gray-700 mb-2">
                  I'm interested in
                </label>
                <select
                  id="interest"
                  name="interest"
                  value={form.interest}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                >
                  <option value="">Select an option</option>
                  <option value="fraud">Fraud Elimination Platform</option>
                  <option value="claims">Instant Claims Platform</option>
                  <option value="both">Both platforms</option>
                  <option value="demo">Request a demo</option>
                  <option value="other">Other / General inquiry</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={form.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none text-black"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>

            {/* Success Message */}
            {success && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-800">
                  Thank you! We'll get back to you within 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-16 px-6 bg-gray-900 text-white text-center">
        <h2 className="text-xl font-bold mb-4">
          Prefer to talk right away?
        </h2>
        <p className="text-xs text-gray-300 mb-8">
          Book a 15-minute intro call with our team.
        </p>
        <Link
          href="https://calendly.com/georgevallencia/30min" // Replace with your actual Calendly/SavvyCal link
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition"
        >
          Schedule a Call
        </Link>
      </section>
    </div>
  );
}