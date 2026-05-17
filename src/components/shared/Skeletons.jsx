export function CardSkeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-3xl bg-gray-100 ${className}`} />
}

export function ListItemSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-gray-100 p-6 space-y-4">
      <div className="h-4 w-1/3 bg-gray-100 rounded" />
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
    </div>
  )
}
