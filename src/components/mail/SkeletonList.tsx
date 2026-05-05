export function SkeletonList() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800" aria-busy="true" aria-label="Chargement des emails">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="w-8 h-8 rounded-full skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-32 rounded skeleton" />
              <div className="h-3 w-20 rounded skeleton ml-auto" />
            </div>
            <div className="h-3 w-48 rounded skeleton" />
            <div className="h-3 w-full rounded skeleton opacity-60" />
          </div>
        </div>
      ))}
    </div>
  )
}