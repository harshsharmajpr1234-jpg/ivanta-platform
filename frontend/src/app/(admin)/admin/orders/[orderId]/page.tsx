'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban, Banknote, Download, FileText, MapPin, Package, RotateCcw, StickyNote, Truck, User,
} from 'lucide-react';
import { ProductImage } from '@/components/product/product-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { SectionHeader } from '@/components/admin/section-header';
import { adminService } from '@/services';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import {
  ORDER_NEXT, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE,
  REPLACEMENT_NEXT, REPLACEMENT_STATUS_LABEL, REPLACEMENT_STATUS_TONE,
  RETURN_NEXT, RETURN_STATUS_LABEL, RETURN_STATUS_TONE, SHIPMENT_EVENT_STATUSES, SHIPMENT_STATUS_TONE,
} from '@/constants';
import { cn, formatDate, formatDateTime, inr } from '@/lib/utils';

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const admin = useAuthStore((s) => s.admin);
  const perms = admin?.permissions ?? [];
  const canUpdate = perms.includes('ORDER_UPDATE');
  const canCancel = perms.includes('ORDER_CANCEL');
  const canDeliver = perms.includes('DELIVERY_UPDATE');

  const order = useQuery({ queryKey: ['admin', 'order', orderId], queryFn: () => adminService.order(orderId) });
  const timeline = useQuery({ queryKey: ['admin', 'order', orderId, 'timeline'], queryFn: () => adminService.orderTimeline(orderId) });
  const shipments = useQuery({ queryKey: ['admin', 'shipments', orderId], queryFn: () => adminService.shipments({ orderId, size: 10 }) });
  const returns = useQuery({ queryKey: ['admin', 'returns', orderId], queryFn: () => adminService.returns({ orderId, limit: 20 }) });
  const refunds = useQuery({ queryKey: ['admin', 'refunds', orderId], queryFn: () => adminService.refunds({ orderId, limit: 20 }) });
  const replacements = useQuery({ queryKey: ['admin', 'replacements', orderId], queryFn: () => adminService.replacements({ limit: 200 }) });

  const [statusDialog, setStatusDialog] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [carrier, setCarrier] = useState('BlueDart');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [eventStatus, setEventStatus] = useState('IN_TRANSIT');
  const [eventDesc, setEventDesc] = useState('');
  const [eventLoc, setEventLoc] = useState('');
  const [note, setNote] = useState('');

  const o = order.data;
  const shipment = shipments.data?.content?.[0] ?? null;
  const orderReplacements = (replacements.data ?? []).filter((r) => r.orderId === orderId);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
    void qc.invalidateQueries({ queryKey: ['admin', 'order', orderId, 'timeline'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'shipments', orderId] });
    void qc.invalidateQueries({ queryKey: ['admin', 'returns', orderId] });
    void qc.invalidateQueries({ queryKey: ['admin', 'refunds', orderId] });
    void qc.invalidateQueries({ queryKey: ['admin', 'replacements'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const statusMut = useMutation({
    mutationFn: (status: string) => adminService.setOrderStatus(orderId, status, reason || undefined),
    onSuccess: () => { toast({ title: 'Order updated', tone: 'success' }); setStatusDialog(null); setReason(''); invalidate(); },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Update failed', tone: 'error' }),
  });
  const cancelMut = useMutation({
    mutationFn: () => adminService.cancelOrder(orderId, reason || undefined),
    onSuccess: () => { toast({ title: 'Order cancelled', description: 'Stock restocked and refund initiated where applicable.', tone: 'success' }); setCancelOpen(false); setReason(''); invalidate(); },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Cancel failed', tone: 'error' }),
  });
  const shipMut = useMutation({
    mutationFn: () => adminService.ship(orderId, carrier || undefined, trackingNumber || undefined),
    onSuccess: () => { toast({ title: 'Shipment created', description: 'Order moved to SHIPPED.', tone: 'success' }); setShipOpen(false); setTrackingNumber(''); invalidate(); },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Ship failed', tone: 'error' }),
  });
  const eventMut = useMutation({
    mutationFn: () => adminService.addEvent(shipment!.id, eventStatus, eventDesc || undefined, eventLoc || undefined),
    onSuccess: () => { toast({ title: 'Tracking event added', tone: 'success' }); setEventDesc(''); setEventLoc(''); invalidate(); },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Event failed', tone: 'error' }),
  });
  const noteMut = useMutation({
    mutationFn: () => adminService.addOrderNote(orderId, note),
    onSuccess: () => { toast({ title: 'Note added', tone: 'success' }); setNote(''); invalidate(); },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Note failed', tone: 'error' }),
  });
  const returnMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.setReturnStatus(id, status),
    onSuccess: () => { toast({ title: 'Return updated', tone: 'success' }); invalidate(); },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Update failed', tone: 'error' }),
  });
  const replacementMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.setReplacementStatus(id, status),
    onSuccess: () => { toast({ title: 'Replacement updated', tone: 'success' }); invalidate(); },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Update failed', tone: 'error' }),
  });

  if (order.isError) {
    return (
      <div className="max-w-[560px] py-10">
        <ErrorState title="Order not found" description="No order matches this id."
          action={<Link href="/admin/orders"><Button variant="secondary">Back to orders</Button></Link>} />
      </div>
    );
  }
  if (!o) return <PageSkeleton />;

  const nextStatuses = ORDER_NEXT[o.status] ?? [];
  const adminCancellable = canCancel && ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'CANCEL_REQUESTED'].includes(o.status);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Orders', href: '/admin/orders' }, { label: o.orderNumber ?? o.id }]} />

      <SectionHeader
        title={o.orderNumber ?? o.id}
        subtitle={`${o.id} · placed ${formatDateTime(o.placedAt)} · ${o.paymentMethod}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
            {o.paymentStatus && (
              <Badge tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'neutral'}>
                {PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}
              </Badge>
            )}
            {o.shippingStatus && <Badge tone="neutral">Shipping: {o.shippingStatus.replaceAll('_', ' ')}</Badge>}
          </div>
        }
      />

      {/* actions bar */}
      <div className="flex flex-wrap gap-2">
        {canUpdate && nextStatuses.map((s) => (
          <Button key={s} size="sm" onClick={() => { setStatusDialog(s); setReason(''); }}>
            Move to {ORDER_STATUS_LABEL[s as keyof typeof ORDER_STATUS_LABEL] ?? s}
          </Button>
        ))}
        {canDeliver && o.status === 'PACKED' && (
          <Button size="sm" onClick={() => setShipOpen(true)}><Truck className="h-4 w-4" /> Create shipment</Button>
        )}
        {adminCancellable && (
          <Button size="sm" variant="danger" onClick={() => { setCancelOpen(true); setReason(''); }}>
            <Ban className="h-4 w-4" /> {o.status === 'CANCEL_REQUESTED' ? 'Approve cancellation' : 'Cancel order'}
          </Button>
        )}
        {o.grandTotal > 0 && (
          <Button size="sm" variant="secondary" onClick={() => void adminService.downloadOrderInvoice(o.id)}>
            <Download className="h-4 w-4" /> Invoice PDF
          </Button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* items */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><Package className="h-4 w-4 text-accent" /> Items (immutable snapshot)</h2>
            <ul className="mt-3 divide-y divide-line">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  <ProductImage imageKey={it.imageKey} name={it.productName} className="h-14 w-14 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">{it.productName}</p>
                    <p className="text-[12px] text-ink-muted">
                      {[it.variantName, it.color, it.storage].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p className="font-mono text-[11px] text-ink-faint">{it.sku} · {it.productId}{it.variantId ? ` / ${it.variantId}` : ''}</p>
                  </div>
                  <div className="text-right text-[12.5px]">
                    <p className="font-bold text-ink">{inr(it.finalPrice)}</p>
                    <p className="text-ink-muted">{it.quantity} × {inr(it.unitPrice)}</p>
                    {it.discount > 0 && <p className="text-success">− {inr(it.discount)} disc.</p>}
                    <p className="text-ink-faint">tax {inr(it.taxAmount)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
              {o.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-ink-muted">Coupon {o.couponCode}</dt><dd className="text-success">− {inr(o.couponDiscount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-muted">Tax</dt><dd>{inr(o.taxTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping · {o.shippingMethodName ?? '—'}</dt><dd>{o.shippingFee === 0 ? 'Free' : inr(o.shippingFee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-[15px] font-bold"><dt>Grand total</dt><dd>{inr(o.grandTotal)}</dd></div>
            </dl>
          </Card>

          {/* shipment + tracking events */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><Truck className="h-4 w-4 text-accent" /> Shipment</h2>
            {!shipment ? (
              <p className="mt-2 text-[13px] text-ink-muted">
                No shipment yet. {o.status === 'PACKED' && canDeliver ? 'Use “Create shipment” above.' : 'It is created when the order ships.'}
              </p>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                  <Badge tone={SHIPMENT_STATUS_TONE[shipment.status] ?? 'neutral'}>{shipment.status.replaceAll('_', ' ')}</Badge>
                  <span className="text-ink-soft">{shipment.carrier ?? 'Carrier'}</span>
                  {shipment.trackingNumber && <span className="font-mono text-[12px] font-bold text-ink">{shipment.trackingNumber}</span>}
                  {shipment.estimatedDelivery && <span className="text-ink-muted">· ETA {formatDate(shipment.estimatedDelivery)}</span>}
                  {shipment.weightKg && <span className="text-ink-faint">· {shipment.weightKg} kg</span>}
                  {shipment.labelUrl && (
                    <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer" className="ml-auto">
                      <Button size="sm" variant="secondary" className="gap-1 text-xs">
                        <Download className="h-3 w-3" /> Shipping Label PDF
                      </Button>
                    </a>
                  )}
                </div>
                <ol className="mt-3 space-y-1.5">
                  {shipment.events.slice().reverse().map((ev, i) => (
                    <li key={`${ev.at}-${i}`} className="flex items-start gap-2 text-[12.5px]">
                      <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', i === 0 ? 'bg-accent' : 'bg-line-strong')} />
                      <span className="font-semibold text-ink">{ev.status.replaceAll('_', ' ')}</span>
                      {ev.description && <span className="text-ink-soft">— {ev.description}</span>}
                      <span className="ml-auto shrink-0 text-[11px] text-ink-faint">{formatDateTime(ev.at)}{ev.location ? ` · ${ev.location}` : ''}</span>
                    </li>
                  ))}
                </ol>
                {canDeliver && shipment.status !== 'DELIVERED' && (
                  <div className="mt-4 rounded-xl bg-canvas p-3">
                    <p className="text-[12px] font-bold text-ink">Add tracking event</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-[170px_1fr_1fr_auto]">
                      <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value)} aria-label="Event status"
                        className="h-10 rounded-xl border border-line-strong bg-white px-2.5 text-[12.5px] text-ink focus:border-accent focus:outline-none">
                        {SHIPMENT_EVENT_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                      </select>
                      <Input value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Description" className="h-10" />
                      <Input value={eventLoc} onChange={(e) => setEventLoc(e.target.value)} placeholder="Location" className="h-10" />
                      <Button size="sm" className="h-10" disabled={eventMut.isPending} onClick={() => eventMut.mutate()}>Add</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* timeline */}
          <Card className="p-5">
            <h2 className="text-[14px] font-bold text-ink">Timeline (status · payment · shipment)</h2>
            <ol className="mt-3 space-y-1.5">
              {(timeline.data ?? []).slice().sort((a, b) => b.at.localeCompare(a.at)).map((ev, i) => (
                <li key={`${ev.type}-${ev.at}-${i}`} className="flex items-start gap-2 text-[12.5px]">
                  <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', i === 0 ? 'bg-accent' : 'bg-line-strong')} />
                  <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wide text-ink-faint">{ev.type}</span>
                  <span className="font-semibold text-ink">{ORDER_STATUS_LABEL[ev.status as keyof typeof ORDER_STATUS_LABEL] ?? ev.status.replaceAll('_', ' ')}</span>
                  {ev.description && <span className="text-ink-soft">— {ev.description}</span>}
                  <span className="ml-auto shrink-0 text-[11px] text-ink-faint">{formatDateTime(ev.at)}</span>
                </li>
              ))}
              {(timeline.data ?? []).length === 0 && <li className="py-3 text-center text-[12.5px] text-ink-muted">No events yet.</li>}
            </ol>
          </Card>

          {/* returns / refunds / replacements */}
          {((returns.data ?? []).length > 0 || (refunds.data ?? []).length > 0 || orderReplacements.length > 0) && (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><RotateCcw className="h-4 w-4 text-accent" /> After-sales</h2>
              {(returns.data ?? []).map((r) => (
                <div key={r.id} className="mt-3 rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="font-mono text-[12px] font-bold text-ink">{r.id}</span>
                    <Badge tone={RETURN_STATUS_TONE[r.status]}>{RETURN_STATUS_LABEL[r.status] ?? r.status}</Badge>
                    <span className="text-ink-muted">{r.reason}</span>
                    <span className="ml-auto text-[11px] text-ink-faint">{formatDateTime(r.requestedAt)}</span>
                  </div>
                  {r.inspectionNotes && <p className="mt-1.5 text-[12px] text-ink-soft">Inspection: {r.inspectionNotes}</p>}
                  {r.refunds?.length > 0 && (
                    <p className="mt-1.5 text-[12px] text-ink-muted">
                      Refunds: {r.refunds.map((rf) => `${rf.id} ${inr(rf.amount)} (${rf.status})`).join(', ')}
                    </p>
                  )}
                  {canUpdate && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(RETURN_NEXT[r.status] ?? []).map((next) => (
                        <Button key={next} size="sm" variant={next === 'REJECTED' ? 'danger' : 'secondary'}
                          disabled={returnMut.isPending} onClick={() => returnMut.mutate({ id: r.id, status: next })}>
                          {RETURN_STATUS_LABEL[next] ?? next}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(refunds.data ?? []).map((r) => (
                <div key={r.id} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line p-3 text-[13px]">
                  <Banknote className="h-4 w-4 text-accent" />
                  <span className="font-mono text-[12px] font-bold text-ink">{r.id}</span>
                  <span className="font-bold">{inr(r.amount)}</span>
                  <Badge tone={r.status === 'SUCCESS' ? 'success' : r.status === 'FAILED' ? 'danger' : 'warning'}>{r.status}</Badge>
                  <span className="text-ink-muted">{r.method} · {r.provider}</span>
                  {r.providerTransactionId && <span className="font-mono text-[11px] text-ink-faint">{r.providerTransactionId}</span>}
                  <span className="ml-auto text-[11px] text-ink-faint">{formatDateTime(r.createdAt)}</span>
                </div>
              ))}
              {orderReplacements.map((r) => (
                <div key={r.id} className="mt-3 rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="font-mono text-[12px] font-bold text-ink">{r.id}</span>
                    <Badge tone={REPLACEMENT_STATUS_TONE[r.status] ?? 'neutral'}>{REPLACEMENT_STATUS_LABEL[r.status] ?? r.status}</Badge>
                    <span className="text-ink-muted">{r.productName} × {r.quantity} — {r.reason}</span>
                    {r.replacementOrderNumber && (
                      <Link href={`/admin/orders/${r.replacementOrderId}`} className="text-[12px] font-semibold text-accent hover:underline">
                        → {r.replacementOrderNumber}
                      </Link>
                    )}
                  </div>
                  {canUpdate && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(REPLACEMENT_NEXT[r.status] ?? []).map((next) => (
                        <Button key={next} size="sm" variant={next === 'REJECTED' ? 'danger' : 'secondary'}
                          disabled={replacementMut.isPending} onClick={() => replacementMut.mutate({ id: r.id, status: next })}>
                          {next === 'APPROVED' ? 'Approve & create order' : REPLACEMENT_STATUS_LABEL[next] ?? next}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* notes */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><StickyNote className="h-4 w-4 text-accent" /> Internal notes</h2>
            <ul className="mt-3 space-y-2">
              {(o.notes ?? []).map((n) => (
                <li key={n.id} className="rounded-xl bg-canvas px-3 py-2 text-[12.5px]">
                  <p className="text-ink">{n.note}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">{n.addedByType}{n.addedBy ? ` ${n.addedBy}` : ''} · {n.visibility} · {formatDateTime(n.createdAt)}</p>
                </li>
              ))}
              {(o.notes ?? []).length === 0 && <li className="text-[12.5px] text-ink-muted">No notes yet — visible to staff only.</li>}
            </ul>
            {canUpdate && (
              <div className="mt-3 flex gap-2">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" className="h-10 flex-1" />
                <Button size="sm" className="h-10" disabled={!note.trim() || noteMut.isPending} onClick={() => noteMut.mutate()}>Add</Button>
              </div>
            )}
          </Card>

          {/* status ledger */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><FileText className="h-4 w-4 text-accent" /> Status ledger (append-only)</h2>
            <ol className="mt-3 space-y-1.5">
              {o.history.map((h, i) => (
                <li key={`${h.at}-${i}`} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                  <span className="text-ink-muted">{h.previousStatus ? `${ORDER_STATUS_LABEL[h.previousStatus as keyof typeof ORDER_STATUS_LABEL] ?? h.previousStatus} →` : 'created →'}</span>
                  <span className="font-semibold text-ink">{ORDER_STATUS_LABEL[h.newStatus as keyof typeof ORDER_STATUS_LABEL] ?? h.newStatus}</span>
                  {h.reason && <span className="text-ink-soft">— {h.reason}</span>}
                  <span className="ml-auto shrink-0 text-[11px] text-ink-faint">{h.changedByType}{h.changedBy ? ` ${h.changedBy}` : ''} · {formatDateTime(h.at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* right rail */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><User className="h-4 w-4 text-accent" /> Customer</h2>
            <p className="mt-2 text-[13.5px] font-semibold text-ink">{o.customerName ?? '—'}</p>
            <p className="font-mono text-[11.5px] text-ink-faint">{o.userId}</p>
            <dl className="mt-2 space-y-1 text-[12.5px] text-ink-soft">
              {o.contactEmail && <div className="flex justify-between gap-2"><dt className="text-ink-muted">Email</dt><dd className="truncate">{o.contactEmail}</dd></div>}
              {o.contactPhone && <div className="flex justify-between gap-2"><dt className="text-ink-muted">Phone</dt><dd>{o.contactPhone}</dd></div>}
            </dl>
            {perms.includes('CUSTOMER_VIEW') && (
              <Link href={`/admin/customers?q=${encodeURIComponent(o.customerName ?? '')}`} className="mt-2 inline-block text-[12.5px] font-semibold text-accent hover:underline">
                View customer →
              </Link>
            )}
          </Card>

          {o.address && (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><MapPin className="h-4 w-4 text-accent" /> Delivery address (snapshot)</h2>
              <p className="mt-2 text-[13px] font-semibold text-ink">{o.address.name} · {o.address.phone}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
                {o.address.addressLine1}{o.address.addressLine2 ? `, ${o.address.addressLine2}` : ''},
                {o.address.locality ? ` ${o.address.locality},` : ''} {o.address.city},
                {o.address.district ? ` ${o.address.district},` : ''} {o.address.state} — {o.address.pincode}
              </p>
              <p className="mt-1 text-[11.5px] text-ink-faint">{o.address.addressType} · immutable order snapshot</p>
              {o.expectedDelivery && <p className="mt-2 text-[12.5px] font-semibold text-ink">Expected delivery: {formatDate(o.expectedDelivery)}</p>}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><Banknote className="h-4 w-4 text-accent" /> Payment</h2>
            <dl className="mt-2 space-y-1 text-[12.5px]">
              <div className="flex justify-between"><dt className="text-ink-muted">Method</dt><dd className="font-semibold text-ink">{o.paymentMethod}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Status</dt>
                <dd>{o.paymentStatus ? <Badge tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'neutral'}>{PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}</Badge> : '—'}</dd></div>
              {o.confirmedAt && <div className="flex justify-between"><dt className="text-ink-muted">Confirmed</dt><dd>{formatDateTime(o.confirmedAt)}</dd></div>}
              {o.shippedAt && <div className="flex justify-between"><dt className="text-ink-muted">Shipped</dt><dd>{formatDateTime(o.shippedAt)}</dd></div>}
              {o.deliveredAt && <div className="flex justify-between"><dt className="text-ink-muted">Delivered</dt><dd>{formatDateTime(o.deliveredAt)}</dd></div>}
              {o.cancelledAt && <div className="flex justify-between"><dt className="text-ink-muted">Cancelled</dt><dd>{formatDateTime(o.cancelledAt)}</dd></div>}
              {o.cancellationReason && <div className="flex justify-between gap-2"><dt className="text-ink-muted">Reason</dt><dd className="text-right text-ink-soft">{o.cancellationReason}</dd></div>}
            </dl>
          </Card>

          {o.customerNote && (
            <Card className="p-5">
              <h2 className="text-[14px] font-bold text-ink">Customer note</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{o.customerNote}</p>
            </Card>
          )}
        </div>
      </div>

      {/* status dialog */}
      <Dialog open={statusDialog !== null} onClose={() => setStatusDialog(null)} title="Update order status" size="sm"
        description={statusDialog ? `${ORDER_STATUS_LABEL[o.status]} → ${ORDER_STATUS_LABEL[statusDialog as keyof typeof ORDER_STATUS_LABEL] ?? statusDialog}. A history row is recorded.` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStatusDialog(null)}>Back</Button>
            <Button loading={statusMut.isPending} onClick={() => statusMut.mutate(statusDialog!)}>Confirm</Button>
          </div>
        }>
        <Label className="text-[13px] font-medium text-ink-soft">Reason (stored in the ledger)</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[70px]" placeholder="e.g. Confirmed with supplier" />
      </Dialog>

      {/* cancel dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} title={o.status === 'CANCEL_REQUESTED' ? 'Approve cancellation?' : 'Cancel order?'} size="sm"
        description={`${o.orderNumber ?? o.id} · ${inr(o.grandTotal)}. Stock is restocked and any captured payment enters the refund workflow.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="danger" loading={cancelMut.isPending} onClick={() => cancelMut.mutate()}>Cancel order</Button>
          </div>
        }>
        <Label className="text-[13px] font-medium text-ink-soft">Reason</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[70px]" placeholder="Customer request / out of stock / …" />
      </Dialog>

      {/* ship dialog */}
      <Dialog open={shipOpen} onClose={() => setShipOpen(false)} title="Create shipment" size="sm"
        description="Generates a tracking number when left blank and moves the order to SHIPPED."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShipOpen(false)}>Back</Button>
            <Button loading={shipMut.isPending} onClick={() => shipMut.mutate()}><Truck className="h-4 w-4" /> Ship order</Button>
          </div>
        }>
        <Label className="text-[13px] font-medium text-ink-soft">Carrier</Label>
        <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="BlueDart / Delhivery / DTDC" />
        <Label className="mt-3 block text-[13px] font-medium text-ink-soft">Tracking number (optional)</Label>
        <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Auto-generated if blank" />
      </Dialog>
    </div>
  );
}
