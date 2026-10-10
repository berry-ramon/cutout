import type { CutoutItem } from "../types/cutout";

const ACCEPTED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
  "image/heic",
  "image/heif",
];

function isHeic(file: File) {
  return (
    /hei[cf]$/i.test(file.name) ||
    ["image/heic", "image/heif"].includes(file.type)
  );
}

function readWithFileReader(file: File) {
  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`${file.name} could not be read.`));
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error(`${file.name} could not be read.`));
        return;
      }
      resolve(new Blob([reader.result], { type: file.type }));
    };
    reader.readAsArrayBuffer(file);
  });
}

async function decodeHeic(file: File): Promise<Blob> {
  try {
    const module = await import("heic2any");
    const converted = await module.default({
      blob: file,
      toType: "image/jpeg",
      quality: 0.94,
    });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch {
    throw new Error(
      "This HEIC file could not be decoded. Try exporting it as a PNG or JPG.",
    );
  }
}

async function downscale(blob: Blob, bitmap: ImageBitmap) {
  const scale = Math.min(1, 6000 / Math.max(bitmap.width, bitmap.height));
  if (scale === 1)
    return {
      blob,
      width: bitmap.width,
      height: bitmap.height,
      downscaled: false,
    };
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Your browser could not prepare this large image.");
  context.drawImage(bitmap, 0, 0, width, height);
  const result = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: 0.94,
  });
  return { blob: result, width, height, downscaled: true };
}

export async function readImageFile(file: File): Promise<CutoutItem> {
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) {
    throw new Error(
      "GIF isn't supported. Only the first frame would be processed - use a PNG or JPG instead.",
    );
  }
  const typeAccepted =
    ACCEPTED.includes(file.type) ||
    /\.(png|jpe?g|webp|bmp|hei[cf])$/i.test(file.name);
  if (!typeAccepted)
    throw new Error(`${file.name} isn't a supported image format.`);

  const decoded = isHeic(file)
    ? await decodeHeic(file)
    : await readWithFileReader(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(decoded);
  } catch {
    throw new Error(`${file.name} appears to be corrupt or unreadable.`);
  }
  const prepared = await downscale(decoded, bitmap);
  bitmap.close();
  return {
    id: crypto.randomUUID(),
    name: file.name.replace(/\.[^.]+$/, ""),
    file: prepared.blob,
    originalUrl: URL.createObjectURL(prepared.blob),
    width: prepared.width,
    height: prepared.height,
    size: file.size,
    status: "queued",
    downscaled: prepared.downscaled,
  };
}

export async function fileFromUrl(url: string) {
  let response: Response;
  try {
    response = await fetch(url, { mode: "cors" });
  } catch {
    throw new Error(
      "That image couldn't be fetched. The site may not allow cross-origin access.",
    );
  }
  if (!response.ok)
    throw new Error(`The image request failed (${response.status}).`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/"))
    throw new Error("That URL doesn't point to a supported image.");
  const pathName = new URL(url).pathname.split("/").pop() || "web-image";
  return new File([blob], pathName, { type: blob.type });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
