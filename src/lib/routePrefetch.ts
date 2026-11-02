const PREFETCH_TTL_MS = 3_000

type PrefetchEntry<Value> = {
  promise: Promise<Value>
  expiresAt: number
}

const entries = new Map<string, PrefetchEntry<unknown>>()

function getActiveEntry<Value>(key: string): PrefetchEntry<Value> | undefined {
  const entry = entries.get(key) as PrefetchEntry<Value> | undefined
  if (!entry) {
    return undefined
  }

  if (entry.expiresAt > Date.now()) {
    return entry
  }

  entries.delete(key)
  return undefined
}

/** Starts a short-lived, per-tab read that a matching route loader may consume once. */
export function prefetchRouteData<Value>(key: string, load: () => Promise<Value>): Promise<Value> {
  const existing = getActiveEntry<Value>(key)
  if (existing) {
    return existing.promise
  }

  const promise = load()
  const entry: PrefetchEntry<Value> = {
    promise,
    expiresAt: Date.now() + PREFETCH_TTL_MS,
  }
  entries.set(key, entry)

  void promise.catch(() => {
    if (entries.get(key) === entry) {
      entries.delete(key)
    }
  })

  return promise
}

/** Returns and removes a still-fresh prefetched read so it cannot outlive one navigation. */
export function takePrefetchedRouteData<Value>(key: string): Promise<Value> | undefined {
  const entry = getActiveEntry<Value>(key)
  if (!entry) {
    return undefined
  }

  entries.delete(key)
  return entry.promise
}

export function clearRoutePrefetches() {
  entries.clear()
}
