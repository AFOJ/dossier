import { createContext, useContext } from "react"
import type { Settings } from "@/db/settings"
import type { Tag } from "@/db/db"
import type { queryResumes } from "@/db/resume"
import type { queryCoverLetters } from "@/db/coverLetter"

type InitialListData<Result> = {
  query: { key: string; result: Result }
  totalDbCount: number
}

export type InitialPageData = {
  settings: Settings
  resumes?: InitialListData<Awaited<ReturnType<typeof queryResumes>>>
  coverLetters?: InitialListData<Awaited<ReturnType<typeof queryCoverLetters>>>
  tags?: Tag[]
}

export const InitialPageDataContext = createContext<InitialPageData | undefined>(undefined)

/** A navigation snapshot only. Live queries remain responsible for later updates. */
export function useInitialPageData() {
  return useContext(InitialPageDataContext)
}
