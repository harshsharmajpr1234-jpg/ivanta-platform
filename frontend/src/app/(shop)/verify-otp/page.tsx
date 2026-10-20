'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, FieldError } from '@/components/ui/input';
import { authService } from '@/services';
import { useAuthStore } from '@/store/auth';

function OtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const identifier = params.get('identifier') ?? '';
  const next = params.get('next') ?? '/account';
  const name = params.get('name') ?? undefined;
  const setUser = useAuthStore((s) => s.setUser);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (!identifier) router.replace('/login'); }, [identifier, router]);
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const otp = digits.join('');

  const resend = async () => {
    setError('');
    try {
      const res = await authService.requestOtp(identifier, name);
      setSecondsLeft(res.expiresInSeconds || 300);
      if (res.devOtp) setDevOtp(res.devOtp);
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not resend OTP'); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setBusy(true); setError('');
    try {
      const user = await authService.verifyOtp(identifier, otp, name);
      setUser(user);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally { setBusy(false); }
  };

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    if (!clean) { setDigits((d) => d.map((x, idx) => (idx === i ? '' : x))); return; }
    // support pasted full code
    if (clean.length > 1) {
      const all = clean.slice(0, 6).split('');
      setDigits((d) => d.map((x, idx) => all[idx] ?? x));
      refs.current[Math.min(all.length, 5)]?.focus();
      return;
    }
    setDigits((d) => d.map((x, idx) => (idx === i ? clean : x)));
    if (i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <div className="bg-surface-sunk/50">
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-soft">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"><MailCheck className="h-6 w-6" /></span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Enter verification code</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
            We sent a 6-digit code to <span className="font-semibold text-ink">{identifier}</span>.
            {secondsLeft > 0 && <> It expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}.</>}
          </p>
          {devOtp && (
            <p className="mt-3 rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-[12.5px] font-medium text-accent">
              Development mode — your code is <span className="font-mono font-bold">{devOtp}</span>
            </p>
          )}
          <form onSubmit={verify} className="mt-6 space-y-4">
            <div className="flex justify-between gap-2" role="group" aria-label="One-time password">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={6}
                  aria-label={`Digit ${i + 1}`}
                  className="h-14 w-full min-w-0 rounded-2xl border border-line-strong bg-surface text-center text-[20px] font-bold text-ink outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
              ))}
            </div>
            {error && <FieldError message={error} />}
            <Button type="submit" size="lg" className="w-full" loading={busy} disabled={otp.length !== 6}>
              {busy ? 'Verifying…' : <>Verify & continue <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-[12.5px]">
            <button type="button" onClick={() => void resend()} disabled={secondsLeft > 0}
              className="font-semibold text-accent hover:underline disabled:text-ink-faint disabled:no-underline">
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
            </button>
            <Link href="/login" className="font-medium text-ink-muted hover:text-ink">Change email/phone</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-24"><div className="h-96 animate-pulse rounded-3xl bg-surface-sunk" /></div>}>
      <OtpForm />
    </Suspense>
  );
}
