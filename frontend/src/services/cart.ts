import { api } from '@/lib/api/client';
import { API } from '@/lib/api/paths';
import type { Cart } from '@/types';

export const cartService = {
  get: () => api.get<Cart>(API.cart.root),
  addItem: (productId: string, quantity: number, variantId?: string | null) =>
    api.post<Cart>(API.cart.items, { productId, variantId: variantId ?? null, quantity }),
  updateItem: (itemId: string, quantity: number) =>
    api.patch<Cart>(API.cart.item(itemId), { quantity }),
  removeItem: (itemId: string) => api.del<Cart>(API.cart.item(itemId)),
  clear: () => api.del<Cart>(API.cart.root),
};

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  imageKey?: string | null;
  stockStatus: string;
}

export const wishlistService = {
  get: async (): Promise<{ items: WishlistItem[] }> => {
    const data = await api.get<any>(API.wishlist.root);
    const rawList: any[] = Array.isArray(data) ? data : (data?.items ?? []);
    return {
      items: rawList.map((it) => ({
        productId: String(it.id ?? it.productId ?? ''),
        name: it.name ?? '',
        slug: it.slug ?? '',
        price: Number(it.price ?? 0),
        mrp: Number(it.mrp ?? it.price ?? 0),
        imageKey: it.imageKey ?? null,
        stockStatus: it.stockStatus ?? 'IN_STOCK',
      })),
    };
  },
  ids: () => api.get<string[]>(API.wishlist.ids),
  toggle: (productId: string, add: boolean) =>
    add ? api.post<void>(API.wishlist.item(productId)) : api.del<void>(API.wishlist.item(productId)),
};
