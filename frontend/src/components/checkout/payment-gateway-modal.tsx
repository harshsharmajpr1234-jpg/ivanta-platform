'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Loader2, Lock, ShieldCheck,
  Smartphone, CreditCard, Landmark, Wallet, QrCode, X, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { inr } from '@/lib/utils';
import type { OrderDetail, Payment, PaymentMethod } from '@/types';

interface PaymentGatewayModalProps {
  open: boolean;
  payment: Payment;
  order: OrderDetail;
  method: PaymentMethod;
  onAuthorize: () => Promise<void>;
  onCancel: () => Promise<void>;
}

const BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', popular: true },
  { id: 'SBI', name: 'State Bank of India', popular: true },
  { id: 'ICICI', name: 'ICICI Bank', popular: true },
  { id: 'AXIS', name: 'Axis Bank', popular: true },
  { id: 'KOTAK', name: 'Kotak Mahindra Bank', popular: true },
  { id: 'PNB', name: 'Punjab National Bank', popular: false },
];

export function PaymentGatewayModal({
  open,
  payment,
  order,
  method,
  onAuthorize,
  onCancel,
}: PaymentGatewayModalProps) {
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [upiId, setUpiId] = useState('customer@upi');
  const [upiTab, setUpiTab] = useState<'qr' | 'id'>('qr');
  const [processingState, setProcessingState] = useState<'idle' | 'connecting' | 'verifying' | 'success' | 'failed'>('idle');
  const [timeLeft, setTimeLeft] = useState(300); // 5 min countdown

  useEffect(() => {
    if (!open) {
      setProcessingState('idle');
      setTimeLeft(300);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handlePay = async () => {
    setProcessingState('connecting');
    await new Promise((r) => setTimeout(r, 900));
    setProcessingState('verifying');
    await new Promise((r) => setTimeout(r, 900));
    try {
      await onAuthorize();
      setProcessingState('success');
    } catch {
      setProcessingState('failed');
    }
  };

  const handleCancelClick = async () => {
    setProcessingState('idle');
    await onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-2xl animate-scale-up">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-line bg-surface-sunk/70 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-bold text-ink">Flyphones Secure Gateway</p>
              <p className="text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> 256-bit Encrypted · Sandbox
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={processingState !== 'idle'}
            onClick={handleCancelClick}
            className="rounded-full p-1 text-ink-muted hover:bg-surface-sunk transition-colors disabled:opacity-40"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount & Order Rail */}
        <div className="border-b border-line/60 bg-surface px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-faint">Order Total</p>
            <p className="text-[20px] font-black text-ink">{inr(payment.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-ink-faint">Order Ref</p>
            <p className="text-[12px] font-mono font-semibold text-ink-soft">#{order.orderNumber || order.id.slice(0, 10)}</p>
          </div>
        </div>

        {/* Processing State Overlay */}
        {processingState !== 'idle' ? (
          <div className="p-8 text-center space-y-4 min-h-[300px] flex flex-col items-center justify-center">
            {processingState === 'connecting' && (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-accent" />
                <p className="text-[15px] font-semibold text-ink">Connecting to Banking Network…</p>
                <p className="text-[12px] text-ink-muted">Please do not refresh or close this window.</p>
              </>
            )}
            {processingState === 'verifying' && (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <p className="text-[15px] font-semibold text-ink">Authorizing payment of {inr(payment.amount)}…</p>
                <p className="text-[12px] text-ink-muted">Verifying HMAC security token with bank server.</p>
              </>
            )}
            {processingState === 'success' && (
              <>
                <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-scale-up" />
                <p className="text-[16px] font-bold text-ink">Payment Successful!</p>
                <p className="text-[12px] text-ink-muted">Redirecting to Order Confirmation…</p>
              </>
            )}
            {processingState === 'failed' && (
              <>
                <XCircle className="h-12 w-12 text-rose-600 animate-scale-up" />
                <p className="text-[16px] font-bold text-ink">Payment Failed or Declined</p>
                <p className="text-[12px] text-ink-muted">Bank returned a decline code. Your account was not charged.</p>
                <Button size="sm" onClick={() => setProcessingState('idle')}>Try Again</Button>
              </>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            
            {/* Method: UPI */}
            {method === 'UPI' && (
              <div className="space-y-3.5">
                <div className="flex rounded-xl bg-surface-sunk p-1 text-[12px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setUpiTab('qr')}
                    className={`flex-1 rounded-lg py-1.5 transition-colors ${upiTab === 'qr' ? 'bg-white shadow-soft text-ink' : 'text-ink-muted'}`}
                  >
                    Scan QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiTab('id')}
                    className={`flex-1 rounded-lg py-1.5 transition-colors ${upiTab === 'id' ? 'bg-white shadow-soft text-ink' : 'text-ink-muted'}`}
                  >
                    UPI ID / VPA
                  </button>
                </div>

                {upiTab === 'qr' ? (
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-line bg-surface/50 text-center space-y-2.5">
                    {/* Simulated QR Code Canvas */}
                    <div className="relative flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-ink/20 bg-white p-2 shadow-inner">
                      <QrCode className="h-28 w-28 text-ink/85" />
                      <div className="absolute inset-x-0 bottom-1 text-[9px] font-bold tracking-tight text-accent bg-white/90 py-0.5">
                        Flyphones UPI Gateway
                      </div>
                    </div>
                    <p className="text-[12px] font-medium text-ink">Scan using Google Pay, PhonePe, Paytm or BHIM</p>
                    <p className="text-[11px] text-ink-faint">Expires in: <span className="font-mono font-bold text-accent">{timerStr}</span></p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[11.5px] font-semibold text-ink">Enter your UPI ID</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        className="h-10 w-full rounded-xl border border-line pl-9 pr-3 text-[13px] text-ink focus:border-accent focus:outline-none"
                      />
                    </div>
                    <p className="text-[10.5px] text-ink-muted">A payment collect request will be authorized instantly.</p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted justify-center">
                  <span>Supported:</span>
                  <span className="font-semibold text-ink">GPay</span> ·
                  <span className="font-semibold text-ink">PhonePe</span> ·
                  <span className="font-semibold text-ink">Paytm</span> ·
                  <span className="font-semibold text-ink">CRED</span>
                </div>
              </div>
            )}

            {/* Method: NETBANKING */}
            {method === 'NETBANKING' && (
              <div className="space-y-3">
                <p className="text-[12px] font-semibold text-ink">Select your Bank:</p>
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-[12px] font-medium transition-all ${
                        selectedBank === b.id
                          ? 'border-accent bg-accent-soft text-accent ring-1 ring-accent'
                          : 'border-line bg-white text-ink hover:bg-surface-sunk'
                      }`}
                    >
                      <Landmark className="h-4 w-4 shrink-0 text-ink-muted" />
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-ink-faint shrink-0" />
                  You will be securely connected to {BANKS.find((b) => b.id === selectedBank)?.name} portal.
                </p>
              </div>
            )}

            {/* Method: CARD */}
            {method === 'CARD' && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-line bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-soft">
                  <div className="flex justify-between items-center text-[11px] text-slate-300">
                    <span>TEST CARD</span>
                    <CreditCard className="h-5 w-5 text-white/80" />
                  </div>
                  <p className="mt-3 font-mono text-[16px] tracking-widest text-slate-100">4532 •••• •••• 8899</p>
                  <div className="mt-3 flex justify-between text-[11px] text-slate-300">
                    <span>EXP: 12/28</span>
                    <span>CVV: •••</span>
                  </div>
                </div>
                <p className="text-[11px] text-ink-muted text-center">3D Secure OTP verification simulated automatically.</p>
              </div>
            )}

            {/* Method: WALLET */}
            {method === 'WALLET' && (
              <div className="space-y-3">
                <p className="text-[12px] font-semibold text-ink">Select Wallet:</p>
                <div className="space-y-2">
                  {['Paytm Wallet', 'Amazon Pay', 'PhonePe Wallet'].map((w, idx) => (
                    <label key={w} className="flex items-center gap-2.5 rounded-xl border border-line p-3 text-[12.5px] cursor-pointer hover:bg-surface-sunk">
                      <input type="radio" name="wallet" defaultChecked={idx === 0} className="text-accent" />
                      <Wallet className="h-4 w-4 text-ink-muted" />
                      <span className="font-medium text-ink">{w}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Button
                size="lg"
                onClick={handlePay}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-[14px]"
              >
                Pay {inr(payment.amount)} & Authorize
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelClick}
                className="w-full text-danger hover:bg-danger-soft h-9 text-[12px]"
              >
                Cancel Payment (Order Will Not Be Placed)
              </Button>
            </div>

            <p className="text-center text-[10.5px] text-ink-faint">
              Sandbox test environment. No actual bank money is debited.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
