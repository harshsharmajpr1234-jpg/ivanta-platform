'use client';
import { useParams } from 'next/navigation';
import { OrderDetailClient } from '@/components/orders/order-detail-client';

export default function AccountOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  return <OrderDetailClient orderId={orderId} basePath="/account/orders" />;
}
