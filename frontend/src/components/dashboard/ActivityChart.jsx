import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function formatLabel(dateStr) {
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return String(dateStr)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return String(dateStr)
  }
}

export function ActivityChart({ recent_activity, daily_scan_activity }) {
  const src = Array.isArray(daily_scan_activity) && daily_scan_activity.length
    ? daily_scan_activity
    : (Array.isArray(recent_activity) ? recent_activity : [])

  const data = src.map((item) => ({
    date: item.date || item.day || item.period || '',
    count: Number(item.count ?? item.scans ?? item.value ?? 0),
  }))

  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">No scan activity data available yet.</div>
  }

  const summary = `${data.length} day(s) of activity. ` +
    data.map((item) => `${formatLabel(item.date)}: ${item.count} scan(s)`).join(', ')

  return (
    <figure className="m-0" role="img" aria-label={`Scan activity. ${summary}`}>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tickFormatter={formatLabel} minTickGap={20} />
            <YAxis allowDecimals={false} />
            <Tooltip labelFormatter={formatLabel} />
            <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
