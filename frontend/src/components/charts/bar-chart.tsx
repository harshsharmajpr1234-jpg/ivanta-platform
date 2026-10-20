'use client';
import { Bar, BarChart as RB, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function BarChart({ data, xKey, bars, money }: { data: Record<string, unknown>[]; xKey: string; bars: { key: string; color: string; label: string }[]; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RB data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v, name) => [money ? `₹${Number(v).toLocaleString('en-IN')}` : v, bars.find((b) => b.key === name)?.label ?? name]} contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }} />
        {bars.map((b) => <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[6, 6, 0, 0]} maxBarSize={26} />)}
      </RB>
    </ResponsiveContainer>
  );
}
