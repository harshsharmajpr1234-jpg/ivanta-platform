'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Navigation, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RowsSkeleton } from '@/components/ui/skeleton';
import { MapAddressPicker } from '@/components/location/map-address-picker';
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
  const [locatingGps, setLocatingGps] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([]);

  const open = (target: Address | 'new') => {
    setEditing(target);
    setShowMap(false);
    setAvailableLocalities([]);
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
        let city = '';
        let district = '';
        let state = '';
        let locList: string[] = [];

        // 1. Direct fetch from official India Post API for instant 100% accurate live resolution
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
            const poList = data[0].PostOffice;
            district = poList[0]?.District || '';
            city = poList[0]?.District || poList[0]?.Circle || '';
            state = poList[0]?.State || '';
            locList = poList.map((p: { Name: string }) => p.Name).filter(Boolean);
          }
        } catch (e) {
          console.warn('Direct India Post API failed, trying backend service...', e);
        }

        // 2. Fallback to backend locationService if direct fetch was unavailable
        if (!city || locList.length === 0) {
          try {
            const info = await locationService.pincode(pincode);
            city = info.cities?.[0] || '';
            district = info.cities?.[0] || '';
            state = info.states?.[0] || '';
            const raw = [...(info.postOffices || []), ...(info.localities || [])];
            locList = raw.filter((v, i, a) => a.indexOf(v) === i && v !== city);
          } catch {
            // Optional enrichment failure
          }
        }

        // Verify serviceability with backend
        try {
          const s = await locationService.serviceability(pincode);
          if (!s.serviceable) {
            toast({ title: 'Heads up — delivery might take 3–5 days for this PIN code', tone: 'warning' });
          }
        } catch {
          // ignore
        }

        setAvailableLocalities(locList);
        setForm((f) => ({
          ...f,
          city: city || f.city,
          district: district || f.district || city,
          state: state || f.state,
          locality: locList[0] || f.locality || city,
        }));
      } catch (err) {
        console.error('Location lookup error:', err);
      } finally {
        setPinBusy(false);
      }
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation is not supported by your browser', tone: 'warning' });
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
          const data = await res.json();
          const addr = data.address || {};
          const pin = addr.postcode?.replace(/\D/g, '').slice(0, 6) || '';
          const state = addr.state || '';
          const city = addr.city || addr.town || addr.county || addr.state_district || '';
          const district = addr.state_district || addr.county || city;
          const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.road || '';
          const line1 = [addr.house_number, addr.road, addr.suburb].filter(Boolean).join(', ');

          setForm((f) => ({
            ...f,
            addressLine1: line1 || f.addressLine1,
            pincode: pin || f.pincode,
            city: city || f.city,
            district: district || f.district,
            state: state || f.state,
            locality: locality || f.locality,
          }));

          if (pin && /^\d{6}$/.test(pin)) {
            void onPin(pin);
          }
          toast({ title: 'Location detected successfully', tone: 'success' });
        } catch {
          toast({ title: 'Could not resolve address from GPS', tone: 'warning' });
        } finally {
          setLocatingGps(false);
        }
      },
      (err) => {
        setLocatingGps(false);
        toast({ title: 'Location access denied or unavailable', description: err.message, tone: 'warning' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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

      <Dialog open={editing !== null} onClose={() => { setEditing(null); setShowMap(false); }}
        title={editing === 'new' ? 'New address' : 'Edit address'} size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setEditing(null); setShowMap(false); }}>Cancel</Button>
            <Button form="address-form" type="submit" loading={busy}>Save address</Button>
          </div>
        }>
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
              showMap
                ? "border-accent bg-accent text-white"
                : "border-line-strong bg-white text-ink hover:border-ink/40 shadow-xs"
            )}
          >
            <MapPin className="h-3.5 w-3.5" />
            {showMap ? 'Hide Map' : 'Pick on Map'}
          </button>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locatingGps}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent/15"
          >
            <Navigation className={cn('h-3.5 w-3.5', locatingGps && 'animate-spin')} />
            {locatingGps ? 'Detecting…' : 'Use GPS Location'}
          </button>
        </div>

        {showMap && (
          <div className="mb-4">
            <MapAddressPicker
              initialPincode={form.pincode}
              initialCity={form.city}
              initialState={form.state}
              onSelectAddress={(addr) => {
                setForm((f) => ({
                  ...f,
                  addressLine1: addr.addressLine1 || f.addressLine1,
                  locality: addr.locality || f.locality,
                  city: addr.city || f.city,
                  district: addr.district || f.district,
                  state: addr.state || f.state,
                  pincode: addr.pincode || f.pincode,
                }));
                if (addr.pincode && /^\d{6}$/.test(addr.pincode)) {
                  void onPin(addr.pincode);
                }
                setShowMap(false);
              }}
              onClose={() => setShowMap(false)}
            />
          </div>
        )}
        <form id="address-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div><Label required>Full name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} /></div>
          <div><Label required>Phone</Label><Input required inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile" /></div>
          <div className="sm:col-span-2"><Label required>Address line 1</Label><Input required value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} maxLength={200} placeholder="Flat / house no, building, street" /></div>
          <div className="sm:col-span-2"><Label>Address line 2</Label><Input value={form.addressLine2 ?? ''} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} maxLength={200} /></div>
          <div><Label required>PIN code</Label>
            <div className="relative">
              <Input required inputMode="numeric" value={form.pincode} onChange={(e) => void onPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 digits — auto-fills city & state" />
              {pinBusy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-faint" />}
            </div>
          </div>
          <div>
            <Label>Locality / Area</Label>
            <Input
              list="account-localities-list"
              value={form.locality ?? ''}
              onChange={(e) => setForm({ ...form, locality: e.target.value })}
              maxLength={120}
              placeholder="e.g. Murlipura, Vidhyadhar Nagar"
            />
            {availableLocalities.length > 0 && (
              <datalist id="account-localities-list">
                {availableLocalities.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            )}
            {availableLocalities.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {availableLocalities.slice(0, 4).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, locality: loc }))}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                      form.locality === loc
                        ? 'bg-ink text-white'
                        : 'bg-surface-sunk text-ink-soft hover:bg-line'
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div><Label required>City</Label><Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} /></div>
          <div><Label>District</Label><Input value={form.district ?? ''} onChange={(e) => setForm({ ...form, district: e.target.value })} maxLength={80} placeholder="District" /></div>
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
