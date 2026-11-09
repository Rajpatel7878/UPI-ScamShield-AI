import { BaseCard, InfoCard } from '../../components/ui/Card.jsx'
import { RISK_INDICATORS } from '../../mock-data/dashboard.js'

export function RiskInsights() {
  return (
    <BaseCard className="pt-0">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
        <h3 className="type-h3">Common Risk Indicators</h3>
        <span className="type-caption text-slate-500">
          Demo indicators • Not from real analysis
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {RISK_INDICATORS.map((item) => (
          <InfoCard
            key={item.id}
            title={item.title}
            icon={item.icon}
            tone="warning"
          >
            <p className="type-body-sm text-slate-300">{item.description}</p>
          </InfoCard>
        ))}
      </div>
    </BaseCard>
  )
}