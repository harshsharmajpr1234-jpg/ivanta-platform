import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12.5px] text-ink-muted">
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-ink-faint" />}
          {it.href ? <Link href={it.href} className="hover:text-accent hover:underline">{it.label}</Link> : <span className="font-medium text-ink-soft">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
