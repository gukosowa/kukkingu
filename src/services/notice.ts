export function handlePromptNoticeOk(url: string | null, openImportJson: () => void): void {
  if (url) {
    window.open(url, '_blank')
    openImportJson()
  }
}
