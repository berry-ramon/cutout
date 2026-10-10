import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === "development";

  return {
    base: "/",

    build: {
      sourcemap: emitSourcemaps ? "inline" : false,
      minify: !emitSourcemaps,
      // The WASM is fetched at runtime, not bundled. Bump the warning
      // limit so the remaining library chunks don't spam the console.
      chunkSizeWarningLimit: 1500,
    },

    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },

    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
    },

    preview: {
      host: "0.0.0.0",
      port: 4173,
    },

    // ---------------------------------------------------------------
    // ONNX RUNTIME (used by @imgly/background-removal)
    // ---------------------------------------------------------------
    // The library ships its own ONNX Runtime Web + WASM. If we let
    // Vite bundle them, we get four duplicate variants and a 24 MB
    // WASM in the output. Instead we:
    //   1. Exclude from optimizeDeps so dev doesn't pre-bundle it
    //   2. Externalize the WASM so the library fetches it at runtime
    //      from jsdelivr (its built-in default)
    // ---------------------------------------------------------------
    optimizeDeps: {
      exclude: ["@imgly/background-removal", "onnxruntime-web"],
    },

    worker: {
      format: "es",
      // Don't try to inline the worker — keep it as a separate file
      // so the browser can cache it independently.
      plugins: () => [react()],
    },
  };
});
