export type ItemStatus = "queued" | "processing" | "done" | "failed"
export type BackgroundMode = "transparent" | "solid" | "custom" | "blur"
export type FitMode = "cover" | "contain" | "original"
export type OutputFormat = "png" | "jpeg" | "webp"
export type PreviewMode = "original" | "cutout" | "split"

export interface CutoutItem {
  id: string
  name: string
  file: Blob
  originalUrl: string
  cutoutBlob?: Blob
  cutoutUrl?: string
  previewUrl?: string
  width: number
  height: number
  size: number
  status: ItemStatus
  progress?: ModelProgress
  error?: string
  downscaled?: boolean
}

export interface ModelProgress {
  key: string
  current: number
  total: number
  percent: number
}

export interface EditorOptions {
  background: BackgroundMode
  solidColor: string
  customBackground?: Blob
  customBackgroundUrl?: string
  fitMode: FitMode
  blurRadius: number
  padding: number
  shadow: boolean
  shadowColor: string
  shadowOffset: number
  shadowBlur: number
  feather: number
  contractExpand: number
  threshold: number
  format: OutputFormat
  quality: number
  maxDimension: "original" | 2048 | 1024 | 512
}

export interface HistoryItem {
  id: string
  name: string
  originalUrl: string
  cutoutUrl: string
  item: CutoutItem
}

export type WorkerRequest =
  | { type: "process"; id: string; blob: Blob }
  | { type: "cancel" }

export type WorkerResponse =
  | { type: "progress"; id: string; progress: ModelProgress }
  | { type: "stage"; id: string; stage: "loading" | "segmenting" }
  | { type: "complete"; id: string; blob: Blob }
  | { type: "error"; id: string; error: string }

export const DEFAULT_OPTIONS: EditorOptions = {
  background: "transparent",
  solidColor: "#FFFFFF",
  fitMode: "cover",
  blurRadius: 36,
  padding: 0,
  shadow: false,
  shadowColor: "#000000",
  shadowOffset: 8,
  shadowBlur: 18,
  feather: 0,
  contractExpand: 0,
  threshold: 50,
  format: "png",
  quality: 92,
  maxDimension: "original",
}
