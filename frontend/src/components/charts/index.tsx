'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const Area = dynamic(() => import('./area-chart'), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> });
const Bars = dynamic(() => import('./bar-chart'), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> });
const Pie = dynamic(() => import('./pie-chart'), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> });

export const AreaChart = Area;
export const BarChart = Bars;
export const PieChart = Pie;
