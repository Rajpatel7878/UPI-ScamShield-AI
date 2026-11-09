import { PieChart, Pie, ResponsiveContainer, Label } from 'recharts'

import { RISK_DISTRIBUTION } from '../../mock-data/dashboard.js'

/** Color mapping for risk severity levels. */
const RISK_COLORS = {
  low: '#22c55e',         // emerald-500
  medium: '#eab308',      // amber-500
  high: '#f87171',        // red-500
  critical: '#ef4444',    // red-600
}

export function RiskDistributionChart() {
  const data = Object.entries(RISK_DISTRIBUTION).map(
    ([name, value]) => ({ name, value: Number(value) })
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
        <Pie
          dataKey="value"
          outerRadius={80}
          innerRadius={55}
          fill={({ dataItem }) => RISK_COLORS[dataItem.data.name] || '#6b7280'}
          label={false}
        />
        <Label
          label={({ dataItem }) => `${dataItem.value} ${dataItem.name}`}
          position="outside"
          offset={30}
          className="text-xs font-medium text-navy-950"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}