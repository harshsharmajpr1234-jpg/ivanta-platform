import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-[64px] font-black tracking-tight text-line-strong">404</p>
      <h1 className="mt-2 text-[22px] font-bold text-ink">This page doesn't exist</h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-muted">The link may be broken, or the page may have been moved. Try browsing verified used Apple devices instead.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/"><Button size="lg">Back to home</Button></Link>
        <Link href="/products"><Button size="lg" variant="secondary">Browse devices</Button></Link>
      </div>
    </div>
  );
}
