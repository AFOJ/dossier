export function ResumesTableSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading resumes">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Resume title</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3 text-right">Quick actions</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <div className="size-8 animate-pulse rounded bg-gray-100" />
                    <div className="size-8 animate-pulse rounded bg-gray-100" />
                    <div className="size-8 animate-pulse rounded bg-gray-100" />
                    <div className="size-8 animate-pulse rounded bg-gray-100" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
