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
import { getApiCredentials, getMerchantProfile, getApiSecret } from '@/lib/auth-api';

export default function DevelopersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('https://api.acme.com/webhooks/xecoflow');

  // Real data state
  const [merchantId, setMerchantId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [baseEndpoint] = useState('https://xecoflow-2gen.onrender.com/v1/payments');

  // Modal state
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [secretError, setSecretError] = useState('');
  const [fetchingSecret, setFetchingSecret] = useState(false);

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

    getMerchantProfile(token)
      .then((profile) => {
        if (profile?.merchant_id) {
          setMerchantId(String(profile.merchant_id));
          localStorage.setItem('merchant', JSON.stringify(profile));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch profile:', err);
        if (err.message.includes('401')) {
          removeToken();
          router.push('/login');
        }
      });

    getApiCredentials(token)
      .then((data) => {
        setApiKey(data.apiKey);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch credentials:', err);
        if (err.message.includes('401')) {
          removeToken();
          router.push('/login');
        } else {
          setLoading(false);
        }
      });
  }, [router]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevealSecret = () => {
    setShowSecretModal(true);
    setPasswordInput('');
    setSecretError('');
  };

  const handleVerifyPassword = async () => {
    const token = getToken();
    if (!token) return;
    setFetchingSecret(true);
    setSecretError('');
    try {
      const result = await getApiSecret(token, passwordInput);
      setApiSecret(result.secret);
      setShowSecret(true);
      setShowSecretModal(false);
    } catch (err: any) {
      setSecretError(err.message || 'Failed to verify password');
    } finally {
      setFetchingSecret(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const displaySecret = showSecret && apiSecret ? apiSecret : '••••••••••••••••••••••••••••••••';

  return (
    <>
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
                  {showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}
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
                  onClick={handleRevealSecret}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Reveal secret (requires password)"
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
                <span>
                  Click the eye icon to reveal the secret – you will be prompted for your login password.
                </span>
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
            </div>

            <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
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

      {/* ─── Secret Reveal Modal ────────────────────────────────────── */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Reveal API Secret</h3>
                <button
                  onClick={() => setShowSecretModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enter your login password to view the API secret.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Enter your password"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                />
                {secretError && (
                  <p className="mt-2 text-sm text-red-600">{secretError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSecretModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPassword}
                  disabled={fetchingSecret || !passwordInput}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                    fetchingSecret || !passwordInput
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {fetchingSecret ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}