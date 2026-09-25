// src/app/dashboard/settings/security/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
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
  const { user, loading: sessionLoading } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [pairs, setPairs] = useState<QAPair[]>(EMPTY);
  const [showAnswers, setShowAnswers] = useState<boolean[]>([false, false, false]);
  const [alreadySetUp, setAlreadySetUp] = useState(false);

  // ─── Load existing questions (only once session is ready) ────────
  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/security-questions/list', {
        credentials: 'include',
        cache: 'no-store',
      });

      // 401 means the session expired — useSession will redirect.
      if (res.status === 401) {
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
            data.data.map((q: { question: string }) => ({
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
  }, []);

  useEffect(() => {
    if (!sessionLoading && user?.merchantId) {
      loadQuestions();
    } else if (!sessionLoading && !user) {
      // useSession is already redirecting; just stop the spinner.
      setLoading(false);
    }
  }, [sessionLoading, user?.merchantId, loadQuestions]);

  // ─── Handlers ────────────────────────────────────────────────────
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
      const res = await fetch('/api/security-questions/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questions: pairs }),
      });

      if (res.status === 401) {
        return; // useSession will redirect
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
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Session loading screen ──────────────────────────────────────
  if (sessionLoading || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return null; // useSession redirects
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
            Security &amp; Access
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Set up recovery questions to protect your account.
          </p>
        </div>
      </div>

      {/* ─── Settings Tabs ─────────────────────────────────────────── */}
      <SettingsTabs />

      {/* ─── Account Recovery ───────────────────────────────────────── */}
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
        <form onSubmit={handleSave} className="space-y-5">
          <div className="text-[12px] text-gray-500 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-3">
            Answers are{' '}
            <strong className="text-gray-700">case-insensitive</strong> and
            stored <strong className="text-gray-700">securely hashed</strong> —
            nobody, including us, can read them.
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
                    aria-label={
                      showAnswers[index] ? 'Hide answer' : 'Show answer'
                    }
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
      </SectionCard>
    </div>
  );
}