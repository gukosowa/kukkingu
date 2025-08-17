import { ref, watch } from 'vue'
import { recipes } from '~src/store/index'
import { mergeRecipesByExportedAt } from '~src/services/importExport'

export const exportHandle = ref<any>(null)
export const exportDirty = ref(false)

watch(recipes, () => {
  if (exportHandle.value) {
    exportDirty.value = true
  }
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
    exportDirty.value = true
  } catch (e) {
    // ignore if user cancels
  }
}

export async function saveExportFile(): Promise<{ mergedWithExisting: boolean }> {
  if (!exportHandle.value) return { mergedWithExisting: false }
  const now = new Date().toISOString()

  let baseForWrite: any[] = recipes.value as any[]
  let mergedWithExisting = false

  try {
    // If the chosen file already has content, import and merge it first
    const existingFile: File = await exportHandle.value.getFile()
    if (existingFile && existingFile.size > 0) {
      const text = await existingFile.text()
      try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          // Merge: prefer whichever has newer exportedAt
          const merged = mergeRecipesByExportedAt(parsed as any, recipes.value as any) as any[]
          recipes.value = merged as any
          baseForWrite = merged
          mergedWithExisting = true
        }
      } catch (_) {
        // Ignore parse errors and proceed with current recipes
      }
    }
  } catch (_) {
    // Some environments may not support getFile; fall back to just writing
  }

  const payload = baseForWrite.map((r: any) => ({ ...r, exportedAt: now }))
  const writable = await exportHandle.value.createWritable()
  await writable.write(JSON.stringify(payload, null, 2))
  await writable.close()
  exportDirty.value = false
  return { mergedWithExisting }
}
