import { ArrowUp, ArrowDown } from 'lucide-react'

export default function KpiCard({ title, value, subtitle, trend, icon: Icon }) {
  const trendIsUp = typeof trend === 'number' && trend >= 0
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {title}
        </div>
        {Icon ? <Icon className="h-4 w-4 text-gray-400" /> : null}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value ?? '—'}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
        {typeof trend === 'number' ? (
          <span
            className={`inline-flex items-center gap-0.5 font-medium ${
              trendIsUp ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trendIsUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
    </div>
  )
}
