import { Play } from "lucide-react"
import type { CutoutItem, EditorOptions } from "../types/cutout"
import BatchGrid from "./BatchGrid"
import DownloadBar from "./DownloadBar"
import ImagePreview from "./ImagePreview"
import OptionsPanel from "./OptionsPanel"

interface WorkspaceProps {
  items: CutoutItem[]
  selectedId: string
  options: EditorOptions
  previewUrl?: string
  processing: boolean
  stage: string
  exporting: boolean
  onSelect: (id: string) => void
  onOptions: (options: EditorOptions) => void
  onProcessAll: () => void
  onCancel: () => void
  onDownload: () => void
  onCopy: () => void
  onDownloadAll: () => void
  onStartOver: () => void
}

export default function Workspace(props: WorkspaceProps) {
  const selected = props.items.find((item) => item.id === props.selectedId) || props.items[0]
  const done = props.items.filter((item) => item.status === "done").length
  const batch = props.items.length > 1
  return (
    <main className="workspace">
      <div className="workspace-main">
        <div className="left-column">
          {batch && <BatchGrid items={props.items} selectedId={selected.id} onSelect={props.onSelect} completed={done} />}
          {!batch || selected.status !== "queued" ? (
            <ImagePreview item={selected} outputUrl={props.previewUrl || selected.previewUrl || selected.cutoutUrl} processing={selected.status === "processing"} stage={props.stage} onCancel={props.onCancel} />
          ) : (
            <div className="queued-preview">
              <img src={selected.originalUrl} alt="" />
              <div><strong>Ready to remove</strong><span>Start the batch to process this image.</span></div>
            </div>
          )}
          {batch && done < props.items.length && (
            <button type="button" className="primary-button process-all" disabled={props.processing} onClick={props.onProcessAll}>
              <Play size={17} fill="currentColor" /> {props.processing ? `Processing ${done + 1} of ${props.items.length}` : "Process all"}
            </button>
          )}
        </div>
        <OptionsPanel options={props.options} onChange={props.onOptions} disabled={!selected.cutoutUrl} />
      </div>
      <DownloadBar batchCount={props.items.length} doneCount={done} canDownload={selected.status === "done"} exporting={props.exporting} onDownload={props.onDownload} onCopy={props.onCopy} onDownloadAll={props.onDownloadAll} onStartOver={props.onStartOver} />
    </main>
  )
}
