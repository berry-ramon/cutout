import { Clipboard, ImagePlus, Link2, LockKeyhole, Sparkles } from "lucide-react"
import { useRef, useState } from "react"

interface DropZoneProps {
  onFiles: (files: File[]) => void
  onUrl: (url: string) => void
  busy: boolean
}

export default function DropZone({ onFiles, onUrl, busy }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [url, setUrl] = useState("")

  return (
    <main className="landing">
      <section className="hero-copy" aria-labelledby="hero-title">
        <div className="eyebrow"><Sparkles size={14} /> Private AI image editing</div>
        <h1 id="hero-title">Lose the background.<br /><span>Keep the magic.</span></h1>
        <p>Studio-quality cutouts, made entirely in your browser. Nothing is uploaded. Nothing leaves your device.</p>
      </section>

      <section
        className={`drop-zone ${dragging ? "is-dragging" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false) }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          onFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.heic,.heif,.bmp,image/*"
          multiple
          onChange={(event) => onFiles(Array.from(event.target.files || []))}
          aria-label="Choose images"
        />
        <div className="upload-orbit"><ImagePlus size={31} strokeWidth={1.7} /></div>
        <h2>Drop your images here</h2>
        <p>or choose another way to add them</p>
        <button className="primary-button large" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus size={18} /> Choose images
        </button>
        <div className="drop-actions">
          <button type="button" className="text-button" onClick={() => setShowUrl((value) => !value)} title="Import a public image URL">
            <Link2 size={16} /> Paste URL
          </button>
          <span aria-hidden="true" />
          <div className="paste-hint" title="Paste an image from your clipboard"><Clipboard size={16} /> Cmd/Ctrl + V</div>
        </div>
        {showUrl && (
          <form className="url-form" onSubmit={(event) => { event.preventDefault(); if (url.trim()) onUrl(url.trim()) }}>
            <label htmlFor="image-url">Public image URL</label>
            <div>
              <input id="image-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/image.jpg" required />
              <button type="submit" className="secondary-button">Add</button>
            </div>
          </form>
        )}
        <div className="formats">PNG · JPG · WEBP · HEIC · BMP <b>up to 25 MB</b></div>
      </section>

      <div className="privacy-pill"><LockKeyhole size={14} /> 100% private · processed on your device</div>
      <div className="feature-row">
        <span><b>No uploads</b><small>Your images stay local</small></span>
        <span><b>Works offline</b><small>After the first model load</small></span>
        <span><b>Batch ready</b><small>Process multiple files</small></span>
      </div>
    </main>
  )
}
