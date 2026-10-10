/// <reference lib="webworker" />
import { removeBackground } from "@imgly/background-removal"
import type { ModelProgress, WorkerRequest, WorkerResponse } from "../types/cutout"

const scope = self as unknown as DedicatedWorkerGlobalScope

function send(message: WorkerResponse) {
  scope.postMessage(message)
}

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== "process") return
  const { id, blob } = event.data
  const downloads = new Map<string, { current: number; total: number }>()

  try {
    send({ type: "stage", id, stage: "loading" })
    const result = await removeBackground(blob, {
      model: "isnet_fp16",
      output: { format: "image/png", quality: 1 },
      progress: (key: string, current: number, total: number) => {
        downloads.set(key, { current, total })
        let loaded = 0
        let bytes = 0
        downloads.forEach((part) => {
          loaded += part.current
          bytes += part.total
        })
        const progress: ModelProgress = {
          key,
          current: loaded,
          total: bytes,
          percent: bytes > 0 ? Math.min(100, Math.round((loaded / bytes) * 100)) : 0,
        }
        send({ type: "progress", id, progress })
      },
    })
    send({ type: "stage", id, stage: "segmenting" })
    if ("caches" in scope) {
      const cache = await caches.open("cutout-app-state")
      await cache.put("/cutout-model-ready", new Response("ready"))
    }
    send({ type: "complete", id, blob: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The AI model could not process this image."
    send({ type: "error", id, error: message })
  }
}
