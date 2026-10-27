'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeIndianRupee, Check, CheckCircle2, CreditCard, Landmark, Loader2, Lock,
  MapPin, Navigation, Plus, Smartphone, Truck, Wallet, XCircle,
} from 'lucide-react';
import { ProductImage } from '@/components/product/product-image';
import { MapAddressPicker } from '@/components/location/map-address-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { checkoutService, locationService, orderService, paymentService, userService } from '@/services';
import { isAuthError } from '@/hooks/use-guest-cart';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { PAYMENT_METHODS } from '@/constants';
import { cn, etaLabel, inr } from '@/lib/utils';
import { PaymentGatewayModal } from '@/components/checkout/payment-gateway-modal';
import type { Address, AddressInput, CheckoutPreview, OrderDetail, Payment, PaymentMethod, PostOfficeOption } from '@/types';

const METHOD_ICONS: Record<PaymentMethod, typeof Smartphone> = {
  UPI: Smartphone, CARD: CreditCard, NETBANKING: Landmark, WALLET: Wallet, COD: BadgeIndianRupee,
};

const STEPS = ['Address', 'Delivery', 'Payment', 'Review'];

export default function CheckoutPage() {
  return (
    <CheckoutFlow />
  );
}

function CheckoutFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const { user, setUser } = useAuthStore();

  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(params.get('coupon'));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [placing, setPlacing] = useState(false);
  const [outcome, setOutcome] = useState<{ kind: 'success'; order: OrderDetail; cod: boolean } | { kind: 'failed'; message: string; order?: OrderDetail } | null>(null);
  const [gatewayModal, setGatewayModal] = useState<{
    open: boolean;
    payment: Payment;
    order: OrderDetail;
    method: PaymentMethod;
  } | null>(null);

  const addresses = useQuery({ queryKey: ['addresses'], queryFn: () => userService.addresses(), enabled: Boolean(user) });
  const preview = useQuery({
    queryKey: ['checkout-preview', addressId, shippingMethodId, couponCode, paymentMethod],
    queryFn: () => checkoutService.preview({
      addressId: addressId ?? undefined,
      shippingMethodId: shippingMethodId ?? undefined,
      couponCode: couponCode ?? undefined,
      paymentMethod: paymentMethod ?? undefined,
    }),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!addressId && addresses.data && addresses.data.length > 0) {
      const def = addresses.data.find((a) => a.isDefault) ?? addresses.data[0];
      setAddressId(def.id);
    }
  }, [addresses.data, addressId]);

  // Login is required AT CHECKOUT (not for browsing/cart). Guests are redirected to
  // sign in; their locally persisted guest cart survives and is merged into the
  // server cart right after login (see useGuestCartMerge), then flow continues here.
  useEffect(() => {
    if (!user) router.replace('/login?next=/checkout');
  }, [user, router]);

  // Stale persisted session: drop to guest mode silently, the redirect above re-runs.
  useEffect(() => {
    if (user && (isAuthError(preview.error) || isAuthError(addresses.error))) setUser(null);
  }, [user, preview.error, addresses.error, setUser]);

  useEffect(() => {
    const pv = preview.data;
    if (pv && !shippingMethodId && pv.shippingMethods.length > 0) setShippingMethodId(pv.shippingMethods[0].id);
  }, [preview.data, shippingMethodId]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <PageSkeleton />
        <p className="mt-4 text-center text-[13px] text-ink-muted">Taking you to sign in — your cart is safe on this device.</p>
      </div>
    );
  }

  if (outcome?.kind === 'success') return <OrderSuccess order={outcome.order} cod={outcome.cod} />;
  if (outcome?.kind === 'failed') {
    return (
      <div className="mx-auto max-w-[560px] px-4 py-16">
        <div className="rounded-3xl border border-line bg-white p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger"><XCircle className="h-7 w-7" /></span>
          <h1 className="mt-4 text-xl font-bold text-ink">Payment failed</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{outcome.message}</p>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            No amount has been captured. {outcome.order ? `Order ${outcome.order.id} was cancelled and stock released.` : 'Your cart items are still available.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => router.push('/products')}>Continue shopping</Button>
            {outcome.order && <Button variant="secondary" onClick={() => router.push(`/orders/${outcome.order!.id}`)}>View order</Button>}
          </div>
        </div>
      </div>
    );
  }

  if (addresses.isLoading || (!preview.data && !preview.isError)) return <PageSkeleton />;

  const pv = preview.data;
  const emptyCart = pv ? pv.itemCount === 0 : true;
  if (emptyCart && !preview.isError) {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-20">
        <ErrorState title="Your cart is empty" description="Add products before checking out."
          action={<Link href="/products"><Button>Browse the store</Button></Link>} />
      </div>
    );
  }

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const placeOrder = async () => {
    if (!pv || !addressId || !shippingMethodId || !paymentMethod) return;
    setPlacing(true);
    try {
      const order = await orderService.place({ addressId, shippingMethodId, couponCode, paymentMethod });
      void qc.invalidateQueries({ queryKey: ['cart'] });
      void qc.invalidateQueries({ queryKey: ['orders'] });

      if (paymentMethod === 'COD') {
        setOutcome({ kind: 'success', order, cod: true });
        return;
      }

      // prepaid: initiate payment via backend
      const payment = await paymentService.initiate(order.id, paymentMethod);

      // Real Razorpay gateway flow
      if (payment.provider === 'razorpay' && payment.keyId && (payment.razorpayOrderId || payment.providerTransactionId)) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay payment SDK');
        }
        const rzpOrderId = payment.razorpayOrderId || payment.providerTransactionId;
        const selectedAddress = (addresses.data ?? []).find((a) => a.id === addressId);

        const options = {
          key: payment.keyId,
          amount: Math.round(payment.amount * 100),
          currency: payment.currency || 'INR',
          name: 'FlyPhones Store',
          description: `Order #${order.orderNumber || order.id}`,
          order_id: rzpOrderId,
          prefill: {
            name: user?.name || selectedAddress?.name || '',
            email: user?.email || '',
            contact: selectedAddress?.phone || '',
          },
          theme: { color: '#0b5cff' },
          handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
            setPlacing(true);
            try {
              const verified = await paymentService.verify(payment.id, JSON.stringify(response));
              const fresh = await orderService.get(order.id);
              if (verified.status === 'SUCCESS') {
                setOutcome({ kind: 'success', order: fresh, cod: false });
              } else {
                setOutcome({ kind: 'failed', message: verified.failureReason ?? 'Payment verification failed', order: fresh });
              }
            } catch (err) {
              setOutcome({ kind: 'failed', message: err instanceof Error ? err.message : 'Verification failed', order });
            } finally {
              setPlacing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setPlacing(false);
              toast({ title: 'Payment modal closed', tone: 'warning' });
            },
          },
        };

        const RazorpayCtor = (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay;
        const rzp = new RazorpayCtor(options);
        rzp.open();
        return;
      }

      // Fallback / mock provider: Open interactive payment gateway modal
      setGatewayModal({
        open: true,
        payment,
        order,
        method: paymentMethod,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not place the order';
      if (/verification/i.test(msg) || /PAYMENT_VERIFICATION/.test(String((e as { code?: string })?.code ?? ''))) {
        setOutcome({ kind: 'failed', message: msg });
      } else {
        toast({ title: msg, tone: 'error' });
      }
    } finally { setPlacing(false); }
  };

  const handleGatewayAuthorize = async () => {
    if (!gatewayModal) return;
    const { payment, order } = gatewayModal;
    const reference = payment.clientSecret;
    if (!reference) throw new Error('Payment reference missing');
    const verified = await paymentService.verify(payment.id, reference);
    const fresh = await orderService.get(order.id);
    setGatewayModal(null);
    if (verified.status === 'SUCCESS') {
      setOutcome({ kind: 'success', order: fresh, cod: false });
    } else {
      setOutcome({ kind: 'failed', message: verified.failureReason ?? 'Payment authorization failed.', order: fresh });
    }
  };

  const handleGatewayCancel = async () => {
    if (!gatewayModal) return;
    const { order } = gatewayModal;
    try {
      await orderService.cancel(order.id, 'Cancelled by customer at payment gateway');
    } catch {
      // ignore
    }
    setGatewayModal(null);
    setOutcome({
      kind: 'failed',
      message: 'Payment was cancelled. Order has not been placed and no money was deducted.',
      order,
    });
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Checkout</h1>

      {/* steps */}
      <ol className="mt-5 flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <li key={s} className="flex items-center gap-2">
            <button type="button" onClick={() => idx < step && setStep(idx)}
              className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                idx === step ? 'bg-ink text-white' : idx < step ? 'bg-success-soft text-success' : 'bg-surface-sunk text-ink-faint')}>
              {idx < step ? <Check className="h-3.5 w-3.5" /> : <span className="text-[11px]">{idx + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </button>
            {idx < STEPS.length - 1 && <span className="h-px w-4 bg-line-strong sm:w-8" />}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {step === 0 && (
            <AddressStep addresses={addresses.data ?? []} addressId={addressId} setAddressId={(id) => { setAddressId(id); setStep(1); }}
              onManaged={() => void addresses.refetch()} />
          )}
          {step === 1 && pv && (
            <DeliveryStep preview={pv} shippingMethodId={shippingMethodId}
              onSelect={(id) => { setShippingMethodId(id); setStep(2); }}
              couponCode={couponCode} setCoupon={(c) => setCouponCode(c)} onBack={() => setStep(0)} />
          )}
          {step === 2 && pv && (
            <PaymentStep method={paymentMethod} onSelect={(m) => { setPaymentMethod(m); setStep(3); }} onBack={() => setStep(1)} />
          )}
          {step === 3 && pv && (
            <ReviewStep pv={pv} address={(addresses.data ?? []).find((a) => a.id === addressId) ?? null}
              method={paymentMethod!} shippingMethodName={pv.shippingMethods.find((m) => m.id === shippingMethodId)?.name ?? ''}
              placing={placing} onPlace={() => void placeOrder()} onBack={() => setStep(2)} />
          )}
        </div>

        {/* summary rail */}
        {pv && (
          <aside className="h-fit rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-20">
            <h2 className="text-[15px] font-bold text-ink">Order summary</h2>
            <ul className="mt-3 space-y-3">
              {pv.items.map((it) => (
                <li key={`${it.productId}-${it.variantName ?? ''}`} className="flex gap-3">
                  <ProductImage imageKey={it.imageKey} name={it.name} className="h-14 w-14 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{it.name}</p>
                    {it.variantName && <p className="truncate text-[11.5px] text-ink-muted">{it.variantName}</p>}
                    <p className="text-[11.5px] text-ink-faint">Qty {it.quantity} × {inr(it.unitPrice)}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-ink">{inr(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="font-medium text-ink">{inr(pv.subtotal)}</dd></div>
              {pv.couponDiscount > 0 && (
                <div className="flex justify-between"><dt className="text-ink-muted">Coupon {pv.couponCode}</dt><dd className="font-medium text-success">− {inr(pv.couponDiscount)}</dd></div>
              )}
              {pv.taxTotal > 0 && (
                <div className="flex justify-between"><dt className="text-ink-muted">Tax</dt><dd className="font-medium text-ink">{inr(pv.taxTotal)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-ink-muted">Delivery</dt>
                <dd className="font-medium text-ink">{pv.shippingFee === 0 ? <span className="text-success">Free</span> : inr(pv.shippingFee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-[15px]"><dt className="font-bold text-ink">Total</dt><dd className="font-bold text-ink">{inr(pv.grandTotal)}</dd></div>
            </dl>
            <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-ink-faint"><Lock className="h-3.5 w-3.5" /> Totals are computed by the server — never by the browser.</p>
          </aside>
        )}
      </div>

      {gatewayModal && (
        <PaymentGatewayModal
          open={gatewayModal.open}
          payment={gatewayModal.payment}
          order={gatewayModal.order}
          method={gatewayModal.method}
          onAuthorize={handleGatewayAuthorize}
          onCancel={handleGatewayCancel}
        />
      )}
    </div>
  );
}

/* ================= step 0: address ================= */
function AddressStep({ addresses, addressId, setAddressId, onManaged }: {
  addresses: Address[]; addressId: string | null; setAddressId: (id: string) => void; onManaged: () => void;
}) {
  const toast = useUIStore((s) => s.toast);
  const [adding, setAdding] = useState(addresses.length === 0);
  const [busy, setBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([]);
  const [postOfficeOptions, setPostOfficeOptions] = useState<PostOfficeOption[]>([]);
  const [isAmbiguous, setIsAmbiguous] = useState(false);
  const [pinStatus, setPinStatus] = useState<'idle' | 'loading' | 'success' | 'not_found' | 'rate_limited' | 'error'>('idle');
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null);
  const lastPinRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState<AddressInput>({
    name: '', phone: '', addressLine1: '', addressLine2: '', locality: '', city: '', district: '',
    state: '', pincode: '', landmark: '', addressType: 'HOME', isDefault: addresses.length === 0,
  });

  const lookupPincode = async (pincode: string, force = false) => {
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      setPinStatus('idle');
      setPinErrorMessage(null);
      setPostOfficeOptions([]);
      setIsAmbiguous(false);
      return;
    }
    if (!force && lastPinRef.current === pincode && pinStatus === 'success') {
      return;
    }
    lastPinRef.current = pincode;
    setPinBusy(true);
    setPinStatus('loading');
    setPinErrorMessage(null);

    try {
      // Call Spring Boot backend lookup endpoint via Next.js proxy
      const res = await locationService.pincodeLookup(pincode);
      setPinStatus('success');
      const pos = res.postOffices || [];
      setPostOfficeOptions(pos);
      setIsAmbiguous(!res.isUnambiguous);

      const locList = pos.map((p) => p.name).filter(Boolean);
      setAvailableLocalities(locList);

      if (res.isUnambiguous) {
        setForm((f) => ({
          ...f,
          district: res.district || f.district,
          state: res.state || f.state,
          city: res.district || f.city || res.district || '',
          locality: f.locality || locList[0] || '',
        }));
      }

      // Verify serviceability with backend rules
      try {
        const s = await locationService.serviceability(pincode);
        if (!s.serviceable) {
          toast({ title: 'Heads up — delivery might take 3–5 days for this PIN code', tone: 'warning' });
        }
      } catch {
        // optional warning
      }
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const code = err?.code || '';
      if (status === 404 || code === 'NOT_FOUND') {
        setPinStatus('not_found');
        setPinErrorMessage('PIN code not found in postal directory. You can enter details manually.');
      } else if (status === 429 || status === 423 || code === 'RATE_LIMITED') {
        setPinStatus('rate_limited');
        setPinErrorMessage('Postal service rate limit reached. Click Retry or enter manually.');
      } else {
        setPinStatus('error');
        setPinErrorMessage('Postal lookup unavailable. Click Retry or enter details manually.');
      }
    } finally {
      setPinBusy(false);
    }
  };

  const onPinChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setForm((f) => ({ ...f, pincode: cleaned }));
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (cleaned.length === 6) {
      debounceTimerRef.current = setTimeout(() => {
        void lookupPincode(cleaned);
      }, 300);
    } else {
      setPinStatus('idle');
      setPinErrorMessage(null);
      setPostOfficeOptions([]);
      setIsAmbiguous(false);
    }
  };

  const selectPostOffice = (po: PostOfficeOption) => {
    setForm((f) => ({
      ...f,
      locality: po.name,
      district: po.district || f.district,
      state: po.state || f.state,
      city: po.district || f.city || po.district,
    }));
    setIsAmbiguous(false);
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
            void lookupPincode(pin, true);
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
      const created = await userService.createAddress(form);
      toast({ title: 'Address saved', tone: 'success' });
      onManaged();
      setAdding(false);
      setAddressId(created.id);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Could not save address', tone: 'error' });
    } finally { setBusy(false); }
  };

  if (adding) {
    return (
      <form onSubmit={save} className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold text-ink">New delivery address</h2>
            <p className="text-[12px] text-ink-muted">Enter PIN code for automatic district, city & area matching</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            {addresses.length > 0 && <button type="button" onClick={() => setAdding(false)} className="text-[12.5px] font-medium text-accent hover:underline">Cancel</button>}
          </div>
        </div>

        {showMap && (
          <div className="mt-4">
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
                  void lookupPincode(addr.pincode, true);
                }
                setShowMap(false);
              }}
              onClose={() => setShowMap(false)}
            />
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><Label required>Full name</Label><Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={120} /></div>
          <div><Label required>Phone</Label><Input required inputMode="numeric" pattern="[6-9]\d{9}" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile" /></div>
          <div className="sm:col-span-2"><Label required>Address line 1</Label><Input required value={form.addressLine1} onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))} maxLength={200} placeholder="Flat / house no, building, street" /></div>
          <div className="sm:col-span-2"><Label>Address line 2</Label><Input value={form.addressLine2 ?? ''} onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))} maxLength={200} /></div>
          <div>
            <Label required>PIN code</Label>
            <div className="relative">
              <Input
                required
                inputMode="numeric"
                value={form.pincode}
                onChange={(e) => onPinChange(e.target.value)}
                placeholder="6 digits — auto-fills district & state"
              />
              {pinBusy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-faint" />}
            </div>
            {pinStatus === 'loading' && (
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-accent">
                <Loader2 className="h-3 w-3 animate-spin" /> Verifying PIN code with postal registry…
              </p>
            )}
            {pinStatus === 'not_found' && (
              <p className="mt-1 text-[11.5px] text-danger">{pinErrorMessage}</p>
            )}
            {(pinStatus === 'rate_limited' || pinStatus === 'error') && (
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-warning-dark">
                <span>{pinErrorMessage}</span>
                <button
                  type="button"
                  onClick={() => void lookupPincode(form.pincode, true)}
                  className="font-semibold text-accent underline hover:text-accent-hover"
                >
                  Retry
                </button>
              </p>
            )}
            {isAmbiguous && (
              <p className="mt-1 text-[11.5px] font-medium text-warning-dark">
                Multiple post offices found. Select your post office below to complete address.
              </p>
            )}
          </div>
          <div>
            <Label>Locality / Area</Label>
            <Input
              list="checkout-localities-list"
              value={form.locality ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, locality: e.target.value }))}
              maxLength={120}
              placeholder="e.g. Jhotwara, Murlipura"
            />
            {availableLocalities.length > 0 && (
              <datalist id="checkout-localities-list">
                {availableLocalities.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            )}
            {postOfficeOptions.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[11px] font-medium text-ink-muted">
                  {isAmbiguous ? 'Select your Post Office:' : 'Matching Post Offices:'}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {postOfficeOptions.map((po) => {
                    const active = form.locality === po.name;
                    return (
                      <button
                        key={po.name}
                        type="button"
                        onClick={() => selectPostOffice(po)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors text-left border',
                          active
                            ? 'border-ink bg-ink text-white shadow-xs'
                            : 'border-line bg-surface-sunk text-ink-soft hover:bg-line hover:text-ink'
                        )}
                      >
                        <span>{po.name}</span>
                        {po.officeType && <span className="ml-1 opacity-70">({po.officeType})</span>}
                        {isAmbiguous && po.district && <span className="ml-1 opacity-80">· {po.district}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div><Label required>City</Label><Input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} maxLength={80} /></div>
          <div><Label>District</Label><Input value={form.district ?? ''} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} maxLength={80} placeholder="District" /></div>
          <div><Label required>State</Label><Input required value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} maxLength={80} /></div>
          <div><Label>Landmark</Label><Input value={form.landmark ?? ''} onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))} maxLength={200} /></div>
          <div><Label>Address type</Label>
            <div className="flex gap-2 pt-1">
              {(['HOME', 'WORK', 'OTHER'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, addressType: t }))}
                  className={cn('rounded-full border px-3.5 py-1.5 text-[12px] font-semibold', form.addressType === t ? 'border-ink bg-ink text-white' : 'border-line-strong text-ink-soft hover:border-ink/40')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] text-ink-soft">
          <input type="checkbox" checked={Boolean(form.isDefault)} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 accent-[#0b5cff]" />
          Make this my default address
        </label>
        <Button type="submit" loading={busy} className="mt-4">Save & deliver here</Button>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink"><MapPin className="h-4 w-4 text-accent" /> Deliver to</h2>
        <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline"><Plus className="h-3.5 w-3.5" /> New address</button>
      </div>
      <ul className="mt-3 space-y-2">
        {addresses.map((a) => (
          <li key={a.id}>
            <button type="button" onClick={() => setAddressId(a.id)}
              className={cn('w-full rounded-xl border p-4 text-left transition-colors',
                addressId === a.id ? 'border-accent bg-accent-soft/50 ring-1 ring-accent' : 'border-line hover:border-ink/30')}>
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold text-ink">{a.name}</span>
                <Badge tone="neutral">{a.addressType}</Badge>
                {a.isDefault && <Badge tone="accent">Default</Badge>}
                {addressId === a.id && <Check className="ml-auto h-4 w-4 text-accent" />}
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
                {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}{a.locality ? `, ${a.locality}` : ''}, {a.city}, {a.state} — {a.pincode}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-muted">Phone {a.phone}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================= step 1: delivery + coupon ================= */
function DeliveryStep({ preview: pv, shippingMethodId, onSelect, couponCode, setCoupon, onBack }: {
  preview: CheckoutPreview;
  shippingMethodId: string | null; onSelect: (id: string) => void;
  couponCode: string | null; setCoupon: (c: string | null) => void; onBack: () => void;
}) {
  const toast = useUIStore((s) => s.toast);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    try {
      const r = await (await import('@/services')).couponService.validate(c, pv.subtotal);
      if (r.valid) { setCoupon(r.code); toast({ title: `Coupon ${r.code} applied`, description: `You save ${inr(r.discount)}`, tone: 'success' }); setCode(''); }
      else { setCoupon(null); toast({ title: 'Coupon not applicable', description: r.reason ?? undefined, tone: 'warning' }); }
    } catch (e) { toast({ title: e instanceof Error ? e.message : 'Invalid coupon', tone: 'error' }); }
    finally { setBusy(false); }
  };

  if (!pv.serviceable) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5">
        <h2 className="text-[15px] font-bold text-danger">Not serviceable</h2>
        <p className="mt-1 text-[13px] text-ink-soft">{pv.serviceabilityMessage ?? 'We cannot deliver to the selected address yet.'}</p>
        <Button variant="secondary" className="mt-3" onClick={onBack}>Change address</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink"><Truck className="h-4 w-4 text-accent" /> Delivery method</h2>
        <ul className="mt-3 space-y-2">
          {pv.shippingMethods.map((m) => {
            return (
              <li key={m.id}>
                <button type="button" onClick={() => onSelect(m.id)}
                  className={cn('flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                    shippingMethodId === m.id ? 'border-accent bg-accent-soft/50 ring-1 ring-accent' : 'border-line hover:border-ink/30')}>
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', shippingMethodId === m.id ? 'border-accent' : 'border-line-strong')}>
                    {shippingMethodId === m.id && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13.5px] font-semibold text-ink">{m.name}</span>
                    {m.etaMinDays != null && m.etaMaxDays != null && (
                      <span className="block text-[12px] text-ink-muted">Arrives {etaLabel([m.etaMinDays, m.etaMaxDays])}</span>
                    )}
                  </span>
                  <span className="text-[13.5px] font-bold text-ink">{m.fee === 0 ? 'Free' : inr(m.fee)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11.5px] text-ink-faint">Delivery charge = method fee + zone surcharge; free shipping thresholds are applied server-side in the summary.</p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold text-ink">Have a coupon?</h2>
        {couponCode ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2.5 text-[13px] font-semibold text-success">
            <Check className="h-4 w-4" /> {couponCode} applied — saving {inr(pv.couponDiscount)}
            <button type="button" onClick={() => setCoupon(null)} className="ml-auto text-[12px] font-medium text-ink-soft hover:underline">Remove</button>
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. IVANTA10, FLAT500, NEWUSER" className="h-10" />
            <Button variant="secondary" loading={busy} onClick={() => void apply()}>Apply</Button>
          </div>
        )}
      </div>
    </div>
  );
}
/* ================= step 2: payment ================= */
function PaymentStep({ method, onSelect, onBack }: { method: PaymentMethod | null; onSelect: (m: PaymentMethod) => void; onBack: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink"><Lock className="h-4 w-4 text-accent" /> Payment method</h2>
      <p className="mt-1 text-[12.5px] text-ink-muted">Payments are verified server-side (HMAC). Card/UPI details never touch our servers in the mock flow — a real gateway plugs into the same interface.</p>
      <ul className="mt-3 space-y-2">
        {PAYMENT_METHODS.map((m) => {
          const Icon = METHOD_ICONS[m.value];
          return (
            <li key={m.value}>
              <button type="button" onClick={() => onSelect(m.value)}
                className={cn('flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                  method === m.value ? 'border-accent bg-accent-soft/50 ring-1 ring-accent' : 'border-line hover:border-ink/30')}>
                <Icon className="h-5 w-5 text-ink-soft" />
                <span className="flex-1">
                  <span className="block text-[13.5px] font-semibold text-ink">{m.label}</span>
                  <span className="block text-[12px] text-ink-muted">{m.hint}</span>
                </span>
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', method === m.value ? 'border-accent' : 'border-line-strong')}>
                  {method === m.value && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={onBack} className="mt-3 text-[12.5px] font-medium text-accent hover:underline">← Back to delivery</button>
    </div>
  );
}

/* ================= step 3: review ================= */
function ReviewStep({ pv, address, method, shippingMethodName, placing, onPlace, onBack }: {
  pv: CheckoutPreview; address: Address | null; method: PaymentMethod; shippingMethodName: string;
  placing: boolean; onPlace: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold text-ink">Review & place order</h2>
        <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-3">
          <div className="rounded-xl bg-surface-sunk p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Delivering to</p>
            <p className="mt-1 font-semibold text-ink">{address?.name}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{address?.addressLine1}, {address?.city} — {address?.pincode}</p>
          </div>
          <div className="rounded-xl bg-surface-sunk p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Delivery</p>
            <p className="mt-1 font-semibold text-ink">{shippingMethodName}</p>
            <p className="mt-0.5 text-[12px] text-ink-soft">{pv.shippingFee === 0 ? 'Free shipping' : `${inr(pv.shippingFee)} shipping`}</p>
          </div>
          <div className="rounded-xl bg-surface-sunk p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Paying with</p>
            <p className="mt-1 font-semibold text-ink">{PAYMENT_METHODS.find((m) => m.value === method)?.label}</p>
            <p className="mt-0.5 text-[12px] text-ink-soft">{method === 'COD' ? 'Pay on delivery' : 'Server-verified payment'}</p>
          </div>
        </div>
        {pv.couponCode && <p className="mt-3 text-[12.5px] font-medium text-success">Coupon {pv.couponCode} — saving {inr(pv.couponDiscount)}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="lg" loading={placing} onClick={onPlace} className="flex-1 sm:flex-none">
            {method === 'COD'
              ? `Place Cash-on-Delivery Order · ${inr(pv.grandTotal)}`
              : `Proceed to Pay via ${PAYMENT_METHODS.find((m) => m.value === method)?.label} · ${inr(pv.grandTotal)}`}
          </Button>
          <button type="button" onClick={onBack} className="text-[12.5px] font-medium text-accent hover:underline">← Back to payment</button>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
          By placing this order you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/refund-policy" className="underline">Return policy</Link>.
          Stock is reserved for 15 minutes; if a prepaid payment fails verification the order is cancelled automatically and stock released.
        </p>
      </div>
    </div>
  );
}

/* ================= success ================= */
function OrderSuccess({ order, cod }: { order: OrderDetail; cod: boolean }) {
  return (
    <div className="mx-auto max-w-[620px] px-4 py-16">
      <div className="rounded-3xl border border-line bg-white p-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success"><CheckCircle2 className="h-8 w-8" /></span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Order placed!</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          {cod ? 'Your Cash-on-Delivery order is confirmed.' : 'Payment verified and captured securely.'}
        </p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Order <span className="font-semibold text-ink">{order.id}</span> · {inr(order.grandTotal)}
          {order.expectedDelivery && <> · expected by <span className="font-semibold text-ink">{order.expectedDelivery}</span></>}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/orders/${order.id}`}><Button>Track order</Button></Link>
          <Link href="/products"><Button variant="secondary">Continue shopping</Button></Link>
        </div>
        <ul className="mx-auto mt-8 max-w-sm space-y-2 text-left text-[12.5px] text-ink-soft">
          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Stock reserved and payment {cod ? 'due at delivery' : 'captured'}</li>
          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Confirmation sent to your notifications</li>
          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Track every step from My orders</li>
        </ul>
      </div>
    </div>
  );
}
