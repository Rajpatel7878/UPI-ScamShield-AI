"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const RISK_COLORS = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
}

export function RiskDistributionChart({ distribution }) {
  const src = distribution && typeof distribution === 'object' ? distribution : {}
  const data = ['Low', 'Medium', 'High', 'Critical'].map((name) => ({
    name,
    value: Number(src[name] || 0),
  }))
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">No risk distribution data available yet.</div>
  }

  const summary = data.map((item) => `${item.name}: ${item.value}`).join(', ')

  return (
    <figure className="m-0" role="img" aria-label={`Risk distribution. ${summary}`}>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={55} label>
              {data.map((entry) => (
                <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
