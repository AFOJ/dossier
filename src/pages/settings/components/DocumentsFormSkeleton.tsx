function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
      <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
    </div>
  )
}

export function DocumentsFormSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <div className="h-8 w-28 animate-pulse rounded bg-gray-200" />
    </div>
  )
}
