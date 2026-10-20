'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/states';
import { cn } from '@/lib/utils';

export interface Column<T> { key: string; header: string; render: (row: T) => ReactNode; sortValue?: (row: T) => string | number; className?: string }

export function DataTable<T>({ rows, columns, searchKeys, pageSize = 8, emptyTitle = 'Nothing here yet', emptyDescription, toolbar }: {
  rows: T[]; columns: Column<T>[]; searchKeys?: (row: T) => string; pageSize?: number; emptyTitle?: string; emptyDescription?: string; toolbar?: ReactNode;
}) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const filtered = useMemo(() => {
    let list = rows;
    if (q.trim() && searchKeys) { const t = q.toLowerCase(); list = list.filter((r) => searchKeys(r).toLowerCase().includes(t)); }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) list = [...list].sort((a, b) => { const va = col.sortValue!(a); const vb = col.sortValue!(b); return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir; });
    }
    return list;
  }, [rows, q, sort, columns, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const view = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
      {(searchKeys || toolbar) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {searchKeys ? (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Filter rows…" className="h-9 pl-9 text-[13px]" aria-label="Filter table rows" />
            </div>
          ) : <span />}
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl3 border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider text-ink-muted', c.className)}>
                  {c.sortValue ? (
                    <button type="button" className="inline-flex items-center gap-1 hover:text-ink" onClick={() => setSort(sort?.key === c.key ? { key: c.key, dir: sort.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 })}>
                      {c.header} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {view.map((r, i) => (
              <tr key={i} className="transition-colors hover:bg-surface/60">
                {columns.map((c) => <td key={c.key} className={cn('px-4 py-3 align-middle text-ink-soft', c.className)}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {view.length === 0 && <div className="p-6"><EmptyState title={emptyTitle} description={emptyDescription ?? q ? `No rows match “${q}”.` : undefined} /></div>}
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-[12.5px] text-ink-muted">
          <span>Page {safePage} of {totalPages} · {filtered.length} rows</span>
          <div className="flex gap-1">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="rounded-lg border border-line p-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="rounded-lg border border-line p-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
