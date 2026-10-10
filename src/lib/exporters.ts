import JSZip from "jszip"
import type { CutoutItem, EditorOptions } from "../types/cutout"
import { canvasToBlob, composeImage } from "./compose"

export function extensionFor(options: EditorOptions) {
  return options.format === "jpeg" ? "jpg" : options.format
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportItem(item: CutoutItem, options: EditorOptions, forcePng = false) {
  const canvas = await composeImage(item, options, true)
  return canvasToBlob(canvas, options, forcePng)
}

export async function copyItem(item: CutoutItem, options: EditorOptions) {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("Image clipboard access isn't supported in this browser.")
  }
  const blob = await exportItem(item, options, true)
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
}

export async function downloadZip(
  items: CutoutItem[],
  options: EditorOptions,
  onProgress: (done: number) => void,
) {
  const zip = new JSZip()
  const extension = extensionFor(options)
  let done = 0
  for (const item of items) {
    if (item.status !== "done") continue
    const blob = await exportItem(item, options)
    zip.file(`${item.name}-cutout.${extension}`, blob)
    done += 1
    onProgress(done)
  }
  const archive = await zip.generateAsync({ type: "blob", compression: "DEFLATE" })
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  saveBlob(archive, `cutouts-${stamp}.zip`)
}
