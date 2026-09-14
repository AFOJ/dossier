const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatTableDate(date: Date): string {
  return dateFormatter.format(date)
}
