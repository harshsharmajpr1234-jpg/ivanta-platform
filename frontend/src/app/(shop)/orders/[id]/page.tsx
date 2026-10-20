'use client';
import { useParams } from 'next/navigation';
import { OrderDetailClient } from '@/components/orders/order-detail-client';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderDetailClient orderId={id} basePath="/orders" />;
}
