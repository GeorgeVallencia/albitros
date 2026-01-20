'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full bg-white fixed top-0 z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold tracking-tight text-black">Albitross</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-10">
          <Link 
            href="/#problem" 
            className="text-sm font-medium text-gray-700 hover:text-black transition"
          >
            Problem
          </Link>
          <Link 
            href="/#why"
            className="text-sm font-medium text-gray-700 hover:text-black transition"
          >
            Why Albitros
          </Link>
          <Link 
            href="/how-it-works" 
            className="text-sm font-medium text-gray-700 hover:text-black transition"
          >
            How It Works
          </Link>
          <Link 
            href="/#case-studies" 
            className="text-sm font-medium text-gray-700 hover:text-black transition"
          >
            Results
          </Link>
          <Link 
            href="/faq" 
            className="text-sm font-medium text-gray-700 hover:text-black transition"
          >
            FAQ
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link 
            href="/roi" 
            className="text-sm font-medium text-gray-700 hover:text-black transition"
          >
            ROI Calculator
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition"
          >
            Schedule a Demo
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-6 space-y-5">
          <Link 
            href="/#problem" 
            className="block text-base font-medium text-gray-700 hover:text-black"
            onClick={() => setMobileOpen(false)}
          >
            Problem
          </Link>
          <Link 
            href="/#why"
            className="block text-base font-medium text-gray-700 hover:text-black"
            onClick={() => setMobileOpen(false)}
          >
            Why Albitros
          </Link>
          <Link 
            href="/how-it-works" 
            className="block text-base font-medium text-gray-700 hover:text-black"
            onClick={() => setMobileOpen(false)}
          >
            How It Works
          </Link>
          <Link 
            href="/#case-studies" 
            className="block text-base font-medium text-gray-700 hover:text-black"
            onClick={() => setMobileOpen(false)}
          >
            Results
          </Link>
          <Link 
            href="/faq" 
            className="block text-base font-medium text-gray-700 hover:text-black"
            onClick={() => setMobileOpen(false)}
          >
            FAQ
          </Link>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            <Link 
              href="/roi" 
              className="block text-base font-medium text-gray-700 hover:text-black"
              onClick={() => setMobileOpen(false)}
            >
              ROI Calculator
            </Link>
            <Link
              href="/contact"
              className="block w-full text-center px-5 py-3 bg-black text-white text-base font-medium rounded-lg hover:bg-gray-900 transition"
              onClick={() => setMobileOpen(false)}
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}