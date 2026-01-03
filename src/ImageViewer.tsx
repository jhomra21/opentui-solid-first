import { createEffect, createSignal, For, onCleanup, untrack } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { createJimp } from "@jimp/core"
import { defaultFormats, defaultPlugins, intToRGBA } from "jimp"
import webp from "@jimp/wasm-webp"

interface ImageViewerProps {
  src: string
  maxWidth?: number
  maxHeight?: number
}

interface PixelRow {
  y: number
  pixels: Array<{ x: number; fg: string; bg: string }>
}

const Jimp = createJimp({ formats: [...defaultFormats, webp], plugins: defaultPlugins })

function rgbToHex(r: number, g: number, b: number) {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

export function ImageViewer(props: ImageViewerProps) {
  const dimensions = useTerminalDimensions()

  const [error, setError] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [imageInfo, setImageInfo] = createSignal("")
  const [rows, setRows] = createSignal<PixelRow[]>([])

  createEffect(() => {
    const src = props.src
    let cancelled = false

    setLoading(true)
    setError(null)
    setImageInfo("")
    setRows([])

    ;(async () => {
      try {
        const image = await Jimp.read(src)
        if (cancelled) return

        const dims = untrack(() => dimensions())
        const maxW = props.maxWidth ?? Math.min(dims.width - 4, 60)
        const maxH = props.maxHeight ?? Math.min((dims.height - 6) * 2, 40)

        if (image.width > maxW || image.height > maxH) {
          image.scaleToFit({ w: maxW, h: maxH })
        }

        const imgW = image.width
        const imgH = image.height
        const termH = Math.ceil(imgH / 2)

        setImageInfo(`${imgW}x${imgH}px → ${imgW}x${termH} cells`)

        const rowData: PixelRow[] = []
        for (let y = 0; y < termH; y++) {
          const pixels: PixelRow["pixels"] = []
          for (let x = 0; x < imgW; x++) {
            const topY = y * 2
            const bottomY = topY + 1

            const { r: tr, g: tg, b: tb } = intToRGBA(image.getPixelColor(x, topY))
            let br = tr, bgG = tg, bb = tb

            if (bottomY < imgH) {
              const rgba = intToRGBA(image.getPixelColor(x, bottomY))
              br = rgba.r; bgG = rgba.g; bb = rgba.b
            }

            pixels.push({
              x,
              fg: rgbToHex(tr, tg, tb),
              bg: rgbToHex(br, bgG, bb),
            })
          }
          rowData.push({ y, pixels })
        }

        setRows(rowData)
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
      }
    })()

    onCleanup(() => {
      cancelled = true
    })
  })

  return (
    <box flexDirection="column">
      {loading() && <text>Loading image...</text>}
      {error() && <text>Error: {error()}</text>}
      {imageInfo() && <text>{imageInfo()}</text>}
      <box flexDirection="column" marginTop={1}>
        <For each={rows()}>
          {(row) => (
            <text>
              <For each={row.pixels}>
                {(p) => <span style={{ fg: p.fg, bg: p.bg }}>▀</span>}
              </For>
            </text>
          )}
        </For>
      </box>
    </box>
  )
}
