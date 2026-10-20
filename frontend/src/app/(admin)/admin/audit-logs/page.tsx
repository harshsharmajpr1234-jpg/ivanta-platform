'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Search, RefreshCw, ChevronLeft, ChevronRight, User, Globe, ArrowRight
} from 'lucide-react';
import { SectionHeader } from '@/components/admin/section-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { adminService } from '@/services/admin';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types';

export default function AdminAuditLogsPage() {
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');

  const auditQuery = useQuery({
    queryKey: ['admin', 'audit-logs', page],
    queryFn: () => adminService.auditLogs({ page, size: 25 }),
  });

  const pagedData = auditQuery.data;
  const logs = pagedData?.content ?? [];
  const totalPages = pagedData?.totalPages ?? 1;

  const filtered = logs.filter((l) =>
    l.action.toLowerCase().includes(q.toLowerCase()) ||
    (l.actorName ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (l.entityType ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (l.entityId ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (l.ipAddress ?? '').includes(q)
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Security & Audit Logs"
        subtitle="Immutable system-wide ledger tracking every administrative action, status update and order change"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] })}
            disabled={auditQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${auditQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      {/* Filter */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by action, actor, entity type or IP address..."
            className="pl-9"
          />
        </div>
      </Card>

      {/* Logs Table */}
      {auditQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : auditQuery.isError ? (
        <ErrorState onRetry={() => void auditQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit entries found"
          description={q ? 'No records match your search filter.' : 'Administrative actions will appear in this ledger.'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-surface-sunk text-[11.5px] uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Timestamp</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-5 py-3 font-semibold">Target Entity</th>
                  <th className="px-5 py-3 font-semibold">Details / Change</th>
                  <th className="px-5 py-3 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-sunk/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-[12px] text-ink-muted">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={
                        log.action.includes('DELETE') || log.action.includes('CANCEL') ? 'danger' :
                        log.action.includes('CREATE') || log.action.includes('CONFIRM') ? 'success' :
                        'accent'
                      }>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-ink font-medium">
                        <User className="h-3.5 w-3.5 text-ink-muted" />
                        <span>{log.actorName || log.actorType || 'System'}</span>
                        {log.actorRole && (
                          <span className="text-[10px] text-ink-muted bg-surface px-1.5 py-0.2 rounded border border-line">
                            {log.actorRole}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[12px]">
                        <span className="font-semibold text-ink uppercase text-[11px] tracking-wider">
                          {log.entityType || '—'}
                        </span>
                        {log.entityId && (
                          <p className="font-mono text-ink-soft text-[11px] truncate max-w-[140px]">
                            {log.entityId}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      {log.oldValue || log.newValue ? (
                        <div className="text-[11.5px] font-mono space-y-0.5">
                          {log.oldValue && (
                            <p className="text-danger truncate">
                              - {log.oldValue}
                            </p>
                          )}
                          {log.newValue && (
                            <p className="text-emerald-700 truncate">
                              + {log.newValue}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-faint text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11.5px] text-ink-muted">
                      {log.ipAddress ? (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3 w-3 text-ink-faint" />
                          {log.ipAddress}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px]">
              <span className="text-ink-muted">Page {page + 1} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
