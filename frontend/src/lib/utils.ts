import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export function inr(n: number): string { return inrFmt.format(n); }
export function inrPlain(n: number): string { return `₹${new Intl.NumberFormat('en-IN').format(n)}`; }

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export function addDays(days: number, from = new Date()): Date { const d = new Date(from); d.setDate(d.getDate() + days); return d; }
export function etaLabel(range: [number, number]): string {
  const a = addDays(range[0]); const b = addDays(range[1]);
  const f = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return range[0] === range[1] ? f(a) : `${f(a)} – ${f(b)}`;
}
export function pct(off: number, of: number): number { return Math.round(((of - off) / of) * 100); }
export function uid(prefix: string): string { return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString().slice(-4)}`; }
export function clamp(n: number, min: number, max: number): number { return Math.min(max, Math.max(min, n)); }
export function delay(ms?: number): Promise<void> { const t = ms ?? 140 + Math.random() * 260; return new Promise((r) => setTimeout(r, t)); }
export function downloadTextFile(filename: string, content: string, mime = 'text/html'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
