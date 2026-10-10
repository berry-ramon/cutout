import type { ModelProgress, WorkerResponse } from "../types/cutout"

export interface RemovalCallbacks {
  onProgress: (progress: ModelProgress) => void
  onStage: (stage: "loading" | "segmenting") => void
}

let activeWorker: Worker | null = null
let activeReject: ((reason: Error) => void) | null = null

export function supportsLocalAI() {
  return typeof WebAssembly === "object" && typeof Worker !== "undefined"
}

export async function isModelCached() {
  if (!("caches" in window)) return false
  try {
    return Boolean(await caches.match("/cutout-model-ready"))
  } catch {
    return false
  }
}

export function removeBackgroundInWorker(
  id: string,
  blob: Blob,
  callbacks: RemovalCallbacks,
): Promise<Blob> {
  cancelRemoval()
  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
  activeWorker = worker

  return new Promise((resolve, reject) => {
    activeReject = reject
    const clean = () => {
      worker.terminate()
      if (activeWorker === worker) activeWorker = null
      activeReject = null
    }
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.id !== id) return
      if (message.type === "progress") callbacks.onProgress(message.progress)
      if (message.type === "stage") callbacks.onStage(message.stage)
      if (message.type === "complete") {
        clean()
        resolve(message.blob)
      }
      if (message.type === "error") {
        clean()
        reject(new Error(message.error))
      }
    }
    worker.onerror = (event) => {
      clean()
      reject(new Error(event.message || "The background removal worker stopped unexpectedly."))
    }
    worker.postMessage({ type: "process", id, blob })
  })
}

export function cancelRemoval() {
  activeWorker?.terminate()
  activeWorker = null
  activeReject?.(new Error("Processing cancelled."))
  activeReject = null
}
