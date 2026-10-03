import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';

const day = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });

export default function Insights({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stats').then(setStats).catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) return <p role="alert" className="p-8 text-danger">{error}</p>;
  if (!stats) return <p className="p-8 text-ink-soft" role="status">Loading insights…</p>;

  const figures = [
    { label: 'Documents ready', value: stats.documents },
    { label: 'Searchable passages', value: stats.chunks },
    { label: 'Questions asked', value: stats.questions },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
          {figures.map((f) => (
            <div key={f.label} className="px-4 py-5 first:pl-0">
              <dd className="font-serif text-4xl font-semibold">{f.value}</dd>
              <dt className="mt-1 text-sm text-ink-soft">{f.label}</dt>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 font-serif text-xl font-semibold">Questions in the last 7 days</h2>
        <div className="mt-4 h-64 rounded-lg border border-line bg-surface p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.perDay.map((d) => ({ ...d, label: day(d.date) }))}>
              <CartesianGrid vertical={false} stroke="#dce1ee" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <Tooltip cursor={{ fill: '#f4f6fb' }} formatter={(v) => [v, 'Questions']} />
              <Bar dataKey="count" fill="#2f4bd8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {stats.questions === 0 && <p className="mt-3 text-sm text-ink-soft">Ask your first question in the Chat tab to see activity here.</p>}
      </div>
    </div>
  );
}
