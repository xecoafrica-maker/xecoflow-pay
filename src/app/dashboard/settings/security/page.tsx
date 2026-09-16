'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';

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

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [pairs, setPairs] = useState<QAPair[]>(EMPTY);
  const [showAnswers, setShowAnswers] = useState<boolean[]>([false, false, false]);
  const [alreadySetUp, setAlreadySetUp] = useState(false);

  useEffect(() => {
    const cached = getStoredMerchant();
    const merchantId = cached?.merchant_id || cached?.merchantId;

    if (!merchantId) {
      router.push('/login?session=expired');
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(
          `/api/security-questions?merchantId=${merchantId}`,
          { credentials: 'include' }
        );

        if (res.status === 401) {
          router.push('/login?session=expired');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length === 3) {
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
        // Silent — page just shows empty form
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

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

    const cached = getStoredMerchant();
    const merchantId = cached?.merchant_id || cached?.merchantId;

    if (!merchantId) {
      router.push('/login?session=expired');
      return;
    }

    // Validate all 3 filled
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

    // Ensure unique questions
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ merchantId, questions: pairs }),
      });

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

      // Clear the banner cache so it disappears immediately
      sessionStorage.removeItem('security_banner_checked');
      sessionStorage.removeItem('security_banner_result');

      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Recovery</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up 3 security questions. If you ever forget your password, we&apos;ll use
            them to confirm you&apos;re the real owner of this account.
          </p>
        </div>
      </div>

      {alreadySetUp && !saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>
            Account recovery is already set up. You can replace it below if you wish.
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Recovery questions saved. Returning to dashboard...</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6"
      >
        <div className="text-sm text-gray-500 leading-relaxed">
          Answers are{' '}
          <strong className="text-gray-700">case-insensitive</strong> and stored{' '}
          <strong className="text-gray-700">securely hashed</strong> — nobody,
          including us, can read them. Choose answers you&apos;ll remember but that
          others are unlikely to know or find online.
        </div>

        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="space-y-3 pb-5 border-b border-gray-100 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold flex items-center justify-center">
                {index + 1}
              </span>
              <label className="text-sm font-medium text-gray-700">
                Question {index + 1}
              </label>
            </div>

            <select
              value={pairs[index].question}
              onChange={(e) => updateQuestion(index, e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            >
              <option value="">Choose a question…</option>
              {QUESTION_BANK.map((q) => (
                <option
                  key={q}
                  value={q}
                  disabled={pairs.some((p, i) => i !== index && p.question === q)}
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
                className="w-full px-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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

        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {alreadySetUp ? 'Replace recovery questions' : 'Save recovery questions'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}