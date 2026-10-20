'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote, Ban, ChevronRight, Download, FileText, MapPin, Package,
  RotateCcw, Truck, Wallet,
} from 'lucide-react';
import { ProductImage } from '@/components/product/product-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Label, Textarea } from '@/components/ui/input';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { orderService, replacementService, returnService } from '@/services';
import { useUIStore } from '@/store/ui';
import {
  ORDER_PROGRESS, ORDER_STATUS_LABEL, ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE, RETURN_REASONS, SHIPMENT_STATUS_TONE,
} from '@/constants';
import { cn, formatDate, formatDateTime, inr } from '@/lib/utils';

const CUSTOMER_CANCELLABLE = ['PENDING_PAYMENT', 'PAYMENT_FAILED', 'PLACED', 'CONFIRMED', 'PROCESSING'];
const CANCEL_REQUESTABLE = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];
const TRACKABLE = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const NO_PROGRESS = ['CANCELLED', 'REFUNDED', 'CANCEL_REQUESTED', 'PENDING_PAYMENT', 'PAYMENT_FAILED',
  'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_PICKUP_SCHEDULED', 'RETURN_PICKED_UP',
  'RETURN_RECEIVED', 'RETURN_INSPECTION', 'REFUND_INITIATED',
  'REPLACEMENT_REQUESTED', 'REPLACEMENT_PROCESSING', 'REPLACEMENT_SHIPPED', 'REPLACEMENT_DELIVERED'];

const EVENT_ICON: Record<string, typeof Truck> = { STATUS: Package, PAYMENT: Wallet, SHIPMENT: Truck };

/**
 * Customer order detail (§24): full snapshot, real backend timeline, live tracking,
 * cancellation (direct pre-ship / request post-ship), returns, replacements and
 * backend-generated invoice PDFs. Shared by /orders/[id] and /account/orders/[orderId].
 */
export function OrderDetailClient({ orderId, basePath }: { orderId: string; basePath: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const order = useQuery({ queryKey: ['order', orderId], queryFn: () => orderService.get(orderId) });
  const tracking = useQuery({
    queryKey: ['tracking', orderId],
    queryFn: () => orderService.tracking(orderId),
    enabled: Boolean(order.data && TRACKABLE.includes(order.data.status)),
    refetchInterval: 60_000,
  });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnNotes, setReturnNotes] = useState('');
  const [replaceItem, setReplaceItem] = useState('');
  const [replaceReason, setReplaceReason] = useState(RETURN_REASONS[0]);

  const o = order.data;
  const progressIdx = useMemo(() => (o ? ORDER_PROGRESS.indexOf(o.status) : -1), [o]);
  const timeline = useMemo(() => (o ? [...o.timeline].sort((a, b) => b.at.localeCompare(a.at)) : []), [o]);

  if (order.isError) {
    return (
      <div className="mx-auto max-w-[560px] px-4 py-16">
        <ErrorState title="Order not found" description="This order does not exist or belongs to another account."
          action={<Link href={basePath}><Button variant="secondary">Back to orders</Button></Link>} />
      </div>
    );
  }
  if (!o) return <PageSkeleton />;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['order', orderId] });
    void qc.invalidateQueries({ queryKey: ['orders'] });
    void qc.invalidateQueries({ queryKey: ['tracking', orderId] });
  };

  const cancel = async () => {
    setBusy(true);
    try {
      const updated = await orderService.cancel(o.id, reason || undefined);
      toast({
        title: updated.status === 'CANCEL_REQUESTED' ? 'Cancellation requested' : 'Order cancelled',
        description: updated.status === 'CANCEL_REQUESTED'
          ? 'Your request was sent to our team — we will confirm shortly.'
          : 'Any captured payment is refunded automatically.',
        tone: 'success',
      });
      setCancelOpen(false);
      refresh();
    } catch (e) { toast({ title: e instanceof Error ? e.message : 'Could not cancel', tone: 'error' }); }
    finally { setBusy(false); }
  };

  const requestReturn = async () => {
    setBusy(true);
    try {
      const r = await returnService.create(o.id, returnReason, returnNotes || undefined);
      toast({ title: 'Return requested', description: `Reference ${r.id} — our team will review it shortly.`, tone: 'success' });
      setReturnOpen(false);
      router.push(`/returns/${r.id}`);
    } catch (e) { toast({ title: e instanceof Error ? e.message : 'Could not request return', tone: 'error' }); }
    finally { setBusy(false); }
  };

  const requestReplacement = async () => {
    if (!replaceItem) { toast({ title: 'Select an item to replace', tone: 'error' }); return; }
    setBusy(true);
    try {
      const r = await replacementService.request(o.id, replaceItem, replaceReason);
      toast({ title: 'Replacement requested', description: `Reference ${r.id} — we will confirm stock and ship it.`, tone: 'success' });
      setReplaceOpen(false);
      refresh();
    } catch (e) { toast({ title: e instanceof Error ? e.message : 'Could not request replacement', tone: 'error' }); }
    finally { setBusy(false); }
  };

  const downloadInvoice = async () => {
    try {
      await orderService.downloadInvoice(o.id);
      toast({ title: 'Invoice downloaded', description: o.orderNumber ?? o.id, tone: 'success' });
    } catch (e) { toast({ title: e instanceof Error ? e.message : 'Invoice unavailable', tone: 'error' }); }
  };

  const shipment = tracking.data?.shipment ?? null;
  const canCancel = CUSTOMER_CANCELLABLE.includes(o.status);
  const canRequestCancel = CANCEL_REQUESTABLE.includes(o.status);
  const canReturn = Boolean(o.returnEligible);

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Orders', href: basePath }, { label: o.orderNumber ?? o.id }]} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2.5 text-2xl font-bold tracking-tight text-ink">
            {o.orderNumber ?? o.id} <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            <span className="font-mono text-[12px]">{o.id}</span> · Placed {formatDateTime(o.placedAt)} · {o.paymentMethod}
            {o.paymentStatus ? ` · payment ${PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {o.grandTotal > 0 && !['PENDING_PAYMENT', 'PAYMENT_FAILED', 'CANCELLED'].includes(o.status) && (
            <Button variant="secondary" onClick={() => void downloadInvoice()}><Download className="h-4 w-4" /> Invoice</Button>
          )}
          {canReturn && (
            <>
              <Button variant="secondary" onClick={() => setReturnOpen(true)}><RotateCcw className="h-4 w-4" /> Return</Button>
              <Button variant="secondary" onClick={() => { setReplaceItem(o.items[0]?.id ?? ''); setReplaceOpen(true); }}>
                <Package className="h-4 w-4" /> Replace
              </Button>
            </>
          )}
          {(canCancel || canRequestCancel) && (
            <Button variant="secondary" className="text-danger" onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4" /> {canCancel ? 'Cancel order' : 'Request cancellation'}
            </Button>
          )}
        </div>
      </div>

      {o.cancellationReason && (
        <p className="mt-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
          {o.status === 'CANCEL_REQUESTED' ? 'Cancellation requested' : 'Cancelled'} — {o.cancellationReason}
        </p>
      )}
      {['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(o.status) && (
        <p className={cn('mt-3 rounded-xl px-3.5 py-2.5 text-[13px]',
          o.status === 'PAYMENT_FAILED' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning')}>
          {o.status === 'PAYMENT_FAILED'
            ? 'Payment could not be completed. You can retry from the payments page — your items are reserved for a short window.'
            : 'This order is awaiting payment. Complete the payment to confirm your items.'}
          <Link href="/account/payments" className="ml-1.5 font-semibold underline">Go to payments →</Link>
        </p>
      )}

      {/* fulfilment progress (happy path) */}
      {!NO_PROGRESS.includes(o.status) && (
        <ol className="mt-6 flex items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-4 no-scrollbar">
          {ORDER_PROGRESS.map((s, idx) => {
            const done = progressIdx > idx || (progressIdx === idx && s === 'DELIVERED');
            const current = progressIdx === idx && s !== 'DELIVERED';
            return (
              <li key={s} className="flex flex-1 items-center gap-1">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                    done ? 'bg-success text-white' : current ? 'bg-accent text-white' : 'bg-surface-sunk text-ink-faint')}>
                    {done ? '✓' : current ? '●' : '○'}
                  </span>
                  <span className={cn('whitespace-nowrap text-[10.5px] font-medium', done || current ? 'text-ink' : 'text-ink-faint')}>{ORDER_STATUS_LABEL[s]}</span>
                </div>
                {idx < ORDER_PROGRESS.length - 1 && <span className={cn('mb-5 h-0.5 flex-1', done ? 'bg-success' : 'bg-line')} />}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* live shipment tracking */}
          {shipment && (
            <section id="tracking" className="scroll-mt-24 rounded-2xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink"><Truck className="h-4 w-4 text-accent" /> Shipment tracking</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                <Badge tone={SHIPMENT_STATUS_TONE[shipment.status] ?? 'neutral'}>{shipment.status.replaceAll('_', ' ')}</Badge>
                <span className="text-ink-soft">{shipment.carrier ?? 'Carrier'}</span>
                {shipment.trackingNumber && <span className="font-mono text-[12px] text-ink-muted">{shipment.trackingNumber}</span>}
                {shipment.estimatedDelivery && <span className="text-ink-muted">· ETA {formatDate(shipment.estimatedDelivery)}</span>}
              </div>
              <ol className="mt-4 space-y-0">
                {shipment.events.slice().reverse().map((ev, i) => (
                  <li key={`${ev.at}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={cn('mt-1 h-2.5 w-2.5 rounded-full', i === 0 ? 'bg-accent ring-4 ring-accent-soft' : 'bg-line-strong')} />
                      {i < shipment.events.length - 1 && <span className="w-px flex-1 bg-line" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-[13px] font-semibold text-ink">{ev.status.replaceAll('_', ' ')}</p>
                      {ev.description && <p className="text-[12px] text-ink-soft">{ev.description}</p>}
                      <p className="text-[11px] text-ink-faint">{formatDateTime(ev.at)}{ev.location ? ` · ${ev.location}` : ''}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* items (immutable snapshot) */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink"><Package className="h-4 w-4 text-accent" /> Items</h2>
            <ul className="mt-3 divide-y divide-line">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  <Link href={`/products/${it.productSlug ?? it.productId}`} className="shrink-0">
                    <ProductImage imageKey={it.imageKey} name={it.productName} className="h-16 w-16 rounded-xl" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${it.productSlug ?? it.productId}`} className="text-[13.5px] font-semibold text-ink hover:text-accent">{it.productName}</Link>
                    {(it.variantName || it.color || it.storage) && (
                      <p className="text-[12px] text-ink-muted">
                        {[it.variantName, it.color, it.storage].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="text-[12px] text-ink-faint">Qty {it.quantity} × {inr(it.unitPrice)}{it.sku ? ` · SKU ${it.sku}` : ''}</p>
                  </div>
                  <span className="text-[14px] font-bold text-ink">{inr(it.finalPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="text-ink">{inr(o.subtotal)}</dd></div>
              {o.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-ink-muted">Coupon {o.couponCode}</dt><dd className="text-success">− {inr(o.couponDiscount)}</dd></div>}
              {o.taxTotal > 0 && <div className="flex justify-between"><dt className="text-ink-muted">Tax</dt><dd className="text-ink">{inr(o.taxTotal)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping{o.shippingMethodName ? ` · ${o.shippingMethodName}` : ''}</dt>
                <dd className="text-ink">{o.shippingFee === 0 ? 'Free' : inr(o.shippingFee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-[15px] font-bold text-ink"><dt>Total</dt><dd>{inr(o.grandTotal)}</dd></div>
            </dl>
          </section>

          {/* real backend timeline: status + payment + shipment events */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[15px] font-bold text-ink">Timeline</h2>
            <ol className="mt-3 space-y-0">
              {timeline.map((ev, i) => {
                const Icon = EVENT_ICON[ev.type] ?? Package;
                return (
                  <li key={`${ev.type}-${ev.at}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        i === 0 ? 'bg-accent text-white' : 'bg-surface-sunk text-ink-soft')}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {i < timeline.length - 1 && <span className="w-px flex-1 bg-line" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-[13px] font-semibold text-ink">
                        {ORDER_STATUS_LABEL[ev.status as keyof typeof ORDER_STATUS_LABEL] ?? ev.status.replaceAll('_', ' ')}
                        <span className="ml-2 rounded-full bg-surface-sunk px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-faint">{ev.type}</span>
                      </p>
                      {ev.description && <p className="text-[12px] text-ink-soft">{ev.description}</p>}
                      <p className="text-[11px] text-ink-faint">{formatDateTime(ev.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* immutable status ledger */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[15px] font-bold text-ink">Status history</h2>
            <ol className="mt-3 space-y-2">
              {o.history.map((h, i) => (
                <li key={`${h.at}-${i}`} className="flex items-start gap-2.5 text-[12.5px]">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  <span className="text-ink-soft">
                    <span className="font-semibold text-ink">{ORDER_STATUS_LABEL[h.newStatus as keyof typeof ORDER_STATUS_LABEL] ?? h.newStatus}</span>
                    {h.reason && <> — {h.reason}</>}
                    <span className="text-ink-faint"> · {h.changedByType}{h.changedBy ? ` ${h.changedBy}` : ''} · {formatDateTime(h.at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* right rail */}
        <div className="space-y-4">
          {o.address && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><MapPin className="h-4 w-4 text-accent" /> Delivery address</h2>
              <p className="mt-2 text-[13px] font-semibold text-ink">{o.address.name} · {o.address.phone}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
                {o.address.addressLine1}{o.address.addressLine2 ? `, ${o.address.addressLine2}` : ''},
                {o.address.locality ? ` ${o.address.locality},` : ''} {o.address.city}, {o.address.state} — {o.address.pincode}
              </p>
              <p className="mt-1 text-[11.5px] text-ink-faint">{o.address.addressType} · snapshotted at order time</p>
            </section>
          )}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><Banknote className="h-4 w-4 text-accent" /> Payment</h2>
            <p className="mt-2 text-[13px] text-ink-soft">{o.paymentMethod}</p>
            {o.paymentStatus && (
              <Badge className="mt-1.5" tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'neutral'}>
                {PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}
              </Badge>
            )}
            <dl className="mt-3 space-y-1 text-[12px] text-ink-muted">
              {o.confirmedAt && <div className="flex justify-between"><dt>Confirmed</dt><dd>{formatDateTime(o.confirmedAt)}</dd></div>}
              {o.shippedAt && <div className="flex justify-between"><dt>Shipped</dt><dd>{formatDateTime(o.shippedAt)}</dd></div>}
              {o.deliveredAt && <div className="flex justify-between"><dt>Delivered</dt><dd>{formatDateTime(o.deliveredAt)}</dd></div>}
              {o.cancelledAt && <div className="flex justify-between"><dt>Cancelled</dt><dd>{formatDateTime(o.cancelledAt)}</dd></div>}
            </dl>
            <Link href="/account/payments" className="mt-3 block text-[12.5px] font-semibold text-accent hover:underline">View all payments →</Link>
          </section>
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><FileText className="h-4 w-4 text-accent" /> Invoice</h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
              A GST invoice with the full item and payment snapshot is generated by our servers the moment you download it.
            </p>
            {o.grandTotal > 0 && !['PENDING_PAYMENT', 'PAYMENT_FAILED', 'CANCELLED'].includes(o.status) && (
              <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => void downloadInvoice()}>
                <Download className="h-3.5 w-3.5" /> Download invoice PDF
              </Button>
            )}
          </section>
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[14px] font-bold text-ink">Need help?</h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
              Returns and replacements are available within the return window shown at checkout. Our support team can help with anything else.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/support"><Button variant="secondary" size="sm" className="w-full">Contact support</Button></Link>
              <Link href="/refund-policy"><Button variant="ghost" size="sm" className="w-full">Return policy</Button></Link>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)}
        title={canCancel ? 'Cancel this order?' : 'Request cancellation?'} size="sm"
        description={`Order ${o.orderNumber ?? o.id} · ${inr(o.grandTotal)}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button variant="danger" loading={busy} onClick={() => void cancel()}>
              {canCancel ? 'Cancel order' : 'Send request'}
            </Button>
          </div>
        }>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional) — helps us improve" className="min-h-[80px]" />
        <p className="mt-2 text-[12px] text-ink-muted">
          {canCancel
            ? `Stock is released immediately. ${o.paymentStatus === 'SUCCESS' ? 'Any captured amount is refunded to the original payment method.' : 'No amount has been captured yet.'}`
            : 'Your order has already shipped, so this sends a cancellation request to our team. If the parcel is already with the courier we may ask you to refuse delivery instead.'}
        </p>
      </Dialog>

      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} title="Request a return" size="sm"
        description="Within the return window · refund after inspection"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReturnOpen(false)}>Not now</Button>
            <Button loading={busy} onClick={() => void requestReturn()}>Submit request</Button>
          </div>
        }>
        <Label className="text-[13px] font-medium text-ink-soft">Reason</Label>
        <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)}
          className="h-10 w-full rounded-xl border border-line-strong bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none">
          {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <Textarea className="mt-3 min-h-[80px]" value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)}
          placeholder="Tell us more (optional) — what went wrong?" />
        <p className="mt-2 text-[12px] text-ink-muted">
          Refund amounts are pro-rated with any coupon discount and can never exceed what you paid.
        </p>
      </Dialog>

      <Dialog open={replaceOpen} onClose={() => setReplaceOpen(false)} title="Request a replacement" size="sm"
        description="We will ship a replacement at no extra cost, subject to stock"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReplaceOpen(false)}>Not now</Button>
            <Button loading={busy} onClick={() => void requestReplacement()}>Submit request</Button>
          </div>
        }>
        <Label className="text-[13px] font-medium text-ink-soft">Item</Label>
        <select value={replaceItem} onChange={(e) => setReplaceItem(e.target.value)}
          className="h-10 w-full rounded-xl border border-line-strong bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none">
          {o.items.map((it) => (
            <option key={it.id} value={it.id}>{it.productName}{it.variantName ? ` — ${it.variantName}` : ''}</option>
          ))}
        </select>
        <Label className="mt-3 block text-[13px] font-medium text-ink-soft">Reason</Label>
        <select value={replaceReason} onChange={(e) => setReplaceReason(e.target.value)}
          className="h-10 w-full rounded-xl border border-line-strong bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none">
          {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <p className="mt-2 text-[12px] text-ink-muted">
          On approval we generate a zero-total replacement order and it follows the usual delivery pipeline with its own tracking.
        </p>
      </Dialog>
    </div>
  );
}
