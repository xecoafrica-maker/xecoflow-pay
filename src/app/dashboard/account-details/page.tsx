// src/app/dashboard/account-settings/page.tsx
'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Copy,
  Check,
  Shield,
  Smartphone,
  Clock,
  AlertCircle,
  Settings,
  Key,
  Users,
  Globe,
  Bell,
  Lock,
  ChevronRight,
  LogOut,
  CreditCard,
  Wallet,
  Eye,
  EyeOff,
} from 'lucide-react';

// ─── Mock Account Data ─────────────────────────────────────────────
const accountData = {
  profile: {
    name: 'SAMUEL CHAGA',
    email: 'samtext454@gmail.com',
    phone: '+254 712 345 678',
    role: 'Merchant',
    avatar: 'SC',
  },
  business: {
    name: 'Jojean Furniture',
    accountNumber: '25336587XXXXX789',
    status: 'VERIFIED',
    businessType: 'Sole Proprietorship',
    registrationDate: '2026-01-15',
  },
  settlement: {
    payoutMethod: 'M-Pesa Express / B2C',
    destination: '0712345678',
    schedule: 'Nightly at 12:00 AM EAT',
    businessEmail: 'info@jojeanfurniture.com',
    businessPhone: '0712345678',
  },
};

export default function AccountSettingsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* ─── Content Area ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="space-y-8">
          {/* ─── Profile Section ────────────────────────────────────── */}
          <div id="profile">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Profile
            </h2>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {accountData.profile.avatar}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{accountData.profile.name}</h3>
                <p className="text-sm text-gray-500">{accountData.profile.role}</p>
                <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  Change Avatar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={accountData.profile.name}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={accountData.profile.email}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={accountData.profile.phone}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={accountData.profile.role}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  disabled
                />
              </div>
            </div>
            <button className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
              Save Changes
            </button>
          </div>

          <div className="border-t border-gray-200" />

          {/* ─── Contact Section ────────────────────────────────────── */}
          <div id="contact">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-indigo-500" />
              Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                <input
                  type="email"
                  value={accountData.settlement.businessEmail}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                <input
                  type="tel"
                  value={accountData.settlement.businessPhone}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="Enter your business address"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>
            <button className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
              Update Contact Details
            </button>
          </div>

          <div className="border-t border-gray-200" />

          {/* ─── Accounts Section ───────────────────────────────────── */}
          <div id="accounts">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-500" />
              Accounts
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">Business Account</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Shield className="w-3 h-3" />
                  {accountData.business.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Account Name</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{accountData.business.name}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Account Number</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono font-semibold text-gray-900">{accountData.business.accountNumber}</span>
                    <button
                      onClick={() => copyToClipboard(accountData.business.accountNumber, 'account')}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copied === 'account' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Business Type</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{accountData.business.businessType}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Registration Date</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(accountData.business.registrationDate).toLocaleDateString('en-KE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Settlement Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Payout Method</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{accountData.settlement.payoutMethod}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Destination</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-900">{accountData.settlement.destination}</span>
                    <button
                      onClick={() => copyToClipboard(accountData.settlement.destination, 'destination')}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copied === 'destination' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Registered Owner Wallet</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Settlement Schedule</label>
                  <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {accountData.settlement.schedule}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Settlements are processed nightly. Ensure your M-PESA number is registered and active.</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* ─── Preferences Section ────────────────────────────────── */}
          <div id="preferences">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Preferences
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <h4 className="font-medium text-gray-900 mb-4">Notification Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive transaction alerts via email</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
                    <p className="text-xs text-gray-500">Receive transaction alerts via SMS</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Push Notifications</p>
                    <p className="text-xs text-gray-500">Receive alerts in-app</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <h4 className="font-medium text-gray-900 mb-4">Security Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Password</p>
                    <p className="text-xs text-gray-500">Last changed 30 days ago</p>
                  </div>
                  <button className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-all">
                    Change
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Language & Region</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none">
                    <option>English (US)</option>
                    <option>Swahili</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none">
                    <option>KES - Kenyan Shilling</option>
                    <option>USD - US Dollar</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* ─── Team Section ───────────────────────────────────────── */}
          <div id="team">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Team
            </h2>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">Manage who has access to your account</p>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
                + Add Member
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                    SC
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">SAMUEL CHAGA</p>
                    <p className="text-xs text-gray-500">samtext454@gmail.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Owner
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                    JM
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Jane Mwangi</p>
                    <p className="text-xs text-gray-500">jane@example.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  Admin
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm">
                    PK
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Peter Kariuki</p>
                    <p className="text-xs text-gray-500">peter@example.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                  Viewer
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* ─── API Keys & Webhooks Section ───────────────────────── */}
          <div id="api-keys">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" />
              API Keys & Webhooks
            </h2>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">Manage your API keys and webhook endpoints</p>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
                + Generate API Key
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Live API Key</p>
                  <p className="text-xs text-gray-500 font-mono">sk_live_••••••••••••••••••••••••</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Test API Key</p>
                  <p className="text-xs text-gray-500 font-mono">sk_test_••••••••••••••••••••••••</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Webhook Endpoint</p>
                  <p className="text-xs text-gray-500 font-mono">https://api.jojeanfurniture.com/webhook</p>
                </div>
                <button className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-all">
                  Edit
                </button>
              </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Security Notice</p>
                  <p className="text-xs text-amber-700 mt-1">Never share your API keys. Rotate them regularly for security.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* ─── Sign Out ───────────────────────────────────────────── */}
          <div>
            <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}