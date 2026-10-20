import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />
      <h1 className="mt-3 text-[28px] font-bold tracking-tight text-ink sm:text-[34px]">{title}</h1>
      <p className="mt-1 text-[12.5px] text-ink-faint">Last updated: {updated}</p>
      <div className="mt-6 space-y-6 text-[14px] leading-relaxed text-ink-soft [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-ink [&_h3]:text-[14.5px] [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-4 [&_li]:list-disc [&_p]:mt-2">
        {children}
      </div>
    </div>
  );
}
