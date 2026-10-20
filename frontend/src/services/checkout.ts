import { api, apiBlob } from '@/lib/api/client';
import { API } from '@/lib/api/paths';
import type {
  CheckoutPreview, OrderDetail, OrderSummary, Payment, PaymentMethod,
  PlaceOrderInput, TimelineEvent, Tracking,
} from '@/types';

export interface OrderListFilters {
  q?: string; status?: string; from?: string; to?: string; page?: number; size?: number;
}

/** Triggers a browser download for an invoice PDF served by the backend. */
export async function downloadInvoice(url: string, fallbackName: string): Promise<void> {
  const { blob, filename } = await apiBlob(url);
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export const checkoutService = {
  preview: (params: { addressId?: string; shippingMethodId?: string; couponCode?: string; paymentMethod?: string }) =>
    api.post<CheckoutPreview>(API.checkout.preview, undefined, { query: params }),
};

export const orderService = {
  place: (input: PlaceOrderInput) => api.post<OrderDetail>(API.orders.root, input),
  list: (filters: OrderListFilters = {}) =>
    api.get<{ content: OrderSummary[]; page: number; size: number; totalElements: number; totalPages: number }>(
      API.orders.root,
      { query: { page: filters.page ?? 0, size: filters.size ?? 10, q: filters.q, status: filters.status, from: filters.from, to: filters.to } }),
  get: (id: string) => api.get<OrderDetail>(API.orders.detail(id)),
  timeline: (id: string) => api.get<TimelineEvent[]>(API.orders.timeline(id)),
  tracking: (id: string) => api.get<Tracking>(API.orders.tracking(id)),
  downloadInvoice: (id: string) => downloadInvoice(API.orders.invoice(id), `invoice-${id}.pdf`),
  cancel: (id: string, reason?: string) => api.post<OrderDetail>(API.orders.cancel(id), { reason }),
};

export const paymentService = {
  initiate: (orderId: string, method: PaymentMethod) =>
    api.post<Payment>(API.payments.initiate, { orderId, method }),
  verify: (paymentId: string, reference: string) =>
    api.post<Payment>(API.payments.verify(paymentId), { reference }),
  list: () => api.get<Payment[]>(API.payments.list),
  get: (id: string) => api.get<Payment>(API.payments.detail(id)),
};
