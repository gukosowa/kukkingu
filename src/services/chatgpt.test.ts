import { expect } from 'chai'
import { openChatGPT } from './chatgpt'

describe('openChatGPT', () => {
  it('always copies to clipboard and does not open a tab', async () => {
    // Stub clipboard
    const originalClipboard: any = (navigator as any).clipboard
    const writes: string[] = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (t: string) => {
          writes.push(t)
        },
      },
    })

    // Spy on window.open to ensure it is not used
    const originalOpen = window.open
    let openedUrl: string | null = null
    // @ts-ignore override for test
    window.open = (url: string) => {
      openedUrl = url
      return null as any
    }

    try {
      const prompt = 'short or long does not matter now'
      const copied = await openChatGPT(prompt)
      expect(copied).to.equal(true)
      expect(writes[0]).to.equal(prompt)
      expect(openedUrl).to.equal(null)
    } finally {
      // Restore globals
      window.open = originalOpen
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: originalClipboard })
    }
  })
})
