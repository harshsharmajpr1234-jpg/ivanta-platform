'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Star, CheckCircle2, XCircle, Search, RefreshCw, ChevronLeft, ChevronRight, MessageSquare, ShieldCheck
} from 'lucide-react';
import { SectionHeader } from '@/components/admin/section-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { adminService } from '@/services/admin';
import { useUIStore } from '@/store/ui';
import { formatDate } from '@/lib/utils';
import type { Review } from '@/types';

const TABS = [
  { key: '', label: 'All Reviews' },
  { key: 'PENDING', label: 'Pending Moderation' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');

  // Reject dialog
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [moderating, setModerating] = useState(false);

  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviews', statusFilter, page],
    queryFn: () => adminService.reviews({
      status: statusFilter || undefined,
      page,
      size: 20
    }),
  });

  const pagedData = reviewsQuery.data;
  const reviews = pagedData?.content ?? [];
  const totalPages = pagedData?.totalPages ?? 1;

  const filtered = reviews.filter((r) =>
    (r.title ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (r.body ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (r.userName ?? '').toLowerCase().includes(q.toLowerCase()) ||
    r.productId.toLowerCase().includes(q.toLowerCase())
  );

  const handleApprove = async (r: Review) => {
    try {
      await adminService.moderateReview(r.id, 'APPROVED');
      toast({ title: 'Review approved', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to approve review', description: msg, tone: 'error' });
    }
  };

  const openRejectModal = (r: Review) => {
    setSelectedReview(r);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedReview) return;
    setModerating(true);
    try {
      await adminService.moderateReview(selectedReview.id, 'REJECTED', rejectReason.trim() || undefined);
      toast({ title: 'Review rejected', tone: 'info' });
      setRejectModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to reject review', description: msg, tone: 'error' });
    } finally {
      setModerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Product Reviews"
        subtitle="Moderate customer ratings and reviews before they appear live on product pages"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })}
            disabled={reviewsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${reviewsQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setStatusFilter(tab.key); setPage(0); }}
              className={`rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-white text-ink shadow-soft'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reviews..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Reviews List */}
      {reviewsQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : reviewsQuery.isError ? (
        <ErrorState onRetry={() => void reviewsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews found"
          description={statusFilter ? `No ${statusFilter.toLowerCase()} reviews at this time.` : 'No reviews match your filter.'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Rating value={r.rating} />
                    <span className="font-semibold text-ink text-[13px]">{r.rating} / 5</span>
                    <Badge
                      tone={
                        r.status === 'APPROVED' ? 'success' :
                        r.status === 'REJECTED' ? 'danger' : 'accent'
                      }
                    >
                      {r.status}
                    </Badge>
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="h-3 w-3" /> Verified Purchase
                      </span>
                    )}
                  </div>

                  {r.title && <h3 className="text-[14px] font-bold text-ink">{r.title}</h3>}
                  {r.body && <p className="text-[13px] text-ink-soft leading-relaxed">{r.body}</p>}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11.5px] text-ink-muted">
                    <span>By: <strong className="text-ink">{r.userName || 'Customer'}</strong></span>
                    <span>•</span>
                    <span>Product ID: <code className="text-ink-soft">{r.productId}</code></span>
                    <span>•</span>
                    <span>Date: {formatDate(r.createdAt)}</span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {r.status !== 'APPROVED' && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(r)}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  {r.status !== 'REJECTED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openRejectModal(r)}
                      className="gap-1.5"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line pt-4 text-[13px]">
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
        </div>
      )}

      {/* Reject Modal */}
      <Dialog
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Review"
        description="Specify why this review is being rejected (e.g. spam, abusive language, off-topic)"
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)} disabled={moderating}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmReject} disabled={moderating}>
              {moderating ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Label htmlFor="rej-note">Reason / Internal Note (Optional)</Label>
          <Textarea
            id="rej-note"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Abusive language or irrelevant promotion"
          />
        </div>
      </Dialog>
    </div>
  );
}
