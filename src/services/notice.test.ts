import { handlePromptNoticeOk } from './notice'
import { expect } from 'chai'

describe('handlePromptNoticeOk', () => {
  it('opens URL and triggers import when URL provided', () => {
    let opened: string | null = null
    const orig = window.open
    window.open = (u: string) => {
      opened = u
      return null as any
    }
    let called = false
    handlePromptNoticeOk('https://chatgpt.com/', () => {
      called = true
    })
    expect(opened).to.equal('https://chatgpt.com/')
    expect(called).to.be.true
    window.open = orig
  })

  it('does nothing without URL', () => {
    let called = false
    const orig = window.open
    window.open = (() => null as any) as any
    handlePromptNoticeOk(null, () => {
      called = true
    })
    expect(called).to.be.false
    window.open = orig
  })
})
