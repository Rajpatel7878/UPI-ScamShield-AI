import { MessageCircle, Link, Globe } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const CONTENT_TYPES = [
  { key: 'sms', label: 'SMS Message', icon: MessageCircle, iconClass: 'text-brand-300' },
  { key: 'whatsapp', label: 'WhatsApp Message', icon: MessageCircle, iconClass: 'text-emerald-400' },
  { key: 'payment', label: 'Payment Request', icon: Link, iconClass: 'text-amber-400' },
  { key: 'url', label: 'Suspicious URL', icon: Globe, iconClass: 'text-danger-400' },
]

export function ContentTypeSelector({
  selectedKey = 'sms',
  onSelect,
  className,
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      {CONTENT_TYPES.map(({ key, label, icon: Icon, iconClass }) => (
        <button
          key={key}
          type="button"
          className={cn(
            'flex flex-col items-center rounded-lg border border-navy-700 bg-navy-900/50 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
            selectedKey === key && 'bg-brand-500/10 text-brand-300',
            'data-[state=selected]:bg-brand-500/10 data-[state=selected]:text-brand-300'
          )}
          onClick={() => onSelect(key)}
          aria-pressed={selectedKey === key}
          aria-label={label}
        >
          <Icon className={cn('size-5', selectedKey === key ? iconClass : 'text-slate-500')} aria-hidden="true" />
          <span className="mt-1 line-clamp-1">{label}</span>
        </button>
      ))}
    </div>
  )
}