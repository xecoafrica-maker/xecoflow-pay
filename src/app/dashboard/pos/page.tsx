// src/app/dashboard/pos/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Zap,
  Printer,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  User,
  Phone,
  Coins,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  History,
  X as XIcon,
  Store,
  CreditCard,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock as ClockIcon,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface Transaction {
  id: string;
  phoneNumber: string;
  amount: number;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'timeout';
  timestamp: string;
  mpesaReceipt?: string;
  customerName?: string;
}

// ─── Sound Effects ──────────────────────────────────────────────────
const playSound = (type: 'success' | 'error' | 'pending') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'success') {
      const frequencies = [523.25, 659.25, 783.99];
      frequencies.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start(audioContext.currentTime + i * 0.1);
        oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
      });
    } else if (type === 'error') {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      gainNode.gain.value = 0.2;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } else {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.15;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  } catch (e) {
    // Silently fail if audio context is not available
  }
};

export default function POSTerminalPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to accept payments');
  const [isLocked, setIsLocked] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Auto-focus phone input ──────────────────────────────────────
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // ─── Keyboard Shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ENTER to submit
      if (e.key === 'Enter' && !e.shiftKey) {
        if (phoneNumber && amount && !isLocked) {
          handleSubmit();
        }
      }
      // ESC to clear
      if (e.key === 'Escape') {
        handleClear();
      }
      // F11 for fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phoneNumber, amount, isLocked]);

  // ─── Toggle Fullscreen ──────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // ─── Toggle Lock ──────────────────────────────────────────────────
  const toggleLock = () => {
    setIsLocked(!isLocked);
    if (!isLocked) {
      setStatusMessage('🔒 Terminal locked - Enter PIN to unlock');
    } else {
      setStatusMessage('Ready to accept payments');
    }
  };

  // ─── Format Phone Number ─────────────────────────────────────────
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 12) {
      setPhoneNumber(raw);
    }
  };

  // ─── Handle Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isLocked) {
      setStatusMessage('🔒 Terminal is locked. Unlock first.');
      return;
    }

    if (!phoneNumber || !amount) {
      setStatusMessage('⚠️ Please enter phone number and amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setStatusMessage('⚠️ Please enter a valid amount');
      return;
    }

    if (phoneNumber.length < 10) {
      setStatusMessage('⚠️ Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setStatusMessage('⏳ Sending payment request to customer...');
    if (isSoundEnabled) playSound('pending');

    const txId = `TX-${Date.now().toString().slice(-8)}`;
    const ref = reference || `POS-${Date.now().toString().slice(-6)}`;

    const newTransaction: Transaction = {
      id: txId,
      phoneNumber: phoneNumber,
      amount: amountNum,
      reference: ref,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    setTransaction(newTransaction);

    setTimeout(() => {
      setStatusMessage('⏳ Customer prompted. Waiting for PIN...');
      
      const isSuccess = Math.random() < 0.8;
      
      setTimeout(() => {
        if (isSuccess) {
          const completedTx: Transaction = {
            ...newTransaction,
            status: 'completed',
            mpesaReceipt: `QJK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            customerName: ['John Mwangi', 'Sarah Wanjiru', 'Peter Ochieng', 'Grace Akinyi'][Math.floor(Math.random() * 4)],
          };
          setTransaction(completedTx);
          setStatusMessage(`✅ Payment received! Receipt: ${completedTx.mpesaReceipt}`);
          if (isSoundEnabled) playSound('success');
          
          setTransactionHistory(prev => [completedTx, ...prev]);
          
          setTimeout(() => {
            if (!document.fullscreenElement) {
              handleClear();
            }
          }, 5000);
        } else {
          const failedTx: Transaction = {
            ...newTransaction,
            status: 'failed',
          };
          setTransaction(failedTx);
          setStatusMessage('❌ Payment failed. Please try again.');
          if (isSoundEnabled) playSound('error');
          
          setTimeout(() => {
            if (!document.fullscreenElement) {
              handleClear();
            }
          }, 3000);
        }
        setIsLoading(false);
      }, 2000);
    }, 1500);
  };

  // ─── Clear Form ──────────────────────────────────────────────────
  const handleClear = () => {
    setPhoneNumber('');
    setAmount('');
    setReference('');
    setTransaction(null);
    setStatusMessage('Ready to accept payments');
    setIsLoading(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // ─── Next Customer ──────────────────────────────────────────────
  const handleNextCustomer = () => {
    handleClear();
  };

  // ─── Print Receipt ──────────────────────────────────────────────
  const handlePrintReceipt = () => {
    if (!transaction || transaction.status !== 'completed') return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XecoFlow Receipt</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
          .receipt { max-width: 300px; margin: 0 auto; text-align: center; }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 15px; }
          .header h2 { color: #0a2540; margin: 0; }
          .header h2 span { color: #10b981; }
          .subtitle { color: #6b7280; font-size: 12px; margin: 4px 0 0; }
          .divider { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
          .row .label { color: #6b7280; }
          .row .value { font-weight: 600; color: #1f2937; }
          .amount { font-size: 24px; font-weight: 700; color: #10b981; margin: 10px 0; }
          .footer { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 11px; color: #9ca3af; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #d1fae5; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>Xeco<span>Flow</span></h2>
            <p class="subtitle">Payment Receipt</p>
          </div>
          
          <div class="status">✅ PAID</div>
          
          <div class="amount">KES ${transaction.amount.toLocaleString()}</div>
          
          <hr class="divider" />
          
          <div class="row">
            <span class="label">Receipt No.</span>
            <span class="value">${transaction.mpesaReceipt || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Date</span>
            <span class="value">${new Date(transaction.timestamp).toLocaleString()}</span>
          </div>
          <div class="row">
            <span class="label">Customer</span>
            <span class="value">${transaction.customerName || transaction.phoneNumber}</span>
          </div>
          <div class="row">
            <span class="label">Phone</span>
            <span class="value">${transaction.phoneNumber}</span>
          </div>
          <div class="row">
            <span class="label">Reference</span>
            <span class="value">${transaction.reference}</span>
          </div>
          
          <hr class="divider" />
          
          <p style="font-size: 12px; color: #4b5563;">Thank you for your payment!</p>
          
          <div class="footer">
            <p>Powered by XecoFlow</p>
            <p style="font-size: 9px; color: #d1d5db;">Secure Payment Solutions</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ─── Get Status Display ──────────────────────────────────────────
  const getStatusDisplay = () => {
    if (isLocked) {
      return { icon: AlertTriangle, text: 'Terminal Locked', color: 'text-red-500', bg: 'bg-red-50' };
    }
    if (!transaction) {
      return { icon: Clock, text: 'Ready for payment', color: 'text-gray-400', bg: 'bg-gray-50' };
    }
    switch (transaction.status) {
      case 'pending':
        return { icon: Clock, text: 'Waiting for customer PIN...', color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'completed':
        return { icon: CheckCircle, text: 'Payment Received!', color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'failed':
        return { icon: XCircle, text: 'Payment Failed', color: 'text-red-500', bg: 'bg-red-50' };
      case 'timeout':
        return { icon: AlertCircle, text: 'Payment Timeout', color: 'text-orange-500', bg: 'bg-orange-50' };
      default:
        return { icon: Clock, text: 'Waiting...', color: 'text-gray-400', bg: 'bg-gray-50' };
    }
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;

  // ─── Today's Stats ──────────────────────────────────────────────
  const todayTransactions = transactionHistory.filter(t => 
    new Date(t.timestamp).toDateString() === new Date().toDateString()
  );
  const todayVolume = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
  const todayCompleted = todayTransactions.filter(t => t.status === 'completed').length;

  return (
    <div className={`min-h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0a2540] to-[#1a3a5c] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-400" />
              <h1 className="text-lg font-bold text-white">Xeco<span className="text-emerald-400">Flow</span></h1>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">POS</span>
            </div>
            <p className="text-xs text-white/60">Counter Register • Virtual Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-lg">
            <span>Today: <strong className="text-white">{todayCompleted}</strong> txns</span>
            <span className="w-px h-4 bg-white/10" />
            <span>KES <strong className="text-white">{todayVolume.toLocaleString()}</strong></span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            title="Transaction History"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            {isSoundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={toggleLock}
            className={`p-2 rounded-lg transition-colors ${
              isLocked 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title={isLocked ? 'Unlock Terminal' : 'Lock Terminal'}
          >
            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ─── Left: Input Form (3 columns) ────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Enter Payment Details
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> Submit
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> Clear
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Phone Number - Large & Prominent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Customer Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      ref={inputRef}
                      type="tel"
                      value={formatPhoneNumber(phoneNumber)}
                      onChange={handlePhoneChange}
                      placeholder="0712 345 678"
                      className={`w-full pl-10 pr-4 py-3.5 text-lg bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                        isLocked ? 'border-gray-200 opacity-60' : 'border-gray-200'
                      }`}
                      disabled={isLoading || !!transaction || isLocked}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Amount (KES)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Coins className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-10 pr-4 py-3.5 text-lg bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                          isLocked ? 'border-gray-200 opacity-60' : 'border-gray-200'
                        }`}
                        disabled={isLoading || !!transaction || isLocked}
                      />
                    </div>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Receipt #"
                      className={`w-full px-4 py-3.5 text-sm bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                        isLocked ? 'border-gray-200 opacity-60' : 'border-gray-200'
                      }`}
                      disabled={isLoading || !!transaction || isLocked}
                    />
                  </div>
                </div>

                {/* Actions - Big Prominent Button */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !!transaction || !phoneNumber || !amount || isLocked}
                    className={`flex-1 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 text-lg ${
                      isLoading || transaction || isLocked || !phoneNumber || !amount
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transform hover:scale-[1.02]'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        Processing...
                      </>
                    ) : isLocked ? (
                      <>
                        <Lock className="w-6 h-6" />
                        Terminal Locked
                      </>
                    ) : (
                      <>
                        <Zap className="w-6 h-6" />
                        Prompt Customer
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="px-8 py-4 border-2 border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>

                {/* Status Message */}
                <div className={`flex items-center gap-3 p-3 rounded-xl ${status.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${status.color}`} />
                  <p className="text-sm font-medium text-gray-900">{statusMessage}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right: Live Status (2 columns) ───────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Live Transaction
              </h3>

              {transaction ? (
                <div className="space-y-4">
                  {/* Status Indicator - Big */}
                  <div className={`p-6 rounded-xl text-center ${status.bg}`}>
                    <StatusIcon className={`w-16 h-16 mx-auto ${status.color}`} />
                    <p className={`text-xl font-bold mt-3 ${status.color}`}>{status.text}</p>
                    {transaction.status === 'completed' && transaction.mpesaReceipt && (
                      <p className="text-sm text-emerald-600 mt-2 font-medium">
                        Ref: {transaction.mpesaReceipt}
                      </p>
                    )}
                    {transaction.status === 'pending' && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-xs text-amber-600">Waiting for customer...</span>
                      </div>
                    )}
                  </div>

                  {/* Transaction Details */}
                  <div className="space-y-2 text-sm bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-medium text-gray-900">
                        {transaction.customerName || transaction.phoneNumber}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-mono text-gray-900">{transaction.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-bold text-xl text-emerald-600">
                        KES {transaction.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Reference</span>
                      <span className="font-mono text-gray-900">{transaction.reference}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">Time</span>
                      <span className="text-gray-600 text-xs">
                        {new Date(transaction.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {transaction.status === 'completed' && (
                      <>
                        <button
                          onClick={handlePrintReceipt}
                          className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          Print Receipt
                        </button>
                        <button
                          onClick={handleNextCustomer}
                          className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all"
                        >
                          Next Customer
                        </button>
                      </>
                    )}
                    {transaction.status === 'failed' && (
                      <button
                        onClick={handleClear}
                        className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all"
                      >
                        Try Again
                      </button>
                    )}
                    {transaction.status === 'pending' && (
                      <button
                        onClick={handleClear}
                        className="flex-1 py-3 border-2 border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 transition-all"
                      >
                        Cancel Transaction
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Smartphone className="w-12 h-12 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 mt-4 font-medium">No active transaction</p>
                  <p className="text-xs text-gray-300 mt-1">Enter customer details and tap Prompt Customer</p>
                  {isLocked && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm">
                      <Lock className="w-4 h-4" />
                      Terminal is locked
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Quick Stats ────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-gray-500">Today</p>
                  <p className="text-lg font-bold text-emerald-600">{todayCompleted}</p>
                  <p className="text-[10px] text-gray-400">Transactions</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">Volume</p>
                  <p className="text-lg font-bold text-blue-600">KES {todayVolume.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Today's total</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-purple-600">{transactionHistory.length}</p>
                  <p className="text-[10px] text-gray-400">All time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Transaction History Modal ─────────────────────────── */}
        {showHistory && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden mx-4">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                {transactionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {transactionHistory.map((tx) => (
                      <div
                        key={tx.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          tx.status === 'completed'
                            ? 'border-emerald-200 bg-emerald-50/30'
                            : tx.status === 'failed'
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-amber-200 bg-amber-50/30'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{tx.customerName || tx.phoneNumber}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                          {tx.mpesaReceipt && (
                            <p className="text-xs text-emerald-600 font-mono">Ref: {tx.mpesaReceipt}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">KES {tx.amount.toLocaleString()}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            tx.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tx.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 text-gray-200 mx-auto" />
                    <p className="text-gray-400 mt-3">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Icons ──────────────────────────────────────────────────────────
const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const Unlock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);