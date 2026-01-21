
'use client';
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Link from "next/link";
import { Home, User, Settings, LogOut, Map, List, BarChart3, Shield, AlertTriangle } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Navbar */}
      {/* <Navbar /> */}
      <div className="flex flex-1 text-black overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg border-r flex flex-col">
          <div className="p-4 font-bold text-xl border-b flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            InsurMap
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="w-5 h-5" /> Dashboard
            </Link>
            <Link
              href="/dashboard/map"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Map className="w-5 h-5" /> Map View
            </Link>
            <Link
              href="/dashboard/properties"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <List className="w-5 h-5" /> Properties List
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <BarChart3 className="w-5 h-5" /> Analytics
            </Link>
            
            {/* Divider */}
            <div className="border-t my-4"></div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
              Account
            </div>
            
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <User className="w-5 h-5" /> Profile
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5" /> Settings
            </Link>
          </nav>
          
          {/* Risk Alert Section */}
          <div className="p-4 border-t bg-red-50">
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              High Risk Alert
            </div>
            <p className="text-xs text-red-600">
              3 properties need attention
            </p>
            <Link 
              href="/dashboard/map?filter=high-risk"
              className="text-xs text-red-700 underline hover:text-red-800"
            >
              View on map →
            </Link>
          </div>
          
          {/* Logout button */}
          <div className="p-4 border-t">
            <button className="flex items-center gap-2 text-red-600 p-2 w-full rounded-lg hover:bg-gray-100 transition-colors">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

