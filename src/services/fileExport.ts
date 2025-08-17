import { ref, watch } from 'vue'
import { recipes } from '~src/store/index'

export const exportHandle = ref<any>(null)
let autosaveTimer: number | null = null

// Auto-save to the chosen file whenever recipes change
watch(recipes, () => {
  if (!exportHandle.value) return
  if (autosaveTimer) window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    saveExportFile().catch(() => {/* ignore autosave failures */})
  }, 400) as unknown as number
}, { deep: true })

export async function chooseExportFile() {
  try {
    exportHandle.value = await (window as any).showSaveFilePicker({
      types: [
        {
          description: 'JSON file',
          accept: { 'application/json': ['.json'] }
        }
      ]
    })
    // Immediately save once after choosing to create/overwrite the file
    await saveExportFile()
  } catch (e) {
    // ignore if user cancels
  }
}

export async function saveExportFile(): Promise<{ mergedWithExisting: boolean }> {
  if (!exportHandle.value) return { mergedWithExisting: false }
  const now = new Date().toISOString()
  const baseForWrite: any[] = recipes.value as any[]
  const payload = baseForWrite.map((r: any) => ({ ...r, exportedAt: now }))
  const writable = await exportHandle.value.createWritable()
  await writable.write(JSON.stringify(payload, null, 2))
  await writable.close()
  return { mergedWithExisting: false }
}

export async function loadFromFile(): Promise<{ merged: boolean }> {
  try {
    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'JSON file',
          accept: { 'application/json': ['.json'] }
        }
      ],
      multiple: false
    })
    const file: File = await fileHandle.getFile()
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      // Replace current recipes with the loaded file content
      // (Import/merge options exist elsewhere via paste/import)
      ;(recipes as any).value = parsed
      return { merged: false }
    }
    // If single object, append
    if (parsed && typeof parsed === 'object') {
      ;(recipes as any).value = [...(recipes as any).value, parsed]
      return { merged: false }
    }
  } catch (e) {
    // user cancelled or parse failed
  }
  return { merged: false }
}
