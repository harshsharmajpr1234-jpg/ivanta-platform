'use client';
import { Cell, Pie, PieChart as RP, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0b5cff', '#1d1d1f', '#22c55e', '#f59e0b', '#8b5cf6', '#94a3b8'];

export default function PieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width="55%" height={220}>
        <RP>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }} formatter={(v) => [`${v}%`, 'share']} />
        </RP>
      </ResponsiveContainer>
      <ul className="space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /> {d.name} <span className="font-semibold text-ink">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
