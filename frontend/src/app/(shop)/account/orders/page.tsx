'use client';
import { OrderListClient } from '@/components/orders/order-list-client';

export default function AccountOrdersPage() {
  return <OrderListClient basePath="/account/orders" />;
}
