'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Boxes, Building2, FileText, FolderTree, LayoutDashboard, LogOut, Menu,
  Package, PackageSearch, ShieldCheck, Star, Tag, Users, X
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Sheet } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/auth';
import { ROLE_LABEL } from '@/constants';
import { cn } from '@/lib/utils';

/**
 * Admin console navigation. Items are gated by the admin's server-issued
 * permission list (hiding UI is convenience only — the backend enforces every
 * action with @PreAuthorize). Only sections with real, working pages are listed.
 */
const NAV: { href: string; label: string; icon: typeof LayoutDashboard; perms: string[] }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, perms: ['REPORT_VIEW', 'ADMIN'] },
  { href: '/admin/products', label: 'Products', icon: Package, perms: ['PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'ADMIN'] },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, perms: ['PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'ADMIN'] },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes, perms: ['INVENTORY_VIEW', 'INVENTORY_UPDATE', 'ADMIN'] },
  { href: '/admin/orders', label: 'Orders', icon: PackageSearch, perms: ['ORDER_VIEW', 'ADMIN'] },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag, perms: ['COUPON_MANAGE', 'ADMIN'] },
  { href: '/admin/customers', label: 'Customers', icon: Users, perms: ['CUSTOMER_VIEW', 'ADMIN'] },
  { href: '/admin/reviews', label: 'Reviews', icon: Star, perms: ['REVIEW_MODERATE', 'ADMIN'] },
  { href: '/admin/warehouse', label: 'Warehouse & Logistics', icon: Building2, perms: ['DELIVERY_VIEW', 'DELIVERY_UPDATE', 'ADMIN'] },
  { href: '/admin/admins', label: 'Staff & Roles', icon: ShieldCheck, perms: ['SUPER_ADMIN'] },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText, perms: ['AUDIT_VIEW', 'SUPER_ADMIN'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, refreshAdmin, logoutAdmin } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    (async () => {
      await refreshAdmin();
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setNavOpen(false); }, [pathname]);

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-canvas"><Spinner className="h-7 w-7" /></div>;
  if (!admin) {
    router.replace('/admin/login');
    return <div className="flex min-h-screen items-center justify-center bg-canvas text-[13px] text-ink-muted">Redirecting to admin login…</div>;
  }

  const perms = admin.permissions ?? [];
  const allowed = NAV.filter((n) => perms.some((p) => n.perms.includes(p)));

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Admin">
      {allowed.map((n) => {
        const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href}
            className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
              active ? 'bg-ink text-white' : 'text-ink/70 hover:bg-surface-sunk hover:text-ink')}>
            <n.icon className="h-4 w-4 shrink-0" /> {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-[14px] font-black text-white">iV</span>
          <div>
            <p className="text-[14px] font-bold leading-tight text-ink">iVanta Admin</p>
            <p className="text-[10.5px] text-ink-muted">Commerce console</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{nav}</div>
        <div className="border-t border-line p-3">
          <div className="rounded-xl bg-canvas px-3 py-2.5">
            <p className="truncate text-[12.5px] font-semibold text-ink">{admin.name}</p>
            <p className="truncate text-[10.5px] text-ink-muted">{admin.email}</p>
            <span className="mt-1.5 inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-[9.5px] font-bold text-accent">{ROLE_LABEL[admin.role]}</span>
          </div>
          <div className="mt-2 flex gap-1">
            <Link href="/" className="flex-1 rounded-xl px-3 py-2 text-center text-[12px] font-medium text-ink-muted hover:bg-surface-sunk hover:text-ink">View site</Link>
            <button type="button" onClick={async () => { await logoutAdmin(); router.push('/admin/login'); }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium text-danger hover:bg-danger/5">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* topbar (mobile/tablet) */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setNavOpen(true)} aria-label="Open admin menu" className="rounded-lg p-1.5 text-ink hover:bg-surface-sunk"><Menu className="h-5 w-5" /></button>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-[13px] font-black text-white">iV</span>
        <p className="text-[14px] font-bold text-ink">Admin</p>
        <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent">{ROLE_LABEL[admin.role]}</span>
      </header>

      <main className="px-4 py-6 lg:ml-60 lg:px-8">{children}</main>

      <Sheet open={navOpen} onClose={() => setNavOpen(false)} title={<span className="flex items-center gap-2"><button type="button" onClick={() => setNavOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></button> Admin menu</span>} side="left">
        {nav}
        <div className="mt-4 border-t border-line pt-3">
          <button type="button" onClick={async () => { await logoutAdmin(); router.push('/admin/login'); }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-danger hover:bg-danger/5">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </Sheet>
    </div>
  );
}
