'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  Mail,
  User,
  Shield,
  BadgeCheck,
  XCircle,
  Wifi,
  WifiOff,
  Split,
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Share2,
} from 'lucide-react';

interface PaymentLinkData {
  id: string;
  billId: string;
  merchantId: string;
  businessName: string;
  name: string;
  price: number;
  currency: string;
  status: string;
  createdAt: string;
  expiryDate: string;
  returnUrl: string;
  linkType: string;
  verified?: boolean;
  logoUrl?: string;
  parentBillId?: string | null;
  isChild?: boolean;
  childStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PAID' | 'COMPLETED' | null;
}

type PayMethod = 'mpesa' | 'airtel' | 'tkash' | 'card' | 'paypal';

const METHOD_LOGOS: Record<PayMethod, { src: string; label: string; activeBorder: string }> = {
  mpesa: {
    src: 'https://swalanyeti.co.ke/storage/uploads/2020/12/IMG-20201203204210.jpg',
    label: 'M-PESA',
    activeBorder: 'border-[#09A747]',
  },
  airtel: {
    src: 'https://www.pngall.com/wp-content/uploads/17/Airtel-Money-Logo-Vector-PNG.png',
    label: 'Airtel',
    activeBorder: 'border-[#ED1C24]',
  },
  tkash: {
    src: 'https://tech-ish.com/wp-content/uploads/2020/04/Telkom-Kenya-Tkash.jpg',
    label: 'T-Kash',
    activeBorder: 'border-[#FF6B00]',
  },
  card: {
    src: 'https://static.vecteezy.com/system/resources/previews/066/705/796/non_2x/visa-and-mastercard-logo-featuring-overlapping-circles-on-a-white-background-free-vector.jpg',
    label: 'Card',
    activeBorder: 'border-[#1A1F36]',
  },
  paypal: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1280px-PayPal.svg.png',
    label: 'PayPal',
    activeBorder: 'border-[#003087]',
  },
};

interface Contributor {
  id: string;
  name: string;
  identifier: string;
  amount: number;
  status: 'pending' | 'paid' | 'accepted' | 'rejected';
  isYou?: boolean;
  payLink?: string;
}

interface DelegateDraft {
  id: string;
  name: string;
  phone: string;
  email: string;
  amount: string;
}

const MAX_DELEGATES = 4;

export default function PaymentLinkPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'pending'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitNote, setSplitNote] = useState('');
  const [delegates, setDelegates] = useState<DelegateDraft[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributorsFullyPaid, setContributorsFullyPaid] = useState(false);
  const [splitSubmitting, setSplitSubmitting] = useState(false);
  const [splitError, setSplitError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [childStatus, setChildStatus] = useState<string | null>(null);
  const [childActionLoading, setChildActionLoading] = useState(false);

  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isWebSocketAvailable, setIsWebSocketAvailable] = useState(true);
  const [receiptSharing, setReceiptSharing] = useState(false);
  const socketRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_POLLING_ATTEMPTS = 30;
  const POLLING_INTERVAL = 3000;
  const isConnectingRef = useRef(false);

  // ─── Reusable refresh helper ──────────────────────────────────────
  const refreshLinkAndContributors = async () => {
    try {
      const [linkRes, cRes] = await Promise.all([
        fetch(`/v1/payment-links/${slug}`),
        fetch(`/v1/payment-links/${slug}/contributors`),
      ]);
      if (linkRes.ok) {
        const linkJson = await linkRes.json();
        if (linkJson.success) setPaymentLink(linkJson.data);
      }
      if (cRes.ok) {
        const cJson = await cRes.json();
        if (cJson.success) {
          const list = (cJson.data.contributors || []).map((c: any) => ({
            id: c.billId,
            name: c.name,
            identifier: c.identifier,
            amount: c.amount,
            status:
              c.status === 'PAID' || c.status === 'COMPLETED' ? 'paid'
              : c.status === 'ACCEPTED' ? 'accepted'
              : c.status === 'REJECTED' ? 'rejected'
              : 'pending',
            isYou: c.isYou,
            payLink: c.payLink,
          }));
          setContributors(list);
          setContributorsFullyPaid(!!cJson.data.isFullyPaid);
        }
      }
    } catch (e) {
      console.warn('Refresh failed', e);
    }
  };

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    const fetchPaymentLink = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/v1/payment-links/${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Payment link not found');
        }
        if (isMounted) {
          setPaymentLink(data.data);
          if (data.data.price > 0) setAmount(data.data.price.toString());
          if (data.data.childStatus) setChildStatus(data.data.childStatus);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load payment link');
          setLoading(false);
        }
      }
    };
    fetchPaymentLink();
    return () => { isMounted = false; };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    const loadContributors = async () => {
      try {
        const res = await fetch(`/v1/payment-links/${slug}/contributors`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;
        if (isMounted) {
          const list = (json.data.contributors || []).map((c: any) => ({
            id: c.billId,
            name: c.name,
            identifier: c.identifier,
            amount: c.amount,
            status:
              c.status === 'PAID' || c.status === 'COMPLETED' ? 'paid'
              : c.status === 'ACCEPTED' ? 'accepted'
              : c.status === 'REJECTED' ? 'rejected'
              : 'pending',
            isYou: c.isYou,
            payLink: c.payLink,
          }));
          setContributors(list);
          setContributorsFullyPaid(!!json.data.isFullyPaid);
        }
      } catch {}
    };
    loadContributors();
    return () => { isMounted = false; };
  }, [slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;
    let socketInstance: any = null;
    const initWebSocket = async () => {
      if (isConnectingRef.current) return;
      isConnectingRef.current = true;
      try {
        const WS_URL = process.env.NEXT_PUBLIC_WS_URL ||
                       (typeof window !== 'undefined' && window.location.origin) ||
                       'wss://xecoflow-2gen.onrender.com';
        const { io } = await import('socket.io-client');
        socketInstance = io(WS_URL, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
          autoConnect: true
        });
        socketInstance.on('connect', () => {
          if (isMounted) {
            setIsSocketConnected(true);
            setIsWebSocketAvailable(true);
            isConnectingRef.current = false;
          }
        });
        socketInstance.on('disconnect', () => { if (isMounted) setIsSocketConnected(false); });
        socketInstance.on('connect_error', () => { if (isMounted) setIsSocketConnected(false); });
        socketInstance.on('payment:status', (data: any) => {
          if (isMounted) {
            if (data.status === 'COMPLETED' || data.status === 'SETTLED') {
              setPaymentStatus('success');
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              // Refetch so parent's own payment reflects
              setTimeout(() => { refreshLinkAndContributors(); }, 500);
            } else if (data.status === 'FAILED' || data.status === 'DECLINED') {
              setPaymentStatus('error');
              setErrorMessage(data.resultDesc || 'Payment failed. Please try again.');
              setShowRetry(true);
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            }
          }
        });
        socketRef.current = socketInstance;
      } catch {
        if (isMounted) {
          setIsWebSocketAvailable(false);
          setIsSocketConnected(false);
          isConnectingRef.current = false;
        }
      }
    };
    const timeoutId = setTimeout(() => { initWebSocket(); }, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      isConnectingRef.current = false;
      if (socketInstance) { socketInstance.disconnect(); socketInstance = null; }
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, []);

  const registerForPaymentUpdates = (checkoutId: string, transactionId: string) => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('register:payment', { checkoutId, transactionId });
        return true;
      }
    } catch {}
    return false;
  };

  const pollPaymentStatus = (txId: string) => {
    setPollingCount(0);
    setShowRetry(false);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      setPollingCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= MAX_POLLING_ATTEMPTS) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setPaymentStatus('error');
          setErrorMessage('Payment is taking longer than expected. Please check your M-PESA app.');
          setShowRetry(true);
          return newCount;
        }
        return newCount;
      });
      try {
        const res = await fetch(`/v1/product-links/status/${txId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const status = data.data;
          if (status.status === 'SETTLED' || status.status === 'COMPLETED') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setPaymentStatus('success');
            // Refetch so parent's own payment reflects
            await refreshLinkAndContributors();
          } else if (status.status === 'FAILED' || status.status === 'DECLINED' || status.status === 'TERMINATED_BY_TIMEOUT') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setPaymentStatus('error');
            setErrorMessage(status.resultDesc || 'Payment failed. Please try again.');
            setShowRetry(true);
          }
        }
      } catch {}
    }, POLLING_INTERVAL);
  };

  const formatPrice = (value: number, currency: string) =>
    `${currency} ${Number(value).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    let phone = phoneNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    else if (phone.startsWith('254')) phone = phone;
    else if (phone.length === 9 || phone.length === 10) {
      phone = phone.length === 9 ? '254' + phone : '254' + phone.slice(-9);
    } else phone = '254' + phone;
    phone = phone.replace(/\D/g, '');
    if (!phone || phone.length < 12) {
      setErrorMessage('Enter a valid 9-digit phone number (e.g., 712345678)');
      setPaymentStatus('error');
      return;
    }
    const amountToPay = Number(amount);
    if (!amountToPay || amountToPay <= 0) {
      setErrorMessage('Please enter a valid amount');
      setPaymentStatus('error');
      return;
    }
    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');
    setShowRetry(false);
    try {
      const res = await fetch('/v1/product-links/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: paymentLink?.billId,
          phone: phone,
          email: email || undefined,
          customerName: customerName || 'Customer',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const txId = data.data?.transactionId;
        const ckId = data.data?.checkoutRequestId;
        if (txId) {
          setTransactionId(txId);
          setCheckoutId(ckId || null);
          setPaymentStatus('pending');
          if (ckId && isWebSocketAvailable) {
            try { registerForPaymentUpdates(ckId, txId); } catch {}
          }
          pollPaymentStatus(txId);
        } else {
          setPaymentStatus('error');
          setErrorMessage('No transaction ID received. Please try again.');
        }
      } else {
        setPaymentStatus('error');
        setErrorMessage(data.error || 'Payment failed. Please try again.');
        setShowRetry(true);
      }
    } catch (err: any) {
      setPaymentStatus('error');
      setErrorMessage(err.message || 'Something went wrong.');
      setShowRetry(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const retryPayment = () => {
    setPaymentStatus('idle');
    setErrorMessage('');
    setShowRetry(false);
    setTransactionId(null);
    setCheckoutId(null);
    setPollingCount(0);
  };

  const openSplitModal = () => {
    setSplitNote('');
    setSplitError('');
    setDelegates([
      { id: `d_${Date.now()}`, name: '', phone: '', email: '', amount: '' },
    ]);
    setIsSplitModalOpen(true);
  };

  const closeSplitModal = () => setIsSplitModalOpen(false);

  const addDelegate = () => {
    if (delegates.length >= MAX_DELEGATES) return;
    setDelegates((prev) => [
      ...prev,
      { id: `d_${Date.now()}_${prev.length}`, name: '', phone: '', email: '', amount: '' },
    ]);
  };

  const removeDelegate = (id: string) => {
    setDelegates((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDelegate = (id: string, field: keyof DelegateDraft, value: string) => {
    setDelegates((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const delegatesTotal = Number(
    delegates.reduce((sum, d) => sum + (Number(d.amount) || 0), 0).toFixed(2)
  );
  const parentTotal = paymentLink?.price || 0;
  const splitRemaining = Number((parentTotal - delegatesTotal).toFixed(2));

  const handleSendSplitRequest = async () => {
    if (!paymentLink) return;
    setSplitError('');
    if (delegates.length === 0) { setSplitError('Add at least one person'); return; }
    if (delegates.length > MAX_DELEGATES) { setSplitError(`Maximum ${MAX_DELEGATES} people`); return; }
    for (let i = 0; i < delegates.length; i++) {
      const d = delegates[i];
      const num = i + 1;
      if (!d.name.trim()) { setSplitError(`Person ${num}: name is required`); return; }
      if (!d.phone && !d.email) { setSplitError(`Person ${num}: phone or email is required`); return; }
      const amt = Number(d.amount);
      if (!amt || amt <= 0) { setSplitError(`Person ${num}: amount must be greater than 0`); return; }
    }
    if (delegatesTotal > Number(parentTotal.toFixed(2))) {
      setSplitError(`Shares total (${delegatesTotal}) cannot exceed bill amount (${parentTotal})`);
      return;
    }
    setSplitSubmitting(true);
    try {
      const res = await fetch(`/v1/payment-links/${slug}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegates: delegates.map((d) => ({
            name: d.name.trim(),
            phone: d.phone || undefined,
            email: d.email || undefined,
            amount: Number(d.amount),
          })),
          yourShare: 0,
          note: splitNote || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSplitError(json.error || 'Failed to create split');
        return;
      }
      await refreshLinkAndContributors();
      setIsSplitModalOpen(false);
    } catch (err: any) {
      setSplitError(err.message || 'Something went wrong');
    } finally {
      setSplitSubmitting(false);
    }
  };

  const copyPayLink = async (contributorId: string, payLink?: string) => {
    if (!payLink) return;
    const fullUrl = `${window.location.origin}${payLink}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(contributorId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleAccept = async () => {
    if (!slug) return;
    setChildActionLoading(true);
    try {
      const res = await fetch(`/v1/payment-links/${slug}/accept`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setChildStatus('ACCEPTED');
      } else {
        setErrorMessage(json.error || 'Failed to accept');
        setPaymentStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      setPaymentStatus('error');
    } finally {
      setChildActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!slug) return;
    setChildActionLoading(true);
    try {
      const res = await fetch(`/v1/payment-links/${slug}/reject`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setChildStatus('REJECTED');
      } else {
        setErrorMessage(json.error || 'Failed to reject');
        setPaymentStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      setPaymentStatus('error');
    } finally {
      setChildActionLoading(false);
    }
  };

  // ─── Derived totals ───────────────────────────────────────────────
  const childrenCollected = contributors
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const total = paymentLink?.price || 0;
  const isParentPaid = paymentLink?.status === 'PAID' || paymentLink?.status === 'COMPLETED';
  const parentPaidAmount = isParentPaid
    ? Math.max(0, total - childrenCollected)
    : 0;
  const collected = Number((childrenCollected + parentPaidAmount).toFixed(2));
  const remaining = Math.max(0, total - collected);
  const isFullyPaid = isParentPaid || contributorsFullyPaid || collected >= total;
  const hasSplit = contributors.length > 0;
  const progressPct = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // ─── Receipt: draw, download, share ────────────────────────────────
  const getReceiptData = () => {
    const paidAmount = Number(amount || paymentLink?.price || 0);
    return {
      merchant: paymentLink?.businessName || 'Merchant',
      item: paymentLink?.name || 'Payment',
      amount: paidAmount,
      currency: paymentLink?.currency || 'KES',
      date: new Date(),
      reference: transactionId || paymentLink?.billId || slug || '—',
      methodLabel: METHOD_LOGOS[method]?.label || 'M-PESA',
    };
  };

  const drawReceiptCanvas = (): HTMLCanvasElement => {
    const data = getReceiptData();
    const scale = 2;
    const width = 480;
    const height = 620;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.scale(scale, scale);

    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // top accent bar
    ctx.fillStyle = '#10B981';
    ctx.fillRect(0, 0, width, 6);

    // success badge
    ctx.beginPath();
    ctx.arc(width / 2, 74, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#ECFDF5';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#10B981';
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(width / 2 - 10, 74);
    ctx.lineTo(width / 2 - 2, 83);
    ctx.lineTo(width / 2 + 13, 63);
    ctx.stroke();

    ctx.fillStyle = '#0a2540';
    ctx.font = '600 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Payment Successful', width / 2, 126);

    ctx.fillStyle = '#111827';
    ctx.font = '700 30px Arial';
    ctx.fillText(
      `${data.currency} ${data.amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      width / 2,
      165
    );

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 195);
    ctx.lineTo(width - 40, 195);
    ctx.stroke();

    const rows: [string, string][] = [
      ['Paid to', data.merchant],
      ['For', data.item],
      ['Payment method', data.methodLabel],
      ['Reference', String(data.reference)],
      ['Date', data.date.toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })],
    ];

    let y = 230;
    rows.forEach(([label, value]) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6b7280';
      ctx.font = '400 12.5px Arial';
      ctx.fillText(label, 40, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#111827';
      ctx.font = '600 12.5px Arial';
      const displayValue = value.length > 30 ? value.slice(0, 30) + '…' : value;
      ctx.fillText(displayValue, width - 40, y);
      y += 36;
    });

    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(40, y + 6);
    ctx.lineTo(width - 40, y + 6);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#9ca3af';
    ctx.font = '400 11px Arial';
    ctx.fillText('Powered by XecoFlow', width / 2, y + 36);

    return canvas;
  };

  const downloadReceipt = () => {
    const data = getReceiptData();
    const canvas = drawReceiptCanvas();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${data.reference}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const shareReceipt = async () => {
    setReceiptSharing(true);
    try {
      const data = getReceiptData();
      const text = `Payment of ${data.currency} ${data.amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${data.merchant} — Ref: ${data.reference}`;
      const canvas = drawReceiptCanvas();
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        if (blob) {
          const file = new File([blob], `receipt-${data.reference}.png`, { type: 'image/png' });
          if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
            await (navigator as any).share({ files: [file], title: 'Payment receipt', text });
            return;
          }
        }
        await (navigator as any).share({ title: 'Payment receipt', text });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedId('receipt');
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // user cancelled the native share sheet, or an error occurred — no-op
    } finally {
      setReceiptSharing(false);
    }
  };

  const receiptActions = (
    <div className="flex items-center gap-2 mt-5 w-full">
      <button
        type="button"
        onClick={downloadReceipt}
        className="flex-1 h-10 rounded-lg border border-gray-300 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors"
      >
        <Download className="w-3.5 h-3.5" /> Download
      </button>
      <button
        type="button"
        onClick={shareReceipt}
        disabled={receiptSharing}
        className="flex-1 h-10 rounded-lg bg-[#0a2540] text-white text-[13px] font-semibold hover:bg-[#152a45] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
      >
        {receiptSharing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : copiedId === 'receipt' ? (
          <><Check className="w-3.5 h-3.5" /> Copied</>
        ) : (
          <><Share2 className="w-3.5 h-3.5" /> Share</>
        )}
      </button>
    </div>
  );

  const renderPaymentStatus = () => {
    if (paymentStatus === 'processing') {
      return (
        <div className="flex items-start gap-3 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[13px]">Initiating payment...</p>
            <p className="text-blue-600 text-[12px] mt-0.5">Please wait while we connect to M-PESA</p>
          </div>
        </div>
      );
    }

    if (paymentStatus === 'pending') {
      const elapsedSec = pollingCount * (POLLING_INTERVAL / 1000);
      const mm = Math.floor(elapsedSec / 60);
      const ss = Math.floor(elapsedSec % 60);
      const pct = Math.min((pollingCount / MAX_POLLING_ATTEMPTS) * 100, 96);
      const radius = 26;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (pct / 100) * circumference;

      const steps = [
        { label: 'Request sent to your phone' },
        { label: 'Enter your PIN' },
        { label: `Confirming with ${METHOD_LOGOS[method]?.label || 'provider'}` },
      ];
      const activeStepIndex = pollingCount < 1 ? 0 : pollingCount < 3 ? 1 : 2;

      return (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 64 64" className="w-20 h-20 -rotate-90">
                <circle cx="32" cy="32" r={radius} fill="none" stroke="#FEF3C7" strokeWidth="5" />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-amber-600 animate-pulse" />
              </div>
            </div>

            <p className="mt-4 text-[14px] font-semibold text-gray-900">Waiting for confirmation</p>
            <p className="text-[12px] text-gray-500 mt-1">
              {mm}m {ss.toString().padStart(2, '0')}s elapsed
            </p>

            <div className="w-full mt-5 space-y-2.5 text-left">
              {steps.map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      idx < activeStepIndex ? 'bg-emerald-500' : idx === activeStepIndex ? 'bg-amber-500' : 'bg-gray-200'
                    }`}
                  >
                    {idx < activeStepIndex ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : idx === activeStepIndex ? (
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    ) : null}
                  </div>
                  <span
                    className={`text-[12.5px] ${
                      idx <= activeStepIndex ? 'text-gray-900 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="w-full mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5">
              {isSocketConnected ? (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <Wifi className="w-3.5 h-3.5" /> Live updates connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <WifiOff className="w-3.5 h-3.5" /> Checking status automatically
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus === 'error') {
      return (
        <div className="flex flex-col gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-medium text-[13px]">Payment Failed</p>
              <p className="text-red-600 text-[12px] mt-0.5">{errorMessage}</p>
            </div>
          </div>
          {showRetry && (
            <button onClick={retryPayment}
              className="mt-1 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors self-start">
              Try Again
            </button>
          )}
        </div>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-start gap-3 text-sm text-emerald-800">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <div>
              <p className="font-medium text-[13px]">Payment Successful!</p>
              <p className="text-emerald-600 text-[12px] mt-0.5">
                {formatPrice(Number(amount || paymentLink?.price || 0), paymentLink?.currency || 'KES')} paid successfully
              </p>
            </div>
          </div>
          {receiptActions}
        </div>
      );
    }

    return null;
  };

  const contributorStatusLabel = (status: Contributor['status']) => {
    if (status === 'paid') return { text: 'Paid', cls: 'text-emerald-600' };
    if (status === 'accepted') return { text: 'Accepted', cls: 'text-blue-600' };
    if (status === 'rejected') return { text: 'Rejected', cls: 'text-gray-500' };
    return { text: 'Waiting', cls: 'text-amber-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900">Link unavailable</h1>
          <p className="text-sm text-gray-500 mt-2">{error || 'This payment link may have expired.'}</p>
          <button onClick={() => router.push('/')}
            className="mt-5 text-sm font-medium text-[#635bff] hover:underline">
            Go home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(paymentLink.expiryDate) < new Date();
  const isPaid = paymentLink.status === 'PAID' || paymentLink.status === 'COMPLETED';
  const isFixedAmount = paymentLink.price > 0;
  const displayAmount = Number(amount || paymentLink.price || 0);
  const merchantName = paymentLink.businessName || 'Merchant';
  const isVerified = paymentLink.verified === true;
  const isChildBill = !!(paymentLink.parentBillId || paymentLink.isChild);
  const isMobileMoney = method === 'mpesa' || method === 'airtel' || method === 'tkash';
  const isChildPending = isChildBill && childStatus === 'PENDING';
  const isChildAccepted = isChildBill && childStatus === 'ACCEPTED';
  const isChildRejected = isChildBill && childStatus === 'REJECTED';

  const poweredBy = (
    <p className="text-[12px] text-gray-400 text-center lg:text-left">
      Powered by{' '}
      <span className="font-semibold text-gray-500">
        <span className="text-[#0a2540]">Xeco</span>
        <span className="text-[#10B981]">Flow</span>
      </span>
      <span className="mx-1.5">·</span>
      <Link href="/terms" className="hover:text-gray-600">Terms</Link>
      <span className="mx-1.5">·</span>
      <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
    </p>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">
        <div className="bg-[#f6f9fc] px-6 py-8 sm:px-10 lg:px-16 lg:py-12 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#0a2540] flex items-center justify-center shrink-0 overflow-hidden shadow-sm ring-2 ring-white">
                {paymentLink.logoUrl ? (
                  <img src={paymentLink.logoUrl} alt={merchantName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {merchantName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 truncate">{merchantName}</p>
                <p className="text-[11px] mt-0.5 flex items-center gap-1">
                  <span className="text-gray-400">Merchant</span>
                  {isVerified && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {isChildPending && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-amber-900 font-semibold">
                    You were invited to pay this share
                  </p>
                  <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">
                    This is part of a split bill from {merchantName}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={childActionLoading}
                  className="flex-1 h-9 rounded-lg border border-amber-300 bg-white text-[13px] font-medium text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={childActionLoading}
                  className="flex-1 h-9 rounded-lg bg-[#0a2540] text-white text-[13px] font-semibold hover:bg-[#152a45] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {childActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Accept'}
                </button>
              </div>
            </div>
          )}

          {isChildAccepted && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] text-emerald-800 font-medium">You accepted this split</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Pay {formatPrice(displayAmount, paymentLink.currency)} to complete your share.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isChildRejected && (
            <div className="mb-4 rounded-lg bg-gray-100 border border-gray-200 px-3.5 py-2.5">
              <div className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] text-gray-700 font-medium">You rejected this invitation</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Contact {merchantName} if this was a mistake.
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-1">Pay {merchantName}</p>
          <p className="text-[36px] sm:text-[40px] font-semibold text-gray-900 tracking-tight leading-none">
            {formatPrice(displayAmount, paymentLink.currency)}
          </p>

          <div className="mt-10 space-y-4 flex-1">
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-600">{paymentLink.name}</span>
              <span className="text-gray-900 font-medium tabular-nums">
                {formatPrice(displayAmount, paymentLink.currency)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-[14px]">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 tabular-nums">{formatPrice(displayAmount, paymentLink.currency)}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900 tabular-nums">{formatPrice(0, paymentLink.currency)}</span>
              </div>
              <div className="flex justify-between text-[15px] font-semibold">
                <span className="text-gray-900">Total due</span>
                <span className="text-gray-900 tabular-nums">{formatPrice(displayAmount, paymentLink.currency)}</span>
              </div>
            </div>

            {!isChildBill && !isFullyPaid && (
              <button type="button" onClick={openSplitModal}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-transparent text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                <Split className="w-4 h-4" />
                {hasSplit ? 'Change split' : 'Split this bill'}
              </button>
            )}

            {!isChildBill && isFullyPaid && (
              <div className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[13px] font-medium text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                Bill fully paid
              </div>
            )}

            {hasSplit && !isChildBill && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Contributors</p>
                  <span className="text-[11px] font-semibold text-gray-400">{contributors.length}</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {contributors.map((c, idx) => {
                    const label = contributorStatusLabel(c.status);
                    return (
                      <div key={c.id} className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-gray-900 truncate">
                            <span className="text-gray-400 mr-1">{idx + 1}.</span>
                            {c.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">{c.identifier}</p>
                          {c.status !== 'paid' && c.payLink && (
                            <button
                              type="button"
                              onClick={() => copyPayLink(c.id, c.payLink)}
                              className="text-[11px] text-[#0a2540] hover:text-[#635bff] font-mono truncate mt-1 block text-left underline underline-offset-2 max-w-full"
                              title="Click to copy"
                            >
                              {typeof window !== 'undefined' ? window.location.origin : ''}{c.payLink}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          <span className="text-[13px] font-semibold text-gray-900 tabular-nums">
                            {formatPrice(c.amount, paymentLink.currency)}
                          </span>
                          {c.status === 'paid' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <>
                              <span className={`text-[11px] font-medium ${label.cls}`}>{label.text}</span>
                              {c.payLink && (
                                <button type="button" onClick={() => copyPayLink(c.id, c.payLink)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                  title="Copy payment link">
                                  {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 tabular-nums min-w-[36px] text-right">
                      {progressPct}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Collected</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      {formatPrice(collected, paymentLink.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Remaining</span>
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {formatPrice(remaining, paymentLink.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 hidden lg:block">{poweredBy}</div>
        </div>

        <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12 flex flex-col justify-center">
          <div className="w-full max-w-[420px] mx-auto">
            <div className="flex items-center justify-end gap-2 mb-3">
              {isSocketConnected ? (
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] text-amber-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Polling
                </span>
              )}
            </div>

            {isPaid ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Payment successful</h2>
                <p className="text-sm text-gray-500 mt-2">
                  {formatPrice(displayAmount, paymentLink.currency)} paid to {merchantName}
                </p>
                {receiptActions}
              </div>
            ) : isChildPending ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-6 text-center">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <h2 className="text-base font-semibold text-gray-900">Action required</h2>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                  Please accept or reject this split invitation to continue.
                </p>
              </div>
            ) : isChildRejected ? (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-5 py-6 text-center">
                <XCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h2 className="text-base font-semibold text-gray-900">Invitation rejected</h2>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                  You declined this share. Nothing to pay.
                </p>
              </div>
            ) : isExpired ? (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900">Link expired</h2>
                <p className="text-sm text-gray-500 mt-2">Contact the merchant for a new link.</p>
              </div>
            ) : (
              <form onSubmit={handlePay} className="space-y-5">
                <div>
                  <p className="text-[13px] font-medium text-gray-700 mb-2.5">Pay with</p>
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(METHOD_LOGOS) as PayMethod[]).map((id) => {
                      const m = METHOD_LOGOS[id];
                      const active = method === id;
                      const broken = brokenLogos[id];
                      return (
                        <button key={id} type="button"
                          onClick={() => { setMethod(id); setPaymentStatus('idle'); setErrorMessage(''); }}
                          className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all ${
                            active ? `${m.activeBorder} bg-white shadow-sm` : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}>
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                            {!broken ? (
                              <img src={m.src} alt={m.label} className="w-7 h-7 object-contain"
                                onError={() => setBrokenLogos((prev) => ({ ...prev, [id]: true }))} />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-600">{m.label.slice(0, 2)}</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-semibold ${active ? 'text-gray-900' : 'text-gray-500'}`}>
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {renderPaymentStatus()}

                {(paymentStatus === 'idle' || paymentStatus === 'error') && (
                  <>
                    {!isFixedAmount && (
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Amount</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00" min={1} step="0.01" required disabled={isProcessing}
                          className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60" />
                      </div>
                    )}

                    {isMobileMoney && (
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          {method === 'mpesa' ? 'M-PESA number' : method === 'airtel' ? 'Airtel Money number' : 'T-Kash number'}
                        </label>
                        <div className="flex h-11 rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/30 focus-within:border-[#635bff]">
                          <span className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 text-[13px] text-gray-500 shrink-0">
                            <Smartphone className="w-4 h-4" /> +254
                          </span>
                          <input type="tel" inputMode="numeric" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="712071385" disabled={isProcessing}
                            className="flex-1 min-w-0 px-3 text-sm outline-none disabled:opacity-60" />
                        </div>
                      </div>
                    )}

                    {method === 'card' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Card number</label>
                          <input type="text" placeholder="4242 4242 4242 4242" disabled={isProcessing}
                            className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Expiry</label>
                            <input type="text" placeholder="MM / YY" disabled={isProcessing}
                              className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">CVC</label>
                            <input type="text" placeholder="123" disabled={isProcessing}
                              className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60" />
                          </div>
                        </div>
                      </div>
                    )}

                    {method === 'paypal' && (
                      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-[13px] text-blue-800">
                        You'll be redirected to PayPal to complete payment securely.
                      </div>
                    )}

                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com" disabled={isProcessing}
                          className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                        Name <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Full name" disabled={isProcessing}
                          className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60" />
                      </div>
                    </div>

                    <button type="submit" disabled={isProcessing}
                      className="w-full h-11 bg-[#0a2540] hover:bg-[#152a45] text-white rounded-lg font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                      ) : (
                        <>Pay {formatPrice(displayAmount, paymentLink.currency)}</>
                      )}
                    </button>

                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                      <Shield className="w-3 h-3 text-emerald-500" /> Secure payment
                    </p>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      <footer className="lg:hidden border-t border-gray-100 px-6 py-5">{poweredBy}</footer>

      {isSplitModalOpen && paymentLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={closeSplitModal}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a2540]">
                  <Split className="w-4 h-4 text-white" />
                </span>
                <h3 className="text-[15px] font-semibold text-gray-900">Split this bill</h3>
              </div>
              <button type="button" onClick={closeSplitModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4 overflow-y-auto flex-1">
              {delegates.map((d, idx) => (
                <div key={d.id} className="rounded-xl border border-gray-200 p-3.5 space-y-2.5 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-gray-700">Person {idx + 1}</p>
                    {delegates.length > 1 && (
                      <button type="button" onClick={() => removeDelegate(d.id)}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input type="text" value={d.name} onChange={(e) => updateDelegate(d.id, 'name', e.target.value)}
                    placeholder="Full name"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]" />
                  <div className="flex h-10 rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/30 focus-within:border-[#635bff]">
                    <span className="flex items-center gap-1.5 px-2.5 bg-gray-50 border-r border-gray-200 text-[12px] text-gray-500 shrink-0">
                      <Smartphone className="w-3.5 h-3.5" /> +254
                    </span>
                    <input type="tel" inputMode="numeric" value={d.phone}
                      onChange={(e) => updateDelegate(d.id, 'phone', e.target.value)}
                      placeholder="712345678"
                      className="flex-1 min-w-0 px-2.5 text-sm outline-none" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={d.email}
                      onChange={(e) => updateDelegate(d.id, 'email', e.target.value)}
                      placeholder="Or their email"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]" />
                  </div>
                  <input type="number" value={d.amount}
                    onChange={(e) => updateDelegate(d.id, 'amount', e.target.value)}
                    placeholder="Amount they will cover (KES)"
                    min={1} step="0.01"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]" />
                </div>
              ))}

              {delegates.length < MAX_DELEGATES && (
                <button type="button" onClick={addDelegate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add another person ({delegates.length}/{MAX_DELEGATES})
                </button>
              )}

              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3.5 py-3">
                <div className="flex justify-between text-[13px] font-semibold">
                  <span className="text-gray-900">Total assigned</span>
                  <span className={`tabular-nums ${
                    delegatesTotal > Number(paymentLink.price.toFixed(2))
                      ? 'text-red-600'
                      : delegatesTotal === Number(paymentLink.price.toFixed(2))
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}>
                    {formatPrice(delegatesTotal, paymentLink.currency)}
                    <span className="text-gray-400 font-normal ml-1">
                      / {formatPrice(paymentLink.price, paymentLink.currency)}
                    </span>
                  </span>
                </div>
                {delegatesTotal < Number(paymentLink.price.toFixed(2)) && (
                  <p className="text-[11px] text-amber-600 mt-1.5">
                    {formatPrice(splitRemaining, paymentLink.currency)} still unassigned — you can invite more people later
                  </p>
                )}
                {delegatesTotal > Number(paymentLink.price.toFixed(2)) && (
                  <p className="text-[11px] text-red-600 mt-1.5">
                    Total exceeds bill by {formatPrice(Math.abs(splitRemaining), paymentLink.currency)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Add a note <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="text" value={splitNote}
                  onChange={(e) => setSplitNote(e.target.value)}
                  placeholder='e.g. "For Sunday offering"'
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]" />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-3 shrink-0">
              {splitError && (
                <div className="flex items-start gap-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{splitError}</span>
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={closeSplitModal} disabled={splitSubmitting}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleSendSplitRequest} disabled={splitSubmitting}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#0a2540] text-white hover:bg-[#152a45] transition-colors disabled:opacity-50 flex items-center gap-2">
                  {splitSubmitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                  ) : 'Send request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}