import { api } from '@/lib/api/client';
import { API } from '@/lib/api/paths';
import type { AppNotification, Coupon, CouponValidation, Refund, Replacement, ReturnRequest, Review, ReviewList, Shipment, ShippingMethod, Tracking } from '@/types';

export const deliveryService = {
  tracking: (orderId: string) => api.get<Tracking>(API.delivery.tracking(orderId)),
  shippingMethods: () => api.get<ShippingMethod[]>(API.delivery.shippingMethods),
};

export const replacementService = {
  request: (orderId: string, orderItemId: string, reason: string) =>
    api.post<Replacement>(API.replacements.root, { orderId, orderItemId, reason }),
  list: () => api.get<Replacement[]>(API.replacements.root),
  get: (id: string) => api.get<Replacement>(API.replacements.detail(id)),
};

export const returnService = {
  create: (orderId: string, reason: string, notes?: string, itemIds?: string[]) =>
    api.post<ReturnRequest>(API.returns.root, { orderId, reason, notes: notes ?? null, itemIds: itemIds ?? null }),
  list: () => api.get<ReturnRequest[]>(API.returns.root),
  get: (id: string) => api.get<ReturnRequest>(API.returns.detail(id)),
  refunds: () => api.get<Refund[]>(API.refunds),
};

export const couponService = {
  validate: (code: string, amount: number) =>
    api.post<CouponValidation>(API.coupons.validate, { code, amount }),
};

export const reviewService = {
  forProduct: (productId: string, page = 0, size = 10) =>
    api.get<ReviewList>(API.reviews.forProduct(productId), { query: { page, size } }),
  create: (productId: string, rating: number, title?: string, body?: string) =>
    api.post<Review>(API.reviews.create, { productId, rating, title: title ?? null, body: body ?? null }),
  mine: () => api.get<Review[]>(API.reviews.mine),
};

export interface NotificationPage { notifications: AppNotification[]; unreadCount: number }

export const notificationService = {
  list: () => api.get<NotificationPage>(API.notifications.root),
  markRead: (id: string) => api.post<void>(API.notifications.read(id)),
  markAllRead: () => api.post<void>(API.notifications.readAll),
};
