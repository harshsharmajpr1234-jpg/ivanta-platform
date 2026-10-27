'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Filter, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { NoResultsState, ErrorState } from '@/components/ui/states';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { catalogService, wishlistService } from '@/services';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { PRODUCT_SORTS } from '@/constants';
import { cn } from '@/lib/utils';
import type { CategoryNode, ProductQuery } from '@/types';


function flatten(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  return nodes.flatMap((n) => [{ node: n, depth }, ...flatten(n.children ?? [], depth + 1)]);
}

function Catalog() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const { user } = useAuthStore();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') ?? '';
  const cat = params.get('cat') ?? '';
  const sort = (params.get('sort') ?? 'featured') as ProductQuery['sort'];
  const page = Number(params.get('page') ?? 0);
  const minPrice = params.get('min') ?? '';
  const maxPrice = params.get('max') ?? '';

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => catalogService.categories(), staleTime: 5 * 60_000 });
  const catList = useMemo(() => flatten(categories.data ?? []), [categories.data]);
  const activeCat = catList.find((c) => c.node.slug === cat || (cat === 'apple-watch' && c.node.slug === 'watch'))?.node;

  const effectiveCategory = cat || activeCat?.id || undefined;
  const query: ProductQuery = {
    q: q || undefined,
    category: effectiveCategory,
    categoryId: activeCat?.id || effectiveCategory,
    sort,
    page,
    size: 12,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  };
  const products = useQuery({
    queryKey: ['products', query],
    queryFn: ({ signal }) => catalogService.products(query, signal),
    placeholderData: keepPreviousData,
  });

  const wishIds = useQuery({ queryKey: ['wishlist', 'ids'], queryFn: () => wishlistService.ids(), enabled: Boolean(user) });

  const setParam = (key: string, value: string | number | null) => {
    const usp = new URLSearchParams(params.toString());
    if (value === null || value === '' || value === 0 && key === 'page') usp.delete(key);
    else usp.set(key, String(value));
    if (key !== 'page') usp.delete('page');
    router.push(`/products?${usp.toString()}`, { scroll: key === 'page' });
  };

  const toggleWish = async (productId: string) => {
    if (!user) { router.push('/login?next=/products'); return; }
    const has = wishIds.data?.includes(productId);
    try {
      await wishlistService.toggle(productId, !has);
      void qc.invalidateQueries({ queryKey: ['wishlist'] });
    } catch { toast({ title: 'Could not update wishlist', tone: 'error' }); }
  };

  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  useEffect(() => { setMinInput(minPrice); setMaxInput(maxPrice); }, [minPrice, maxPrice]);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-ink">Category</h3>
        <ul className="mt-2 space-y-0.5">
          <li>
            <button type="button" onClick={() => setParam('cat', null)}
              className={cn('w-full rounded-lg px-2.5 py-1.5 text-left text-[13px]', !cat ? 'bg-ink font-semibold text-white' : 'text-ink-soft hover:bg-surface-sunk')}>
              All products
            </button>
          </li>
          {catList.map(({ node, depth }) => (
            <li key={node.id}>
              <button type="button" onClick={() => setParam('cat', node.slug)}
                style={{ paddingLeft: `${10 + depth * 14}px` }}
                className={cn('w-full rounded-lg py-1.5 pr-2.5 text-left text-[13px]',
                  cat === node.slug ? 'bg-ink font-semibold text-white' : 'text-ink-soft hover:bg-surface-sunk')}>
                {node.name} <span className="opacity-60">({node.productCount})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-ink">Price (₹)</h3>
        <div className="mt-2 flex items-center gap-2">
          <Input inputMode="numeric" value={minInput} onChange={(e) => setMinInput(e.target.value)} placeholder="Min" className="h-9" />
          <span className="text-ink-faint">–</span>
          <Input inputMode="numeric" value={maxInput} onChange={(e) => setMaxInput(e.target.value)} placeholder="Max" className="h-9" />
        </div>
        <Button variant="secondary" size="sm" className="mt-2 w-full"
          onClick={() => { setParam('min', minInput || null); setParam('max', maxInput || null); }}>
          Apply price
        </Button>
      </div>
      {(cat || minPrice || maxPrice || sort !== 'featured') && (
        <button type="button" onClick={() => router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')}
          className="flex items-center gap-1.5 text-[13px] font-medium text-danger hover:underline">
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}
    </div>
  );

  const total = products.data?.totalElements ?? 0;
  const totalPages = products.data?.totalPages ?? 0;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        ...(activeCat ? [{ label: activeCat.name }] : q ? [{ label: `“${q}”` }] : []),
      ]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {q ? `Results for “${q}”` : activeCat?.name ?? 'All products'}
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            {products.data ? `${total} product${total === 1 ? '' : 's'}` : 'Loading…'} · prices & stock verified live by the server
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <label className="flex items-center gap-2 text-[13px] text-ink-soft">
            <SlidersHorizontal className="h-4 w-4 text-ink-faint" />
            <select value={sort} onChange={(e) => setParam('sort', e.target.value)}
              className="h-9 rounded-xl border border-line-strong bg-white px-2.5 text-[13px] text-ink focus:border-accent focus:outline-none">
              {PRODUCT_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{filterPanel}</aside>
        <div>
          {products.isError ? (
            <ErrorState description="Could not load products. Is the backend running?" onRetry={() => void products.refetch()} />
          ) : !products.data ? (
            <ProductGridSkeleton count={8} />
          ) : products.data.content.length === 0 ? (
            <NoResultsState icon={SearchX} title="No products match" description="Try a different search, category or price range."
              action={<Button variant="secondary" onClick={() => router.push('/products')}>Clear filters</Button>} />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
              {products.data.content.map((p) => (
                <ProductCard key={p.id} p={p} wished={wishIds.data?.includes(p.id)} onToggleWish={() => void toggleWish(p.id)} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setParam('page', page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-[13px] text-ink-soft">Page {page + 1} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page + 1 >= totalPages} onClick={() => setParam('page', page + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} side="left" title="Filters">{filterPanel}</Sheet>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1240px] px-4 py-8"><ProductGridSkeleton count={6} /></div>}>
      <Catalog />
    </Suspense>
  );
}
