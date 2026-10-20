import { api } from '@/lib/api/client';
import { API } from '@/lib/api/paths';
import type {
  AdminPaymentRow, AdminProfile, AuditLog, Coupon, CustomerRow, DashboardStats, InventoryMovement,
  InventoryRow, OrderDetail, OrderNote, OrderSummary, Page, Payment, PaymentTransaction, Refund, Replacement, ReturnRequest, Review,
  SalesReportRow, Shipment, ShippingMethod, SystemSetting, Warehouse, CategoryNode, CategoryItem, ProductDetail,
} from '@/types';

type Q = Record<string, string | number | boolean | undefined | null>;

export const adminService = {
  /* ---- admins ---- */
  admins: () => api.get<AdminProfile[]>(API.admin.admins),
  roles: () => api.get<{ role: string; name: string; description?: string | null }[]>(API.admin.roles),
  permissions: () => api.get<{ permission: string; description?: string | null }[]>(API.admin.permissions),
  createAdmin: (input: { name: string; email: string; password?: string; tempPassword?: string; role: string }) =>
    api.post<AdminProfile>(API.admin.admins, {
      name: input.name,
      email: input.email,
      role: input.role,
      tempPassword: input.tempPassword || input.password || '',
    }),
  updateAdmin: (id: string, input: { name?: string; role?: string; isActive?: boolean; password?: string }) =>
    api.patch<AdminProfile>(API.admin.admin(id), input),

  /* ---- dashboard / reports ---- */
  stats: () => api.get<DashboardStats>(API.admin.stats),
  salesReport: (days = 30) => api.get<SalesReportRow[]>(API.admin.salesReport, { query: { days } }),

  /* ---- orders ---- */
  orders: (query: Q = {}) => api.get<Page<OrderSummary>>(API.admin.orders, { query }),
  order: (id: string) => api.get<OrderDetail>(API.admin.order(id)),
  orderTimeline: (id: string) => api.get<import('@/types').TimelineEvent[]>(API.admin.orderTimeline(id)),
  addOrderNote: (id: string, note: string) => api.post<OrderNote[]>(API.admin.orderNotes(id), { note }),
  downloadOrderInvoice: (id: string) =>
    import('@/services/checkout').then(m => m.downloadInvoice(API.admin.orderInvoice(id), `invoice-${id}.pdf`)),
  setOrderStatus: (id: string, status: string, reason?: string) =>
    api.post<OrderDetail>(API.admin.orderStatus(id), { status, reason: reason ?? null }),
  cancelOrder: (id: string, reason?: string) =>
    api.post<OrderDetail>(API.admin.orderCancel(id), { reason: reason ?? null }),
  /* ---- replacements ---- */
  replacements: (query: Q = {}) => api.get<Replacement[]>(API.admin.replacements, { query }),
  setReplacementStatus: (id: string, status: string, reason?: string) =>
    api.post<Replacement>(API.admin.replacementStatus(id), { status, reason: reason ?? null }),

  /* ---- payments ---- */
  payments: (query: Q = {}) => api.get<Page<AdminPaymentRow>>(API.admin.payments, { query }),
  paymentTransactions: (id: string) => api.get<PaymentTransaction[]>(API.admin.paymentTransactions(id)),
  codCollected: (id: string) => api.post<Payment>(API.admin.codCollected(id)),

  /* ---- delivery ---- */
  shipments: (query: Q = {}) => api.get<Page<Shipment>>(API.admin.shipments, { query }),
  ship: (orderId: string, carrier?: string, trackingNumber?: string, weightKg?: number) =>
    api.post<Shipment>(API.admin.ship(orderId), { carrier: carrier ?? null, trackingNumber: trackingNumber ?? null, weightKg: weightKg ?? 0.5 }),
  addEvent: (shipmentId: string, status: string, description?: string, location?: string) =>
    api.post<Shipment>(API.admin.shipmentEvents(shipmentId), { status, description: description ?? null, location: location ?? null }),
  shippingMethods: () => api.get<ShippingMethod[]>(API.admin.shippingMethods),
  createShippingMethod: (input: Partial<ShippingMethod>) => api.post<ShippingMethod>(API.admin.shippingMethods, input),
  updateShippingMethod: (id: string, input: Partial<ShippingMethod>) => api.patch<ShippingMethod>(API.admin.shippingMethod(id), input),
  warehouse: () => api.get<import('@/types').WarehouseSettings>(API.admin.warehouse),
  updateWarehouse: (input: import('@/types').WarehouseSettings) => api.put<import('@/types').WarehouseSettings>(API.admin.warehouse, input),
  providerStatus: () => api.get<import('@/types').CourierProviderStatus>(API.admin.providerStatus),

  /* ---- returns / refunds ---- */
  returns: (query: Q = {}) => api.get<ReturnRequest[]>(API.admin.returns, { query }),
  setReturnStatus: (id: string, status: string, inspectionNotes?: string) =>
    api.post<ReturnRequest>(API.admin.returnStatus(id), { status, inspectionNotes: inspectionNotes ?? null }),
  refunds: (query: Q = {}) => api.get<Refund[]>(API.admin.refunds, { query }),

  /* ---- reviews ---- */
  reviews: (query: Q = {}) => api.get<Page<Review>>(API.admin.reviews, { query }),
  moderateReview: (id: string, status: 'APPROVED' | 'REJECTED', adminNote?: string) =>
    api.post<Review>(API.admin.reviewModerate(id), { status, adminNote: adminNote ?? null }),

  /* ---- customers ---- */
  customers: (query: Q = {}) => api.get<Page<CustomerRow>>(API.admin.customers, { query }),
  updateCustomer: (id: string, input: { name?: string; isActive?: boolean }) =>
    api.patch<CustomerRow>(API.admin.customer(id), input),

  /* ---- catalog management ---- */
  adminCategories: () => api.get<CategoryItem[]>(API.admin.categories),
  createCategory: (input: { name: string; parentId?: string | null; description?: string; imageKey?: string; sortOrder?: number }) =>
    api.post<CategoryItem>(API.admin.categories, input),
  updateCategory: (id: string, input: { name?: string; parentId?: string | null; description?: string; sortOrder?: number; isActive?: boolean }) =>
    api.patch<CategoryItem>(API.admin.category(id), input),
  deleteCategory: (id: string) => api.del<void>(API.admin.category(id)),
  adminProduct: (id: string) => api.get<ProductDetail>(API.admin.product(id)),
  adminProducts: (query: Q = {}) => api.get<Page<import('@/types').ProductListItem>>(API.admin.products, { query }),
  createProduct: (input: unknown) => api.post<ProductDetail>(API.admin.products, input),
  updateProduct: (id: string, input: unknown) => api.patch<ProductDetail>(API.admin.product(id), input),
  archiveProduct: (id: string) => api.del<void>(API.admin.product(id)),
  hardDeleteProduct: (id: string) => api.del<void>(API.admin.productHard(id)),
  addVariant: (id: string, input: unknown) => api.post<unknown>(API.admin.variants(id), input),
  updateVariant: (variantId: string, input: unknown) => api.patch<unknown>(API.admin.variant(variantId), input),
  deleteVariant: (variantId: string) => api.del<void>(API.admin.variant(variantId)),
  setVariantStock: (variantId: string, stock: number, note?: string) =>
    api.patch<InventoryRow>(API.admin.inventory + '/' + variantId, undefined, { query: { stock, note: note ?? null } }),
  updatePricing: (id: string, input: { price: number; mrp?: number; variantId?: string | null }) =>
    api.put<void>(API.admin.pricing(id), input),
  pricingHistory: (id: string) =>
    api.get<{ id: string; variantId?: string | null; price: number; mrp: number; effectiveFrom: string; effectiveTo?: string | null }[]>(API.admin.pricingHistory(id)),
  uploadImage: (id: string, file: File, main: boolean, variantId?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (variantId) fd.append('variantId', variantId);
    fd.append('main', String(main));
    return api.post<{ id: string; storageKey: string }>(API.admin.images(id), fd);
  },
  deleteImage: (imageId: string) => api.del<void>(API.admin.image(imageId)),
  addSpec: (id: string, input: { specKey: string; specValue: string; sortOrder?: number }) =>
    api.post<void>(API.admin.specs(id), input),
  deleteSpec: (specId: string) => api.del<void>(API.admin.spec(specId)),
  addColor: (id: string, input: { name: string; hex?: string; sortOrder?: number }) =>
    api.post<void>(API.admin.colors(id), input),
  addStorageOption: (id: string, input: { storage: string; sortOrder?: number }) =>
    api.post<void>(API.admin.storageOptions(id), input),

  /* ---- coupons ---- */
  coupons: (query: Q = {}) => api.get<Page<Coupon> | Coupon[]>(API.admin.coupons, { query }),
  createCoupon: (input: Partial<Coupon>) => api.post<Coupon>(API.admin.coupons, input),
  updateCoupon: (id: string, input: Partial<Coupon>) => api.patch<Coupon>(API.admin.coupon(id), input),
  couponUsage: (id: string) => api.get<{ orderId: string; userId: string; discountAmount: number; usedAt: string }[]>(API.admin.couponUsage(id)),

  /* ---- inventory ---- */
  inventory: (query: Q = {}) => api.get<Page<InventoryRow> | InventoryRow[]>(API.admin.inventory, { query }),
  warehouses: () => api.get<Warehouse[]>(API.admin.warehouses),
  addStock: (input: { productId: string; variantId?: string | null; warehouseId: string; sku?: string; quantity: number; reorderLevel?: number }) =>
    api.post<InventoryRow>(API.admin.stock, input),
  adjustStock: (id: string, delta: number, note?: string) =>
    api.post<InventoryRow>(API.admin.adjust(id), { delta, note: note ?? null }),
  transferStock: (id: string, toWarehouseId: string, quantity: number, note?: string) =>
    api.post<InventoryRow>(API.admin.transfer(id), { toWarehouseId, quantity, note: note ?? null }),
  movements: (id: string) => api.get<InventoryMovement[]>(API.admin.movements(id)),

  /* ---- location dataset ---- */
  zones: () => api.get<unknown[]>(API.admin.location.zones),
  createZone: (input: unknown) => api.post<unknown>(API.admin.location.zones, input),
  updateZone: (id: string, input: unknown) => api.patch<unknown>(API.admin.location.zone(id), input),
  createCity: (input: unknown) => api.post<unknown>(API.admin.location.cities, input),
  updateCity: (id: string, input: unknown) => api.patch<unknown>(API.admin.location.city(id), input),
  createLocality: (input: unknown) => api.post<unknown>(API.admin.location.localities, input),
  createPincode: (input: unknown) => api.post<unknown>(API.admin.location.pincodes, input),

  /* ---- settings / audit ---- */
  settings: () => api.get<SystemSetting[]>(API.admin.settings),
  updateSetting: (key: string, value: string) => api.patch<SystemSetting>(API.admin.setting(key), { value }),
  auditLogs: (query: Q = {}) => api.get<Page<AuditLog>>(API.admin.auditLogs, { query }),
};
