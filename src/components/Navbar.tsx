'use client';

import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../media/logo.jpg';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ fullName: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      // User not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <nav className="w-full bg-white fixed top-0 z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={logo}
            alt="Albitros"
            width={120}
            height={32}
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {loading ? (
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
          ) : user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {getGreeting()}, {user.fullName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 hover:text-black transition flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
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
              <Link
                href="/roi"
                className="text-sm font-medium text-gray-700 hover:text-black transition"
              >
                ROI Calculator
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-black transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Sign Up
              </Link>
            </>
          )}
          <Link
            href="/roi"
            className="text-sm font-medium text-gray-700 hover:text-black transition"
          >
            ROI Calculator
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
            className="block text-base font-medium text-black hover:text-gray-700"
            onClick={() => setMobileOpen(false)}
          >
            Problem
          </Link>
          <Link
            href="/#why"
            className="block text-base font-medium text-black hover:text-gray-700"
            onClick={() => setMobileOpen(false)}
          >
            Why Albitros
          </Link>
          <Link
            href="/how-it-works"
            className="block text-base font-medium text-black hover:text-gray-700"
            onClick={() => setMobileOpen(false)}
          >
            How It Works
          </Link>
          <Link
            href="/#case-studies"
            className="block text-base font-medium text-black hover:text-gray-700"
            onClick={() => setMobileOpen(false)}
          >
            Results
          </Link>
          <Link
            href="/faq"
            className="block text-base font-medium text-black hover:text-gray-700"
            onClick={() => setMobileOpen(false)}
          >
            FAQ
          </Link>
          <Link
            href="/roi"
            className="block text-base font-medium text-black hover:text-gray-700"
            onClick={() => setMobileOpen(false)}
          >
            ROI Calculator
          </Link>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            <Link
              href="/#problem"
              className="block text-base font-medium text-black hover:text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              Problem
            </Link>
            <Link
              href="/#why"
              className="block text-base font-medium text-black hover:text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              Why Albitros
            </Link>
            <Link
              href="/how-it-works"
              className="block text-base font-medium text-black hover:text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/#case-studies"
              className="block text-base font-medium text-black hover:text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              Results
            </Link>
            <Link
              href="/faq"
              className="block text-base font-medium text-black hover:text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/roi"
              className="block text-base font-medium text-black hover:text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              ROI Calculator
            </Link>

            <div className="pt-4 border-t border-gray-200 space-y-4">
              {loading ? (
                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
              ) : user ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getGreeting()}, {user.fullName}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-base font-medium text-gray-700 hover:text-black w-full"
                  >
                    <LogOut className="w-4 h-4 cursor-pointer" />
                    <span>Logout</span>
                  </button>
                  <Link
                    href="/roi"
                    className="block text-base font-medium text-black hover:text-gray-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    ROI Calculator
                  </Link>
                </div>
              ) : (
                <div>
                  <Link
                    href="/login"
                    className="block text-base font-medium text-black hover:text-gray-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-base font-medium text-black hover:text-gray-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
