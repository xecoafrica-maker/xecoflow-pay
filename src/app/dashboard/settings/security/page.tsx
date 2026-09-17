// src/app/dashboard/settings/security/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Monitor,
  LogOut,
  AlertCircle,
  KeyRound,
  Clock,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import SettingsTabs from '@/components/settings/SettingsTabs';

// ─── Question Bank ─────────────────────────────────────────────────
const QUESTION_BANK = [
  'What was the name of your first primary school teacher?',
  'What was the make of your first car?',
  'In what city were you born?',
  'What was your childhood nickname?',
  'What was the name of your favourite childhood friend?',
  'What was the name of your first pet?',
  'What street did you live on during your childhood?',
  'What was your favourite subject in school?',
  'What is the name of the town where your parents first met?',
  'What was the name of your first employer?',
];

interface QAPair {
  question: string;
  answer: string;
}

const EMPTY: QAPair[] = [
  { question: '', answer: '' },
  { question: '', answer: '' },
  { question: '', answer: '' },
];

// ─── Section Card Wrapper ─────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
            <Icon className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-[12px] text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────
function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
}) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default function SecuritySettingsPage() {
  const router = useRouter();

  // ─── Password Section State ──────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  // ─── 2FA State ───────────────────────────────────────────────────
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);

  // ─── Recovery Questions State ────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [pairs, setPairs] = useState<QAPair[]>(EMPTY);
  const [showAnswers, setShowAnswers] = useState<boolean[]>([false, false, false]);
  const [alreadySetUp, setAlreadySetUp] = useState(false);

  // ─── Sessions State ──────────────────────────────────────────────
  const [sessions, setSessions] = useState<
    Array<{ id: string; device: string; location: string; lastActive: string; current: boolean }>
  >([
    {
      id: 'current',
      device: 'Chrome · Windows',
      location: 'Nairobi, KE',
      lastActive: 'Active now',
      current: true,
    },
  ]);

  // ─── Load Recovery Questions ─────────────────────────────────────
  useEffect(() => {
    // ✅ EXACT same pattern as Withdraw Funds page
    const cached = getStoredMerchant();
    const id = cached?.merchant_id || cached?.merchantId;
    const token = getToken();

    // ✅ Only redirect if BOTH token and merchant are missing
    if (!token || !id) {
      console.warn('⚠️ Missing session, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(
          `/api/security-questions?merchantId=${id}`,
          {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // ✅ Only logout on explicit 401
        if (res.status === 401) {
          router.push('/login?session=expired');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (
            data.success &&
            Array.isArray(data.data) &&
            data.data.length === 3
          ) {
            setAlreadySetUp(true);
            setPairs(
              data.data.map((q: any) => ({
                question: q.question || '',
                answer: '',
              }))
            );
          }
        }
      } catch {
        // Silent — network glitch shouldn't kill the page
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  // ─── Password Handler ────────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setPwError('New password must be different from current password');
      return;
    }

    setPwSaving(true);

    try {
      // ✅ Same session check as Withdraw page
      const token = getToken();
      const cached = getStoredMerchant();
      const id = cached?.merchant_id || cached?.merchantId;

      if (!token || !id) {
        router.push('/login?session=expired');
        return;
      }

      // TODO: wire to real endpoint when ready
      // const res = await fetch('/v1/auth/change-password', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ currentPassword, newPassword }),
      // });
      await new Promise((r) => setTimeout(r, 800));

      setPwSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  // ─── 2FA Handler ─────────────────────────────────────────────────
  const handleToggle2FA = async () => {
    setTwoFALoading(true);
    try {
      // TODO: wire to real endpoint when ready
      await new Promise((r) => setTimeout(r, 600));
      setTwoFAEnabled((v) => !v);
    } finally {
      setTwoFALoading(false);
    }
  };

  // ─── Recovery Questions Handlers ─────────────────────────────────
  const updateQuestion = (index: number, value: string) => {
    setPairs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, question: value } : p))
    );
    setSaved(false);
    setError('');
  };

  const updateAnswer = (index: number, value: string) => {
    setPairs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, answer: value } : p))
    );
    setSaved(false);
    setError('');
  };

  const toggleShowAnswer = (index: number) => {
    setShowAnswers((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    // ✅ Same session check as Withdraw page
    const cached = getStoredMerchant();
    const id = cached?.merchant_id || cached?.merchantId;
    const token = getToken();

    if (!token || !id) {
      router.push('/login?session=expired');
      return;
    }

    for (let i = 0; i < 3; i++) {
      if (!pairs[i].question) {
        setError(`Please choose a question for #${i + 1}`);
        return;
      }
      if (!pairs[i].answer.trim() || pairs[i].answer.trim().length < 2) {
        setError(`Please provide an answer for #${i + 1}`);
        return;
      }
    }

    const seen = new Set<string>();
    for (const p of pairs) {
      const key = p.question.trim().toLowerCase();
      if (seen.has(key)) {
        setError('All 3 questions must be different.');
        return;
      }
      seen.add(key);
    }

    setSaving(true);

    try {
      const res = await fetch('/api/security-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ merchantId: id, questions: pairs }),
      });

      // ✅ Only logout on explicit 401
      if (res.status === 401) {
        router.push('/login?session=expired');
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || data.message || 'Failed to save recovery questions'
        );
      }

      setSaved(true);
      setAlreadySetUp(true);
      setPairs((prev) => prev.map((p) => ({ ...p, answer: '' })));

      sessionStorage.removeItem('security_banner_checked');
      sessionStorage.removeItem('security_banner_result');

      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Session Handlers ────────────────────────────────────────────
  const handleSignOutSession = async (id: string) => {
    // TODO: wire to real endpoint
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSignOutAllOthers = async () => {
    // TODO: wire to real endpoint
    setSessions((prev) => prev.filter((s) => s.current));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
            Security & Access
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage your password, two-factor authentication, recovery, and active sessions.
          </p>
        </div>
      </div>

      {/* ─── Settings Tabs ─────────────────────────────────────────── */}
      <SettingsTabs />

      {/* ─── 1. Password ────────────────────────────────────────────── */}
      <SectionCard
        icon={Lock}
        title="Password"
        description="Use a strong password you don't use anywhere else."
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[12px] p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {pwError}
            </div>
          )}

          {pwSaved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] p-2.5 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              Password updated successfully.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {pwSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ─── 2. Two-Factor Authentication ───────────────────────────── */}
      <SectionCard
        icon={Smartphone}
        title="Two-Factor Authentication"
        description="Add an extra layer of security by requiring a code when you sign in."
        action={
          <Badge tone={twoFAEnabled ? 'success' : 'neutral'}>
            {twoFAEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg shrink-0">
              <MessageSquare className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-900">
                Authenticator or SMS
              </p>
              <p className="text-[12px] text-gray-500 mt-0.5">
                {twoFAEnabled
                  ? 'Your account is protected with 2FA.'
                  : 'Strongly recommended for accounts with withdrawals enabled.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggle2FA}
            disabled={twoFALoading}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shrink-0 flex items-center gap-2 ${
              twoFAEnabled
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } disabled:opacity-70`}
          >
            {twoFALoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Please wait...
              </>
            ) : twoFAEnabled ? (
              'Disable 2FA'
            ) : (
              'Enable 2FA'
            )}
          </button>
        </div>
      </SectionCard>

      {/* ─── 3. Account Recovery ────────────────────────────────────── */}
      <SectionCard
        icon={ShieldCheck}
        title="Account Recovery"
        description="Set 3 security questions. If you forget your password, we'll use them to confirm you're the real owner."
        action={
          alreadySetUp ? (
            <Badge tone="success">Set up</Badge>
          ) : (
            <Badge tone="warning">Not set up</Badge>
          )
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="text-[12px] text-gray-500 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-3">
              Answers are <strong className="text-gray-700">case-insensitive</strong> and
              stored <strong className="text-gray-700">securely hashed</strong> — nobody,
              including us, can read them.
            </div>

            {alreadySetUp && !saved && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] p-2.5 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Recovery is already set up. You can replace it below.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-[12px] p-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {saved && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] p-2.5 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Recovery questions saved.
              </div>
            )}

            <div className="space-y-5">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="space-y-3 pb-5 border-b border-gray-100 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <label className="text-[12px] font-medium text-gray-700">
                      Question {index + 1}
                    </label>
                  </div>

                  <select
                    value={pairs[index].question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    required
                  >
                    <option value="">Choose a question…</option>
                    {QUESTION_BANK.map((q) => (
                      <option
                        key={q}
                        value={q}
                        disabled={pairs.some(
                          (p, i) => i !== index && p.question === q
                        )}
                      >
                        {q}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <input
                      type={showAnswers[index] ? 'text' : 'password'}
                      value={pairs[index].answer}
                      onChange={(e) => updateAnswer(index, e.target.value)}
                      placeholder="Your answer"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 pr-12 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowAnswer(index)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      aria-label={showAnswers[index] ? 'Hide answer' : 'Show answer'}
                    >
                      {showAnswers[index] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {alreadySetUp
                      ? 'Replace Recovery Questions'
                      : 'Save Recovery Questions'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      {/* ─── 4. Active Sessions ─────────────────────────────────────── */}
      <SectionCard
        icon={Monitor}
        title="Active Sessions"
        description="Devices currently signed in to your account."
        action={
          sessions.length > 1 ? (
            <button
              type="button"
              onClick={handleSignOutAllOthers}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out Others
            </button>
          ) : null
        }
      >
        <div className="divide-y divide-gray-100">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-gray-900">
                      {s.device}
                    </p>
                    {s.current && <Badge tone="success">This device</Badge>}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {s.location} · {s.lastActive}
                  </p>
                </div>
              </div>
              {!s.current && (
                <button
                  type="button"
                  onClick={() => handleSignOutSession(s.id)}
                  className="text-[12px] font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  Sign out
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ─── 5. Recent Login Activity ───────────────────────────────── */}
      <SectionCard
        icon={Clock}
        title="Recent Login Activity"
        description="Last few sign-ins to your account."
        action={
          <button
            type="button"
            onClick={() => router.push('/dashboard/activity-logs')}
            className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="divide-y divide-gray-100">
          {[
            {
              device: 'Chrome · Windows',
              location: 'Nairobi, KE',
              time: 'Today, 10:24 AM',
              status: 'Success',
            },
            {
              device: 'Safari · iPhone',
              location: 'Nairobi, KE',
              time: 'Yesterday, 6:12 PM',
              status: 'Success',
            },
            {
              device: 'Chrome · Windows',
              location: 'Nairobi, KE',
              time: '3 days ago',
              status: 'Success',
            },
          ].map((log, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-[13px] font-medium text-gray-900">
                  {log.device}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {log.location} · {log.time}
                </p>
              </div>
              <Badge tone="success">{log.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}