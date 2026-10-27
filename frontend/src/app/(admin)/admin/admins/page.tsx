'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, Plus, RefreshCw, UserCheck, ShieldAlert, KeyRound, Ban, CheckCircle2, Edit3, Lock
} from 'lucide-react';
import { SectionHeader } from '@/components/admin/section-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { adminService } from '@/services/admin';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { ADMIN_ROLES, ROLE_LABEL } from '@/constants';
import { formatDate } from '@/lib/utils';
import type { AdminProfile, AdminRole } from '@/types';

export default function AdminStaffPage() {
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const currentAdmin = useAuthStore((s) => s.admin);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);

  // Create form
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<AdminRole>('CUSTOMER_SUPPORT');
  const [createPassword, setCreatePassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('CUSTOMER_SUPPORT');

  const adminsQuery = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => adminService.admins(),
  });

  const admins = adminsQuery.data ?? [];

  const openCreate = () => {
    setCreateName('');
    setCreateEmail('');
    setCreateRole('CUSTOMER_SUPPORT');
    setCreatePassword('');
    setCreateModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      toast({ title: 'All fields are required', tone: 'error' });
      return;
    }
    if (createPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', tone: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await adminService.createAdmin({
        name: createName.trim(),
        email: createEmail.trim(),
        role: createRole,
        tempPassword: createPassword,
      });
      toast({ title: 'Admin account created', tone: 'success' });
      setCreateModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to create admin', description: msg, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (a: AdminProfile) => {
    setSelectedAdmin(a);
    setEditName(a.name);
    setEditRole(a.role);
    setEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setSubmitting(true);
    try {
      await adminService.updateAdmin(selectedAdmin.id, {
        name: editName.trim(),
        role: editRole,
      });
      toast({ title: 'Admin details updated', tone: 'success' });
      setEditModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to update admin', description: msg, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (a: AdminProfile) => {
    if (a.id === currentAdmin?.id) {
      toast({ title: 'Cannot disable your own account', tone: 'error' });
      return;
    }
    const willDisable = true; // toggle
    if (!confirm(`Are you sure you want to change access for "${a.name}"?`)) return;

    try {
      await adminService.updateAdmin(a.id, { isActive: !willDisable });
      toast({ title: 'Account status updated', tone: 'info' });
      void qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Failed to update status', description: msg, tone: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Staff & Role Management"
        subtitle="Manage administrator access, assign specialized operational roles and enforce 2FA security"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void qc.invalidateQueries({ queryKey: ['admin', 'admins'] })}
              disabled={adminsQuery.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${adminsQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add staff member
            </Button>
          </div>
        }
      />

      {/* Staff Table */}
      {adminsQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : adminsQuery.isError ? (
        <ErrorState onRetry={() => void adminsQuery.refetch()} />
      ) : admins.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No admin staff found"
          description="Click 'Add staff member' to create staff accounts."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-surface-sunk text-[11.5px] uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Staff Member</th>
                  <th className="px-5 py-3 font-semibold">Assigned Role</th>
                  <th className="px-5 py-3 font-semibold">Permissions</th>
                  <th className="px-5 py-3 font-semibold">2FA Security</th>
                  <th className="px-5 py-3 font-semibold">Last Login</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {admins.map((a) => {
                  const isSelf = a.id === currentAdmin?.id;
                  return (
                    <tr key={a.id} className="hover:bg-surface-sunk/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white font-bold text-[11.5px]">
                            {a.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-semibold text-ink flex items-center gap-1.5">
                              {a.name}
                              {isSelf && (
                                <span className="rounded bg-accent-soft px-1.5 py-0.2 text-[9.5px] font-bold text-accent">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11.5px] text-ink-muted">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={a.role === 'SUPER_ADMIN' ? 'accent' : 'neutral'}>
                          {ROLE_LABEL[a.role] || a.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft text-[12px]">
                        {a.role === 'SUPER_ADMIN' ? (
                          <span className="font-semibold text-accent">Full Access (Wildcard)</span>
                        ) : (
                          <span>{(a.permissions ?? []).length} permissions</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={a.twoFactorEnabled ? 'success' : 'warning'}>
                          {a.twoFactorEnabled ? '2FA Enabled' : 'Not Set'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-ink-muted">
                        {a.lastLoginAt ? formatDate(a.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(a)}
                            title="Edit Role / Name"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Staff Member"
        description="Create a new administrator account with role-based access control"
        size="md"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="st-name">Full Name *</Label>
            <Input
              id="st-name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div>
            <Label htmlFor="st-email">Official Email Address *</Label>
            <Input
              id="st-email"
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="e.g. rahul@flyphones.in"
              required
            />
          </div>

          <div>
            <Label htmlFor="st-role">Role & Access Scope *</Label>
            <select
              id="st-role"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as AdminRole)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="st-pass">Temporary Password *</Label>
            <Input
              id="st-pass"
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              The user will be required to change this password upon their first login.
            </p>
          </div>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Staff Member"
        description={`Update role or name for ${selectedAdmin?.email}`}
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <Label htmlFor="ed-name">Full Name</Label>
            <Input
              id="ed-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="ed-role">Assigned Role</Label>
            <select
              id="ed-role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as AdminRole)}
              disabled={selectedAdmin?.id === currentAdmin?.id}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none disabled:bg-surface-sunk"
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {selectedAdmin?.id === currentAdmin?.id && (
              <p className="mt-1 text-[11px] text-ink-muted">You cannot change your own role.</p>
            )}
          </div>
        </form>
      </Dialog>
    </div>
  );
}
