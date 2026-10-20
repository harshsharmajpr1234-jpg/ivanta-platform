'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive, CheckCircle2, ChevronLeft, ChevronRight, Edit3, Eye, FileText, Image as ImageIcon,
  Layers, Plus, RefreshCw, Search, Trash2, Upload, X
} from 'lucide-react';
import { SectionHeader } from '@/components/admin/section-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Sheet } from '@/components/ui/sheet';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/states';
import { adminService, catalogService } from '@/services';
import { useUIStore } from '@/store/ui';
import { inr, cn } from '@/lib/utils';
import type { ProductDetail, ProductListItem } from '@/types';

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [catFilter, setCatFilter] = useState('');

  // Modals & drawers
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Variant modal
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantForm, setVariantForm] = useState({ sku: '', name: '', storage: '', color: '', connectivity: '', size: '', price: '', mrp: '', stock: '10' });

  // Image modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isMainImage, setIsMainImage] = useState(true);

  // Spec modal
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '', sku: '', brandId: 'BRD-APPLE', categoryId: '', model: '',
    shortDescription: '', description: '', price: '', mrp: '', taxRate: '0',
    releaseYear: String(new Date().getFullYear()), warrantyMonths: '12',
    isActive: true, featured: false
  });
  const [busy, setBusy] = useState(false);

  // Categories query
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => catalogService.categories() });
  
  // Products list query
  const products = useQuery({
    queryKey: ['admin', 'products', page, q, status, catFilter],
    queryFn: () => adminService.adminProducts({
      page, size: 15, q: q || undefined,
      status: status === 'ALL' ? undefined : status,
      categoryId: catFilter || undefined
    })
  });

  const loadProductDetail = async (id: string) => {
    setSelectedProductId(id);
    setLoadingDetail(true);
    try {
      const detail = await adminService.adminProduct(id);
      setEditProduct(detail);
    } catch {
      toast({ title: 'Could not load product details', tone: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.categoryId || !createForm.price) {
      toast({ title: 'Please fill required fields (Name, Category, Price)', tone: 'error' });
      return;
    }
    setBusy(true);
    try {
      const created = await adminService.createProduct({
        name: createForm.name.trim(),
        sku: createForm.sku.trim() || undefined,
        brandId: createForm.brandId,
        categoryId: createForm.categoryId,
        model: createForm.model.trim() || undefined,
        shortDescription: createForm.shortDescription.trim() || undefined,
        description: createForm.description.trim() || undefined,
        price: Number(createForm.price),
        mrp: createForm.mrp ? Number(createForm.mrp) : Number(createForm.price),
        taxRate: Number(createForm.taxRate || 0),
        releaseYear: createForm.releaseYear ? Number(createForm.releaseYear) : undefined,
        warrantyMonths: Number(createForm.warrantyMonths || 12),
        isActive: createForm.isActive,
        featured: createForm.featured
      });
      toast({ title: 'Product created successfully', tone: 'success' });
      setCreateOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      loadProductDetail(created.id);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Failed to create product', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePublish = async (p: ProductDetail) => {
    setBusy(true);
    try {
      await adminService.updateProduct(p.id, { isActive: !p.isActive });
      toast({ title: p.isActive ? 'Product unpublished (DRAFT)' : 'Product published (ACTIVE)', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      loadProductDetail(p.id);
    } catch {
      toast({ title: 'Failed to update product status', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleFeatured = async (p: ProductDetail) => {
    setBusy(true);
    try {
      await adminService.updateProduct(p.id, { featured: !p.featured });
      toast({ title: p.featured ? 'Removed from featured' : 'Marked as featured', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      loadProductDetail(p.id);
    } catch {
      toast({ title: 'Failed to update featured flag', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product? It will be hidden from the public store.')) return;
    setBusy(true);
    try {
      await adminService.archiveProduct(id);
      toast({ title: 'Product archived', tone: 'success' });
      setSelectedProductId(null);
      setEditProduct(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch {
      toast({ title: 'Could not archive product', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setBusy(true);
    try {
      await adminService.addVariant(editProduct.id, {
        sku: variantForm.sku.trim() || undefined,
        name: variantForm.name.trim() || undefined,
        storage: variantForm.storage.trim() || undefined,
        color: variantForm.color.trim() || undefined,
        connectivity: variantForm.connectivity.trim() || undefined,
        size: variantForm.size.trim() || undefined,
        price: Number(variantForm.price || editProduct.price),
        mrp: Number(variantForm.mrp || editProduct.mrp),
        isActive: true
      });
      toast({ title: 'Variant added', tone: 'success' });
      setVariantModalOpen(false);
      setVariantForm({ sku: '', name: '', storage: '', color: '', connectivity: '', size: '', price: '', mrp: '', stock: '10' });
      loadProductDetail(editProduct.id);
    } catch {
      toast({ title: 'Failed to add variant', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !imageFile) return;
    setBusy(true);
    try {
      await adminService.uploadImage(editProduct.id, imageFile, isMainImage);
      toast({ title: 'Image uploaded successfully', tone: 'success' });
      setImageModalOpen(false);
      setImageFile(null);
      loadProductDetail(editProduct.id);
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch {
      toast({ title: 'Image upload failed', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleAddSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !specKey || !specValue) return;
    setBusy(true);
    try {
      await adminService.addSpec(editProduct.id, { specKey, specValue });
      toast({ title: 'Specification added', tone: 'success' });
      setSpecModalOpen(false);
      setSpecKey(''); setSpecValue('');
      loadProductDetail(editProduct.id);
    } catch {
      toast({ title: 'Failed to add specification', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const totalPages = products.data?.totalPages ?? 0;
  const total = products.data?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Product Catalog Management"
        subtitle="Manage products, variants, pricing, stock and publishing status for the customer store"
        action={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add New Product
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => { setStatus(st); setPage(0); }}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-[13px] font-medium transition-colors',
                  status === st ? 'bg-ink text-white' : 'bg-surface-sunk text-ink-soft hover:bg-line'
                )}
              >
                {st === 'ALL' ? 'All Products' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                placeholder="Search products..."
                className="pl-9 h-9"
              />
            </div>

            <select
              value={catFilter}
              onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}
              className="h-9 rounded-xl border border-line bg-white px-3 text-[13px] text-ink focus:border-accent focus:outline-none"
            >
              <option value="">All Categories</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      {products.isLoading && <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>}
      {products.isError && <ErrorState onRetry={() => void products.refetch()} />}

      {products.data && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-sunk/50 text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Brand / Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.data.content.map((p: ProductListItem) => (
                  <tr key={p.id} className="hover:bg-surface-sunk/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => loadProductDetail(p.id)}
                          className="font-semibold text-ink hover:text-accent text-left"
                        >
                          {p.name}
                        </button>
                        <p className="text-[11px] font-mono text-ink-faint">ID: {p.id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      {p.brand} / <span className="font-medium text-ink">{p.category}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-ink">
                      {inr(p.price)}
                      {p.mrp > p.price && (
                        <span className="ml-1.5 text-[11px] font-normal text-ink-faint line-through">{inr(p.mrp)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={p.stockStatus === 'IN_STOCK' ? 'success' : p.stockStatus === 'LOW_STOCK' ? 'warning' : 'danger'}>
                        {p.stockStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={p.stockStatus !== 'DISCONTINUED' ? 'success' : 'neutral'}>
                        ACTIVE
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {p.featured ? (
                        <span className="inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">Featured</span>
                      ) : (
                        <span className="text-ink-faint text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => loadProductDetail(p.id)}>
                          <Edit3 className="h-3.5 w-3.5" /> Manage
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.data.content.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-muted">
                      No products found. Add products using the button above to publish to the store.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="text-[12px] text-ink-soft">Showing page {page + 1} of {totalPages} ({total} products)</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button variant="secondary" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* CREATE PRODUCT MODAL */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Product">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="c-name" required>Product Name</Label>
              <Input id="c-name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. iPhone 17 Pro" required />
            </div>

            <div>
              <Label htmlFor="c-cat" required>Category</Label>
              <select
                id="c-cat"
                value={createForm.categoryId}
                onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                className="w-full h-10 rounded-xl border border-line bg-white px-3 text-[13px] text-ink focus:border-accent"
                required
              >
                <option value="">Select category...</option>
                {(categories.data ?? []).flatMap(c => [c, ...(c.children ?? [])]).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="c-sku">SKU (Auto-generated if empty)</Label>
              <Input id="c-sku" value={createForm.sku} onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })} placeholder="e.g. IVN-IP17P" />
            </div>

            <div>
              <Label htmlFor="c-price" required>Selling Price (₹)</Label>
              <Input id="c-price" type="number" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} placeholder="129900" required />
            </div>

            <div>
              <Label htmlFor="c-mrp">MRP / List Price (₹)</Label>
              <Input id="c-mrp" type="number" value={createForm.mrp} onChange={(e) => setCreateForm({ ...createForm, mrp: e.target.value })} placeholder="134900" />
            </div>

            <div>
              <Label htmlFor="c-model">Model Number</Label>
              <Input id="c-model" value={createForm.model} onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })} placeholder="e.g. A3523" />
            </div>

            <div>
              <Label htmlFor="c-warranty">Warranty (Months)</Label>
              <Input id="c-warranty" type="number" value={createForm.warrantyMonths} onChange={(e) => setCreateForm({ ...createForm, warrantyMonths: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="c-short">Short Description</Label>
              <Input id="c-short" value={createForm.shortDescription} onChange={(e) => setCreateForm({ ...createForm, shortDescription: e.target.value })} placeholder="Brief product overview for cards" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="c-desc">Full Description</Label>
              <textarea
                id="c-desc"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full rounded-xl border border-line p-3 text-[13px] text-ink focus:border-accent"
                placeholder="Detailed specifications and product features..."
              />
            </div>

            <div className="flex items-center gap-6 sm:col-span-2 pt-2">
              <label className="flex items-center gap-2 text-[13px] font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                Publish immediately (Active)
              </label>

              <label className="flex items-center gap-2 text-[13px] font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.featured}
                  onChange={(e) => setCreateForm({ ...createForm, featured: e.target.checked })}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                Mark as Featured Product
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : 'Save Product'}</Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT & MANAGE PRODUCT DRAWER */}
      <Sheet
        open={Boolean(selectedProductId)}
        onClose={() => { setSelectedProductId(null); setEditProduct(null); }}
        title={editProduct ? `Manage: ${editProduct.name}` : 'Product Details'}
        side="right"
      >
        {loadingDetail && <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>}
        
        {editProduct && (
          <div className="space-y-6 pb-12">
            {/* Status & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-sunk p-4 border border-line">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={editProduct.isActive ? 'success' : 'warning'}>
                    {editProduct.isActive ? 'ACTIVE' : 'DRAFT'}
                  </Badge>
                  {editProduct.featured && <Badge tone="neutral">FEATURED</Badge>}
                </div>
                <p className="mt-1 text-[11px] font-mono text-ink-faint">SKU: {editProduct.sku}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={editProduct.isActive ? 'secondary' : 'primary'} onClick={() => handleTogglePublish(editProduct)}>
                  {editProduct.isActive ? 'Unpublish (Draft)' : 'Publish (Active)'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleToggleFeatured(editProduct)}>
                  {editProduct.featured ? 'Unfeature' : 'Feature'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleArchive(editProduct.id)}>
                  <Archive className="h-3.5 w-3.5" /> Archive
                </Button>
              </div>
            </div>

            {/* Price & Overview */}
            <Card className="p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-ink uppercase tracking-wide">Pricing & Stock</h3>
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div><span className="text-ink-faint block text-[11px]">Selling Price</span><span className="font-bold text-ink">{inr(editProduct.price)}</span></div>
                <div><span className="text-ink-faint block text-[11px]">MRP</span><span className="text-ink">{inr(editProduct.mrp)}</span></div>
                <div><span className="text-ink-faint block text-[11px]">Category</span><span className="text-ink">{editProduct.category}</span></div>
                <div><span className="text-ink-faint block text-[11px]">Brand</span><span className="text-ink">{editProduct.brand}</span></div>
              </div>
            </Card>

            {/* Images Section */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" /> Images ({editProduct.images?.length ?? 0})
                </h3>
                <Button size="sm" variant="secondary" onClick={() => setImageModalOpen(true)}>
                  <Upload className="h-3.5 w-3.5" /> Upload Image
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(editProduct.images ?? []).map((img) => (
                  <div key={img.id} className="relative group rounded-xl border border-line overflow-hidden bg-surface-sunk aspect-square">
                    <img src={`/api/v1/media/${img.storageKey}`} alt={img.alt ?? 'Product image'} className="h-full w-full object-cover" />
                    {img.isMain && <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[9px] font-bold text-white">MAIN</span>}
                    <button
                      type="button"
                      onClick={async () => {
                        await adminService.deleteImage(img.id);
                        loadProductDetail(editProduct.id);
                      }}
                      className="absolute right-1 top-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {(editProduct.images ?? []).length === 0 && (
                  <p className="col-span-3 py-4 text-center text-[12px] text-ink-muted">No images uploaded yet.</p>
                )}
              </div>
            </Card>

            {/* Variants Section */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="h-4 w-4" /> Variants ({editProduct.variants?.length ?? 0})
                </h3>
                <Button size="sm" variant="secondary" onClick={() => setVariantModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Variant
                </Button>
              </div>

              <div className="space-y-2">
                {(editProduct.variants ?? []).map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl border border-line p-3 text-[13px]">
                    <div>
                      <p className="font-semibold text-ink">{v.name}</p>
                      <p className="text-[11px] font-mono text-ink-faint">SKU: {v.sku} · Stock: {v.available}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-ink">{inr(v.price)}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await adminService.deleteVariant(v.id);
                          loadProductDetail(editProduct.id);
                        }}
                        className="text-danger hover:underline text-[12px]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {(editProduct.variants ?? []).length === 0 && (
                  <p className="py-4 text-center text-[12px] text-ink-muted">No variants created. The product will sell at base price.</p>
                )}
              </div>
            </Card>

            {/* Specifications */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Specifications
                </h3>
                <Button size="sm" variant="secondary" onClick={() => setSpecModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Spec
                </Button>
              </div>

              <dl className="divide-y divide-line text-[13px]">
                {(editProduct.specs ?? []).map((s, idx) => (
                  <div key={idx} className="flex justify-between py-2">
                    <dt className="font-medium text-ink-muted">{s.specKey}</dt>
                    <dd className="font-semibold text-ink">{s.specValue}</dd>
                  </div>
                ))}
                {(editProduct.specs ?? []).length === 0 && (
                  <p className="py-4 text-center text-[12px] text-ink-muted">No specifications listed.</p>
                )}
              </dl>
            </Card>
          </div>
        )}
      </Sheet>

      {/* ADD VARIANT MODAL */}
      <Dialog open={variantModalOpen} onClose={() => setVariantModalOpen(false)} title="Add Product Variant">
        <form onSubmit={handleAddVariant} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="v-sku">SKU</Label><Input id="v-sku" value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} placeholder="Auto-generated if empty" /></div>
            <div><Label htmlFor="v-storage">Storage / Capacity</Label><Input id="v-storage" value={variantForm.storage} onChange={(e) => setVariantForm({ ...variantForm, storage: e.target.value })} placeholder="e.g. 256GB" /></div>
            <div><Label htmlFor="v-color">Color</Label><Input id="v-color" value={variantForm.color} onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })} placeholder="e.g. Black" /></div>
            <div><Label htmlFor="v-size">Size / Screen</Label><Input id="v-size" value={variantForm.size} onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })} placeholder="e.g. 6.3 inch" /></div>
            <div><Label htmlFor="v-price" required>Price (₹)</Label><Input id="v-price" type="number" value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })} placeholder={String(editProduct?.price ?? '')} required /></div>
            <div><Label htmlFor="v-mrp">MRP (₹)</Label><Input id="v-mrp" type="number" value={variantForm.mrp} onChange={(e) => setVariantForm({ ...variantForm, mrp: e.target.value })} placeholder={String(editProduct?.mrp ?? '')} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setVariantModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : 'Add Variant'}</Button>
          </div>
        </form>
      </Dialog>

      {/* UPLOAD IMAGE MODAL */}
      <Dialog open={imageModalOpen} onClose={() => setImageModalOpen(false)} title="Upload Product Image">
        <form onSubmit={handleUploadImage} className="space-y-4">
          <div>
            <Label htmlFor="img-file" required>Select Image File</Label>
            <Input id="img-file" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} required />
          </div>
          <label className="flex items-center gap-2 text-[13px] font-medium text-ink cursor-pointer">
            <input type="checkbox" checked={isMainImage} onChange={(e) => setIsMainImage(e.target.checked)} />
            Set as Primary Main Product Image
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setImageModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !imageFile}>{busy ? <Spinner className="h-4 w-4" /> : 'Upload'}</Button>
          </div>
        </form>
      </Dialog>

      {/* ADD SPEC MODAL */}
      <Dialog open={specModalOpen} onClose={() => setSpecModalOpen(false)} title="Add Specification">
        <form onSubmit={handleAddSpec} className="space-y-4">
          <div><Label htmlFor="s-key" required>Specification Key</Label><Input id="s-key" value={specKey} onChange={(e) => setSpecKey(e.target.value)} placeholder="e.g. Display / Chip / Camera" required /></div>
          <div><Label htmlFor="s-val" required>Specification Value</Label><Input id="s-val" value={specValue} onChange={(e) => setSpecValue(e.target.value)} placeholder="e.g. 6.3 inch Super Retina XDR" required /></div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setSpecModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : 'Add Specification'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
