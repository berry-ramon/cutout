import { AlertCircle, Check, Clock3, LoaderCircle } from "lucide-react"
import type { CutoutItem } from "../types/cutout"

interface BatchGridProps {
  items: CutoutItem[]
  selectedId: string
  onSelect: (id: string) => void
  completed: number
}

export default function BatchGrid({ items, selectedId, onSelect, completed }: BatchGridProps) {
  return (
    <section className="batch-card">
      <div className="batch-heading"><div><strong>Batch workspace</strong><span>{items.length} images · {completed} complete</span></div><div className="batch-count">{completed}/{items.length}</div></div>
      <div className="batch-progress"><i style={{ width: `${items.length ? completed / items.length * 100 : 0}%` }} /></div>
      <div className="batch-grid">
        {items.map((item) => (
          <button type="button" key={item.id} className={`batch-item ${selectedId === item.id ? "selected" : ""}`} onClick={() => onSelect(item.id)} title={item.error || item.name}>
            <img src={item.cutoutUrl || item.originalUrl} alt="" />
            <span className={`status-icon ${item.status}`}>
              {item.status === "done" && <Check size={13} />}
              {item.status === "processing" && <LoaderCircle size={13} />}
              {item.status === "failed" && <AlertCircle size={13} />}
              {item.status === "queued" && <Clock3 size={13} />}
            </span>
            <small>{item.name}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
