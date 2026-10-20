'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FolderTree, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, RefreshCw
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
import type { CategoryItem } from '@/types';

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminService.adminCategories(),
  });

  const categories = categoriesQuery.data ?? [];

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.slug.toLowerCase().includes(q.toLowerCase())
  );

  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setParentId('');
    setDescription('');
    setSortOrder('0');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (c: CategoryItem) => {
    setEditingCategory(c);
    setName(c.name);
    setParentId(c.parentId ?? '');
    setDescription(c.description ?? '');
    setSortOrder(String(c.sortOrder));
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Name is required', tone: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, {
          name: name.trim(),
          parentId: parentId || null,
          description: description.trim() || undefined,
          sortOrder: parseInt(sortOrder, 10) || 0,
          isActive,
        });
        toast({ title: 'Category updated', tone: 'success' });
      } else {
        await adminService.createCategory({
          name: name.trim(),
          parentId: parentId || null,
          description: description.trim() || undefined,
          sortOrder: parseInt(sortOrder, 10) || 0,
        });
        toast({ title: 'Category created', tone: 'success' });
      }
      setModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to save category', description: msg, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${catName}"?`)) return;
    try {
      await adminService.deleteCategory(id);
      toast({ title: 'Category deactivated', tone: 'info' });
      void qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to deactivate', description: msg, tone: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Categories"
        subtitle="Manage product categories, catalog hierarchy and sorting order"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void qc.invalidateQueries({ queryKey: ['admin', 'categories'] })}
              disabled={categoriesQuery.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${categoriesQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search category name or slug..."
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Categories Table */}
      {categoriesQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : categoriesQuery.isError ? (
        <ErrorState onRetry={() => void categoriesQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories found"
          description={q ? 'Try a different search term.' : 'Click "Add category" to create your first catalog category.'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-surface-sunk text-[11.5px] uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Slug</th>
                  <th className="px-5 py-3 font-semibold">Parent Category</th>
                  <th className="px-5 py-3 font-semibold">Sort Order</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((cat) => {
                  const parent = categories.find((c) => c.id === cat.parentId);
                  return (
                    <tr key={cat.id} className="hover:bg-surface-sunk/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-line text-ink font-semibold">
                            {cat.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-semibold text-ink">{cat.name}</p>
                            {cat.description && (
                              <p className="max-w-xs truncate text-[11.5px] text-ink-muted">{cat.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-ink-soft">
                        {cat.slug}
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">
                        {parent ? parent.name : <span className="text-ink-faint">None (Root)</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-ink-soft">
                        {cat.sortOrder}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={cat.isActive ? 'success' : 'neutral'}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(cat)}
                            title="Edit Category"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {cat.isActive && (
                            <Button
                              variant="danger"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDeactivate(cat.id, cat.name)}
                              title="Deactivate Category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        description="Set category details and catalog organization"
        size="md"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Category Name *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro"
              required
            />
          </div>

          <div>
            <Label htmlFor="cat-parent">Parent Category (Optional)</Label>
            <select
              id="cat-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
            >
              <option value="">None (Top-level Category)</option>
              {categories
                .filter((c) => !editingCategory || c.id !== editingCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Input
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for SEO and catalog listing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cat-order">Sort Order</Label>
              <Input
                id="cat-order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
              />
            </div>
            {editingCategory && (
              <div className="flex flex-col justify-end">
                <Label className="mb-2">Status</Label>
                <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-line"
                  />
                  Category is Active
                </label>
              </div>
            )}
          </div>
        </form>
      </Dialog>
    </div>
  );
}
