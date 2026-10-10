# Cutout

Cutout is a fully client-side AI background remover built with React, TypeScript, Vite, and Tailwind CSS. Images are decoded, segmented, refined, composited, and exported in the browser. They are never uploaded to a server.

## How it works

- `@imgly/background-removal` runs an IS-Net/U²-Net-family ONNX model in a Web Worker.
- The model and WASM assets are cached by the browser and the library's model cache.
- Canvas APIs perform edge refinement, padding, shadows, blur, and background compositing.
- Batch processing is sequential to avoid exhausting memory.
- JSZip creates batch downloads locally.

The first removal downloads the medium-quality model and runtime assets (about **80 MB**). This is expected and only happens once. Actual byte progress is shown during the download. Once cached, the tool can work offline.

## Development

Requirements: Node.js 20 and pnpm 10 (see `.mise.toml`).

```bash
pnpm install
pnpm dev
```

Create a production build:

```bash
pnpm build
```

## Deployment

Cutout is a static Vite app and needs no API keys or environment variables.

- **Vercel:** import the repository, use `pnpm build`, and publish `dist`.
- **Netlify:** use build command `pnpm build` and publish directory `dist`.
- **GitHub Pages:** set Vite's `base` to your repository path if it is not served from a custom domain, run `pnpm build`, and deploy `dist` with a Pages workflow.

For best ONNX performance, configure these response headers where supported:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The app still works without cross-origin isolation, but multithreaded WASM optimizations may be unavailable.
