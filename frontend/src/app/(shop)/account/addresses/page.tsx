'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RowsSkeleton } from '@/components/ui/skeleton';
import { locationService, userService } from '@/services';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import type { Address, AddressInput } from '@/types';

const EMPTY: AddressInput = {
  name: '', phone: '', addressLine1: '', addressLine2: '', locality: '', city: '', district: '',
  state: '', pincode: '', landmark: '', addressType: 'HOME', isDefault: false,
};

export default function AddressesPage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: () => userService.addresses() });

  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);

  const open = (target: Address | 'new') => {
    setEditing(target);
    setForm(target === 'new' ? EMPTY : {
      name: target.name, phone: target.phone, addressLine1: target.addressLine1,
      addressLine2: target.addressLine2 ?? '', locality: target.locality ?? '', city: target.city,
      district: target.district ?? '', state: target.state, pincode: target.pincode,
      landmark: target.landmark ?? '', addressType: target.addressType, isDefault: target.isDefault,
    });
  };

  const onPin = async (pincode: string) => {
    setForm((f) => ({ ...f, pincode }));
    if (/^\d{6}$/.test(pincode)) {
      setPinBusy(true);
      try {
        const info = await locationService.pincode(pincode);
        setForm((f) => ({
          ...f,
          city: f.city || info.cities[0] || '',
          state: f.state || info.states[0] || '',
          locality: f.locality || info.localities[0] || '',
        }));
        if (!info.serviceable) toast({ title: 'Heads up — this PIN code is not serviceable yet', tone: 'warning' });
      } catch { /* enrichment optional */ } finally { setPinBusy(false); }
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing === 'new') await userService.createAddress(form);
      else if (editing) await userService.updateAddress(editing.id, form);
      toast({ title: 'Address saved', tone: 'success' });
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ['addresses'] });
    } catch (err) { toast({ title: err instanceof Error ? err.message : 'Could not save address', tone: 'error' }); }
    finally { setBusy(false); }
  };

  const remove = async (a: Address) => {
    try {
      await userService.deleteAddress(a.id);
      toast({ title: 'Address removed', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['addresses'] });
    } catch (err) { toast({ title: err instanceof Error ? err.message : 'Could not remove', tone: 'error' }); }
  };

  const makeDefault = async (a: Address) => {
    try {
      await userService.setDefaultAddress(a.id);
      void qc.invalidateQueries({ queryKey: ['addresses'] });
    } catch { toast({ title: 'Could not update default', tone: 'error' }); }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-ink">Delivery addresses</h1>
        <Button size="sm" onClick={() => open('new')}><Plus className="h-4 w-4" /> New address</Button>
      </div>

      {addresses.isError ? <ErrorState className="mt-6" onRetry={() => void addresses.refetch()} /> :
        !addresses.data ? <RowsSkeleton rows={3} cols={2} /> :
        addresses.data.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={MapPin} title="No addresses yet" description="Add a delivery address to speed through checkout."
              action={<Button onClick={() => open('new')}>Add address</Button>} />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {addresses.data.map((a) => (
              <li key={a.id} className={cn('rounded-2xl border bg-white p-4', a.isDefault ? 'border-accent ring-1 ring-accent/40' : 'border-line')}>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink">{a.name}</span>
                  <Badge tone="neutral">{a.addressType}</Badge>
                  {a.isDefault && <Badge tone="accent"><Star className="h-3 w-3" /> Default</Badge>}
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
                  {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}{a.locality ? `, ${a.locality}` : ''}, {a.city}{a.district ? `, ${a.district}` : ''}, {a.state} — {a.pincode}
                </p>
                {a.landmark && <p className="mt-0.5 text-[12px] text-ink-muted">Near {a.landmark}</p>}
                <p className="mt-0.5 text-[12px] text-ink-muted">{a.phone}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => open(a)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  {!a.isDefault && <Button size="sm" variant="ghost" onClick={() => void makeDefault(a)}>Make default</Button>}
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => void remove(a)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New address' : 'Edit address'} size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button form="address-form" type="submit" loading={busy}>Save address</Button>
          </div>
        }>
        <form id="address-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div><Label required>Full name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} /></div>
          <div><Label required>Phone</Label><Input required inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile" /></div>
          <div className="sm:col-span-2"><Label required>Address line 1</Label><Input required value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} maxLength={200} /></div>
          <div className="sm:col-span-2"><Label>Address line 2</Label><Input value={form.addressLine2 ?? ''} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} maxLength={200} /></div>
          <div><Label required>PIN code</Label>
            <div className="relative">
              <Input required inputMode="numeric" value={form.pincode} onChange={(e) => void onPin(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              {pinBusy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-faint" />}
            </div>
          </div>
          <div><Label>Locality</Label><Input value={form.locality ?? ''} onChange={(e) => setForm({ ...form, locality: e.target.value })} maxLength={120} /></div>
          <div><Label required>City</Label><Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} /></div>
          <div><Label>District</Label><Input value={form.district ?? ''} onChange={(e) => setForm({ ...form, district: e.target.value })} maxLength={80} /></div>
          <div><Label required>State</Label><Input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={80} /></div>
          <div><Label>Landmark</Label><Input value={form.landmark ?? ''} onChange={(e) => setForm({ ...form, landmark: e.target.value })} maxLength={200} /></div>
          <div><Label>Type</Label>
            <div className="flex gap-2 pt-1.5">
              {(['HOME', 'WORK', 'OTHER'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, addressType: t })}
                  className={cn('rounded-full border px-3 py-1.5 text-[12px] font-semibold',
                    form.addressType === t ? 'border-ink bg-ink text-white' : 'border-line-strong text-ink-soft')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-soft sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-[#0b5cff]" checked={Boolean(form.isDefault)}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Default delivery address
          </label>
        </form>
      </Dialog>
    </div>
  );
}
