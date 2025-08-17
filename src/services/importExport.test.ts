import { expect } from 'chai'
import type { Recipe } from '~src/store/index'
import { mergeRecipesByExportedAt } from './importExport'

describe('mergeRecipesByExportedAt', () => {
  const base = (): Recipe => ({
    name: 'R',
    original: 1,
    desired: 1,
    note: '',
    ingredients: [],
  })

  it('replaces when incoming is newer', () => {
    const existing: Recipe[] = [{ ...base(), id: '1', exportedAt: '2024-01-01T00:00:00.000Z', note: 'old' }]
    const incoming: Recipe[] = [{ ...base(), id: '1', exportedAt: '2024-02-01T00:00:00.000Z', note: 'new' }]
    const merged = mergeRecipesByExportedAt(existing, incoming)
    expect(merged).to.have.length(1)
    expect(merged[0].note).to.equal('new')
  })

  it('keeps existing when incoming is older', () => {
    const existing: Recipe[] = [{ ...base(), id: '1', exportedAt: '2024-03-01T00:00:00.000Z', note: 'keep' }]
    const incoming: Recipe[] = [{ ...base(), id: '1', exportedAt: '2024-02-01T00:00:00.000Z', note: 'discard' }]
    const merged = mergeRecipesByExportedAt(existing, incoming)
    expect(merged[0].note).to.equal('keep')
  })

  it('replaces when existing has no exportedAt', () => {
    const existing: Recipe[] = [{ ...base(), id: '1', note: 'no-date' }]
    const incoming: Recipe[] = [{ ...base(), id: '1', exportedAt: '2024-02-01T00:00:00.000Z', note: 'new' }]
    const merged = mergeRecipesByExportedAt(existing, incoming)
    expect(merged[0].note).to.equal('new')
  })

  it('does not replace when incoming has no exportedAt', () => {
    const existing: Recipe[] = [{ ...base(), id: '1', exportedAt: '2024-02-01T00:00:00.000Z', note: 'keep' }]
    const incoming: Recipe[] = [{ ...base(), id: '1', note: 'no-date' }]
    const merged = mergeRecipesByExportedAt(existing, incoming)
    expect(merged[0].note).to.equal('keep')
  })

  it('appends new ids', () => {
    const existing: Recipe[] = [{ ...base(), id: '1', exportedAt: '2024-02-01T00:00:00.000Z', note: 'one' }]
    const incoming: Recipe[] = [{ ...base(), id: '2', exportedAt: '2024-02-02T00:00:00.000Z', note: 'two' }]
    const merged = mergeRecipesByExportedAt(existing, incoming)
    expect(merged).to.have.length(2)
    expect(merged.find((r) => r.id === '2')?.note).to.equal('two')
  })
})

