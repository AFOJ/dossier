import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { usePageTitle } from './usePageTitle'

describe('usePageTitle', () => {
  it('sets the document title with the Dossier suffix', () => {
    renderHook(() => usePageTitle('Create Profile'))

    expect(document.title).toBe('Create Profile | Dossier')
  })

  it('updates the title when the page title changes', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: 'First title' },
    })
    expect(document.title).toBe('First title | Dossier')

    rerender({ title: 'Second title' })
    expect(document.title).toBe('Second title | Dossier')
  })
})