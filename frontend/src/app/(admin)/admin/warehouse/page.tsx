'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, AlertCircle, Save, ShieldCheck, Truck } from 'lucide-react';
import { adminService } from '@/services/admin';
import { useUIStore } from '@/store/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import type { WarehouseSettings } from '@/types';

export default function AdminWarehousePage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const warehouseQuery = useQuery({
    queryKey: ['admin', 'warehouse'],
    queryFn: () => adminService.warehouse(),
  });

  const providerQuery = useQuery({
    queryKey: ['admin', 'providerStatus'],
    queryFn: () => adminService.providerStatus(),
  });

  const [form, setForm] = useState<WarehouseSettings>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    sellerGstin: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (warehouseQuery.data) {
      setForm(warehouseQuery.data);
    }
  }, [warehouseQuery.data]);

  if (warehouseQuery.isLoading || providerQuery.isLoading) {
    return <PageSkeleton />;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminService.updateWarehouse(form);
      setForm(updated);
      toast({ title: 'Warehouse settings saved', description: 'Updated pickup address and seller GSTIN', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['admin', 'warehouse'] });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Failed to save warehouse settings', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const status = providerQuery.data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2.5">
          <Building2 className="h-6 w-6 text-accent" /> Warehouse & Logistics Settings
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Configure owner-owned warehouse pickup address, seller GSTIN, and third-party courier provider status.
        </p>
      </div>

      {/* Provider Status Overview */}
      <div className="rounded-2xl border border-line bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" /> Active Courier Integration
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Active Provider: <span className="font-bold uppercase text-ink">{status?.activeProvider ?? 'mock'}</span>
              {status?.autoShipOnPacked && ' · Auto-ship on PACKED enabled'}
            </p>
          </div>
          <Badge tone={status?.activeProvider === 'mock' ? 'warning' : 'success'}>
            {status?.activeProvider === 'mock' ? 'Mock / Test Mode' : 'Live Courier Mode'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line">
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface-sunk p-3 text-xs">
            <div>
              <p className="font-semibold text-ink">Shiprocket REST API</p>
              <p className="text-ink-muted text-[11px]">Credentials: SHIPROCKET_EMAIL & PASSWORD</p>
            </div>
            {status?.shiprocketConfigured ? (
              <Badge tone="success" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Configured
              </Badge>
            ) : (
              <Badge tone="neutral" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Not Configured
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-surface-sunk p-3 text-xs">
            <div>
              <p className="font-semibold text-ink">Delhivery Direct API</p>
              <p className="text-ink-muted text-[11px]">Token: DELHIVERY_API_TOKEN</p>
            </div>
            {status?.delhiveryConfigured ? (
              <Badge tone="success" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Configured
              </Badge>
            ) : (
              <Badge tone="neutral" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Not Configured
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Pickup Address & Seller Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-line bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" /> Pickup Origin & Tax Credentials
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Facility Name</label>
            <input
              type="text"
              required
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. iVanta Main Fulfilment Centre"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Seller GSTIN</label>
            <input
              type="text"
              required
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink font-mono focus:border-accent focus:outline-none"
              value={form.sellerGstin}
              onChange={(e) => setForm({ ...form, sellerGstin: e.target.value })}
              placeholder="e.g. 08ABCDE1234F1Z5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Contact Person Name</label>
            <input
              type="text"
              required
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Contact Phone Number</label>
            <input
              type="text"
              required
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Contact Email</label>
            <input
              type="email"
              required
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Street Address Line 1</label>
            <input
              type="text"
              required
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none"
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Address Line 2 (Optional)</label>
            <input
              type="text"
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none"
              value={form.addressLine2 ?? ''}
              onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">City</label>
            <input
              type="text"
              required
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">State</label>
            <input
              type="text"
              required
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-accent focus:outline-none"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">6-Digit Pincode</label>
            <input
              type="text"
              required
              maxLength={6}
              className="w-full h-9 rounded-xl border border-line bg-white px-3 text-sm text-ink font-mono focus:border-accent focus:outline-none"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <Button type="submit" loading={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Warehouse Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
