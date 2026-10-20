'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowUpRight, Boxes, CheckCircle2, History, Plus, RefreshCw, Search, SlidersHorizontal, Warehouse as WarehouseIcon
} from 'lucide-react';
import { SectionHeader } from '@/components/admin/section-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { Sheet } from '@/components/ui/sheet';
import { ErrorState } from '@/components/ui/states';
import { adminService } from '@/services';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import type { InventoryMovement, InventoryRow } from '@/types';

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const [q, setQ] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & drawers
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryRow | null>(null);
  const [adjustForm, setAdjustForm] = useState({ mode: 'SET' as 'SET' | 'DELTA', quantity: '10', note: '' });

  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyInventoryId, setHistoryInventoryId] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  // Queries
  const warehouses = useQuery({ queryKey: ['admin', 'warehouses'], queryFn: () => adminService.warehouses() });
  const inventory = useQuery({
    queryKey: ['admin', 'inventory', warehouseFilter, statusFilter],
    queryFn: () => adminService.inventory({
      warehouseId: warehouseFilter || undefined,
      status: statusFilter || undefined
    })
  });

  const movements = useQuery({
    queryKey: ['admin', 'inventory', 'movements', historyInventoryId],
    queryFn: () => adminService.movements(historyInventoryId!),
    enabled: Boolean(historyInventoryId)
  });

  const handleOpenAdjust = (row: InventoryRow) => {
    setSelectedInventory(row);
    setAdjustForm({ mode: 'SET', quantity: String(row.quantity), note: '' });
    setAdjustModalOpen(true);
  };

  const handleOpenHistory = (row: InventoryRow) => {
    setSelectedInventory(row);
    setHistoryInventoryId(row.id);
    setHistoryDrawerOpen(true);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;
    setBusy(true);
    try {
      const val = Number(adjustForm.quantity);
      if (adjustForm.mode === 'SET') {
        if (selectedInventory.variantId) {
          await adminService.setVariantStock(selectedInventory.variantId, val, adjustForm.note || 'Manual stock set by admin');
        } else {
          await adminService.adjustStock(selectedInventory.id, val - selectedInventory.quantity, adjustForm.note || 'Manual stock update');
        }
      } else {
        await adminService.adjustStock(selectedInventory.id, val, adjustForm.note || 'Manual stock adjustment');
      }
      toast({ title: 'Stock updated successfully', tone: 'success' });
      setAdjustModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'inventory'] });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Failed to update stock', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const rawRows: InventoryRow[] = Array.isArray(inventory.data)
    ? inventory.data
    : (inventory.data as unknown as { content: InventoryRow[] })?.content ?? [];

  const filteredRows = rawRows.filter((r) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return (
      (r.productName?.toLowerCase().includes(term)) ||
      (r.variantName?.toLowerCase().includes(term)) ||
      (r.sku?.toLowerCase().includes(term)) ||
      (r.id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Inventory & Stock Control"
        subtitle="Monitor warehouse stock levels, adjust quantities, view reservations, and audit movement logs"
      />

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search SKU, product or variant..."
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-9 rounded-xl border border-line bg-white px-3 text-[13px] text-ink focus:border-accent focus:outline-none"
            >
              <option value="">All Warehouses</option>
              {(warehouses.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-line bg-white px-3 text-[13px] text-ink focus:border-accent focus:outline-none"
            >
              <option value="">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      {inventory.isLoading && <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>}
      {inventory.isError && <ErrorState onRetry={() => void inventory.refetch()} />}

      {inventory.data && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-sunk/50 text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="py-3 px-4">SKU / Item ID</th>
                  <th className="py-3 px-4">Product & Variant</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4 text-center">Total Stock</th>
                  <th className="py-3 px-4 text-center">Reserved</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-sunk/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono font-semibold text-ink">{r.sku}</p>
                      <p className="text-[11px] text-ink-faint">{r.id}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-ink">{r.productName ?? 'Product'}</p>
                      <p className="text-[11.5px] text-ink-muted">{r.variantName ?? 'Base Model'}</p>
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      {r.warehouseName ?? r.warehouseId}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-ink">{r.quantity}</td>
                    <td className="py-3 px-4 text-center font-medium text-amber-600">{r.reserved}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{r.available}</td>
                    <td className="py-3 px-4">
                      <Badge tone={r.status === 'IN_STOCK' ? 'success' : r.status === 'LOW_STOCK' ? 'warning' : 'danger'}>
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleOpenAdjust(r)}>
                          Adjust Stock
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenHistory(r)}>
                          <History className="h-3.5 w-3.5" /> History
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-ink-muted">
                      No inventory records found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      <Dialog open={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title="Update Inventory Stock">
        {selectedInventory && (
          <form onSubmit={handleSaveStock} className="space-y-4">
            <div className="rounded-xl bg-surface-sunk p-3 text-[13px] border border-line">
              <p className="font-semibold text-ink">{selectedInventory.productName} ({selectedInventory.variantName ?? 'Base'})</p>
              <p className="text-[11px] font-mono text-ink-faint">SKU: {selectedInventory.sku} · Current Available: {selectedInventory.available}</p>
            </div>

            <div>
              <Label>Adjustment Type</Label>
              <div className="flex items-center gap-4 mt-1.5">
                <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={adjustForm.mode === 'SET'}
                    onChange={() => setAdjustForm({ ...adjustForm, mode: 'SET' })}
                  />
                  Set Exact Total Stock
                </label>
                <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={adjustForm.mode === 'DELTA'}
                    onChange={() => setAdjustForm({ ...adjustForm, mode: 'DELTA' })}
                  />
                  Add / Subtract Delta (+10 or -5)
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="adj-qty" required>
                {adjustForm.mode === 'SET' ? 'New Total Quantity' : 'Quantity Change (Delta)'}
              </Label>
              <Input
                id="adj-qty"
                type="number"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="adj-note">Audit Note / Reason</Label>
              <Input
                id="adj-note"
                value={adjustForm.note}
                onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                placeholder="e.g. Restock shipment received / Damage adjustment"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <Button type="button" variant="secondary" onClick={() => setAdjustModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : 'Save Inventory'}</Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* MOVEMENT HISTORY DRAWER */}
      <Sheet
        open={historyDrawerOpen}
        onClose={() => { setHistoryDrawerOpen(false); setHistoryInventoryId(null); }}
        title={`Stock History: ${selectedInventory?.sku ?? ''}`}
        side="right"
      >
        <div className="space-y-4 pb-12">
          {movements.isLoading && <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>}
          {movements.isError && <ErrorState onRetry={() => void movements.refetch()} />}

          {movements.data && (
            <div className="space-y-3">
              {movements.data.map((m: InventoryMovement) => (
                <div key={m.id} className="rounded-xl border border-line p-3 text-[12.5px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{m.type}</span>
                    <span className={cn('font-bold', m.change > 0 ? 'text-emerald-600' : m.change < 0 ? 'text-red-600' : 'text-ink-soft')}>
                      {m.change > 0 ? `+${m.change}` : m.change}
                    </span>
                  </div>
                  <p className="text-ink-muted text-[11.5px]">{m.note ?? 'Movement recorded'}</p>
                  <div className="flex items-center justify-between text-[10.5px] font-mono text-ink-faint pt-1 border-t border-line/50">
                    <span>After: {m.after} units</span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {movements.data.length === 0 && (
                <p className="py-8 text-center text-ink-muted text-[13px]">No audit movement records found for this item.</p>
              )}
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
