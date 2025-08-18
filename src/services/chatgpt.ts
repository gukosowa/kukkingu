function legacyCopyToClipboard(text: string) {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  } catch (e) {
    // Ignore copy errors
  }
}

export async function openChatGPT(prompt: string): Promise<boolean> {
  // Always copy to clipboard; do not rely on query string
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(prompt)
    } else {
      legacyCopyToClipboard(prompt)
    }
  } catch (e) {
    legacyCopyToClipboard(prompt)
  }
  return true
}
