import { Inbox } from 'lucide-react'

export default function EmptyState({
  title = 'No data',
  description = 'No data — upload an exam to get started.',
  icon: Icon = Inbox,
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <Icon className="mb-3 h-8 w-8 text-gray-400" />
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
