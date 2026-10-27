import { api } from '@/lib/api/client';
import { API } from '@/lib/api/paths';
import type { CategoryNode, Page, ProductDetail, ProductListItem, ProductQuery } from '@/types';

export const catalogService = {
  categories: () => api.get<CategoryNode[]>(API.categories),
  products: (query: ProductQuery = {}, signal?: AbortSignal) => {
    const q: Record<string, any> = { ...query };
    if (!q.category && q.categoryId) q.category = q.categoryId;
    return api.get<Page<ProductListItem>>(API.products.list, { query: q, signal });
  },
  featured: (limit = 8) => api.get<ProductListItem[]>(API.products.featured, { query: { size: limit } }),
  product: (idOrSlug: string) => api.get<ProductDetail>(API.products.detail(idOrSlug)),
  related: (id: string) => api.get<ProductListItem[]>(API.products.related(id)),
  availability: (id: string) =>
    api.get<{ productId: string; stockStatus: string; variants: { variantId: string; variantName?: string | null; sku?: string | null; totalAvailable: number; byWarehouse: Record<string, number>; status: string }[] }>(API.products.availability(id)),
};
