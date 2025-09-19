const DEFAULTS = {
  maxDimension: 2048,
  targetSizeBytes: 1.5 * 1024 * 1024,
  minDimension: 720,
  initialQuality: 0.85,
  minQuality: 0.55,
  qualityStep: 0.07,
}

export interface ImageOptimizationOptions {
  maxDimension?: number
  targetSizeBytes?: number
  minDimension?: number
  initialQuality?: number
  minQuality?: number
  qualityStep?: number
}

interface ImageSource {
  width: number
  height: number
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  cleanup?: () => void
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create blob from canvas'))
      }
    }, type, quality)
  })
}

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const loadImageSource = async (blob: Blob): Promise<ImageSource> => {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, width, height) => {
          ctx.drawImage(bitmap, 0, 0, width, height)
        },
        cleanup: () => bitmap.close?.(),
      }
    } catch (error) {
      console.warn('createImageBitmap failed, falling back to Image element:', error)
    }
  }

  const img = new Image()
  const objectUrl = URL.createObjectURL(blob)

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = objectUrl
    })

    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, width, height) => {
        ctx.drawImage(img, 0, 0, width, height)
      },
      cleanup: () => URL.revokeObjectURL(objectUrl),
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

const drawScaledImage = (source: ImageSource, width: number, height: number): HTMLCanvasElement => {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  source.draw(ctx, width, height)
  return canvas
}

const encodeCanvas = async (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> => {
  return await canvasToBlob(canvas, mimeType, quality)
}

const optimizeDimensions = (
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number; scale: number } => {
  const largestSide = Math.max(width, height)
  if (largestSide <= maxDimension) {
    return { width, height, scale: 1 }
  }
  const scale = maxDimension / largestSide
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  }
}

const shouldUseLossless = (mimeType: string): boolean => {
  if (mimeType === 'image/gif') return false
  return mimeType === 'image/png' || mimeType === 'image/svg+xml'
}

const pickOutputType = (mimeType: string): string => {
  if (mimeType === 'image/gif') {
    // GIFs lose animation when processed; fall back to PNG
    return 'image/png'
  }
  if (shouldUseLossless(mimeType)) {
    return 'image/png'
  }
  if (mimeType === 'image/webp') {
    return 'image/webp'
  }
  return 'image/jpeg'
}

export const optimizeImageBlob = async (
  input: Blob,
  options: ImageOptimizationOptions = {}
): Promise<string> => {
  const settings = { ...DEFAULTS, ...options }
  const mimeType = input.type && input.type !== 'application/octet-stream'
    ? input.type
    : 'image/jpeg'

  const source = await loadImageSource(input)

  try {
    const { width: initialWidth, height: initialHeight } = source
    let { width, height } = optimizeDimensions(initialWidth, initialHeight, settings.maxDimension)
    let canvas = drawScaledImage(source, width, height)
    const outputType = pickOutputType(mimeType)

    let quality = shouldUseLossless(outputType) ? undefined : settings.initialQuality
    let blob = await encodeCanvas(canvas, outputType, quality)

    if (!shouldUseLossless(outputType)) {
      quality = quality ?? settings.initialQuality
      let currentQuality = quality
      while (blob.size > settings.targetSizeBytes && currentQuality > settings.minQuality + settings.qualityStep) {
        currentQuality = Math.max(settings.minQuality, currentQuality - settings.qualityStep)
        blob = await encodeCanvas(canvas, outputType, currentQuality)
      }

      // If still too large, progressively reduce dimensions
      while (
        blob.size > settings.targetSizeBytes &&
        (canvas.width > settings.minDimension || canvas.height > settings.minDimension)
      ) {
        width = Math.max(settings.minDimension, Math.round(canvas.width * 0.85))
        height = Math.max(settings.minDimension, Math.round(canvas.height * 0.85))

        if (width === canvas.width && height === canvas.height) {
          break
        }

        canvas = drawScaledImage(
          {
            width: canvas.width,
            height: canvas.height,
            draw: (ctx, w, h) => {
              ctx.drawImage(canvas, 0, 0, w, h)
            },
          },
          width,
          height,
        )

        blob = await encodeCanvas(canvas, outputType, currentQuality)
      }
    } else {
      // Lossless formats can only shrink via dimensions
      while (
        blob.size > settings.targetSizeBytes &&
        (canvas.width > settings.minDimension || canvas.height > settings.minDimension)
      ) {
        width = Math.max(settings.minDimension, Math.round(canvas.width * 0.85))
        height = Math.max(settings.minDimension, Math.round(canvas.height * 0.85))

        if (width === canvas.width && height === canvas.height) {
          break
        }

        canvas = drawScaledImage(
          {
            width: canvas.width,
            height: canvas.height,
            draw: (ctx, w, h) => {
              ctx.drawImage(canvas, 0, 0, w, h)
            },
          },
          width,
          height,
        )

        blob = await encodeCanvas(canvas, outputType)
      }
    }

    return await blobToDataUrl(blob)
  } finally {
    source.cleanup?.()
  }
}

export const optimizeImageFile = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<string> => {
  return await optimizeImageBlob(file, options)
}

