import Link from "next/link";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
            Get in Touch
          </h1>
          <p className="mt-8 text-xl text-gray-600 max-w-3xl mx-auto">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
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
                    className="text-lg text-gray-600 hover:text-black transition"
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
                    className="text-lg text-gray-600 hover:text-black transition"
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
                  <p className="text-lg text-gray-600">
                    Riverside Square, 84 Riverside Dr, Nairobi<br />
                    Kenya
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Typical Response Time
              </h3>
              <p className="text-gray-600">
                We usually reply within 24 hours on business days. 
                For urgent inquiries, feel free to call us directly.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-2xl p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Send Us a Message
            </h2>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Acme Insurance"
                />
              </div>

              <div>
                <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-2">
                  I'm interested in
                </label>
                <select
                  id="interest"
                  name="interest"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>

            {/* Success Message (hidden by default – show with JS on submit) */}
            <div className="hidden mt-8 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-800">
                Thank you! We'll get back to you within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-16 px-6 bg-gray-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">
          Prefer to talk right away?
        </h2>
        <p className="text-xl text-gray-300 mb-8">
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