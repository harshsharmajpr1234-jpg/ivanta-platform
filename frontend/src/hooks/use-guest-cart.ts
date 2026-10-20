import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import { cartService } from '@/services';
import { useAuthStore } from '@/store/auth';
import { useGuestCart } from '@/store/guest-cart';
import { useUIStore } from '@/store/ui';

/** True when an error is a 401/403 from the API (session missing or expired). */
export const isAuthError = (e: unknown): boolean =>
  e instanceof ApiError && (e.status === 401 || e.status === 403 || e.code === 'UNAUTHORIZED');

// Module-level guard: one merge at a time, immune to React StrictMode double-effects.
let mergeInFlight: Promise<void> | null = null;

/**
 * Watches for login. When a user session appears while the local guest cart is
 * non-empty, merges it into the server cart:
 *  - same product + variant quantities are combined by the backend,
 *  - the backend validates stock and re-prices every line from the database
 *    (local prices are never sent),
 *  - unavailable items are dropped and reported,
 *  - exactly ONE summary toast is produced for the whole merge.
 * If the session turns out to be stale (401 mid-merge) it falls back to guest
 * mode and keeps the local cart untouched.
 */
export function useGuestCartMerge(): void {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const items = useGuestCart((s) => s.items);
  const clearGuest = useGuestCart((s) => s.clear);
  const toast = useUIStore((s) => s.toast);
  const qc = useQueryClient();

  useEffect(() => {
    if (!user || items.length === 0 || mergeInFlight) return;

    mergeInFlight = (async () => {
      const dropped: string[] = [];
      let merged = 0;
      for (const item of items) {
        try {
          await cartService.addItem(item.productId, item.quantity, item.variantId);
          merged += 1;
        } catch (e) {
          if (isAuthError(e)) {
            // Session died mid-merge — back to guest mode, keep the local cart.
            setUser(null);
            return;
          }
          dropped.push(item.variantName ? `${item.name} (${item.variantName})` : item.name);
        }
      }
      clearGuest();
      void qc.invalidateQueries({ queryKey: ['cart'] });
      void qc.invalidateQueries({ queryKey: ['checkout-preview'] });
      if (merged > 0 && dropped.length === 0) {
        toast({
          title: 'Cart synced to your account',
          description: `${merged} item${merged === 1 ? '' : 's'} merged — prices re-verified by the server.`,
          tone: 'success',
        });
      } else if (merged > 0) {
        toast({ title: 'Cart synced — some items unavailable', description: `Removed: ${dropped.join(', ')}`, tone: 'warning' });
      } else if (dropped.length > 0) {
        toast({ title: 'Could not sync cart', description: `Unavailable: ${dropped.join(', ')}`, tone: 'error' });
      }
    })().finally(() => {
      mergeInFlight = null;
    });
  }, [user, items, clearGuest, qc, setUser, toast]);
}

/** Mounted once in <Providers> — runs the guest-cart merge whenever a session appears. */
export function GuestCartBridge(): null {
  useGuestCartMerge();
  return null;
}
