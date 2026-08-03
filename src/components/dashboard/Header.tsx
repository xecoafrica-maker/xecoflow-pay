// src/components/dashboard/Header.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
  Shield,
  UserCircle,
} from 'lucide-react';
import { getStoredMerchant, removeToken } from '@/lib/auth';

export default function DashboardHeader() {
  const router = useRouter();
  const [merchantName, setMerchantName] = useState('Merchant');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredMerchant();
    if (stored?.businessName) {
      setMerchantName(stored.businessName);
    } else if (stored?.business_name) {
      setMerchantName(stored.business_name);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
    setShowDropdown(false);
  };

  const handleProfile = () => {
    router.push('/dashboard/settings/profile');
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#071526] border-b border-[#11243d]">
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            Xeco<span className="text-emerald-400">Flow</span>
          </span>
        </Link>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search transactions, customers..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Alerts */}
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                {merchantName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white truncate max-w-[120px]">
                  {merchantName}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                showDropdown ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0f1f33] border border-[#1a2a4a] rounded-xl shadow-2xl py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1a2a4a]">
                  <p className="text-sm font-medium text-white">{merchantName}</p>
                  <p className="text-xs text-slate-400 truncate">Admin Account</p>
                </div>

                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </button>

                <button
                  onClick={() => router.push('/dashboard/settings')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <button
                  onClick={() => router.push('/dashboard/security')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Security
                </button>

                <div className="border-t border-[#1a2a4a] my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}