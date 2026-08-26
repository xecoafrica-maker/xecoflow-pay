'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Link2,
  Loader2,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const merchant = getStoredMerchant();

  // Basic Information
  const [title, setTitle] = useState('');
  const [amountType, setAmountType] = useState<'fixed' | 'custom'>('fixed');
  const [amount, setAmount] = useState('');

  // Optional pre-fill (specific buyer) — leave blank for public link
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Optional
  const [reference, setReference] = useState('');
  const [channel, setChannel] = useState('');
  const [expiry, setExpiry] = useState('never');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const isValid =
    title.trim().length > 0 &&
    (amountType === 'custom' || (amount && Number(amount) > 0));

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Page title is required');
      return;
    }
    if (amountType === 'fixed' && (!amount || Number(amount) <= 0)) {
      setError('Enter a valid fixed amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const merchantId = merchant?.merchant_id || merchant?.merchantId;
      
      const res = await fetch('/v1/product-links', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: merchantId,
          businessName: merchant?.business_name || merchant?.businessName || 'XecoFlow Store',
          name: title.trim(),
          price: amountType === 'fixed' ? Number(amount) : 0,
          currency: 'KES',
          description: title.trim(),
          fileUrl: '',
          fileName: '',
          redirectUrl: '',
          linkType: 'payment',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate link');

      const slug = data.data?.slug || data.data?.description;
      const url = `${window.location.origin}/pay/${slug}`;
      setLink(url);
      
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const reset = () => {
    setLink('');
    setTitle('');
    setAmountType('fixed');
    setAmount('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setReference('');
    setChannel('');
    setExpiry('never');
    setShowAdvanced(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/smart-bills/pages')}
          className="text-[13px] text-gray-500 hover:text-gray-800 flex items-center gap-1.5 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Payment links
        </button>
        <h1 className="text-2xl font-semibold text-[#0a2540] tracking-tight">
          Create Payment Link
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a payment link for invoices, donations, and services
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {link ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <p className="text-sm font-medium text-[#0a2540] mb-3">Your payment link</p>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <input
              readOnly
              value={link}
              className="flex-1 min-w-0 bg-transparent text-[13px] text-gray-700 outline-none"
            />
            <button
              onClick={copyLink}
              className="shrink-0 p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-600 font-medium mt-2">Copied to clipboard</p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => window.open(link, '_blank')}
              className="px-4 py-2.5 bg-[#0a2540] hover:bg-[#152a45] text-white rounded-xl text-sm font-medium"
            >
              Open link
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700"
            >
              Create another
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ── Basic Information ── */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-[15px] font-semibold text-[#0a2540]">
                Basic Information
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Core setup for this payment link</p>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Page title */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Link name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Invoice #001, Donation, Consultation Fee"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Shown as the main heading on the buyer's payment screen
                </p>
              </div>

              {/* Amount type */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Amount type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAmountType('fixed')}
                    className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                      amountType === 'fixed'
                        ? 'border-[#635bff] bg-[#635bff]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#0a2540]">Fixed amount</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      You set a specific price
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountType('custom')}
                    className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                      amountType === 'custom'
                        ? 'border-[#635bff] bg-[#635bff]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#0a2540]">Custom amount</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Customer enters the amount
                    </p>
                  </button>
                </div>
              </div>

              {/* Fixed amount value */}
              {amountType === 'fixed' && (
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Amount (KES) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-gray-400">
                      KES
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="500.00"
                      min={1}
                      step="0.01"
                      className="w-full h-11 pl-14 pr-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Buyer details (optional pre-fill) ── */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-[15px] font-semibold text-[#0a2540]">
                Buyer details
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Pre-fill if sending to a specific buyer — or leave blank for a public link
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Email <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                />
              </div>
            </div>
          </section>

          {/* ── Advanced ── */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left"
            >
              <div>
                <h2 className="text-[15px] font-semibold text-[#0a2540]">Advanced options</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Reference, channel, and link expiry
                </p>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-5 sm:px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Reference <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Invoice number or order ID"
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      Payment channel{' '}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                    >
                      <option value="">Use default</option>
                      <option value="mpesa">M-PESA</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      Link expiry
                    </label>
                    <select
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                    >
                      <option value="never">Never expires</option>
                      <option value="1h">1 hour</option>
                      <option value="24h">24 hours</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </section>

          <button
            onClick={handleGenerate}
            disabled={!isValid || loading}
            className="w-full h-12 bg-[#0a2540] hover:bg-[#152a45] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Generate Payment Link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}