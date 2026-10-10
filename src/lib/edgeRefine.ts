function morphology(source: Uint8ClampedArray, width: number, height: number, radius: number) {
  const output = new Uint8ClampedArray(source.length)
  const expand = radius > 0
  const amount = Math.abs(Math.round(radius))
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = expand ? 0 : 255
      for (let oy = -amount; oy <= amount; oy += 1) {
        for (let ox = -amount; ox <= amount; ox += 1) {
          const sx = Math.min(width - 1, Math.max(0, x + ox))
          const sy = Math.min(height - 1, Math.max(0, y + oy))
          const alpha = source[sy * width + sx]
          value = expand ? Math.max(value, alpha) : Math.min(value, alpha)
        }
      }
      output[y * width + x] = value
    }
  }
  return output
}

export async function refineCutout(
  image: CanvasImageSource,
  width: number,
  height: number,
  feather: number,
  contractExpand: number,
  threshold: number,
) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("Canvas is unavailable in this browser.")
  context.drawImage(image, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height)
  let alpha = new Uint8ClampedArray(width * height)
  const bias = (50 - threshold) * 2.55
  for (let index = 0; index < alpha.length; index += 1) {
    alpha[index] = Math.max(0, Math.min(255, pixels.data[index * 4 + 3] + bias))
  }
  if (contractExpand !== 0) alpha = morphology(alpha, width, height, contractExpand)
  for (let index = 0; index < alpha.length; index += 1) pixels.data[index * 4 + 3] = alpha[index]
  context.clearRect(0, 0, width, height)
  context.putImageData(pixels, 0, 0)

  if (feather > 0) {
    const softened = document.createElement("canvas")
    softened.width = width
    softened.height = height
    const softContext = softened.getContext("2d")
    if (!softContext) return canvas
    softContext.filter = `blur(${feather}px)`
    softContext.drawImage(canvas, 0, 0)
    softContext.filter = "none"
    return softened
  }
  return canvas
}
