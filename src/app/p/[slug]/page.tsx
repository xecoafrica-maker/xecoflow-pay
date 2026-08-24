'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Smartphone,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  FileText,
  Download,
  ShieldCheck,
  Send,
  Clock3,
  Building2,
  User,
  LockKeyhole,
  Share2,
  Copy,
  Check,
  Mail,
  Eye,
  ChevronDown,
  Sparkles,
  BadgeCheck,
  ExternalLink,
  ReceiptText,
  WalletCards,
  CircleHelp,
  X,
} from 'lucide-react';

interface ProductData {
  id: string;
  productId: string;
  merchantId: string;
  businessName: string;
  name: string;
  price: number;
  currency: string;
  fileUrl: string;
  fileName: string;
  status: string;
  createdAt: string;
  expiryDate: string;
  returnUrl: string;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [showNameField, setShowNameField] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  const fetchProduct = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/product-links/${slug}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.error || 'Product not found');
      }
    } catch {
      setError('We could not load this payment page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  const amount = useMemo(
    () => (product ? Number(product.price).toFixed(2) : '0.00'),
    [product]
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatFileName = (name = '') =>
    name.length > 36 ? `${name.substring(0, 36)}…` : name;

  const normalizePhone = (value: string) => {
    let phone = value.replace(/\D/g, '');

    if (phone.startsWith('0')) phone = `254${phone.slice(1)}`;
    if (!phone.startsWith('254') && phone.length === 10) phone = `254${phone}`;
    if (!phone.startsWith('254') && phone.length === 9) phone = `254${phone}`;

    return phone;
  };

  const handlePay = async () => {
    if (!product || isProcessing) return;

    const phone = normalizePhone(phoneNumber);

    if (!/^254\d{9}$/.test(phone)) {
      setPaymentStatus('error');
      setErrorMessage('Enter a valid Kenyan M-PESA number, for example 0712 345 678.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const response = await fetch('/api/product-links/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.productId,
          phone,
          email: email.trim(),
          customerName: customerName.trim() || 'Customer',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        setProduct(data.data);

        setTimeout(() => {
          if (data.data?.fileUrl) triggerDownload(data.data.fileUrl);
        }, 1200);
      } else {
        setPaymentStatus('error');
        setErrorMessage(data.error || 'Payment could not be completed. Please try again.');
      }
    } catch (err: any) {
      setPaymentStatus('error');
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerDownload = (url: string) => {
    if (!url) return;

    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = url;
    link.download = product?.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard may be blocked by browser permissions.
    }
  };

  const shareToWhatsApp = () => {
    const text = `${product?.name || 'Digital product'}\n${window.location.href}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-xl shadow-violet-600/20">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">Preparing your checkout</h2>
          <p className="mt-1 text-sm text-slate-500">Please wait a moment…</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] px-4 flex items-center justify-center">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_70px_-30px_rgba(15,23,42,.3)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Page unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || 'This payment link is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Return home
          </button>
        </div>
      </main>
    );
  }

  const isExpired = new Date(product.expiryDate) < new Date();
  const isPaid = product.status === 'PAID' || product.status === 'COMPLETED';

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950 selection:bg-violet-100 selection:text-violet-900">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan-100/30 blur-3xl" />
      </div>

      {/* Top navigation */}
      <header className="relative z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/20">
              <WalletCards className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">{product.businessName || 'XecoFlow'}</p>
              <p className="text-[11px] text-slate-400">Secure digital checkout</p>
            </div>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <CircleHelp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Need help?</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        {/* Breadcrumb / trust line */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Secure checkout</span>
            <span className="text-slate-300">/</span>
            <span>{formatFileName(product.fileName || 'Digital document')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Protected payment
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(390px,.82fr)] lg:gap-8">
          {/* PRODUCT / PREVIEW */}
          <section className="min-w-0">
            <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-38px_rgba(15,23,42,.35)]">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-violet-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      Digital product
                    </div>
                    <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
                      {product.name}
                    </h1>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{product.fileName || 'Digital document'}</span>
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 sm:flex">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Verified seller
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="relative mx-auto aspect-[3/4] max-h-[760px] w-full overflow-hidden bg-slate-100 sm:max-w-[760px]">
                {product.fileUrl ? (
                  <iframe
                    src={`${product.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    title="Product preview"
                    className="pointer-events-none h-full w-full border-0"
                    onLoad={() => setPdfLoaded(true)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <FileText className="mx-auto h-16 w-16 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-500">Preview unavailable</p>
                    </div>
                  </div>
                )}

                {!pdfLoaded && product.fileUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
                  </div>
                )}

                {!isPaid && !isExpired && (
                  <>
                    <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-transparent via-white/75 to-white backdrop-blur-[3px]" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-8 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-100 bg-white/95 text-violet-600 shadow-xl shadow-slate-900/10 backdrop-blur">
                        <LockKeyhole className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">Preview protected</p>
                      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                        Complete payment to unlock the full document.
                      </p>
                      <div className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-lg">
                        {product.currency} {amount} · Unlock access
                      </div>
                    </div>
                  </>
                )}

                {isPaid && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-emerald-100 bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-lg backdrop-blur">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Unlocked
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 text-xs text-slate-500 sm:px-7">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  Link expires {formatDate(product.expiryDate)}
                </span>
                <span className="inline-flex max-w-full items-center gap-1.5 truncate">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  {formatFileName(product.fileName)}
                </span>
              </div>
            </div>

            {/* Share */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold text-slate-700">Share this checkout</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Send the secure link to someone else.</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={copyLink}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Copy checkout link"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={shareToWhatsApp}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label="Share on WhatsApp"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* CHECKOUT */}
          <aside className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-38px_rgba(15,23,42,.35)]">
              {isPaid ? (
                <div className="p-6 sm:p-8">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-emerald-700">
                      Payment complete
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                      Your file is ready
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Your payment was successful. You can download your document now.
                    </p>
                  </div>

                  <button
                    onClick={() => triggerDownload(product.fileUrl)}
                    disabled={isDownloading}
                    className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                    {isDownloading ? 'Preparing download…' : `Download ${formatFileName(product.fileName || 'file')}`}
                  </button>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3.5">
                      <ReceiptText className="h-4 w-4 text-slate-500" />
                      <p className="mt-2 text-[11px] text-slate-400">Amount paid</p>
                      <p className="text-sm font-bold text-slate-900">
                        {product.currency} {amount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3.5">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <p className="mt-2 text-[11px] text-slate-400">Delivery</p>
                      <p className="text-sm font-bold text-slate-900">Digital file</p>
                    </div>
                  </div>

                  {product.returnUrl && (
                    <button
                      onClick={() => router.push(product.returnUrl)}
                      className="mt-5 flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-violet-600 transition hover:text-violet-700"
                    >
                      Return to seller <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ) : isExpired ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
                    <Clock3 className="h-7 w-7 text-rose-500" />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-rose-600">Checkout closed</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">Link expired</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This payment link expired on {formatDate(product.expiryDate)}.
                  </p>
                </div>
              ) : (
                <>
                  {/* Checkout header */}
                  <div className="border-b border-slate-100 p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">
                          Total to pay
                        </p>
                        <p className="mt-1 text-[36px] font-black leading-none tracking-[-.04em] text-slate-950">
                          <span className="text-xl font-bold text-slate-500">{product.currency}</span>{' '}
                          {amount}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Secure
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">{product.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">{product.fileName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-6 sm:p-7">
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white">1</span>
                      <span className="text-slate-700">Enter details</span>
                      <span className="h-px flex-1 bg-slate-200" />
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400">2</span>
                      <span className="text-slate-400">Confirm on phone</span>
                    </div>

                    {paymentStatus === 'processing' && (
                      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-violet-950">Check your phone</p>
                            <p className="mt-1 text-xs leading-5 text-violet-700">
                              We’ve sent an M-PESA payment request. Enter your M-PESA PIN on your phone to continue.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentStatus === 'error' && (
                      <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-rose-900">Payment not completed</p>
                          <p className="mt-1 text-xs leading-5 text-rose-700">{errorMessage}</p>
                        </div>
                        <button
                          onClick={() => setPaymentStatus('idle')}
                          className="ml-auto shrink-0 text-rose-400 hover:text-rose-600"
                          aria-label="Dismiss error"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Optional name */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowNameField((v) => !v)}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
                      >
                        <User className="h-4 w-4" />
                        {showNameField ? 'Hide name' : 'Add your name'}
                        <span className="font-normal text-slate-400">(optional)</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition ${showNameField ? 'rotate-180' : ''}`} />
                      </button>

                      {showNameField && (
                        <div className="relative mt-2.5">
                          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Your full name"
                            disabled={isProcessing}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-50"
                          />
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-700">
                        Email <span className="font-normal text-slate-400">(optional — for receipt)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          disabled={isProcessing}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* M-PESA */}
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-700">
                        M-PESA mobile number <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10">
                        <div className="flex h-12 items-center gap-2 border-r border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-600">
                          <Smartphone className="h-4 w-4 text-slate-400" />
                          +254
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePay();
                          }}
                          placeholder="712 345 678"
                          disabled={isProcessing}
                          className="h-12 min-w-0 flex-1 px-4 text-sm outline-none placeholder:text-slate-400 disabled:bg-slate-50"
                        />
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-5 text-slate-400">
                        <Send className="h-3.5 w-3.5" />
                        An M-PESA STK prompt will appear on this phone.
                      </p>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handlePay}
                      disabled={isProcessing}
                      className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-600 to-fuchsia-600 px-5 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(124,58,237,.65)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-10px_rgba(124,58,237,.7)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Waiting for M-PESA…
                        </>
                      ) : (
                        <>
                          <LockKeyhole className="h-4 w-4" />
                          Pay {product.currency} {amount}
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] leading-5 text-slate-400">
                      By continuing, you confirm the payment details above.
                      <br />
                      You’ll approve the transaction securely on your phone.
                    </p>

                    {/* Trust row */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/70 py-3">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span className="text-[10px] font-semibold text-slate-500">Protected</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Smartphone className="h-4 w-4 text-violet-600" />
                        <span className="text-[10px] font-semibold text-slate-500">M-PESA</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Eye className="h-4 w-4 text-slate-500" />
                        <span className="text-[10px] font-semibold text-slate-500">Digital delivery</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 px-3 text-center text-[11px] text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              <span>Powered by</span>
              <span className="font-bold text-slate-600">XecoFlow</span>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile fixed CTA */}
      {!isPaid && !isExpired && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_-20px_rgba(15,23,42,.45)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
              <p className="truncate text-lg font-black text-slate-950">
                {product.currency} {amount}
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="flex h-12 min-w-[155px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-lg disabled:opacity-60"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
              {isProcessing ? 'Waiting…' : 'Pay securely'}
            </button>
          </div>
        </div>
      )}

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <CircleHelp className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold">How payment works</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Enter your M-PESA number, tap Pay, then approve the STK prompt on your phone.
                </p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close help"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ['1', 'Enter your phone number', 'Use the number where you want to receive the M-PESA prompt.'],
                ['2', 'Tap Pay securely', 'XecoFlow will initiate the payment request.'],
                ['3', 'Approve on your phone', 'Enter your M-PESA PIN on the official phone prompt.'],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-3 rounded-2xl bg-slate-50 p-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-bold text-white">
                    {number}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}