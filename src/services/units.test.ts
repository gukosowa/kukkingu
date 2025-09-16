import { expect } from 'chai'
import { migrateRecipeUnits, normalizeAmountType } from './units'

describe('units normalization', () => {
  it('maps Japanese legacy units to canonical', () => {
    expect(normalizeAmountType('㏄')).to.equal('ml')
    expect(normalizeAmountType('大さじ')).to.equal('tbl')
    expect(normalizeAmountType('小さじ')).to.equal('tea')
    expect(normalizeAmountType('個')).to.equal('p')
    expect(normalizeAmountType('少々')).to.equal('pinch')
  })

  it('keeps canonical values', () => {
    expect(normalizeAmountType('ml')).to.equal('ml')
    expect(normalizeAmountType('g')).to.equal('g')
    expect(normalizeAmountType('tbl')).to.equal('tbl')
    expect(normalizeAmountType('tea')).to.equal('tea')
    expect(normalizeAmountType('p')).to.equal('p')
  })

  it('leaves unknown values unchanged', () => {
    expect(normalizeAmountType('cup')).to.equal('cup')
  })

  it('migrates a recipe structure', () => {
    const r = {
      name: 'test',
      original: 1,
      desired: 1,
      note: '',
      ingredients: [
        { name: '水', amount: 100, amountType: '㏄' },
        { name: '砂糖', amount: 1, amountType: '大さじ' },
        { name: '塩', amount: 1, amountType: '小さじ' },
        { name: '卵', amount: 1, amountType: '個' },
      ],
    }
    const migrated = migrateRecipeUnits(r)
    expect(migrated.ingredients[0].amountType).to.equal('ml')
    expect(migrated.ingredients[1].amountType).to.equal('tbl')
    expect(migrated.ingredients[2].amountType).to.equal('tea')
    expect(migrated.ingredients[3].amountType).to.equal('p')

  })
})