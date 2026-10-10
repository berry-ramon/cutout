import { Plus, Scissors, ShieldCheck } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import DropZone from "./components/DropZone"
import HistoryStrip from "./components/HistoryStrip"
import ThemeToggle from "./components/ThemeToggle"
import Workspace from "./components/Workspace"
import { composeImage, canvasToBlob } from "./lib/compose"
import { copyItem, downloadZip, exportItem, extensionFor, saveBlob } from "./lib/exporters"
import { fileFromUrl, readImageFile } from "./lib/imageIO"
import { cancelRemoval, isModelCached, removeBackgroundInWorker, supportsLocalAI } from "./lib/remover"
import type { CutoutItem, EditorOptions, HistoryItem } from "./types/cutout"
import { DEFAULT_OPTIONS } from "./types/cutout"

interface Toast {
  id: number
  kind: "success" | "error" | "info"
  message: string
}

interface NavigatorConnection {
  effectiveType?: string
}

export default function App() {
  const [dark, setDark] = useState(false)
  const [items, setItems] = useState<CutoutItem[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [options, setOptions] = useState<EditorOptions>(DEFAULT_OPTIONS)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [stage, setStage] = useState("Removing background…")
  const [processing, setProcessing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [modelCached, setModelCached] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const cancelled = useRef(false)

  const toast = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, kind }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3800)
  }, [])

  useEffect(() => {
    void isModelCached().then(setModelCached)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (items.length > 0 && event.target instanceof HTMLInputElement) return
      const files = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith("image/"))
      if (files.length) void addFiles(files)
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  })

  const updateItem = useCallback((id: string, change: Partial<CutoutItem>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...change } : item))
  }, [])

  const confirmSlowConnection = useCallback(() => {
    if (modelCached) return true
    const connection = (navigator as Navigator & { connection?: NavigatorConnection }).connection
    if (connection?.effectiveType === "2g" || connection?.effectiveType === "3g") {
      return window.confirm("You appear to be on a slower connection. First-time setup downloads about 80 MB. Continue?")
    }
    return true
  }, [modelCached])

  const processOne = useCallback(async (item: CutoutItem) => {
    if (!supportsLocalAI()) {
      throw new Error("Your browser doesn't support the AI model needed for this tool. Try Chrome, Edge, Firefox, or Safari 16+.")
    }
    if (!confirmSlowConnection()) throw new Error("Download cancelled.")
    setProcessing(true)
    updateItem(item.id, { status: "processing", error: undefined })
    setStage(modelCached ? "Starting local AI…" : "Preparing AI model…")
    try {
      const blob = await removeBackgroundInWorker(item.id, item.file, {
        onProgress: (progress) => {
          updateItem(item.id, { progress })
          setStage("Preparing AI model…")
        },
        onStage: (nextStage) => setStage(nextStage === "loading" ? (modelCached ? "Loading cached model…" : "Preparing AI model…") : "Removing background…"),
      })
      const cutoutUrl = URL.createObjectURL(blob)
      const finished: CutoutItem = { ...item, cutoutBlob: blob, cutoutUrl, status: "done", progress: undefined }
      updateItem(item.id, finished)
      setModelCached(true)
      setHistory((current) => [{ id: crypto.randomUUID(), name: item.name, originalUrl: item.originalUrl, cutoutUrl, item: finished }, ...current.filter((entry) => entry.item.id !== item.id)].slice(0, 10))
      toast(`${item.name} is ready`, "success")
      return finished
    } catch (error) {
      const message = error instanceof Error ? error.message : "This image could not be processed."
      updateItem(item.id, { status: message === "Processing cancelled." ? "queued" : "failed", error: message })
      if (message !== "Processing cancelled.") toast(message, "error")
      throw error
    } finally {
      setProcessing(false)
    }
  }, [confirmSlowConnection, modelCached, toast, updateItem])

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return
    const prepared: CutoutItem[] = []
    for (const file of files) {
      try {
        if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is over the 25 MB limit.`)
        prepared.push(await readImageFile(file))
      } catch (error) {
        toast(error instanceof Error ? error.message : "An image could not be read.", "error")
      }
    }
    if (!prepared.length) return
    setItems(prepared)
    setSelectedId(prepared[0].id)
    setOptions(DEFAULT_OPTIONS)
    if (prepared.length === 1) {
      try { await processOne(prepared[0]) } catch { /* surfaced by processOne */ }
    } else {
      toast(`${prepared.length} images added. Start the batch when you're ready.`, "info")
    }
  }, [processOne, toast])

  const processAll = useCallback(async () => {
    cancelled.current = false
    for (const item of items) {
      if (cancelled.current) break
      if (item.status === "done") continue
      setSelectedId(item.id)
      try { await processOne(item) } catch { if (cancelled.current) break }
    }
  }, [items, processOne])

  const selected = items.find((item) => item.id === selectedId) || items[0]

  useEffect(() => {
    if (!selected?.cutoutUrl) {
      setPreviewUrl(undefined)
      return
    }
    let disposed = false
    const timer = window.setTimeout(async () => {
      try {
        const canvas = await composeImage(selected, options)
        const blob = await canvasToBlob(canvas, { ...options, format: "png" }, true)
        if (disposed) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return url
        })
      } catch (error) {
        if (!disposed) toast(error instanceof Error ? error.message : "Preview could not be updated.", "error")
      }
    }, 120)
    return () => { disposed = true; window.clearTimeout(timer) }
  }, [options, selected, toast])

  const startOver = () => {
    cancelled.current = true
    cancelRemoval()
    setItems([])
    setSelectedId("")
    setPreviewUrl(undefined)
    setOptions(DEFAULT_OPTIONS)
  }

  const download = async () => {
    if (!selected) return
    setExporting(true)
    try {
      const blob = await exportItem(selected, options)
      saveBlob(blob, `${selected.name}-cutout.${extensionFor(options)}`)
      toast("Download started", "success")
    } catch (error) { toast(error instanceof Error ? error.message : "Download failed.", "error") }
    finally { setExporting(false) }
  }

  const copy = async () => {
    if (!selected) return
    setExporting(true)
    try { await copyItem(selected, options); toast("PNG copied to clipboard", "success") }
    catch (error) { toast(error instanceof Error ? error.message : "Copy failed.", "error") }
    finally { setExporting(false) }
  }

  const downloadAll = async () => {
    setExporting(true)
    try {
      await downloadZip(items, options, (done) => setStage(`Packaging ${done} of ${items.length}…`))
      toast("ZIP download started", "success")
    } catch (error) { toast(error instanceof Error ? error.message : "ZIP export failed.", "error") }
    finally { setExporting(false) }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand" onClick={startOver} aria-label="Cutout home">
          <span><Scissors size={18} /></span> Cutout
        </button>
        <div className="privacy-status"><ShieldCheck size={14} /> Local processing</div>
        <div className="top-actions">
          {items.length > 0 && <button type="button" className="new-image-button" onClick={startOver}><Plus size={16} /> New image</button>}
          <ThemeToggle dark={dark} onToggle={() => setDark((value) => !value)} />
        </div>
      </header>

      {items.length === 0 ? (
        <DropZone
          onFiles={(files) => void addFiles(files)}
          onUrl={(url) => void fileFromUrl(url).then((file) => addFiles([file])).catch((error: unknown) => toast(error instanceof Error ? error.message : "URL import failed.", "error"))}
          busy={processing}
        />
      ) : (
        <>
          {!modelCached && processing && <div className="model-note"><strong>First-time setup downloads ~80 MB.</strong> This only happens once, then Cutout works offline.</div>}
          <Workspace
            items={items}
            selectedId={selectedId}
            options={options}
            previewUrl={previewUrl}
            processing={processing}
            stage={stage}
            exporting={exporting}
            onSelect={setSelectedId}
            onOptions={(next) => setOptions(next.background === "transparent" && next.format === "jpeg" ? { ...next, format: "png" } : next)}
            onProcessAll={() => void processAll()}
            onCancel={() => { cancelled.current = true; cancelRemoval() }}
            onDownload={() => void download()}
            onCopy={() => void copy()}
            onDownloadAll={() => void downloadAll()}
            onStartOver={startOver}
          />
          <HistoryStrip items={history} onSelect={(entry) => { setItems([entry.item]); setSelectedId(entry.item.id) }} />
        </>
      )}

      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((item) => <div key={item.id} className={`toast ${item.kind}`}>{item.message}</div>)}
      </div>
      <div className="sr-only" aria-live="assertive">{processing ? stage : ""}</div>
    </div>
  )
}
