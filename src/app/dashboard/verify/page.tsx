'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  History,
  FileCheck2,
  Upload,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react';

type VerificationStatus =
  | 'idle'
  | 'verifying'
  | 'verified'
  | 'not_found'
  | 'error';

interface VerificationResult {
  businessName?: string;
  kraPin?: string;
  idNumber?: string;
  status: 'verified' | 'not_found';
  message?: string;
  reference?: string;
  verifiedAt?: string;
}

export default function XECOVerifyPage() {
  const router = useRouter();

  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  /*
   * Replace this function with your real GavaConnect API endpoint.
   *
   * IMPORTANT:
   * Do not call GavaConnect directly from the browser if your
   * credentials/API keys are private.
   *
   * Recommended:
   *
   * Browser
   *   ↓
   * /api/verify/kra
   *   ↓
   * Your backend
   *   ↓
   * GavaConnect
   */
  const handleVerify = async () => {
    const cleanedId = idNumber.trim();

    if (!cleanedId) {
      setStatus('error');
      setResult({
        status: 'not_found',
        message: 'Please enter a valid ID number.',
      });
      return;
    }

    setStatus('verifying');
    setResult(null);

    try {
      /*
       * TEMPORARY DEMO REQUEST
       *
       * Replace this with your actual endpoint:
       *
       * const response = await fetch('/api/verify/kra', {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({ idNumber: cleanedId }),
       * });
       *
       * const data = await response.json();
       */

      await new Promise((resolve) => setTimeout(resolve, 1200));

      /*
       * DEMO RESULT
       * Remove this section when connecting your real API.
       */
      setStatus('verified');

      setResult({
        businessName: 'Verification Result',
        kraPin: 'PENDING API RESPONSE',
        idNumber: cleanedId,
        status: 'verified',
        reference: `XV-${Date.now().toString().slice(-8)}`,
        verifiedAt: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error(error);

      setStatus('error');

      setResult({
        status: 'not_found',
        message:
          'We could not complete the verification. Please try again.',
      });
    }
  };

  const handleCopyReference = async () => {
    if (!result?.reference) return;

    await navigator.clipboard.writeText(result.reference);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleClear = () => {
    setIdNumber('');
    setResult(null);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* =========================================================
            PAGE HEADER
        ========================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft
                className="w-5 h-5 text-slate-600"
                aria-hidden="true"
              />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  XECO Verify
                </h1>

                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-semibold">
                  BUSINESS
                </span>
              </div>

              <p className="text-sm text-slate-500 mt-0.5">
                Verify business identity and KRA PIN information
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/verify/history')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>

        {/* =========================================================
            HERO / INTRO SECTION
        ========================================================= */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="p-5 md:p-7">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <ShieldCheck
                    className="w-6 h-6 text-teal-600"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Verify a business
                  </h2>

                  <p className="text-sm text-slate-500 mt-1 max-w-xl leading-6">
                    Check a business using its national ID number and retrieve
                    the available KRA PIN verification information.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Verification service available
              </div>
            </div>
          </div>

          {/* =========================================================
              VERIFICATION FORM SECTION
          ========================================================= */}
          <div className="border-t border-slate-100 bg-slate-50/70 p-5 md:p-7">
            <div className="max-w-3xl">

              <label
                htmlFor="idNumber"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                National ID Number
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <input
                    id="idNumber"
                    type="text"
                    inputMode="numeric"
                    value={idNumber}
                    onChange={(e) => {
                      setIdNumber(e.target.value);
                      if (status !== 'idle') {
                        setStatus('idle');
                        setResult(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerify();
                      }
                    }}
                    placeholder="Enter national ID number"
                    className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={status === 'verifying'}
                  className="h-12 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'verifying' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Verify
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-start gap-2 mt-3">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />

                <p className="text-xs text-slate-500 leading-5">
                  Only enter information you are authorized to verify.
                  Verification results are based on the information returned
                  by the connected verification service.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            VERIFICATION RESULT
        ========================================================= */}
        {result && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-5">

            <div className="px-5 md:px-7 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Verification Result
                </h2>

                <p className="text-xs text-slate-500 mt-0.5">
                  Result from the latest verification request
                </p>
              </div>

              {result.status === 'verified' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                  <XCircle className="w-4 h-4" />
                  Not Verified
                </div>
              )}
            </div>

            {result.status === 'verified' ? (
              <div className="p-5 md:p-7">

                {/* Main result */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-5">
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Verification completed
                    </p>

                    <p className="text-xs text-emerald-700 mt-1">
                      The submitted information returned a successful
                      verification response.
                    </p>
                  </div>
                </div>

                {/* Result details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      Business / Name
                    </p>

                    <p className="text-sm font-semibold text-slate-900">
                      {result.businessName || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      KRA PIN
                    </p>

                    <p className="text-sm font-semibold text-slate-900 font-mono">
                      {result.kraPin || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      ID Number
                    </p>

                    <p className="text-sm font-semibold text-slate-900 font-mono">
                      {result.idNumber || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      Verified At
                    </p>

                    <p className="text-sm font-semibold text-slate-900">
                      {result.verifiedAt || '—'}
                    </p>
                  </div>
                </div>

                {/* Reference */}
                {result.reference && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500">
                        Verification Reference
                      </p>

                      <p className="text-sm font-semibold text-slate-900 font-mono mt-1">
                        {result.reference}
                      </p>
                    </div>

                    <button
                      onClick={handleCopyReference}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy reference
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-5">
                  <button
                    onClick={handleClear}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    New Verification
                  </button>

                  <button
                    onClick={() =>
                      router.push('/dashboard/verify/history')
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 flex items-center gap-2"
                  >
                    View History
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 md:p-7">

                <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-red-900">
                      Verification was not completed
                    </p>

                    <p className="text-xs text-red-700 mt-1 leading-5">
                      {result.message ||
                        'The submitted information could not be verified.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  className="mt-4 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                >
                  Try Again
                </button>
              </div>
            )}
          </section>
        )}

        {/* =========================================================
            QUICK ACTIONS SECTION
        ========================================================= */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Verification tools
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Manage your business verification workflow
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Supplier Verification */}
            <button
              onClick={() => {
                document
                  .getElementById('idNumber')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });

                setTimeout(() => {
                  document.getElementById('idNumber')?.focus();
                }, 400);
              }}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-teal-600" />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                Verify Supplier
              </h3>

              <p className="text-xs text-slate-500 mt-1 leading-5">
                Check a supplier before adding them to your business records.
              </p>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 mt-4">
                Start verification
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Bulk */}
            <button
              onClick={() => router.push('/dashboard/verify/bulk')}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <Upload className="w-5 h-5 text-slate-600" />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                Bulk Verification
              </h3>

              <p className="text-xs text-slate-500 mt-1 leading-5">
                Verify multiple suppliers from an uploaded list.
              </p>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-4">
                Upload list
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* History */}
            <button
              onClick={() => router.push('/dashboard/verify/history')}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <History className="w-5 h-5 text-slate-600" />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                Verification History
              </h3>

              <p className="text-xs text-slate-500 mt-1 leading-5">
                Review previous supplier and business verification requests.
              </p>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-4">
                View history
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </section>

        {/* =========================================================
            WHAT XECO VERIFY CHECKS
        ========================================================= */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-5">

          <div className="p-5 md:p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-slate-600" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  What XECO Verify checks
                </h2>

                <p className="text-xs text-slate-500 mt-0.5">
                  Current verification capability
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    ID-based verification
                  </p>

                  <p className="text-xs text-slate-500 mt-1 leading-5">
                    Submit an ID number to request the available KRA
                    verification information.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    KRA PIN verification
                  </p>

                  <p className="text-xs text-slate-500 mt-1 leading-5">
                    Display the KRA PIN information returned by the connected
                    verification service.
                  </p>
                </div>
              </div>

            </div>

            {/* Future capabilities */}
            <div className="mt-5 p-4 rounded-xl border border-dashed border-slate-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    More verification services coming
                  </p>

                  <p className="text-xs text-slate-500 mt-1 leading-5">
                    XECO Verify is designed to expand as additional
                    verification and compliance services become available.
                    New services can be added without changing your supplier
                    records or verification history.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================
            TRUST / PRIVACY SECTION
        ========================================================= */}
        <section className="mb-5">
          <div className="rounded-2xl bg-slate-900 p-5 md:p-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-white">
                    Built for business verification
                  </h2>

                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-5">
                    XECO Verify helps businesses organize verification
                    requests and maintain a clear record of checks performed
                    through connected services.
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard/verify/history')}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                View records
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>
          </div>
        </section>

        {/* =========================================================
            FOOTER NOTE
        ========================================================= */}
        <div className="flex items-center justify-center gap-2 pb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />

          <p className="text-[11px] text-slate-400 text-center">
            XECO Verify · Business verification and compliance infrastructure
          </p>
        </div>

      </div>
    </div>
  );
}