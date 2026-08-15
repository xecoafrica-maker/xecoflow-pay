// src/app/dashboard/developers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Webhook,
  ExternalLink,
  AlertCircle,
  Building2,
  Shield,
  X,
} from 'lucide-react';
import { getToken, getStoredMerchant, removeToken } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

// ─── Types ──────────────────────────────────────────────────────────
interface ApiKeyData {
  merchant_id: number;
  api_key: string;
  api_secret: string;
  is_active: boolean;
}

export default function DevelopersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Real data state
  const [merchantId, setMerchantId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('••••••••••••••••••••••••••••••••');
  const [apiSecret, setApiSecret] = useState<string>('••••••••••••••••••••••••••••••••');
  const [baseEndpoint] = useState('https://xecoflow-2gen.onrender.com/v1/payments');

  // ─── Fetch API Keys ──────────────────────────────────────────────
  const fetchApiKeys = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/v1/auth/api-keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          removeToken();
          router.push('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setApiKey(data.data.api_key || '••••••••••••••••••••••••••••••••');
        setApiSecret(data.data.api_secret || '••••••••••••••••••••••••••••••••');
        setMerchantId(String(data.data.merchant_id || ''));
        setWebhookUrl(data.data.webhook_url || '');
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Load Data ──────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const cached = getStoredMerchant();
    if (cached) {
      const id = cached.merchantId || cached.merchant_id;
      if (id) setMerchantId(String(id));
    }

    fetchApiKeys();
  }, [router]);

  // ─── Copy to Clipboard ──────────────────────────────────────────
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ─── Save Webhook ───────────────────────────────────────────────
  const saveWebhook = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/v1/auth/webhook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhookUrl })
      });

      if (response.ok) {
        alert('Webhook saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save webhook:', error);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // ─── Display Values ─────────────────────────────────────────────
  const displaySecret = showSecret ? apiSecret : '••••••••••••••••••••••••••••••••';
  const displayApiKey = showApiKey ? apiKey : '••••••••••••••••••••••••••••••••';

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API & Webhooks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your API credentials and configure webhook endpoints for real‑time event notifications.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="#"
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1"
          >
            <ExternalLink size={16} />
            Documentation
          </a>
        </div>
      </div>

      {/* ─── Gateway Credentials ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900">Gateway Credentials</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Merchant ID</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1">
                {merchantId || '—'}
              </span>
              <button
                onClick={() => copyToClipboard(merchantId, 'shortcode')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy merchant ID"
              >
                {copied === 'shortcode' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Use this as the <code className="bg-gray-100 px-1 rounded">shortcode</code> field.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Base API Endpoint</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1 truncate">
                {baseEndpoint}
              </span>
              <button
                onClick={() => copyToClipboard(baseEndpoint, 'endpoint')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy endpoint"
              >
                {copied === 'endpoint' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Prepend to all API endpoints.</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>These credentials are generated during registration. Keep them secure.</span>
        </div>
      </div>

      {/* ─── API Key ────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900">API Key</h2>
          </div>
          <div className="text-xs text-gray-400">Used for authentication</div>
        </div>

        <div className="p-6">
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1 truncate">
                {displayApiKey}
              </span>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Toggle API key visibility"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => copyToClipboard(apiKey, 'apikey')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy API key"
              >
                {copied === 'apikey' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Include this key in the <code className="bg-amber-100 px-1 rounded">x-api-key</code> header.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── API Secret ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900">API Secret</h2>
          </div>
          <div className="text-xs text-gray-400">Used for signing requests</div>
        </div>

        <div className="p-6">
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1 truncate">
                {displaySecret}
              </span>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Toggle secret visibility"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {showSecret && (
                <button
                  onClick={() => copyToClipboard(apiSecret, 'apisecret')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy secret"
                >
                  {copied === 'apisecret' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Keep this secret safe. It is used to generate HMAC signatures for webhook verification.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Webhooks ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Webhook className="w-5 h-5 text-indigo-500" />
              Webhooks
            </h2>
            <p className="text-sm text-gray-500">
              Configure endpoints to receive real‑time event notifications.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Endpoint URL</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="https://your-domain.com/webhooks/xecoflow"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">We'll send POST requests to this URL for payment events.</p>
          </div>

          <button
            onClick={saveWebhook}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Save Webhook Settings
          </button>
        </div>
      </div>

      {/* ─── Security Best Practices ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900">Security Best Practices</h2>
        </div>
        <div className="p-6">
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
              <span>Never share your API key with anyone</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
              <span>Store keys in environment variables, not in code</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
              <span>Use HTTPS for all API requests</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
              <span>Validate callback signatures to prevent fraud</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}