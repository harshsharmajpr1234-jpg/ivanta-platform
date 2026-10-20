'use client';
import { OrderListClient } from '@/components/orders/order-list-client';

export default function OrdersPage() {
  return <OrderListClient basePath="/orders" />;
}
