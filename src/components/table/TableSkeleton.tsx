type TableSkeletonProps = {
  headers: string[]
  actionButtonCount: number
  ariaLabel: string
}

export function TableSkeleton(props: Readonly<TableSkeletonProps>) {
  const { headers, actionButtonCount, ariaLabel } = props

  return (
    <div className="flex flex-col gap-3" aria-label={ariaLabel}>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              {headers.map((header) => {
                return (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                )
              })}
              <th className="px-4 py-3 text-right">Quick actions</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4].map((row) => {
              return (
                <tr key={row} className="border-b border-gray-100 last:border-0">
                  {headers.map((header, index) => {
                    return (
                      <td key={header} className="px-4 py-4">
                        <div
                          className={
                            index === 0
                              ? "h-4 w-48 animate-pulse rounded bg-gray-200"
                              : "h-4 w-32 animate-pulse rounded bg-gray-100"
                          }
                        />
                      </td>
                    )
                  })}
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {Array.from({ length: actionButtonCount }).map((_, index) => {
                        return (
                          <div key={index} className="size-8 animate-pulse rounded bg-gray-100" />
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
