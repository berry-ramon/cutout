import type { CutoutItem, EditorOptions } from "../types/cutout"
import { refineCutout } from "./edgeRefine"

async function imageFromUrl(url: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  return createImageBitmap(blob)
}

function drawFit(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  width: number,
  height: number,
  fit: "cover" | "contain" | "original",
) {
  if (fit === "original") {
    context.drawImage(image, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight)
    return
  }
  const ratio = fit === "cover"
    ? Math.max(width / imageWidth, height / imageHeight)
    : Math.min(width / imageWidth, height / imageHeight)
  const drawnWidth = imageWidth * ratio
  const drawnHeight = imageHeight * ratio
  context.drawImage(image, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight)
}

export async function composeImage(
  item: CutoutItem,
  options: EditorOptions,
  applyMaxDimension = false,
) {
  if (!item.cutoutUrl) throw new Error("Process the image before exporting it.")
  const [original, cutout] = await Promise.all([
    imageFromUrl(item.originalUrl),
    imageFromUrl(item.cutoutUrl),
  ])
  const refined = await refineCutout(
    cutout,
    item.width,
    item.height,
    options.feather,
    options.contractExpand,
    options.threshold,
  )
  const paddingScale = 1 + (options.padding / 100) * 2
  let width = Math.round(item.width * paddingScale)
  let height = Math.round(item.height * paddingScale)
  let outputScale = 1
  if (applyMaxDimension && options.maxDimension !== "original") {
    outputScale = Math.min(1, options.maxDimension / Math.max(width, height))
    width = Math.round(width * outputScale)
    height = Math.round(height * outputScale)
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is unavailable in this browser.")
  const subjectWidth = item.width * outputScale
  const subjectHeight = item.height * outputScale
  const x = (width - subjectWidth) / 2
  const y = (height - subjectHeight) / 2

  if (options.background === "solid") {
    context.fillStyle = options.solidColor
    context.fillRect(0, 0, width, height)
  } else if (options.background === "custom" && options.customBackgroundUrl) {
    const background = await imageFromUrl(options.customBackgroundUrl)
    drawFit(context, background, background.width, background.height, width, height, options.fitMode)
    background.close()
  } else if (options.background === "blur") {
    context.save()
    context.filter = `blur(${options.blurRadius}px)`
    const overscan = Math.max(20, options.blurRadius * 2)
    context.drawImage(original, -overscan, -overscan, width + overscan * 2, height + overscan * 2)
    context.restore()
  }

  if (options.shadow && options.background !== "transparent" && options.background !== "blur") {
    context.shadowColor = options.shadowColor
    context.shadowBlur = options.shadowBlur * outputScale
    context.shadowOffsetX = options.shadowOffset * outputScale
    context.shadowOffsetY = options.shadowOffset * outputScale
  }
  context.drawImage(refined, x, y, subjectWidth, subjectHeight)
  original.close()
  cutout.close()
  return canvas
}

export async function canvasToBlob(canvas: HTMLCanvasElement, options: EditorOptions, forcePng = false) {
  const format = forcePng ? "png" : options.format
  const mime = `image/${format}`
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The image could not be encoded."))),
      mime,
      options.quality / 100,
    )
  })
}
