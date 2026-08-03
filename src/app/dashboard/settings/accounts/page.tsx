'use client';

import { useState } from 'react';
import {
  Wallet,
  Building2,
  Shield,
  Smartphone,
  Clock,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

const accountData = {
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
  },
};

export default function AccountsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500">Manage your business and settlement accounts</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
    </div>
  );
}