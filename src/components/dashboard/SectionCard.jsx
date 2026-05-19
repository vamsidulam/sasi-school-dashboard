export default function SectionCard({ title, subtitle, action, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
            ) : null}
          </div>
          {action ?? null}
        </div>
      )}
      {children}
    </section>
  )
}
