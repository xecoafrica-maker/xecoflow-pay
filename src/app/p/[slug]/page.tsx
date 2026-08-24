'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  Download,
  Loader2,
  Lock,
  Mail,
  Smartphone,
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

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;

  const [product, setProduct] =
    useState<ProductData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] =
    useState('');

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>('idle');

  const [errorMessage, setErrorMessage] =
    useState('');

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [copied, setCopied] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | FETCH PRODUCT
  |--------------------------------------------------------------------------
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

        if (response.ok && data.success) {
          setProduct(data.data);
        } else {
          setError(
            data.error ||
              'This product could not be found.'
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          'Unable to load this payment page.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  /*
  |--------------------------------------------------------------------------
  | PHONE FORMAT
  |--------------------------------------------------------------------------
  */

  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('254')) {
      digits = digits.slice(3);
    }

    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 9);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 6) {
      return `${digits.slice(
        0,
        3
      )} ${digits.slice(3)}`;
    }

    return `${digits.slice(
      0,
      3
    )} ${digits.slice(
      3,
      6
    )} ${digits.slice(6)}`;
  };

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE PHONE
  |--------------------------------------------------------------------------
  */

  const normalizePhone = (
    value: string
  ) => {
    let phone = value.replace(/\D/g, '');

    if (phone.startsWith('0')) {
      phone =
        '254' + phone.slice(1);
    }

    if (
      !phone.startsWith('254') &&
      phone.length === 9
    ) {
      phone = '254' + phone;
    }

    if (
      !phone.startsWith('254') &&
      phone.length === 10
    ) {
      phone = '254' + phone;
    }

    return phone;
  };

  /*
  |--------------------------------------------------------------------------
  | PAYMENT
  |--------------------------------------------------------------------------
  */

  const handlePay = async () => {
    if (!product) return;

    const phone =
      normalizePhone(phoneNumber);

    if (
      !phone ||
      phone.length !== 12
    ) {
      setPaymentStatus('error');

      setErrorMessage(
        'Please enter a valid M-PESA number.'
      );

      return;
    }

    setPaymentStatus('processing');
    setErrorMessage('');

    const customerName =
      `${firstName} ${lastName}`.trim() ||
      'Customer';

    try {
      const response = await fetch(
        '/api/product-links/pay',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            productId:
              product.productId,
            phone,
            email,
            customerName,
          }),
        }
      );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setPaymentStatus('success');

        if (data.data) {
          setProduct(data.data);
        }

        setTimeout(() => {
          if (data.data?.fileUrl) {
            triggerDownload(
              data.data.fileUrl
            );
          }
        }, 1500);
      } else {
        setPaymentStatus('error');

        setErrorMessage(
          data.error ||
            'Payment could not be completed.'
        );
      }
    } catch (err: any) {
      console.error(err);

      setPaymentStatus('error');

      setErrorMessage(
        err?.message ||
          'An error occurred while processing your payment.'
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DOWNLOAD
  |--------------------------------------------------------------------------
  */

  const triggerDownload = (
    url: string
  ) => {
    if (!url) return;

    setIsDownloading(true);

    try {
      const link =
        document.createElement('a');

      link.href = url;
      link.download =
        product?.fileName ||
        'download';

      link.target = '_blank';
      link.rel =
        'noopener noreferrer';

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
  |--------------------------------------------------------------------------
  | COPY LINK
  |--------------------------------------------------------------------------
  */

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error(err);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#edf7fc] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#159bc5]" />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (!product || error) {
    return (
      <main className="min-h-screen bg-[#edf7fc] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white border border-gray-200">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-gray-900">
            Payment page unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error ||
              'This product link is invalid or no longer available.'}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push('/')
            }
            className="mt-6 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const isExpired =
    !!product.expiryDate &&
    new Date(product.expiryDate) <
      new Date();

  const isPaid =
    product.status === 'PAID' ||
    product.status === 'COMPLETED';

  const amount =
    Number(product.price).toFixed(2);

  const currency =
    product.currency || 'KES';

  const merchantName =
    product.businessName ||
    'XecoFlow';

  /*
  |--------------------------------------------------------------------------
  | MAIN PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-white">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

        {/* =========================================================
            LEFT SIDE
        ========================================================== */}

        <section className="relative min-h-[430px] bg-[#eaf7fc] flex flex-col items-center justify-center px-8 py-16 lg:min-h-screen">

          {/* Very subtle background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />
          </div>

          {/* Product identity */}
          <div className="relative z-10 flex flex-col items-center text-center">

            {/* Logo */}
            <div className="flex h-10 w-10 items-center justify-center bg-white shadow-sm border border-white">
              <div className="flex flex-col gap-[2px]">
                <span className="h-[3px] w-[22px] rounded-sm bg-[#12a7d1]" />
                <span className="h-[3px] w-[22px] rounded-sm bg-[#12a7d1]" />
                <span className="h-[3px] w-[16px] rounded-sm bg-[#12a7d1]" />
                <span className="h-[3px] w-[12px] rounded-sm bg-[#12a7d1]" />
              </div>
            </div>

            {/* Product name */}
            <h1 className="mt-7 max-w-[460px] text-center text-[28px] font-extrabold uppercase tracking-[-0.03em] text-black sm:text-[34px]">
              {product.name}
            </h1>

            {/* Merchant */}
            <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.08em] text-gray-600">
              BY {merchantName}
            </p>

            {/* Product description */}
            <div className="mt-7 max-w-[390px] text-center">
              <p className="text-sm leading-6 text-gray-500">
                Secure payment for your
                digital product.
              </p>
            </div>
          </div>

          {/* Payment methods */}
          <div className="absolute bottom-7 left-1/2 z-10 w-[calc(100%-48px)] max-w-[370px] -translate-x-1/2">
            <div className="flex items-center justify-center gap-4 rounded-md border border-[#c8dbe4] bg-white/35 px-5 py-3">

              <div className="text-[10px] font-bold text-gray-500">
                <span className="text-[#42b96a]">
                  M-PESA
                </span>
              </div>

              <div className="text-sm font-black italic text-[#2445c4]">
                VISA
              </div>

              <div className="flex items-center">
                <span className="h-5 w-5 rounded-full bg-[#eb001b]" />
                <span className="-ml-2 h-5 w-5 rounded-full bg-[#f79e1b] opacity-90" />
              </div>

              <div className="text-[9px] font-bold text-gray-500">
                AMEX
              </div>

              <div className="text-[10px] font-bold text-gray-500">
                Airtel
              </div>
            </div>

            <div className="mt-2 text-center text-[9px] text-gray-500">
              <Lock className="mr-1 inline h-2.5 w-2.5" />
              Secured payment
            </div>
          </div>
        </section>

        {/* =========================================================
            RIGHT SIDE
        ========================================================== */}

        <section className="min-h-screen bg-white flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">

          <div className="w-full max-w-[430px]">

            {/* =====================================================
                SUCCESS
            ====================================================== */}

            {isPaid ||
            paymentStatus === 'success' ? (
              <SuccessView
                product={product}
                isDownloading={
                  isDownloading
                }
                onDownload={() =>
                  triggerDownload(
                    product.fileUrl
                  )
                }
                onBack={() => {
                  if (
                    product.returnUrl
                  ) {
                    router.push(
                      product.returnUrl
                    );
                  }
                }}
              />
            ) : isExpired ? (
              /* ===================================================
                  EXPIRED
              ==================================================== */

              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>

                <h2 className="mt-5 text-xl font-bold text-gray-900">
                  Link expired
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  This payment link is
                  no longer active.
                  Please contact the
                  merchant for a new
                  payment link.
                </p>
              </div>
            ) : (
              /* ===================================================
                  CHECKOUT
              ==================================================== */

              <>
                {/* Form */}

                <div className="space-y-5">

                  {/* First + Last name */}

                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-1.5 block text-sm font-medium text-gray-900"
                      >
                        First name
                      </label>

                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) =>
                          setFirstName(
                            e.target.value
                          )
                        }
                        placeholder="First name"
                        disabled={
                          paymentStatus ===
                          'processing'
                        }
                        className="h-10 w-full rounded-[4px] border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#159bc5] focus:ring-1 focus:ring-[#159bc5] disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-1.5 block text-sm font-medium text-gray-900"
                      >
                        Last name
                      </label>

                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) =>
                          setLastName(
                            e.target.value
                          )
                        }
                        placeholder="Last name"
                        disabled={
                          paymentStatus ===
                          'processing'
                        }
                        className="h-10 w-full rounded-[4px] border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#159bc5] focus:ring-1 focus:ring-[#159bc5] disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Email */}

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-medium text-gray-900"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      placeholder="Email address"
                      disabled={
                        paymentStatus ===
                        'processing'
                      }
                      className="h-10 w-full rounded-[4px] border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#159bc5] focus:ring-1 focus:ring-[#159bc5] disabled:bg-gray-50"
                    />
                  </div>

                  {/* Phone */}

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block text-sm font-medium text-gray-900"
                    >
                      Phone number
                    </label>

                    <div className="flex">

                      <div className="flex h-10 w-[78px] shrink-0 items-center justify-center gap-1 rounded-l-[4px] border border-r-0 border-gray-300 bg-white text-sm text-gray-700">
                        <span>
                          +254
                        </span>

                        <svg
                          width="9"
                          height="6"
                          viewBox="0 0 9 6"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 1L4.5 4.5L8 1"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <div className="relative flex-1">
                        <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />

                        <input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={
                            phoneNumber
                          }
                          onChange={(e) =>
                            setPhoneNumber(
                              formatPhone(
                                e.target
                                  .value
                              )
                            )
                          }
                          placeholder="Phone number"
                          disabled={
                            paymentStatus ===
                            'processing'
                          }
                          className="h-10 w-full rounded-r-[4px] border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#159bc5] focus:ring-1 focus:ring-[#159bc5] disabled:bg-gray-50"
                        />
                      </div>
                    </div>

                    <p className="mt-1.5 text-[11px] text-gray-400">
                      An M-PESA prompt
                      will appear on
                      this phone.
                    </p>
                  </div>

                  {/* Amount */}

                  <div>
                    <label
                      htmlFor="amount"
                      className="mb-1.5 block text-sm font-medium text-gray-900"
                    >
                      Amount
                    </label>

                    <div className="flex h-10 overflow-hidden rounded-[4px] border border-gray-300 bg-gray-50">

                      <div className="flex w-[55px] items-center justify-center border-r border-gray-300 text-sm text-gray-600">
                        {currency}
                      </div>

                      <input
                        id="amount"
                        type="text"
                        value={amount}
                        readOnly
                        className="min-w-0 flex-1 bg-gray-50 px-3 text-sm text-gray-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Error */}

                  {paymentStatus ===
                    'error' && (
                    <div className="flex items-start gap-2 rounded-[4px] border border-red-200 bg-red-50 px-3 py-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                      <p className="text-xs leading-5 text-red-600">
                        {errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Processing */}

                  {paymentStatus ===
                    'processing' && (
                    <div className="flex items-center gap-3 rounded-[4px] border border-blue-200 bg-blue-50 px-3 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />

                      <div>
                        <p className="text-xs font-medium text-blue-800">
                          Sending M-PESA
                          request...
                        </p>

                        <p className="mt-0.5 text-[10px] text-blue-600">
                          Check your
                          phone and
                          approve the
                          payment.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pay button */}

                  <button
                    type="button"
                    onClick={
                      handlePay
                    }
                    disabled={
                      paymentStatus ===
                        'processing' ||
                      !phoneNumber.trim()
                    }
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-[4px] bg-[#35b95c] text-sm font-semibold text-white transition hover:bg-[#2fab54] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentStatus ===
                    'processing' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay now
                      </>
                    )}
                  </button>

                  {/* Security */}

                  <div className="pt-1 text-center">
                    <p className="text-[10px] text-gray-400">
                      <Lock className="mr-1 inline h-3 w-3" />
                      Secure payment
                    </p>
                  </div>

                  {/* Product reference */}

                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">
                        Product
                      </span>

                      <span className="max-w-[240px] truncate font-medium text-gray-600">
                        {product.name}
                      </span>
                    </div>

                    {product.fileName && (
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">
                          File
                        </span>

                        <span className="max-w-[240px] truncate text-gray-500">
                          {
                            product.fileName
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Share */}

                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={
                        copyLink
                      }
                      className="flex items-center gap-1.5 text-[10px] text-gray-400 transition hover:text-gray-700"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}

                      {copied
                        ? 'Copied'
                        : 'Copy payment link'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* =====================================================
                FOOTER
            ====================================================== */}

            <div className="mt-10 text-center">
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                <Lock className="h-3 w-3" />

                <span>
                  Secured by
                </span>

                <span className="font-semibold text-gray-500">
                  XecoFlow
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================
          MOBILE BOTTOM PAYMENT
      ========================================================== */}

      {!isPaid &&
        !isExpired &&
        paymentStatus !==
          'success' &&
        paymentStatus !==
          'processing' && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-5px_20px_rgba(0,0,0,0.06)] lg:hidden">
            <div className="flex items-center gap-3">

              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400">
                  Amount
                </p>

                <p className="text-base font-bold text-gray-900">
                  {currency}{' '}
                  {amount}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handlePay
                }
                disabled={
                  !phoneNumber.trim()
                }
                className="h-11 rounded-[4px] bg-[#35b95c] px-6 text-sm font-semibold text-white disabled:opacity-50"
              >
                Pay now
              </button>
            </div>
          </div>
        )}
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| SUCCESS VIEW
|--------------------------------------------------------------------------
*/

function SuccessView({
  product,
  isDownloading,
  onDownload,
  onBack,
}: {
  product: ProductData;
  isDownloading: boolean;
  onDownload: () => void;
  onBack: () => void;
}) {
  return (
    <div className="text-center">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-gray-900">
        Payment successful
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        Your payment has been
        confirmed and your
        digital product is ready.
      </p>

      <button
        type="button"
        onClick={onDownload}
        disabled={isDownloading}
        className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-[4px] bg-[#35b95c] text-sm font-semibold text-white transition hover:bg-[#2fab54] disabled:opacity-60"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download{' '}
            {product.fileName ||
              'file'}
          </>
        )}
      </button>

      <p className="mt-4 text-[11px] leading-5 text-gray-400">
        Your digital product
        has been unlocked.
      </p>

      {product.returnUrl && (
        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-xs font-medium text-[#159bc5] hover:underline"
        >
          ← Back to merchant
        </button>
      )}
    </div>
  );
}