'use client';
import { Area, AreaChart as RA, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AreaChart({ data, xKey, yKey, label, money }: { data: Record<string, unknown>[]; xKey: string; yKey: string; label: string; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RA data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b5cff" stopOpacity={0.22} /><stop offset="100%" stopColor="#0b5cff" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (money ? `${Math.round(v / 100000)}L` : String(v))} />
        <Tooltip formatter={(v) => [money ? `₹${Number(v).toLocaleString('en-IN')}` : v, label]} contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }} />
        <Area type="monotone" dataKey={yKey} stroke="#0b5cff" strokeWidth={2.2} fill={`url(#fill-${yKey})`} />
      </RA>
    </ResponsiveContainer>
  );
}
