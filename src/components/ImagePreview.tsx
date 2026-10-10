import { Maximize2, Minus, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { CutoutItem, PreviewMode } from "../types/cutout"
import { formatBytes } from "../lib/imageIO"

interface ImagePreviewProps {
  item: CutoutItem
  outputUrl?: string
  processing: boolean
  stage: string
  onCancel: () => void
}

export default function ImagePreview({ item, outputUrl, processing, stage, onCancel }: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<PreviewMode>("split")
  const [split, setSplit] = useState(52)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const frame = frameRef.current
    if (!canvas || !frame) return
    const context = canvas.getContext("2d")
    if (!context) return
    const ratio = window.devicePixelRatio || 1
    const rect = frame.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    context.scale(ratio, ratio)

    const draw = async () => {
      const original = await createImageBitmap(await (await fetch(item.originalUrl)).blob())
      const result = outputUrl ? await createImageBitmap(await (await fetch(outputUrl)).blob()) : null
      context.clearRect(0, 0, rect.width, rect.height)
      const scale = Math.min(rect.width / item.width, rect.height / item.height) * zoom * 0.9
      const width = item.width * scale
      const height = item.height * scale
      const x = (rect.width - width) / 2 + pan.x
      const y = (rect.height - height) / 2 + pan.y
      if (mode === "original" || !result) {
        context.drawImage(original, x, y, width, height)
      } else {
        context.drawImage(result, x, y, width, height)
        if (mode === "split") {
          context.save()
          context.beginPath()
          context.rect(0, 0, rect.width * split / 100, rect.height)
          context.clip()
          context.drawImage(original, x, y, width, height)
          context.restore()
        }
      }
      original.close()
      result?.close()
    }
    void draw()
  }, [item, mode, outputUrl, pan, split, zoom])

  return (
    <section className="preview-card">
      <div className="preview-meta">
        <div><strong>{item.name}</strong><span>{item.width} × {item.height} · {formatBytes(item.size)}</span></div>
        {item.downscaled && <span className="notice-chip" title="Images over 6000px are reduced to protect browser memory">Downscaled for safety</span>}
      </div>
      <div
        className={`canvas-frame ${processing ? "is-processing" : ""}`}
        ref={frameRef}
        onPointerDown={(event) => {
          if (zoom <= 1) return
          dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return
          setPan({ x: dragRef.current.panX + event.clientX - dragRef.current.x, y: dragRef.current.panY + event.clientY - dragRef.current.y })
        }}
        onPointerUp={() => { dragRef.current = null }}
      >
        <canvas ref={canvasRef} aria-label="Image preview canvas" />
        {mode === "split" && outputUrl && !processing && (
          <>
            <input
              className="split-control"
              type="range"
              min="0"
              max="100"
              value={split}
              onChange={(event) => setSplit(Number(event.target.value))}
              aria-label="Before and after divider"
              title="Drag or use arrow keys to compare before and after"
            />
            <span className="split-divider" style={{ left: `${split}%` }} aria-hidden="true"><i /></span>
          </>
        )}
        {processing && (
          <div className="processing-overlay" aria-live="polite">
            <div className="model-mark"><span /></div>
            <strong>{stage}</strong>
            {item.progress && item.progress.total > 0 && (
              <>
                <div className="progress-track"><i style={{ width: `${item.progress.percent}%` }} /></div>
                <span>{item.progress.percent}% · {formatBytes(item.progress.current)} of {formatBytes(item.progress.total)}</span>
              </>
            )}
            <button type="button" className="secondary-button compact" onClick={onCancel}>Cancel</button>
          </div>
        )}
        {!processing && outputUrl && <><span className="compare-label left">Original</span><span className="compare-label right">Cutout</span></>}
      </div>
      <div className="preview-toolbar">
        <div className="segmented" aria-label="Preview mode">
          {(["original", "cutout", "split"] as PreviewMode[]).map((value) => (
            <button type="button" key={value} className={mode === value ? "active" : ""} onClick={() => setMode(value)} title={`Show ${value} view`}>
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <div className="zoom-controls">
          <button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} aria-label="Zoom out" title="Zoom out"><Minus size={16} /></button>
          <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} title="Fit image"><Maximize2 size={15} /> Fit</button>
          <button type="button" onClick={() => setZoom(1)} title="Actual size">1:1</button>
          <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} aria-label="Zoom in" title="Zoom in"><Plus size={16} /></button>
        </div>
      </div>
    </section>
  )
}
