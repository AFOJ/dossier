import { describe, expect, it } from 'vitest'
import {
  getPageMetadata,
  getPageRange,
  getVisiblePageNumbers,
} from './pagination'

describe('pagination', () => {
  it('normalises invalid pagination and clamps an unavailable page', () => {
    expect(getPageMetadata(12, { page: 99, perPage: 2 })).toEqual({
      page: 6,
      perPage: 2,
      totalCount: 12,
      totalPages: 6,
    })
    expect(getPageMetadata(0, { page: 0, perPage: 0 })).toMatchObject({
      page: 1,
      perPage: 10,
      totalPages: 1,
    })
  })

  it('calculates a range only when rows exist', () => {
    expect(getPageRange(getPageMetadata(12, { page: 2, perPage: 10 }))).toEqual(
      {
        start: 11,
        end: 12,
      },
    )
    expect(getPageRange(getPageMetadata(0, { page: 1, perPage: 10 }))).toEqual({
      start: 0,
      end: 0,
    })
  })

  it('adds ellipses only around omitted pages', () => {
    expect(getVisiblePageNumbers(5, 10)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      'ellipsis',
      10,
    ])
  })
})
