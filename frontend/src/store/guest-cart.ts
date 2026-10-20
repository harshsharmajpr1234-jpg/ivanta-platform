import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Guest cart — persisted locally (localStorage) so shoppers can browse and add
 * items without an account. `unitPrice`/`mrp` are DISPLAY ONLY: the server
 * re-prices everything from the database when the cart is merged after login
 * and again in the checkout preview. Never trust these values for charging.
 */
export interface GuestCartItem {
  key: string; // `${productId}::${variantId ?? ''}`
  productId: string;
  variantId: string | null;
  sku: string | null;
  name: string;
  variantName: string | null;
  imageKey: string | null;
  slug: string;
  quantity: number;
  unitPrice: number;
  mrp: number | null;
  selectedStorage: string | null;
  selectedColor: string | null;
  addedAt: string;
}

export const GUEST_CART_MAX_PER_ITEM = 10;

export const guestItemKey = (productId: string, variantId?: string | null): string =>
  `${productId}::${variantId ?? ''}`;

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (item: Omit<GuestCartItem, 'key' | 'addedAt'>) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((s) => {
          const key = guestItemKey(item.productId, item.variantId);
          const existing = s.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.key === key
                  ? {
                      ...i,
                      quantity: Math.min(GUEST_CART_MAX_PER_ITEM, i.quantity + item.quantity),
                      unitPrice: item.unitPrice,
                      mrp: item.mrp,
                    }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...s.items,
              { ...item, key, quantity: Math.min(GUEST_CART_MAX_PER_ITEM, Math.max(1, item.quantity)), addedAt: new Date().toISOString() },
            ],
          };
        }),
      setQuantity: (key, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.key !== key)
              : s.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(GUEST_CART_MAX_PER_ITEM, quantity) } : i)),
        })),
      removeItem: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'ivanta-guest-cart', version: 1 },
  ),
);

export const guestCartCount = (items: GuestCartItem[]): number => items.reduce((n, i) => n + i.quantity, 0);
export const guestCartSubtotal = (items: GuestCartItem[]): number => items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
