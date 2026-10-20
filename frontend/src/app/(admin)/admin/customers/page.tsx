'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, RefreshCw, ChevronLeft, ChevronRight, Ban, CheckCircle2, ShoppingBag, Edit3
} from 'lucide-react';
import { SectionHeader } from '@/components/admin/section-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { adminService } from '@/services/admin';
import { useUIStore } from '@/store/ui';
import { inr, formatDate } from '@/lib/utils';
import type { CustomerRow } from '@/types';

export default function AdminCustomersPage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const customersQuery = useQuery({
    queryKey: ['admin', 'customers', page],
    queryFn: () => adminService.customers({ page, size: 20 }),
  });

  const pagedData = customersQuery.data;
  const customers = pagedData?.content ?? [];
  const totalPages = pagedData?.totalPages ?? 1;

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (c.phone ?? '').includes(q)
  );

  const handleToggleBlock = async (c: CustomerRow) => {
    const action = c.isActive ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${action} customer "${c.name}"?`)) return;

    try {
      await adminService.updateCustomer(c.id, { isActive: !c.isActive });
      toast({ title: `Customer ${!c.isActive ? 'unblocked' : 'blocked'}`, tone: 'info' });
      void qc.invalidateQueries({ queryKey: ['admin', 'customers'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to update customer status', description: msg, tone: 'error' });
    }
  };

  const openEdit = (c: CustomerRow) => {
    setSelectedCustomer(c);
    setEditName(c.name);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      await adminService.updateCustomer(selectedCustomer.id, { name: editName.trim() });
      toast({ title: 'Customer updated', tone: 'success' });
      setEditModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'customers'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to update customer', description: msg, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Customers"
        subtitle="View registered customers, purchase history, order volumes and manage access"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void qc.invalidateQueries({ queryKey: ['admin', 'customers'] })}
            disabled={customersQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${customersQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      {/* Filter */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by customer name, email or phone number..."
            className="pl-9"
          />
        </div>
      </Card>

      {/* Customers Table */}
      {customersQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : customersQuery.isError ? (
        <ErrorState onRetry={() => void customersQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={q ? 'No customers match your search query.' : 'Customers will appear here when they register.'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-surface-sunk text-[11.5px] uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Total Spent</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-sunk/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent font-bold text-[12px]">
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-ink">{c.name}</p>
                          <p className="font-mono text-[11px] text-ink-faint">ID: {c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      <p>{c.email || '—'}</p>
                      {c.phone && <p className="text-[11.5px] text-ink-muted">{c.phone}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted text-[12px]">
                      {c.createdAt ? formatDate(c.createdAt) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-ink">
                        <ShoppingBag className="h-3.5 w-3.5 text-ink-muted" />
                        {c.orderCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-ink">
                      {inr(c.totalSpent)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={c.isActive ? 'success' : 'danger'}>
                        {c.isActive ? 'Active' : 'Blocked'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(c)}
                          title="Edit Customer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={c.isActive ? 'danger' : 'secondary'}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleToggleBlock(c)}
                          title={c.isActive ? 'Block Customer' : 'Unblock Customer'}
                        >
                          {c.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px]">
              <span className="text-ink-muted">Page {page + 1} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Edit Customer Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Customer"
        description={`Update account details for ${selectedCustomer?.email || selectedCustomer?.name}`}
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <Label htmlFor="cust-name">Customer Name</Label>
            <Input
              id="cust-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
