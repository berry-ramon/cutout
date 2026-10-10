import { Clipboard, Download, FileArchive, RotateCcw } from "lucide-react"

interface DownloadBarProps {
  batchCount: number
  doneCount: number
  canDownload: boolean
  exporting: boolean
  onDownload: () => void
  onCopy: () => void
  onDownloadAll: () => void
  onStartOver: () => void
}

export default function DownloadBar({ batchCount, doneCount, canDownload, exporting, onDownload, onCopy, onDownloadAll, onStartOver }: DownloadBarProps) {
  return (
    <div className="download-bar">
      <button type="button" className="primary-button" disabled={!canDownload || exporting} onClick={onDownload} title="Save the selected cutout">
        <Download size={17} /> {exporting ? "Preparing…" : "Download"}
      </button>
      <button type="button" className="secondary-button" disabled={!canDownload || exporting} onClick={onCopy} title="Copy result as PNG"><Clipboard size={16} /> Copy</button>
      {batchCount > 1 && <button type="button" className="secondary-button" disabled={doneCount === 0 || exporting} onClick={onDownloadAll} title="Download completed images as a ZIP"><FileArchive size={16} /> Download all ({doneCount})</button>}
      <button type="button" className="ghost-button start-over" onClick={onStartOver} title="Clear this workspace"><RotateCcw size={15} /> Start over</button>
    </div>
  )
}
