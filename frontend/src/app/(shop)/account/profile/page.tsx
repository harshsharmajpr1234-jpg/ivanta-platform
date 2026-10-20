'use client';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input, Label, FieldError } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth';
import { userService } from '@/services';
import { useUIStore } from '@/store/ui';

export default function ProfilePage() {
  const { user, patchUser } = useAuthStore();
  const toast = useUIStore((s) => s.toast);
  const [name, setName] = useState(user?.name ?? '');
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [marketingSms, setMarketingSms] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !loaded) {
      void userService.profile().then((p) => {
        setName(p.name ?? '');
        setMarketingEmails(p.marketingEmails !== false);
        setMarketingSms(p.marketingSms !== false);
        setLoaded(true);
      }).catch(() => setLoaded(true));
    }
  }, [user, loaded]);

  const save = async () => {
    setErr('');
    if (name.trim().length < 2) { setErr('Name must be at least 2 characters.'); return; }
    setBusy(true);
    try {
      await userService.updateProfile({ name: name.trim(), marketingEmails, marketingSms });
      patchUser({ name: name.trim() });
      setSaved(true);
      toast({ title: 'Profile updated', tone: 'success' });
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save profile'); }
    finally { setBusy(false); }
  };

  if (!user) return null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Profile</h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">Your details are used for order updates and delivery coordination.</p>
      </div>
      <Card>
        <CardHeader title="Personal information" />
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-name" required>Full name</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p-phone">Mobile number</Label>
              <Input id="p-phone" value={user?.phone ?? '—'} disabled />
              <p className="mt-1 text-[11px] text-ink-muted">Used for delivery coordination — sign-in identity cannot be changed here.</p>
            </div>
          </div>
          <div>
            <Label htmlFor="p-email">Email (sign-in identity)</Label>
            <Input id="p-email" value={user.email ?? user.phone ?? ''} disabled />
            <p className="mt-1 text-[11px] text-ink-muted">Email cannot be changed — it is your account identity for OTP sign-in.</p>
          </div>
          <div className="space-y-2 border-t border-line pt-4">
            <label className="flex items-center gap-2 text-[13px] text-ink-soft">
              <input type="checkbox" className="h-4 w-4 accent-[#0b5cff]" checked={marketingEmails} onChange={(e) => setMarketingEmails(e.target.checked)} />
              Email me offers and order-related news
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink-soft">
              <input type="checkbox" className="h-4 w-4 accent-[#0b5cff]" checked={marketingSms} onChange={(e) => setMarketingSms(e.target.checked)} />
              SMS me offers and delivery updates
            </label>
          </div>
          {err && <FieldError message={err} />}
          <button type="button" onClick={save}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-6 text-[13px] font-semibold text-white hover:bg-black">
            {busy ? 'Saving…' : saved ? <><Check className="h-4 w-4" /> Saved</> : 'Save changes'}
          </button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Account" subtitle={`Member since ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}`} />
        <CardContent className="text-[13px] text-ink-muted">
          <p>Sessions are protected with HTTP-only cookies and expire automatically. Sign-out is available from the account menu.</p>
        </CardContent>
      </Card>
    </div>
  );
}
