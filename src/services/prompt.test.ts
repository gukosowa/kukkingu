import { expect } from 'chai'
import { buildImportRecipePrompt, type LocaleText } from './prompt'

const L: LocaleText = 'English'

describe('buildImportRecipePrompt source selection', () => {
  it('uses URL when only url is provided', () => {
    const p = buildImportRecipePrompt({ url: 'https://example.com/recipe', locale: L })
    expect(p).to.contain('Fetch the content of https://example.com/recipe')
    expect(p).to.not.contain('Use only this text:')
    expect(p).to.not.contain('Context:')
    expect(p).to.not.contain('attached pictures')
  })

  it('uses only provided text when only text is provided', () => {
    const p = buildImportRecipePrompt({ text: '1 onion', locale: L })
    expect(p).to.contain('Use only this text:')
    expect(p).to.contain('1 onion')
    expect(p).to.not.contain('Fetch the content of')
    expect(p).to.not.contain('attached pictures')
  })

  it('uses attached pictures only when image-only is selected', () => {
    const p = buildImportRecipePrompt({ fromPicture: true, locale: L })
    expect(p).to.contain('attached pictures')
    expect(p).to.not.contain('Fetch the content of')
    expect(p).to.not.contain('Use only this text:')
  })

  it('acknowledges when no url, text, or pictures provided', () => {
    const p = buildImportRecipePrompt({ locale: L })
    expect(p).to.contain('Remember all the information')
    expect(p).to.contain("Understood. Now write anything and I'll try to convert it to the json")
  })

  it('treats url as primary and text as context when both provided', () => {
    const p = buildImportRecipePrompt({ url: 'https://example.com/r', text: 'Some notes', locale: L })
    expect(p).to.contain('Fetch the content of https://example.com/r')
    expect(p).to.contain('Context:')
    expect(p).to.contain('Some notes')
    expect(p).to.not.contain('Combine and deduplicate')
  })
})

describe('buildImportRecipePrompt servings rule', () => {
  const locales: Record<LocaleText, string> = {
    English: 'Servings',
    German: 'Portionen',
    Japanese: '人前',
  }

  Object.entries(locales).forEach(([locale, name]) => {
    it(`uses "${name}" as the first ingredient for ${locale}`, () => {
      const p = buildImportRecipePrompt({ url: 'https://example.com/recipe', locale: locale as LocaleText })
      expect(p).to.contain(`first ingredient named "${name}"`)
      expect(p).to.contain('original and desired')
    })
  })
})

