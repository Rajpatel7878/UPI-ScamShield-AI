import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { DAILY_SCANS } from '../../mock-data/dashboard.js'

/** Map day names to ordered indices for the chart. */
const _DAY_ORDER = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
}

/** Format day name for display. */
function formatDay(key) {
  return key
    .replace(/^./, (c) => c.toUpperCase())
    .replace('Monday', 'Mon')
    .replace('Tuesday', 'Tue')
    .replace('Wednesday', 'Wed')
    .replace('Thursday', 'Thu')
    .replace('Friday', 'Fri')
    .replace('Saturday', 'Sat')
    .replace('Sunday', 'Sun')
}

export function ActivityChart() {
  /** Build the chart dataset from DAILY_SCANS. */
  const entries = Object.entries(DAILY_SCANS).map(
    ([day, scans]) => ({
      day,
      scans: Number(scans),
    })
  )

  /** Sort by day order. */
  entries.sort((a, b) => _DAY_ORDER[a.day] - _DAY_ORDER[b.day])

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={entries} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
        <XAxis
          dataKey="day"
          fontSize={10}
          tick={['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']}
          domain={['monday', 'sunday']}
        />

        <YAxis
          domain={['0', '90']}
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickFormatter={(value) => value}
        />

        <Tooltip
          content={({ active, payloads }) => {
            if (!active || !payloads.length) return null
            const payload = payloads[0]
            const day = payload.datum.day
            const value = Math.round(payload.datum.scans)

            return (
              <div className="recharts-tooltip-wrapper">
                <span className="text-sm text-ink">
                  {formatDay(day)}: {value} scans
                </span>
              </div>
            )
          }}
          label={({ payload }) => `Day: ${formatDay(payload.datum.day)}`}
        />

        <Line
          type="monotone"
          dataKey="scans"
          stroke="#14b8a6"
          strokeWidth={2}
          activeDot={{ r: 8, stroke: '#14b8a6', strokeWidth: 2 }}
          dot={false}
          isAnimationActive
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
