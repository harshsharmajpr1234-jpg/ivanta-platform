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

export const wishlistService = {
  get: () => api.get<{ items: { productId: string; name: string; slug: string; price: number; mrp: number; imageKey?: string | null; stockStatus: string }[] }>(API.wishlist.root),
  ids: () => api.get<string[]>(API.wishlist.ids),
  toggle: (productId: string, add: boolean) =>
    add ? api.post<void>(API.wishlist.item(productId)) : api.del<void>(API.wishlist.item(productId)),
};
