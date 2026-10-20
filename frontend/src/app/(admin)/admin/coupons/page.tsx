'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Tag, Plus, RefreshCw, Search, CheckCircle2, XCircle, Users, Calendar, AlertCircle
} from 'lucide-react';
import { SectionHeader } from '@/components/admin/section-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { Sheet } from '@/components/ui/sheet';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { adminService } from '@/services/admin';
import { useUIStore } from '@/store/ui';
import { inr, formatDate } from '@/lib/utils';
import type { Coupon } from '@/types';

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Usage drawer
  const [usageDrawerOpen, setUsageDrawerOpen] = useState(false);
  const [selectedCouponForUsage, setSelectedCouponForUsage] = useState<Coupon | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [isActive, setIsActive] = useState(true);

  const couponsQuery = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => adminService.coupons(),
  });

  const rawCoupons = couponsQuery.data;
  const coupons: Coupon[] = Array.isArray(rawCoupons)
    ? rawCoupons
    : (rawCoupons as { content?: Coupon[] })?.content ?? [];

  const usageQuery = useQuery({
    queryKey: ['admin', 'coupons', selectedCouponForUsage?.id, 'usage'],
    queryFn: () => adminService.couponUsage(selectedCouponForUsage!.id),
    enabled: Boolean(selectedCouponForUsage && usageDrawerOpen),
  });

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(q.toLowerCase()) ||
    (c.description ?? '').toLowerCase().includes(q.toLowerCase())
  );

  const openCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('10');
    setMinOrderValue('0');
    setMaxDiscount('');
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    setStartsAt(today);
    setExpiresAt(nextMonth);
    setUsageLimit('');
    setPerUserLimit('1');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description ?? '');
    setDiscountType(c.discountType);
    setDiscountValue(String(c.discountValue));
    setMinOrderValue(c.minOrderValue != null ? String(c.minOrderValue) : '0');
    setMaxDiscount(c.maxDiscount != null ? String(c.maxDiscount) : '');
    setStartsAt(c.startsAt ? c.startsAt.split('T')[0] : '');
    setExpiresAt(c.expiresAt ? c.expiresAt.split('T')[0] : '');
    setUsageLimit(c.usageLimit != null ? String(c.usageLimit) : '');
    setPerUserLimit(String(c.perUserLimit || 1));
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const handleOpenUsage = (c: Coupon) => {
    setSelectedCouponForUsage(c);
    setUsageDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({ title: 'Coupon code is required', tone: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Coupon> = {
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        perUserLimit: parseInt(perUserLimit, 10) || 1,
        isActive,
      };

      if (editingCoupon) {
        await adminService.updateCoupon(editingCoupon.id, payload);
        toast({ title: 'Coupon updated', tone: 'success' });
      } else {
        await adminService.createCoupon(payload);
        toast({ title: 'Coupon created', tone: 'success' });
      }
      setModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to save coupon', description: msg, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      await adminService.updateCoupon(c.id, { isActive: !c.isActive });
      toast({ title: `Coupon ${!c.isActive ? 'activated' : 'paused'}`, tone: 'info' });
      void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to update status', description: msg, tone: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Discount Coupons"
        subtitle="Create promotional promo codes, percentage or flat discounts, and manage redemption limits"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] })}
              disabled={couponsQuery.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${couponsQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add coupon
            </Button>
          </div>
        }
      />

      {/* Search Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search coupon code or description..."
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Coupons Table */}
      {couponsQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : couponsQuery.isError ? (
        <ErrorState onRetry={() => void couponsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No coupons found"
          description={q ? 'Try a different search term.' : 'Click "Add coupon" to create your first discount code.'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-surface-sunk text-[11.5px] uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Discount</th>
                  <th className="px-5 py-3 font-semibold">Min Order</th>
                  <th className="px-5 py-3 font-semibold">Redemptions</th>
                  <th className="px-5 py-3 font-semibold">Validity</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-sunk/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
                          <Tag className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <span className="font-mono font-bold tracking-wider text-ink">{c.code}</span>
                          {c.description && (
                            <p className="max-w-xs truncate text-[11.5px] text-ink-muted">{c.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      {c.discountType === 'PERCENTAGE' ? (
                        <span>
                          {c.discountValue}% off
                          {c.maxDiscount && (
                            <span className="ml-1 text-[11px] font-normal text-ink-muted">
                              (upto {inr(c.maxDiscount)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>{inr(c.discountValue)} flat</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {c.minOrderValue ? inr(c.minOrderValue) : 'No min'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleOpenUsage(c)}
                        className="inline-flex items-center gap-1.5 text-ink hover:text-accent font-medium hover:underline"
                        title="View redemption history"
                      >
                        <Users className="h-3.5 w-3.5 text-ink-muted" />
                        <span>{c.usageCount}</span>
                        {c.usageLimit && <span className="text-ink-muted">/ {c.usageLimit}</span>}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-ink-muted">
                      {c.expiresAt ? formatDate(c.expiresAt) : 'No expiry'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className="cursor-pointer"
                        title="Click to toggle status"
                      >
                        <Badge tone={c.isActive ? 'success' : 'neutral'}>
                          {c.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEdit(c)}
                          className="text-[12px]"
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        description="Set promotion code rules and redemption limits"
        size="md"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cp-code">Coupon Code *</Label>
              <Input
                id="cp-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. APPLEFEST20"
                required
                className="font-mono uppercase font-bold"
              />
            </div>
            <div>
              <Label htmlFor="cp-type">Discount Type</Label>
              <select
                id="cp-type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Flat Amount (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="cp-desc">Description</Label>
            <Input
              id="cp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 10% instant discount on iPhones"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="cp-val">Discount Value *</Label>
              <Input
                id="cp-val"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="10"
                required
              />
            </div>
            <div>
              <Label htmlFor="cp-min">Min Order Value (₹)</Label>
              <Input
                id="cp-min"
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="cp-max">Max Cap (₹)</Label>
              <Input
                id="cp-max"
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="Optional"
                disabled={discountType === 'FIXED'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cp-start">Valid From</Label>
              <Input
                id="cp-start"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cp-end">Valid Until</Label>
              <Input
                id="cp-end"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cp-limit">Total Usage Limit</Label>
              <Input
                id="cp-limit"
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited if empty"
              />
            </div>
            <div>
              <Label htmlFor="cp-user-limit">Per Customer Limit</Label>
              <Input
                id="cp-user-limit"
                type="number"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-line"
              />
              Coupon is Active and can be redeemed at checkout
            </label>
          </div>
        </form>
      </Dialog>

      {/* Usage History Drawer */}
      <Sheet
        open={usageDrawerOpen}
        onClose={() => setUsageDrawerOpen(false)}
        title={
          <span>
            Redemption History — <span className="font-mono font-bold">{selectedCouponForUsage?.code}</span>
          </span>
        }
        side="right"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-ink-muted">
            All customer orders that used this coupon code.
          </p>

          {usageQuery.isPending ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-6 w-6" />
            </div>
          ) : usageQuery.isError ? (
            <p className="text-[13px] text-danger">Failed to load redemptions</p>
          ) : (usageQuery.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-muted">
              This coupon has not been redeemed yet.
            </p>
          ) : (
            <div className="divide-y divide-line rounded-xl border border-line bg-surface">
              {(usageQuery.data ?? []).map((u, i) => (
                <div key={i} className="p-3 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">Order: {u.orderId}</span>
                    <span className="font-bold text-accent">-{inr(u.discountAmount)}</span>
                  </div>
                  <p className="mt-0.5 text-ink-muted text-[11.5px]">User: {u.userId}</p>
                  <p className="text-ink-faint text-[11px]">{formatDate(u.usedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
