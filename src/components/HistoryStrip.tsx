import { ChevronDown, History } from "lucide-react"
import { useState } from "react"
import type { HistoryItem } from "../types/cutout"

interface HistoryStripProps {
  items: HistoryItem[]
  onSelect: (item: HistoryItem) => void
}

export default function HistoryStrip({ items, onSelect }: HistoryStripProps) {
  const [open, setOpen] = useState(true)
  if (items.length === 0) return null
  return (
    <section className="history-strip">
      <button type="button" className="history-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span><History size={15} /> Recent cutouts <b>{items.length}</b></span><ChevronDown size={16} className={open ? "rotated" : ""} />
      </button>
      {open && <div className="history-list">{items.map((history) => (
        <button type="button" key={history.id} onClick={() => onSelect(history)} title={`Reload ${history.name}`}>
          <img src={history.cutoutUrl} alt="" /><span>{history.name}</span>
        </button>
      ))}</div>}
    </section>
  )
}
