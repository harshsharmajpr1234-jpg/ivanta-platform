'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, KeyRound, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { adminAuthService } from '@/services/auth';
import { useAuthStore } from '@/store/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const setAdmin = useAuthStore((s) => s.setAdmin);
  const [step, setStep] = useState<'creds' | '2fa'>('creds');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await adminAuthService.login(email, password);
      if (!res.authenticated) { setError('Invalid credentials'); setBusy(false); return; }
      if (res.requireOtp) { setStep('2fa'); setBusy(false); return; }
      setAdmin(res.admin ?? await adminAuthService.me());
      router.push('/admin');
    } catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); setBusy(false); }
  };

  const verify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await adminAuthService.login2fa(email, otp);
      if (!res.authenticated) { setError('Invalid code'); setBusy(false); return; }
      setAdmin(res.admin ?? await adminAuthService.me());
      router.push('/admin');
    } catch (err) { setError(err instanceof Error ? err.message : '2FA verification failed'); setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-white/10">
            <img src="/logo-icon.png" alt="Flyphones — Powered by Hansh Technologies" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Flyphones Admin Console</h1>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[13px] text-white/50">
            <Lock className="h-3.5 w-3.5" /> Restricted area — all access is logged
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
          {step === 'creds' ? (
            <form onSubmit={login} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="a-email" required><span className="text-white/80">Work email</span></Label>
                <Input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@flyphones.in" className="border-white/20 bg-white/10 text-white placeholder:text-white/30" />
              </div>
              <div>
                <Label htmlFor="a-pass" required><span className="text-white/80">Password</span></Label>
                <Input id="a-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Flyphones@••••••" className="border-white/20 bg-white/10 text-white placeholder:text-white/30" />
              </div>
              {error && (
                <p className="flex items-start gap-2 rounded-xl bg-red-500/15 px-3.5 py-2.5 text-[12.5px] font-medium text-red-300">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </p>
              )}
              <button type="submit" disabled={busy || !email || !password}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-ink transition-all hover:bg-white/90 disabled:opacity-40">
                {busy ? <Spinner className="h-4 w-4" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </button>

              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] text-white/40">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@flyphones.in'); setPassword('Flyphones@Admin123'); }}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/20 transition-colors"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('delivery@flyphones.in'); setPassword('Flyphones@Delivery123'); }}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/20 transition-colors"
                >
                  Delivery Manager
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('orders@flyphones.in'); setPassword('Flyphones@Orders123'); }}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/20 transition-colors"
                >
                  Orders
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={verify2fa} className="space-y-4" noValidate>
              <div className="flex items-center gap-2.5 rounded-xl bg-blue/20 px-3.5 py-2.5 text-[12.5px] text-blue-200">
                <ShieldCheck className="h-4 w-4 shrink-0" /> Two-factor authentication required for this account.
              </div>
              <div>
                <Label htmlFor="a-otp" required><span className="text-white/80">6-digit code</span></Label>
                <Input id="a-otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000" className="border-white/20 bg-white/10 text-center text-xl font-bold tracking-[0.5em] text-white placeholder:text-white/30" />
              </div>
              {error && <FieldError message={error} />}
              <button type="submit" disabled={busy || otp.length !== 6}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-ink transition-all hover:bg-white/90 disabled:opacity-40">
                {busy ? <Spinner className="h-4 w-4" /> : <><KeyRound className="h-4 w-4" /> Verify & enter console</>}
              </button>
              <button type="button" onClick={() => { setStep('creds'); setError(''); }} className="w-full text-center text-[12.5px] text-white/50 hover:text-white">Back to credentials</button>
            </form>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-[11.5px] leading-relaxed text-white/40">
          <p className="font-semibold text-white/60">Security model</p>
          <p className="mt-1">Credentials are verified server-side against BCrypt hashes configured via environment variables. Sessions use HTTP-only cookies with 30-minute sliding expiry. Five failed attempts lock the account for 15 minutes; every attempt is audited with IP.</p>
        </div>
      </div>
    </div>
  );
}
