'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  Send,
  FileText,
  Calendar,
  Clock,
  IndianRupee,
  Loader2,
  ExternalLink,
  QrCode,
  Lock,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import OnboardingGuard, { useOnboarding } from '@/components/OnboardingGuard';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface BusinessDetails {
  name: string;
  logo: string;
  primaryColor: string;
  accentColor: string;
  currency: string;
  phone: string;
  email: string;
}

function InnerCreateSmartBill() {
  const router = useRouter();
  const { isOnboarded, isLoading } = useOnboarding();
  
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [billLink, setBillLink] = useState('');
  const [billId, setBillId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [merchantName, setMerchantName] = useState('');

  // ─── Load Merchant Data Automatically ──────────────────────────────
  const merchantData = getStoredMerchant();
  const defaultBusinessName = merchantData?.businessName || merchantData?.business_name || '';
  const defaultPhone = merchantData?.phone || merchantData?.settlement_phone || '';
  const defaultEmail = merchantData?.email || '';

  const [business, setBusiness] = useState<BusinessDetails>({
    name: defaultBusinessName,
    logo: '',
    primaryColor: '#10B981',
    accentColor: '#0A2540',
    currency: 'KES',
    phone: defaultPhone,
    email: defaultEmail,
  });

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 },
  ]);

  const [taxRate, setTaxRate] = useState(16);
  const [includeTax, setIncludeTax] = useState(true);
  const [expiryDays, setExpiryDays] = useState(7);

  // ─── Update business fields if merchant data changes ─────────────
  useEffect(() => {
    const freshData = getStoredMerchant();
    if (freshData) {
      setBusiness((prev) => ({
        ...prev,
        name: freshData.businessName || freshData.business_name || prev.name,
        phone: freshData.phone || freshData.settlement_phone || prev.phone,
        email: freshData.email || prev.email,
      }));
    }
  }, []);

  const updateCustomer = (field: keyof CustomerDetails, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: typeof value === 'string' ? value : Number(value) } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return includeTax ? (subtotal * taxRate) / 100 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const generateBill = async () => {
    const merchantData = getStoredMerchant();
    const merchantId = merchantData?.merchantId || merchantData?.merchant_id || '';
    const businessName = merchantData?.businessName || merchantData?.business_name || '';

    if (!merchantId) {
      alert('Please login to create a bill');
      return;
    }

    // ✅ Generate the return URL
    const returnUrl = `${window.location.origin}/dashboard/transactions`;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/bills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          businessName: business.name || businessName,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          items: items,
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          total: calculateTotal(),
          currency: business.currency,
          taxRate: taxRate,
          expiryDays: expiryDays,
          description: items.map(item => item.description).join(', '),
          returnUrl: returnUrl, 
        }),
      });

      const data = await response.json();

      if (data.success) {
        const link = `${window.location.origin}/bill/${data.data.bill_id}`;
        setBillLink(link);
        setBillId(data.data.bill_id);
        setGenerated(true);
        setCopied(false);
      } else {
        alert('Failed to generate bill: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to generate bill');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(billLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFormValid = customer.name && items.some((item) => item.description && item.unitPrice > 0);

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  // ─── ONBOARDING GUARD: BLOCK THE PAGE IF NOT FULLY ONBOARDED ────
  if (!isLoading && !isOnboarded) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Required</h2>
        <p className="text-gray-500 max-w-md mb-6">
          You need to complete your business details and settlement preferences before you can create bills.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          Go to Dashboard to Setup
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Smart Bill</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate a professional bill with a secure payment link for your customer.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/smart-bills')}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── LEFT: Form ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Business Details (Auto-Filled & Read-Only) */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Business Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={business.name}
                  readOnly
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={business.phone}
                  readOnly
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={business.email}
                  readOnly
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={business.primaryColor}
                    readOnly
                    className="w-10 h-10 rounded border border-gray-300 p-1 cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={business.primaryColor}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={business.currency}
                  disabled
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                >
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                  <option value="TZS">TZS - Tanzanian Shilling</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-indigo-500" />
              Customer Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => updateCustomer('name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => updateCustomer('email', e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => updateCustomer('phone', e.target.value)}
                    placeholder="0712345678"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) => updateCustomer('address', e.target.value)}
                    placeholder="Nairobi, Kenya"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Line Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="col-span-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                      min="1"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                      placeholder="Price"
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {business.currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Tax ({taxRate}%)</span>
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={includeTax}
                      onChange={(e) => setIncludeTax(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Include
                  </label>
                </div>
                <span className="font-medium text-gray-900">
                  {business.currency} {tax.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-800">Total</span>
                <span className="text-indigo-600">
                  {business.currency} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Expiry Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Expiry Settings
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires after (days)
              </label>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                min="1"
                max="90"
              />
              <p className="text-xs text-gray-400 mt-1">The bill will expire after the specified number of days.</p>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Preview & Actions ─────────────────────────────── */}
        <div className="space-y-6">
          {/* Preview Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-500" />
              Preview
            </h2>

            {!generated ? (
              <div className="text-center py-8 text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm">Fill in the details and click Generate</p>
                <p className="text-xs mt-1">A professional bill will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bill Preview */}
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200" style={{ borderColor: business.primaryColor }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: business.accentColor }}>
                        {business.name || 'Your Business'}
                      </h3>
                      <p className="text-xs text-gray-500">Smart Bill</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-gray-400">#{billId}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-medium text-gray-900">{customer.name}</span>
                    </div>
                    {customer.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="text-gray-900">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone</span>
                        <span className="text-gray-900">{customer.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="space-y-1 text-sm">
                      {items.map((item, index) => (
                        item.description && (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-600">{item.description} x{item.quantity}</span>
                            <span className="font-medium text-gray-900">
                              {business.currency} {(item.quantity * item.unitPrice).toFixed(2)}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{business.currency} {subtotal.toFixed(2)}</span>
                    </div>
                    {includeTax && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax ({taxRate}%)</span>
                        <span className="text-gray-900">{business.currency} {tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-1 border-t border-gray-200">
                      <span style={{ color: business.accentColor }}>Total</span>
                      <span style={{ color: business.primaryColor }}>
                        {business.currency} {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Pay Now Button */}
                  <button
                    onClick={() => {
                      window.open(billLink, '_blank');
                    }}
                    className="w-full mt-4 py-3 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: business.primaryColor }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Bill & Pay Now
                  </button>
                </div>

                {/* Shareable Link */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <p className="text-xs font-medium text-indigo-900 mb-2">Shareable Link</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={billLink}
                      readOnly
                      className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm text-gray-700 focus:outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copied && <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateBill}
            disabled={!isFormValid || isGenerating}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Bill
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            {!isFormValid && 'Please fill in customer name and at least one valid line item.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Wrap the page in the Onboarding Guard ──────────────────────────
export default function WrappedCreateSmartBill() {
  return (
    <OnboardingGuard>
      <InnerCreateSmartBill />
    </OnboardingGuard>
  );
}