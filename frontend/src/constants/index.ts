import type { AdminRole, OrderStatus, PaymentMethod, ReturnStatus, StockStatus } from '@/types';
import type { BadgeTone } from '@/components/ui/badge';

export const BRAND = {
  name: 'Flyphones',
  parentCompany: 'Manish Technologies',
  tagline: 'Empowering you with the latest mobile devices',
  domain: 'https://flyphones.in',
  supportEmail: 'support@flyphones.co.in',
  supportEmailDomain: '@flyphones.co.in',
  supportPhone: '+91 8130506855',
  supportPhoneRaw: '8130506855',
  supportHours: 'Monday to Saturday – 10:00 AM to 07:00 PM IST',
  address: {
    line1: '510, Suneja Tower 2',
    line2: 'District Center, Janakpuri West',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110078',
    full: '510, Suneja Tower 2, District Center, Janakpuri West, New Delhi, 110078',
  },
} as const;

/* ---------- condition grading (Website Condition.docx) ---------- */
export interface ConditionGrade {
  grade: 'A' | 'B' | 'C';
  label: string;
  badgeTone: BadgeTone;
  functional: string;
  display: string;
  displayGlass: string;
  bodyCondition: string;
  summary: string;
}

export const CONDITION_GRADES: Record<'A' | 'B' | 'C', ConditionGrade> = {
  A: {
    grade: 'A',
    label: 'A Grade – Superb Condition',
    badgeTone: 'success',
    functional: 'No Functional Defect',
    display: 'Perfect Condition',
    displayGlass: 'Minimal scratches that are barely visible',
    bodyCondition: 'Few scratches / minor signs of usage',
    summary: 'Pristine pre-owned device with flawless display and minimal cosmetic wear.',
  },
  B: {
    grade: 'B',
    label: 'B Grade – Good Condition',
    badgeTone: 'accent',
    functional: 'No Functional Defect',
    display: 'Minor dot of pixel on display, no issue for visibility',
    displayGlass: 'Minor 4–5 scratches on display glass',
    bodyCondition: 'Minor dents and scratches on device',
    summary: 'Great value with 100% functional performance and minor light cosmetic wear.',
  },
  C: {
    grade: 'C',
    label: 'C Grade – Fair Condition',
    badgeTone: 'warning',
    functional: 'No Functional Defect',
    display: 'Minor 3–4 dot of pixel on display or shade on display, no issue for visibility',
    displayGlass: 'Minor 7–8 scratches on display glass',
    bodyCondition: '5–8 minor dents and scratches on device',
    summary: 'Fully functional, budget-friendly device with noticeable external signs of use.',
  },
};

/* ---------- warranty policy (Refurbished Device Policy) ---------- */
export const WARRANTY_POLICY = {
  refurbishedMonths: 6,
  refurbishedLabel: '6 Months Limited Warranty',
  accessoriesMonths: 3,
  accessoriesLabel: '3 Months Accessories Warranty (Adaptor, Cord & Battery)',
  damageReportingHours: 24,
  unboxingVideoRequired: true,
  imeiValidationRequired: true,
  internalSealIntegrityRequired: true,
  subcontractingPermitted: true,
  exclusions: [
    'Physical damage, such as cracked screens, dents, or impact damage',
    'Water or liquid damage',
    'Accidental or intentional damage',
    'Cosmetic defects or regular signs of wear and tear',
    'Issues due to software tampering, rooting/jailbreaking, or unauthorized repairs',
  ],
} as const;

/* ---------- catalog ---------- */
export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  IN_STOCK: 'In stock', LOW_STOCK: 'Low stock', OUT_OF_STOCK: 'Out of stock', DISCONTINUED: 'Discontinued',
};
export const STOCK_STATUS_TONE: Record<StockStatus, BadgeTone> = {
  IN_STOCK: 'success', LOW_STOCK: 'warning', OUT_OF_STOCK: 'danger', DISCONTINUED: 'neutral',
};
export const PRODUCT_SORTS: { value: string; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

/* ---------- orders ---------- */
export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING_PAYMENT', 'PAYMENT_FAILED', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED',
  'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCEL_REQUESTED', 'CANCELLED',
  'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_PICKUP_SCHEDULED', 'RETURN_PICKED_UP',
  'RETURN_RECEIVED', 'RETURN_INSPECTION', 'REFUND_INITIATED', 'REFUNDED',
  'REPLACEMENT_REQUESTED', 'REPLACEMENT_PROCESSING', 'REPLACEMENT_SHIPPED', 'REPLACEMENT_DELIVERED',
];
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Awaiting payment', PAYMENT_FAILED: 'Payment failed', PLACED: 'Order placed',
  CONFIRMED: 'Confirmed', PROCESSING: 'Processing', PACKED: 'Packed',
  SHIPPED: 'Shipped', IN_TRANSIT: 'In transit', OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered', CANCEL_REQUESTED: 'Cancellation requested', CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return requested', RETURN_APPROVED: 'Return approved',
  RETURN_PICKUP_SCHEDULED: 'Return pickup scheduled', RETURN_PICKED_UP: 'Return picked up',
  RETURN_RECEIVED: 'Return received', RETURN_INSPECTION: 'Return under inspection',
  REFUND_INITIATED: 'Refund initiated', REFUNDED: 'Refunded',
  REPLACEMENT_REQUESTED: 'Replacement requested', REPLACEMENT_PROCESSING: 'Replacement processing',
  REPLACEMENT_SHIPPED: 'Replacement shipped', REPLACEMENT_DELIVERED: 'Replacement delivered',
};
export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  PENDING_PAYMENT: 'warning', PAYMENT_FAILED: 'danger', PLACED: 'accent',
  CONFIRMED: 'accent', PROCESSING: 'accent', PACKED: 'accent',
  SHIPPED: 'accent', IN_TRANSIT: 'accent', OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success', CANCEL_REQUESTED: 'warning', CANCELLED: 'danger',
  RETURN_REQUESTED: 'warning', RETURN_APPROVED: 'warning',
  RETURN_PICKUP_SCHEDULED: 'warning', RETURN_PICKED_UP: 'warning',
  RETURN_RECEIVED: 'warning', RETURN_INSPECTION: 'warning',
  REFUND_INITIATED: 'warning', REFUNDED: 'neutral',
  REPLACEMENT_REQUESTED: 'warning', REPLACEMENT_PROCESSING: 'accent',
  REPLACEMENT_SHIPPED: 'accent', REPLACEMENT_DELIVERED: 'success',
};
/** The customer-facing happy path shown as a progress timeline. */
export const ORDER_PROGRESS: OrderStatus[] =
  ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

/* ---------- payments ---------- */
export const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: 'UPI', label: 'UPI', hint: 'GPay, PhonePe, Paytm & more' },
  { value: 'CARD', label: 'Card', hint: 'Visa, Mastercard, RuPay, Amex' },
  { value: 'NETBANKING', label: 'Net banking', hint: 'All major Indian banks' },
  { value: 'WALLET', label: 'Wallet', hint: 'Popular wallets' },
  { value: 'COD', label: 'Cash on delivery', hint: 'Pay when it arrives' },
];
export const PAYMENT_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'warning', PROCESSING: 'warning', SUCCESS: 'success', FAILED: 'danger',
  REFUNDED: 'neutral', PARTIALLY_REFUNDED: 'neutral',
};
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', PROCESSING: 'Processing', SUCCESS: 'Paid', FAILED: 'Failed',
  REFUNDED: 'Refunded', PARTIALLY_REFUNDED: 'Partially refunded',
};

/* ---------- returns / refunds ---------- */
export const RETURN_STATUSES: ReturnStatus[] = [
  'REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED', 'INSPECTION',
  'APPROVED_FOR_REFUND', 'REFUND_PROCESSING', 'REFUNDED', 'REJECTED', 'CLOSED',
];
export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: 'Requested', APPROVED: 'Approved', PICKUP_SCHEDULED: 'Pickup scheduled',
  PICKED_UP: 'Picked up', RECEIVED: 'Received', INSPECTION: 'Under inspection',
  APPROVED_FOR_REFUND: 'Approved for refund',
  REFUND_PROCESSING: 'Refund processing', REFUNDED: 'Refunded', REJECTED: 'Rejected', CLOSED: 'Closed',
};
export const RETURN_STATUS_TONE: Record<ReturnStatus, BadgeTone> = {
  REQUESTED: 'warning', APPROVED: 'accent', PICKUP_SCHEDULED: 'accent', PICKED_UP: 'accent',
  RECEIVED: 'accent', INSPECTION: 'accent', APPROVED_FOR_REFUND: 'accent',
  REFUND_PROCESSING: 'warning', REFUNDED: 'success', REJECTED: 'danger', CLOSED: 'neutral',
};
/** Admin next-step map mirroring the backend state machine. */
export const RETURN_NEXT: Record<string, ReturnStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PICKUP_SCHEDULED', 'REJECTED'],
  PICKUP_SCHEDULED: ['PICKED_UP', 'RECEIVED', 'REJECTED'],
  PICKED_UP: ['RECEIVED'],
  RECEIVED: ['INSPECTION'],
  INSPECTION: ['APPROVED_FOR_REFUND', 'REJECTED'],
  APPROVED_FOR_REFUND: ['REFUND_PROCESSING'],
  REFUND_PROCESSING: ['REFUNDED', 'CLOSED'],
  REJECTED: ['CLOSED'],
  REFUNDED: ['CLOSED'],
  CLOSED: [],
};

/* ---------- replacements ---------- */
export const REPLACEMENT_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Requested', APPROVED: 'Approved', PROCESSING: 'Processing',
  SHIPPED: 'Shipped', DELIVERED: 'Delivered', REJECTED: 'Rejected', CLOSED: 'Closed',
};
export const REPLACEMENT_STATUS_TONE: Record<string, BadgeTone> = {
  REQUESTED: 'warning', APPROVED: 'accent', PROCESSING: 'accent',
  SHIPPED: 'accent', DELIVERED: 'success', REJECTED: 'danger', CLOSED: 'neutral',
};
export const REPLACEMENT_NEXT: Record<string, string[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['CLOSED'], PROCESSING: ['CLOSED'], SHIPPED: ['CLOSED'],
  DELIVERED: [], REJECTED: [], CLOSED: [],
};
export const RETURN_REASONS = [
  'Damaged or defective', 'Wrong item delivered', 'Item different from description',
  'Changed my mind', 'Better price found elsewhere', 'Arrived too late',
];

/* ---------- delivery ---------- */
export const SHIPMENT_EVENT_STATUSES = ['LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'];
export const SHIPMENT_STATUS_TONE: Record<string, BadgeTone> = {
  LABEL_CREATED: 'neutral', PICKED_UP: 'accent', IN_TRANSIT: 'accent',
  OUT_FOR_DELIVERY: 'warning', DELIVERED: 'success', EXCEPTION: 'danger',
};
/** Admin order-advance options per current status (state machine mirror). */
export const ORDER_NEXT: Record<string, string[]> = {
  PENDING_PAYMENT: [],   // payment workflow only
  PAYMENT_FAILED: [],    // payment retry / expiry only
  PLACED: ['CONFIRMED'],
  CONFIRMED: ['PROCESSING'],
  PROCESSING: ['PACKED'],
  PACKED: [],            // shipping is done via Delivery → Ship
  SHIPPED: [],           // driven by tracking events
  IN_TRANSIT: [],        // driven by tracking events
  OUT_FOR_DELIVERY: [],  // driven by tracking events
  DELIVERED: [],         // returns/replacements driven by their own flows
  CANCEL_REQUESTED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],  // reject request → resume; approve → Cancel button
  CANCELLED: [],         // refund chain is automatic
  RETURN_REQUESTED: [], RETURN_APPROVED: [], RETURN_PICKUP_SCHEDULED: [], RETURN_PICKED_UP: [],
  RETURN_RECEIVED: [], RETURN_INSPECTION: [], REFUND_INITIATED: [], REFUNDED: [],
  REPLACEMENT_REQUESTED: [], REPLACEMENT_PROCESSING: [], REPLACEMENT_SHIPPED: [], REPLACEMENT_DELIVERED: [],
};

/* ---------- admin ---------- */
export const ADMIN_ROLES: { value: AdminRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'PRODUCT_MANAGER', label: 'Product Manager' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
  { value: 'ORDER_MANAGER', label: 'Order Manager' },
  { value: 'FINANCE_MANAGER', label: 'Finance Manager' },
  { value: 'DELIVERY_MANAGER', label: 'Delivery Manager' },
  { value: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
  { value: 'MARKETING_MANAGER', label: 'Marketing Manager' },
];
export const ROLE_LABEL: Record<AdminRole, string> = Object.fromEntries(
  ADMIN_ROLES.map((r) => [r.value, r.label]),
) as Record<AdminRole, string>;
export const INVENTORY_STATUS_TONE: Record<string, BadgeTone> = {
  IN_STOCK: 'success', LOW_STOCK: 'warning', OUT_OF_STOCK: 'danger',
};
