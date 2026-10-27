/* FlyPhones e-commerce domain model — mirrors the Spring Boot DTOs one-for-one.
 * All money values arrive as JSON numbers (BigDecimal serialisation) and are
 * formatted with lib/utils inr(). All dates are ISO-8601 strings. */

/* ---------- common ---------- */
export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }

/* ---------- auth / users ---------- */
export interface User { id: string; name: string; email: string | null; phone: string | null; createdAt: string }
export interface OtpRequestResult { expiresInSeconds: number; channel: string; devOtp?: string | null }

export type AddressType = 'HOME' | 'WORK' | 'OTHER';
export interface Address {
  id: string; name: string; phone: string; addressLine1: string; addressLine2?: string | null;
  locality?: string | null; road?: string | null; city: string; district?: string | null; state: string;
  pincode: string; country: string; landmark?: string | null; addressType: AddressType; isDefault: boolean;
}
export interface AddressInput {
  name: string; phone: string; addressLine1: string; addressLine2?: string; locality?: string; road?: string;
  city: string; district?: string; state: string; pincode: string; latitude?: number; longitude?: number;
  landmark?: string; addressType?: AddressType; isDefault?: boolean;
}

/* ---------- admin auth ---------- */
export type AdminRole =
  | 'SUPER_ADMIN' | 'PRODUCT_MANAGER' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER'
  | 'FINANCE_MANAGER' | 'DELIVERY_MANAGER' | 'CUSTOMER_SUPPORT' | 'MARKETING_MANAGER';
export interface AdminProfile {
  id: string; name: string; email: string; role: AdminRole; permissions: string[];
  twoFactorEnabled: boolean; mustChangePassword: boolean; lastLoginAt?: string | null;
}
export interface AdminLoginResult { authenticated: boolean; requireOtp: boolean; otpHint?: string | null; admin?: AdminProfile | null }

/* ---------- catalog ---------- */
export interface CategoryNode {
  id: string; name: string; slug: string; description?: string | null;
  imageKey?: string | null; productCount: number; children: CategoryNode[];
}
export interface CategoryItem {
  id: string; name: string; slug: string; parentId?: string | null;
  description?: string | null; imageKey?: string | null; sortOrder: number;
  isActive: boolean; createdAt?: string;
}
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
export interface ProductListItem {
  id: string; name: string; slug: string; brand?: string | null; category?: string | null;
  price: number; mrp: number; discountPct: number; ratingAvg: number; ratingCount: number;
  imageKey?: string | null; stockStatus: StockStatus; featured: boolean; releaseYear?: number | null;
}
export interface Variant {
  id: string; sku?: string | null; name?: string | null; storage?: string | null; color?: string | null;
  connectivity?: string | null; size?: string | null; price: number; mrp: number;
  available: number; totalAvailable?: number; stockStatus: StockStatus;
}
export interface ColorOption { id: string; name: string; hex?: string | null }
export interface StorageOption { id: string; storage: string }
export interface Spec { specKey: string; specValue: string }
export interface ProductImage { id: string; storageKey: string; alt?: string | null; isMain: boolean; isThumbnail: boolean }
export interface ProductDetail {
  id: string; sku?: string | null; name: string; slug: string; brand?: string | null; category?: string | null;
  model?: string | null; shortDescription?: string | null; description?: string | null;
  price: number; mrp: number; discountPct: number; taxRate: number; stockStatus: StockStatus;
  releaseYear?: number | null; warrantyMonths: number; featured: boolean; isActive: boolean; ratingAvg: number; ratingCount: number;
  variants: Variant[]; colors: ColorOption[]; storages: StorageOption[]; specs: Spec[]; images: ProductImage[];
}
export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'featured';
export interface ProductQuery {
  q?: string; categoryId?: string; category?: string; brandId?: string; minPrice?: number; maxPrice?: number;
  color?: string; storage?: string; sort?: ProductSort; page?: number; size?: number;
}

/* ---------- cart ---------- */
export interface CartItem {
  id: string; productId: string; productName: string; productSlug: string;
  variantId?: string | null; variantName?: string | null; sku?: string | null; imageKey?: string | null;
  quantity: number; unitPrice: number; mrp: number; lineTotal: number; available: number; stockOk: boolean;
}
export interface Cart {
  id: string | null; items: CartItem[]; itemCount: number;
  subtotal: number; mrpTotal: number; savings: number;
}

/* ---------- location ---------- */
export interface LocationSuggestion {
  id: string; type: 'city' | 'locality' | 'pincode'; label: string; sublabel?: string | null;
  city?: string | null; state?: string | null; pincode?: string | null; popular: boolean;
}
export interface PincodeInfo {
  code: string; cities: string[]; states: string[]; localities: string[]; postOffices: string[]; serviceable: boolean;
}
export interface PostOfficeOption {
  name: string;
  district: string;
  state: string;
  officeType: string;
  deliveryStatus: string;
}
export interface PincodeLookupResponse {
  pincode: string;
  district?: string | null;
  state?: string | null;
  isUnambiguous: boolean;
  districts: string[];
  states: string[];
  postOffices: PostOfficeOption[];
  serviceable: boolean;
}
export interface ShippingMethodOption { id: string; name: string; fee: number; etaMinDays?: number | null; etaMaxDays?: number | null }
export interface Serviceability {
  serviceable: boolean; zone?: string | null; deliveryCharge?: number | null;
  etaMinDays?: number | null; etaMaxDays?: number | null; plannedDate?: string | null;
  message?: string | null; shippingMethods: ShippingMethodOption[];
}

/* ---------- checkout / orders ---------- */
export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'COD';
export interface OrderItemPreview {
  productId: string; name: string; variantName?: string | null; imageKey?: string | null;
  quantity: number; unitPrice: number; lineTotal: number;
}
export interface CheckoutPreview {
  items: OrderItemPreview[]; itemCount: number; subtotal: number; couponDiscount: number;
  couponCode?: string | null; taxTotal: number; shippingFee: number; grandTotal: number;
  serviceable: boolean; serviceabilityMessage?: string | null;
  address?: Address | null; shippingMethods: ShippingMethodOption[]; paymentMethods?: PaymentMethod[];
}
export type OrderStatus =
  | 'PENDING_PAYMENT' | 'PAYMENT_FAILED' | 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'PACKED'
  | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  | 'CANCEL_REQUESTED' | 'CANCELLED'
  | 'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'RETURN_PICKUP_SCHEDULED' | 'RETURN_PICKED_UP'
  | 'RETURN_RECEIVED' | 'RETURN_INSPECTION' | 'REFUND_INITIATED' | 'REFUNDED'
  | 'REPLACEMENT_REQUESTED' | 'REPLACEMENT_PROCESSING' | 'REPLACEMENT_SHIPPED' | 'REPLACEMENT_DELIVERED';
export type ShippingStatus =
  | 'PENDING' | 'PACKED' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export interface OrderItem {
  id: string; productId: string; productName: string; productSlug?: string | null;
  variantId?: string | null; variantName?: string | null;
  color?: string | null; storage?: string | null;
  sku?: string | null; imageKey?: string | null;
  quantity: number; unitPrice: number; discount: number; taxAmount: number; finalPrice: number;
}
export interface OrderSummary {
  id: string; orderNumber?: string | null; placedAt: string; status: OrderStatus;
  paymentStatus?: string | null; shippingStatus?: string | null;
  grandTotal: number; paymentMethod: PaymentMethod;
  itemCount: number; primaryName?: string | null; primaryImage?: string | null; expectedDelivery?: string | null;
  customerName?: string | null;
}
export interface OrderNote {
  id: number; note: string; addedByType: string; addedBy?: string | null;
  visibility: string; createdAt: string;
}
export interface StatusHistoryEntry {
  previousStatus?: string | null; newStatus: string; changedByType: string; changedBy?: string | null;
  reason?: string | null; at: string;
}
export interface TimelineEvent { type: string; status: string; description?: string | null; at: string }
export interface OrderDetail {
  id: string; orderNumber?: string | null; userId: string; customerName?: string | null;
  placedAt: string; status: OrderStatus;
  subtotal: number; discountTotal: number; couponCode?: string | null; couponDiscount: number;
  taxTotal: number; shippingFee: number; grandTotal: number; currency: string;
  paymentMethod: PaymentMethod; paymentStatus?: string | null;
  shippingStatus?: string | null; shippingMethodName?: string | null;
  expectedDelivery?: string | null; cancellationReason?: string | null;
  contactEmail?: string | null; contactPhone?: string | null; customerNote?: string | null;
  confirmedAt?: string | null; shippedAt?: string | null; deliveredAt?: string | null; cancelledAt?: string | null;
  returnEligible?: boolean | null; invoiceId?: string | null; notes?: OrderNote[] | null;
  items: OrderItem[]; address?: Address | null; history: StatusHistoryEntry[]; timeline: TimelineEvent[];
}
export interface PlaceOrderInput {
  addressId: string; shippingMethodId: string; couponCode?: string | null;
  paymentMethod: PaymentMethod; customerNote?: string | null;
}

/* ---------- payments ---------- */
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export interface Payment {
  id: string; orderId: string; amount: number; currency: string; method: PaymentMethod; provider: string;
  status: PaymentStatus; providerTransactionId?: string | null; failureReason?: string | null;
  createdAt: string; processedAt?: string | null; clientSecret?: string | null;
  keyId?: string | null; razorpayOrderId?: string | null;
}
export interface PaymentTransaction {
  id: string; provider: string; providerTransactionId?: string | null; txnType: string;
  amount: number; status: string; createdAt: string;
}

/* ---------- delivery ---------- */
export interface TrackingEvent { status: string; description?: string | null; location?: string | null; at: string }
export interface Shipment {
  id: string; orderId: string; trackingNumber?: string | null; carrier?: string | null; status: string;
  estimatedDelivery?: string | null; shippedAt?: string | null; deliveredAt?: string | null;
  providerShipmentId?: string | null; labelUrl?: string | null; pickupToken?: string | null; weightKg?: number | null;
  events: TrackingEvent[];
}
export interface Tracking { orderId: string; orderStatus: OrderStatus; shipment?: Shipment | null }
export interface ShippingMethod {
  id: string; name: string; carrier?: string | null; baseFee: number; freeAbove?: number | null;
  etaMinDays?: number | null; etaMaxDays?: number | null; isActive: boolean;
}

export interface WarehouseSettings {
  name: string; contactName: string; phone: string; email: string;
  addressLine1: string; addressLine2?: string | null; city: string; state: string; pincode: string;
  sellerGstin: string;
}

export interface CourierProviderStatus {
  activeProvider: string; autoShipOnPacked: boolean; shiprocketConfigured: boolean; delhiveryConfigured: boolean;
}

/* ---------- returns / refunds ---------- */
export type ReturnStatus =
  | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PICKUP_SCHEDULED' | 'PICKED_UP' | 'RECEIVED' | 'INSPECTION'
  | 'APPROVED_FOR_REFUND' | 'REFUND_PROCESSING' | 'REFUNDED' | 'CLOSED';

/* ---------- replacements ---------- */
export type ReplacementStatus =
  | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CLOSED';
export interface Replacement {
  id: string; orderId: string; orderNumber?: string | null; orderItemId: string;
  productName?: string | null; variantName?: string | null; sku?: string | null;
  imageKey?: string | null; quantity: number; refundValue: number;
  status: ReplacementStatus; reason: string;
  replacementOrderId?: string | null; replacementOrderNumber?: string | null;
  requestedAt?: string | null; resolvedAt?: string | null;
}
export interface ReturnItem {
  id: string; orderItemId: string; productName: string; variantName?: string | null;
  quantity: number; refundAmount: number;
}
export interface Refund {
  id: string; orderId: string; amount: number; status: string; method: PaymentMethod; provider: string;
  providerTransactionId?: string | null; failureReason?: string | null; createdAt: string; processedAt?: string | null;
}
export interface ReturnRequest {
  id: string; orderId: string; status: ReturnStatus; reason: string; customerNotes?: string | null;
  inspectionNotes?: string | null; requestedAt: string; resolvedAt?: string | null;
  items: ReturnItem[]; refunds: Refund[];
}

/* ---------- coupons ---------- */
export interface CouponValidation { valid: boolean; code: string; description?: string | null; discount: number; reason?: string | null }
export interface Coupon {
  id: string; code: string; description?: string | null; discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number; minOrderValue?: number | null; maxDiscount?: number | null;
  applicableCategoryId?: string | null; applicableProductId?: string | null;
  startsAt?: string | null; expiresAt?: string | null; usageLimit?: number | null; usageCount: number;
  perUserLimit: number; isActive: boolean;
}

/* ---------- reviews ---------- */
export interface Review {
  id: string; productId: string; userName?: string | null; rating: number; title?: string | null;
  body?: string | null; verifiedPurchase: boolean; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string;
}
export interface ReviewList {
  content: Review[]; page: number; size: number; totalElements: number; totalPages: number;
  ratingAvg: number; ratingCount: number;
}

/* ---------- notifications ---------- */
export interface AppNotification {
  id: string; type: string; title?: string | null; body?: string | null;
  link?: string | null; isRead: boolean; createdAt: string;
}

/* ---------- inventory (admin) ---------- */
export interface InventoryRow {
  id: string; productId: string; productName: string; variantId?: string | null; variantName?: string | null;
  sku?: string | null; warehouseId: string; warehouseName?: string | null;
  quantity: number; reserved: number; available: number; reorderLevel: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}
export interface InventoryMovement {
  id: string; type: string; change: number; after: number; referenceType?: string | null;
  referenceId?: string | null; note?: string | null; createdBy?: string | null; createdAt: string;
}
export interface Warehouse { id: string; name: string; city?: string | null; isActive: boolean }

/* ---------- admin stats / audit / settings ---------- */
export interface DayPoint { day: string; revenue: number; orders: number }
export interface NameValue { name: string; value: number }
export interface TopProduct { productId: string; name: string; unitsSold: number; revenue: number }
export interface DashboardStats {
  counts: Record<string, number>;
  currency: Record<string, number>;
  ordersByStatus: Record<string, number>;
  revenueByDay: DayPoint[]; ordersByDay: DayPoint[];
  categoryDistribution: NameValue[]; paymentMethods: NameValue[];
  inventoryStatus: NameValue[]; topProducts: TopProduct[];
}
export interface SalesReportRow { day: string; orders: number; revenue: number; refundTotal: number }
export interface AuditLog {
  id: string; actorType?: string | null; actorName?: string | null; actorRole?: string | null;
  action: string; entityType?: string | null; entityId?: string | null;
  oldValue?: string | null; newValue?: string | null; ipAddress?: string | null; createdAt: string;
}
export interface SystemSetting { key: string; value: string; category?: string | null; description?: string | null; updatedAt?: string | null }
export interface CustomerRow {
  id: string; name: string; email?: string | null; phone?: string | null; isActive: boolean;
  createdAt: string; orderCount: number; totalSpent: number;
}
export interface AdminPaymentRow {
  id: string; orderId: string; userId: string; customerName?: string | null;
  amount: number; method: PaymentMethod; status: PaymentStatus; createdAt: string;
}

/* ---------- ui-local ---------- */
export interface LocationSelection {
  label: string; locality?: string; city?: string; state?: string; pincode?: string; source?: 'gps' | 'manual';
}
