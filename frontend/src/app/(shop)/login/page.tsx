'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services';
import { useAuthStore } from '@/store/auth';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/account';
  const register = params.get('register') === '1';
  const setUser = useAuthStore((s) => s.setUser);

  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const validIdentifier = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier) || /^[6-9]\d{9}$/.test(identifier.replace(/\D/g, ''));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validIdentifier) { setError('Enter a valid email address or 10-digit mobile number.'); return; }
    setBusy(true);
    try {
      if (mode === 'otp') {
        await authService.requestOtp(identifier, name || undefined);
        router.push(`/verify-otp?identifier=${encodeURIComponent(identifier)}&next=${encodeURIComponent(next)}${name ? `&name=${encodeURIComponent(name)}` : ''}`);
      } else {
        const user = await authService.login(identifier, password);
        setUser(user);
        router.push(next);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Sign-in failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-surface-sunk/50">
      <div className="mx-auto grid min-h-[calc(100vh-56px)] max-w-[1240px] items-center gap-10 px-4 py-12 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-soft">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{register ? 'Create your iVanta account' : 'Sign in to iVanta'}</h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              {register
                ? 'Register with your email or mobile — we verify it with a one-time password and your account is ready instantly. Any cart on this device is merged into your account after sign-in.'
                : 'Track orders, manage addresses, returns and your wishlist. New here? An account is created automatically with your first OTP.'}
            </p>
            <div className="mt-5 inline-flex rounded-full bg-surface-sunk p-1 text-[12.5px] font-semibold">
              {(['otp', 'password'] as const).map((m) => (
                <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
                  className={`rounded-full px-4 py-1.5 transition-colors ${mode === m ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'}`}>
                  {m === 'otp' ? 'OTP sign-in' : 'Password'}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
              <div>
                <Label htmlFor="identifier" required>Email or mobile</Label>
                <Input id="identifier" autoComplete="username" value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 9876543218" aria-invalid={!!error} />
              </div>
              {mode === 'otp' ? (
                <div>
                  <Label htmlFor="name" required={register}>Full name <span className="font-normal text-ink-muted">{register ? '(on your account)' : '(only for new accounts)'}</span></Label>
                  <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
                </div>
              ) : (
                <div>
                  <Label htmlFor="password" required>Password</Label>
                  <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
              )}
              {error && <FieldError message={error} />}
              <Button type="submit" size="lg" className="w-full" loading={busy}>
                {busy ? (mode === 'otp' ? 'Sending OTP…' : 'Signing in…')
                  : mode === 'otp' ? <>Send OTP <ArrowRight className="h-4 w-4" /></> : <>Sign in <KeyRound className="h-4 w-4" /></>}
              </Button>
            </form>
            <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              Sessions use HTTP-only cookies — nothing sensitive is stored on your device. By continuing you agree to the{' '}
              <Link href="/terms" className="font-semibold text-accent hover:underline">Terms</Link> and{' '}
              <Link href="/privacy" className="font-semibold text-accent hover:underline">Privacy Policy</Link>.
            </p>
            <div className="mt-4 pt-3 border-t border-line text-center text-[12.5px] text-ink-muted">
              Are you a staff member or administrator?{' '}
              <Link href="/admin/login" className="font-semibold text-accent hover:underline">Sign in to Admin Console</Link>
            </div>
          </div>
        </div>
        <div className="order-1 hidden lg:order-2 lg:block">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-soft">
            <p className="text-[13px] font-bold uppercase tracking-widest text-accent">iVanta Store</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ink">Genuine Apple products.<br />Delivered with care.</h2>
            <ul className="mt-6 space-y-3 text-[13.5px] text-ink-soft">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> 100% genuine, sealed-box stock with official warranty</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Secure payments — UPI, cards, netbanking or cash on delivery</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Easy returns within the return window</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-24"><div className="h-96 animate-pulse rounded-3xl bg-surface-sunk" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
