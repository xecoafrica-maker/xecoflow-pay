'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  HelpCircle,
  Loader2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  Receipt,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  X,
  Zap,
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

type PaymentStatus =
  | 'idle'
  | 'processing'
  | 'success'
  | 'error';

type CheckoutStep = 1 | 2;

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

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>('idle');

  const [errorMessage, setErrorMessage] = useState('');

  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [checkoutStep, setCheckoutStep] =
    useState<CheckoutStep>(1);

  const [pdfLoaded, setPdfLoaded] = useState(false);

  /*
   * ---------------------------------------------------------
   * FETCH PRODUCT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/product-links/${slug}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.error ||
              'This product link could not be loaded.'
          );
          return;
        }

        setProduct(data.data);
      } catch (err) {
        console.error(err);

        setError(
          'We could not connect to the checkout. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  /*
   * ---------------------------------------------------------
   * DERIVED STATE
   * ---------------------------------------------------------
   */

  const isExpired = useMemo(() => {
    if (!product?.expiryDate) return false;

    return new Date(product.expiryDate) < new Date();
  }, [product]);

  const isPaid = useMemo(() => {
    if (!product) return false;

    return (
      product.status === 'PAID' ||
      product.status === 'COMPLETED'
    );
  }, [product]);

  const merchantName =
    product?.businessName || 'XecoFlow Merchant';

  const merchantInitials = useMemo(() => {
    return merchantName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }, [merchantName]);

  const formattedPrice = product
    ? `${product.currency} ${Number(product.price).toFixed(2)}`
    : '';

  /*
   * ---------------------------------------------------------
   * PHONE FORMAT
   * ---------------------------------------------------------
   */

  const formatPhoneInput = (value: string) => {
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('254')) {
      digits = digits.slice(3);
    }

    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 9);

    const parts = [];

    if (digits.length > 0) {
      parts.push(digits.slice(0, 3));
    }

    if (digits.length > 3) {
      parts.push(digits.slice(3, 6));
    }

    if (digits.length > 6) {
      parts.push(digits.slice(6, 9));
    }

    return parts.join(' ');
  };

  const normalizePhone = (value: string) => {
    let phone = value.replace(/\D/g, '');

    if (phone.startsWith('0')) {
      phone = `254${phone.slice(1)}`;
    }

    if (!phone.startsWith('254') && phone.length === 9) {
      phone = `254${phone}`;
    }

    if (!phone.startsWith('254') && phone.length === 10) {
      phone = `254${phone}`;
    }

    return phone;
  };

  /*
   * ---------------------------------------------------------
   * PAYMENT
   * ---------------------------------------------------------
   */

  const handlePay = async () => {
    if (!product) return;

    const phone = normalizePhone(phoneNumber);

    if (!phone || phone.length !== 12) {
      setPaymentStatus('error');
      setErrorMessage(
        'Enter a valid Kenyan M-PESA number.'
      );
      return;
    }

    setPaymentStatus('processing');
    setCheckoutStep(2);
    setErrorMessage('');

    try {
      const response = await fetch(
        '/api/product-links/pay',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product.productId,
            phone,
            email,
            customerName:
              customerName.trim() || 'Customer',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setPaymentStatus('error');
        setCheckoutStep(1);

        setErrorMessage(
          data.error ||
            'We could not initiate your M-PESA payment.'
        );

        return;
      }

      setPaymentStatus('success');

      if (data.data) {
        setProduct(data.data);
      }

      /*
       * Small delay gives the customer time to see
       * the successful payment state before download.
       */
      setTimeout(() => {
        if (data.data?.fileUrl) {
          triggerDownload(data.data.fileUrl);
        }
      }, 1800);
    } catch (err: any) {
      console.error(err);

      setPaymentStatus('error');
      setCheckoutStep(1);

      setErrorMessage(
        err?.message ||
          'Something went wrong while processing your payment.'
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * DOWNLOAD
   * ---------------------------------------------------------
   */

  const triggerDownload = (url: string) => {
    if (!url) return;

    setIsDownloading(true);

    try {
      const link = document.createElement('a');

      link.href = url;
      link.download =
        product?.fileName || 'digital-document';

      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
      }, 700);
    }
  };

  /*
   * ---------------------------------------------------------
   * COPY CHECKOUT LINK
   * ---------------------------------------------------------
   */

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (err) {
      console.error(err);
    }
  };

  /*
   * ---------------------------------------------------------
   * WHATSAPP SHARE
   * ---------------------------------------------------------
   */

  const shareWhatsApp = () => {
    const text = `View ${product?.name || 'this digital product'} securely:\n${window.location.href}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  /*
   * ---------------------------------------------------------
   * DATE
   * ---------------------------------------------------------
   */

  const formatExpiry = (date: string) => {
    return new Date(date).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7fb] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-white shadow-[0_16px_45px_rgba(30,20,80,0.10)] flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
            </div>
          </div>

          <p className="mt-5 text-sm font-medium text-slate-600">
            Preparing secure checkout
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait a moment…
          </p>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#f7f7fb] px-5 flex items-center justify-center">
        <div className="w-full max-w-md rounded-[28px] bg-white border border-slate-200/80 shadow-[0_30px_80px_rgba(20,20,60,0.10)] p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
            Checkout unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              'This product link is invalid or has expired.'}
          </p>

          <button
            onClick={() => router.push('/')}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Return home
          </button>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-slate-950">
      {/* =====================================================
          BACKGROUND LIGHTING
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-56 -left-40 h-[600px] w-[600px] rounded-full bg-violet-200/30 blur-[120px]" />

        <div className="absolute top-20 right-[-180px] h-[550px] w-[550px] rounded-full bg-indigo-100/30 blur-[130px]" />

        <div className="absolute bottom-[-300px] left-[35%] h-[600px] w-[600px] rounded-full bg-purple-100/20 blur-[140px]" />
      </div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="relative z-20 border-b border-slate-200/70 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1380px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
              <Sparkles className="h-4 w-4" />
            </div>

            <div>
              <div className="text-sm font-bold tracking-tight text-slate-950">
                XecoFlow
              </div>

              <div className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:block">
                Digital commerce
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />

            <span className="text-[11px] font-semibold text-emerald-700">
              Secure checkout
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="relative z-10 mx-auto max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {/* Breadcrumb */}
        <div className="mb-5 hidden items-center gap-2 text-[11px] font-medium text-slate-400 lg:flex">
          <span className="text-slate-500">
            Secure checkout
          </span>

          <span>/</span>

          <span className="max-w-[350px] truncate">
            {product.fileName}
          </span>
        </div>

        {/* ===================================================
            MASTER CHECKOUT SHELL
        ==================================================== */}

        <section className="overflow-hidden rounded-[30px] border border-white/80 bg-white/80 shadow-[0_35px_100px_rgba(24,20,60,0.12)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[minmax(0,1.18fr)_minmax(420px,0.82fr)]">
            {/* =================================================
                LEFT PRODUCT AREA
            ================================================== */}

            <section className="relative border-b border-slate-200/80 bg-white/70 lg:border-b-0 lg:border-r">
              <div className="p-5 sm:p-7 lg:p-9">
                {/* Product top */}
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">
                      <Sparkles className="h-3 w-3" />
                      Digital product
                    </div>

                    <h1 className="mt-4 max-w-[650px] text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl lg:text-[38px] lg:leading-[1.05]">
                      {product.name}
                    </h1>

                    <div className="mt-3 flex max-w-[620px] items-center gap-2 text-sm text-slate-500">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />

                      <span className="truncate">
                        {product.fileName ||
                          'Digital document'}
                      </span>
                    </div>
                  </div>

                  {/* Merchant */}
                  <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:flex">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-black text-white">
                      {merchantInitials}
                    </div>

                    <div>
                      <div className="max-w-[130px] truncate text-xs font-bold text-slate-900">
                        {merchantName}
                      </div>

                      <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified merchant
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile merchant */}
                <div className="mt-5 flex items-center gap-3 sm:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-black text-white">
                    {merchantInitials}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {merchantName}
                    </div>

                    <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified merchant
                    </div>
                  </div>
                </div>

                {/* =================================================
                    DOCUMENT STAGE
                ================================================== */}

                <div className="mt-7 overflow-hidden rounded-[26px] border border-slate-200 bg-[#eef0f5] shadow-[0_24px_60px_rgba(20,20,50,0.10)]">
                  {/* Preview toolbar */}
                  <div className="flex h-[54px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                        <FileText className="h-4 w-4 text-violet-600" />
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Document preview
                        </div>

                        <div className="text-[10px] text-slate-400">
                          Protected before payment
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5">
                      <LockKeyhole className="h-3 w-3 text-slate-500" />

                      <span className="text-[10px] font-semibold text-slate-500">
                        Protected
                      </span>
                    </div>
                  </div>

                  {/* Paper stage */}
                  <div className="relative h-[520px] overflow-hidden bg-[#e8eaf0] sm:h-[650px] lg:h-[700px]">
                    {/* paper */}
                    <div className="absolute inset-x-5 top-5 bottom-5 overflow-hidden rounded-[5px] bg-white shadow-[0_18px_50px_rgba(20,20,40,0.20)] sm:inset-x-10 sm:top-7 sm:bottom-7">
                      {!pdfLoaded && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-7 w-7 animate-spin text-violet-600" />

                            <span className="mt-3 text-xs font-medium text-slate-400">
                              Preparing preview…
                            </span>
                          </div>
                        </div>
                      )}

                      {product.fileUrl ? (
                        <iframe
                          title="Document preview"
                          src={`${product.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          onLoad={() => setPdfLoaded(true)}
                          className="h-full w-full border-0"
                          style={{
                            pointerEvents: 'none',
                            scrollbarWidth: 'none',
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FileText className="h-20 w-20 text-slate-200" />
                        </div>
                      )}

                      {/* Protected lower content */}
                      <div className="absolute inset-x-0 bottom-0 h-[48%]">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/75 to-white backdrop-blur-[7px]" />

                        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center px-6 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-white shadow-[0_12px_30px_rgba(100,50,200,0.12)]">
                            <LockKeyhole className="h-5 w-5 text-violet-600" />
                          </div>

                          <h3 className="mt-4 text-sm font-black tracking-tight text-slate-900">
                            Preview protected
                          </h3>

                          <p className="mt-1 max-w-[260px] text-[11px] leading-5 text-slate-500">
                            Complete your payment to access the full document.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview footer */}
                  <div className="flex min-h-[52px] items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 sm:px-5">
                    <div className="flex min-w-0 items-center gap-2 text-[10px] font-medium text-slate-500">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" />

                      <span>
                        Link expires{' '}
                        {formatExpiry(
                          product.expiryDate
                        )}
                      </span>
                    </div>

                    <div className="hidden min-w-0 items-center gap-2 text-[10px] font-medium text-slate-400 sm:flex">
                      <FileText className="h-3.5 w-3.5 shrink-0" />

                      <span className="max-w-[220px] truncate">
                        {product.fileName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    SHARE
                ================================================== */}

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Share this checkout
                    </div>

                    <div className="mt-0.5 text-[10px] text-slate-400">
                      Send the secure purchase link to someone else.
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={copyLink}
                      aria-label="Copy checkout link"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={shareWhatsApp}
                      aria-label="Share on WhatsApp"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                RIGHT CHECKOUT
            ================================================== */}

            <section className="relative bg-white">
              <div className="sticky top-0">
                {/* =================================================
                    CHECKOUT HEADER
                ================================================== */}

                <div className="border-b border-slate-100 px-5 py-6 sm:px-7 sm:py-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Total to pay
                      </p>

                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-slate-500">
                          {product.currency}
                        </span>

                        <span className="text-[42px] font-black leading-none tracking-[-0.05em] text-slate-950">
                          {Number(
                            product.price
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure
                    </div>
                  </div>

                  {/* Product summary */}
                  <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-white shadow-sm">
                      <FileText className="h-5 w-5 text-violet-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-black text-slate-900">
                        {product.name}
                      </div>

                      <div className="mt-1 truncate text-[10px] font-medium text-slate-400">
                        {product.fileName}
                      </div>
                    </div>

                    <div className="text-xs font-black text-slate-900">
                      {formattedPrice}
                    </div>
                  </div>
                </div>

                {/* =================================================
                    PAYMENT BODY
                ================================================== */}

                <div className="px-5 py-6 sm:px-7 sm:py-7">
                  {/* =================================================
                      SUCCESS STATE
                  ================================================== */}

                  {isPaid ||
                  paymentStatus === 'success' ? (
                    <SuccessState
                      product={product}
                      isDownloading={
                        isDownloading
                      }
                      triggerDownload={
                        triggerDownload
                      }
                      router={router}
                    />
                  ) : isExpired ? (
                    <ExpiredState />
                  ) : (
                    <>
                      {/* =================================================
                          STEPPER
                      ================================================== */}

                      <div className="relative mb-8">
                        <div className="absolute left-[20px] right-[20px] top-4 h-px bg-slate-200" />

                        <div className="relative flex items-start justify-between">
                          <CheckoutStepItem
                            number={1}
                            title="Enter details"
                            active={
                              checkoutStep === 1
                            }
                            complete={
                              checkoutStep === 2
                            }
                          />

                          <CheckoutStepItem
                            number={2}
                            title="Confirm on phone"
                            active={
                              checkoutStep === 2
                            }
                            complete={false}
                          />
                        </div>
                      </div>

                      {/* =================================================
                          PROCESSING STATE
                      ================================================== */}

                      {paymentStatus ===
                      'processing' ? (
                        <ProcessingState
                          phoneNumber={phoneNumber}
                          formattedPrice={
                            formattedPrice
                          }
                          onBack={() => {
                            setPaymentStatus(
                              'idle'
                            );
                            setCheckoutStep(1);
                          }}
                        />
                      ) : (
                        <>
                          {/* Error */}
                          {paymentStatus ===
                            'error' &&
                            errorMessage && (
                              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                </div>

                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-red-800">
                                    Payment could not start
                                  </div>

                                  <p className="mt-1 text-[11px] leading-5 text-red-600">
                                    {
                                      errorMessage
                                    }
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* =================================================
                              FORM
                          ================================================== */}

                          <div className="space-y-5">
                            {/* Name */}
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowNameField(
                                    !showNameField
                                  )
                                }
                                className="group flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                              >
                                <User className="h-4 w-4" />

                                <span>
                                  {showNameField
                                    ? 'Hide name'
                                    : 'Add your name'}
                                </span>

                                <span className="font-normal text-slate-400">
                                  optional
                                </span>

                                <ChevronDown
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    showNameField
                                      ? 'rotate-180'
                                      : ''
                                  }`}
                                />
                              </button>

                              {showNameField && (
                                <div className="relative mt-3">
                                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                  <input
                                    type="text"
                                    value={
                                      customerName
                                    }
                                    onChange={(e) =>
                                      setCustomerName(
                                        e.target
                                          .value
                                      )
                                    }
                                    placeholder="Your name"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Email */}
                            <div>
                              <label className="mb-2 block text-[11px] font-bold text-slate-600">
                                Email
                                <span className="ml-1 font-medium text-slate-400">
                                  — optional for receipt
                                </span>
                              </label>

                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) =>
                                    setEmail(
                                      e.target.value
                                    )
                                  }
                                  placeholder="you@example.com"
                                  className="h-13 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                                />
                              </div>
                            </div>

                            {/* M-PESA */}
                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">
                                  M-PESA mobile number
                                  <span className="ml-1 text-red-500">
                                    *
                                  </span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowHelp(
                                      true
                                    )
                                  }
                                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition hover:text-violet-600"
                                >
                                  <HelpCircle className="h-3 w-3" />
                                  How it works
                                </button>
                              </div>

                              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10">
                                <div className="flex h-14 shrink-0 items-center gap-2 border-r border-slate-200 bg-slate-50 px-4">
                                  <span className="text-base">
                                    🇰🇪
                                  </span>

                                  <span className="text-sm font-bold text-slate-700">
                                    +254
                                  </span>
                                </div>

                                <div className="relative flex-1">
                                  <Smartphone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                  <input
                                    type="tel"
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    value={
                                      phoneNumber
                                    }
                                    onChange={(e) =>
                                      setPhoneNumber(
                                        formatPhoneInput(
                                          e.target
                                            .value
                                        )
                                      )
                                    }
                                    placeholder="712 345 678"
                                    className="h-14 w-full bg-white pl-11 pr-4 text-base font-bold tracking-wide text-slate-950 outline-none placeholder:font-medium placeholder:text-slate-300"
                                  />
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                <Send className="h-3 w-3" />

                                <span>
                                  An M-PESA STK prompt will appear on this phone.
                                </span>
                              </div>
                            </div>

                            {/* =================================================
                                PRIMARY CTA
                            ================================================== */}

                            <button
                              type="button"
                              onClick={handlePay}
                              disabled={
                                !phoneNumber.trim()
                              }
                              className="group relative mt-2 flex h-[58px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-sm font-black text-white shadow-[0_15px_35px_rgba(124,58,237,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(124,58,237,0.36)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition group-hover:translate-x-full group-hover:opacity-100 duration-700" />

                              <LockKeyhole className="relative h-4 w-4" />

                              <span className="relative">
                                Pay {formattedPrice}{' '}
                                with M-PESA
                              </span>

                              <ArrowRight className="relative h-4 w-4 transition group-hover:translate-x-1" />
                            </button>

                            {/* =================================================
                                PAYMENT MICROCOPY
                            ================================================== */}

                            <p className="text-center text-[10px] leading-5 text-slate-400">
                              By continuing, you confirm the payment details above.
                              <br />
                              You will approve the transaction securely on your phone.
                            </p>

                            {/* =================================================
                                DELIVERY GUARANTEE
                            ================================================== */}

                            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                                  <Zap className="h-4 w-4 text-violet-600" />
                                </div>

                                <div>
                                  <div className="text-xs font-black text-slate-900">
                                    Instant digital delivery
                                  </div>

                                  <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                    Once your payment is confirmed, your document becomes available immediately.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* =================================================
                                TRUST ROW
                            ================================================== */}

                            <div className="grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
                              <TrustItem
                                icon={
                                  <ShieldCheck className="h-4 w-4" />
                                }
                                title="Protected"
                                subtitle="Secure checkout"
                              />

                              <TrustItem
                                icon={
                                  <Phone className="h-4 w-4" />
                                }
                                title="M-PESA"
                                subtitle="Mobile payment"
                              />

                              <TrustItem
                                icon={
                                  <Eye className="h-4 w-4" />
                                }
                                title="Instant"
                                subtitle="Digital access"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="flex items-center justify-center gap-2 py-6 text-[10px] font-medium text-slate-400">
          <LockKeyhole className="h-3 w-3" />

          <span>Protected payment experience</span>

          <span>•</span>

          <span>
            Powered by{' '}
            <strong className="font-bold text-slate-600">
              XecoFlow
            </strong>
          </span>
        </div>
      </div>

      {/* =====================================================
          MOBILE STICKY PAYMENT
      ====================================================== */}

      {!isPaid &&
        !isExpired &&
        paymentStatus !== 'processing' &&
        paymentStatus !== 'success' && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-15px_40px_rgba(20,20,50,0.10)] backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Total
                </div>

                <div className="text-lg font-black tracking-tight text-slate-950">
                  {formattedPrice}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePay}
                disabled={!phoneNumber.trim()}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-black text-white shadow-lg shadow-violet-600/20 disabled:opacity-50"
              >
                <LockKeyhole className="h-4 w-4" />

                Pay with M-PESA

                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      {/* =====================================================
          HELP MODAL
      ====================================================== */}

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-5 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
                <Smartphone className="h-5 w-5 text-violet-600" />
              </div>

              <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950">
                How M-PESA payment works
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your payment is completed securely through your M-PESA mobile number.
              </p>

              <div className="mt-6 space-y-4">
                <HelpStep
                  number="01"
                  title="Enter your M-PESA number"
                  text="Use the number registered with M-PESA."
                />

                <HelpStep
                  number="02"
                  title="Tap the payment button"
                  text="An STK payment request will be sent to your phone."
                />

                <HelpStep
                  number="03"
                  title="Approve on your phone"
                  text="Enter your M-PESA PIN on the official M-PESA prompt."
                />

                <HelpStep
                  number="04"
                  title="Get instant access"
                  text="After successful confirmation, your digital document is unlocked."
                />
              </div>

              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom spacing */}
      <div className="h-20 lg:hidden" />

      {/* =====================================================
          GLOBAL CSS
      ====================================================== */}

      <style jsx global>{`
        html {
          background: #f7f7fb;
        }

        body {
          margin: 0;
          background: #f7f7fb;
        }

        iframe {
          scrollbar-width: none;
        }

        iframe::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        input[type='tel'] {
          letter-spacing: 0.025em;
        }

        @keyframes softPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }

          50% {
            transform: scale(1.04);
            opacity: 0.8;
          }
        }

        .soft-pulse {
          animation: softPulse 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| CHECKOUT STEP
|--------------------------------------------------------------------------
*/

function CheckoutStepItem({
  number,
  title,
  active,
  complete,
}: {
  number: number;
  title: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="relative z-10 flex w-[120px] flex-col items-center text-center">
      <div
        className={[
          'flex h-8 w-8 items-center justify-center rounded-full border-4 border-white text-[10px] font-black transition-all duration-500',
          complete
            ? 'bg-emerald-500 text-white shadow-[0_6px_20px_rgba(16,185,129,0.25)]'
            : active
            ? 'bg-violet-600 text-white shadow-[0_7px_22px_rgba(124,58,237,0.28)]'
            : 'bg-slate-100 text-slate-400',
        ].join(' ')}
      >
        {complete ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          number
        )}
      </div>

      <span
        className={[
          'mt-2 text-[9px] font-bold transition-colors',
          active || complete
            ? 'text-slate-800'
            : 'text-slate-400',
        ].join(' ')}
      >
        {title}
      </span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TRUST ITEM
|--------------------------------------------------------------------------
*/

function TrustItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-3 text-center">
      <div className="text-violet-600">
        {icon}
      </div>

      <div className="mt-1.5 text-[9px] font-black text-slate-700">
        {title}
      </div>

      <div className="mt-0.5 text-[8px] font-medium text-slate-400">
        {subtitle}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PROCESSING STATE
|--------------------------------------------------------------------------
*/

function ProcessingState({
  phoneNumber,
  formattedPrice,
  onBack,
}: {
  phoneNumber: string;
  formattedPrice: string;
  onBack: () => void;
}) {
  return (
    <div className="py-5 text-center">
      {/* Animated M-PESA phone */}
      <div className="relative mx-auto h-28 w-28">
        <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-40" />

        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-violet-50">
          <div className="flex h-16 w-12 items-center justify-center rounded-[12px] border-2 border-violet-500 bg-white shadow-lg">
            <Smartphone className="h-6 w-6 text-violet-600" />
          </div>
        </div>
      </div>

      <div className="mt-7">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          Waiting for confirmation
        </div>

        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
          Check your phone
        </h2>

        <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-slate-500">
          We sent an M-PESA payment request to
        </p>

        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <Phone className="h-4 w-4 text-slate-400" />

          <span className="text-sm font-black tracking-wide text-slate-800">
            +254 {phoneNumber}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
              <Receipt className="h-4 w-4 text-violet-600" />
            </div>

            <div className="flex-1">
              <div className="text-[10px] font-medium text-slate-400">
                Amount
              </div>

              <div className="mt-0.5 text-sm font-black text-slate-900">
                {formattedPrice}
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure
            </div>
          </div>
        </div>

        <p className="mt-6 text-[10px] leading-5 text-slate-400">
          Enter your M-PESA PIN only on the official prompt on your phone.
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-5 text-xs font-bold text-violet-600 transition hover:text-violet-800"
        >
          ← Change number
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SUCCESS STATE
|--------------------------------------------------------------------------
*/

function SuccessState({
  product,
  isDownloading,
  triggerDownload,
  router,
}: {
  product: ProductData;
  isDownloading: boolean;
  triggerDownload: (url: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="py-5 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-emerald-50 shadow-[0_15px_40px_rgba(16,185,129,0.15)]">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
        <Check className="h-3 w-3" />
        Payment confirmed
      </div>

      <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
        You're all set
      </h2>

      <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-slate-500">
        Your payment was successful and your digital document is ready.
      </p>

      <button
        type="button"
        onClick={() =>
          triggerDownload(product.fileUrl)
        }
        disabled={isDownloading}
        className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-[0_15px_35px_rgba(16,185,129,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Preparing download…
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            Download document
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-4 w-4 text-slate-400" />

          <div>
            <div className="text-xs font-bold text-slate-800">
              Your receipt
            </div>

            <p className="mt-1 text-[10px] leading-5 text-slate-400">
              If you provided an email address, your receipt and access details can be delivered there.
            </p>
          </div>
        </div>
      </div>

      {product.returnUrl && (
        <button
          type="button"
          onClick={() =>
            router.push(product.returnUrl)
          }
          className="mt-5 text-xs font-bold text-violet-600 hover:text-violet-800"
        >
          ← Return to merchant
        </button>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| EXPIRED STATE
|--------------------------------------------------------------------------
*/

function ExpiredState() {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-red-50">
        <Clock3 className="h-9 w-9 text-red-500" />
      </div>

      <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
        Checkout expired
      </h2>

      <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-slate-500">
        This purchase link is no longer active. Please contact the merchant for a new link.
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| HELP STEP
|--------------------------------------------------------------------------
*/

function HelpStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[9px] font-black text-violet-600">
        {number}
      </div>

      <div>
        <div className="text-xs font-black text-slate-900">
          {title}
        </div>

        <p className="mt-1 text-[10px] leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}