import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
  untrack,
} from "solid-js";
import { useTerminalDimensions } from "@opentui/solid";
import { createJimp } from "@jimp/core";
import { defaultFormats, defaultPlugins, intToRGBA } from "jimp";
import webp from "@jimp/wasm-webp";

const Jimp = createJimp({
  formats: [...defaultFormats, webp],
  plugins: defaultPlugins,
});

interface ImageViewerProps {
  src: string;
  maxWidth?: number;
  maxHeight?: number;
}

interface PixelRow {
  y: number;
  pixels: Array<{ x: number; fg: string; bg: string }>;
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function ImageViewer(props: ImageViewerProps) {
  const dimensions = useTerminalDimensions();

  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [imageInfo, setImageInfo] = createSignal("");
  const [rows, setRows] = createSignal<PixelRow[]>([]);

  createEffect(() => {
    const src = props.src;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setImageInfo("");
    setRows([]);

    (async () => {
      try {
        const image = await Jimp.read(src);
        if (cancelled) return;

        const originalW = image.width;
        const originalH = image.height;

        const dims = untrack(() => dimensions());
        // Use available terminal space, accounting for left panel (40 cols + 2 margin + 1 padding)
        const availableW = props.maxWidth ?? dims.width - 45;
        // Each terminal row shows 2 pixel rows via half-blocks, account for header text
        const availableH = props.maxHeight ?? (dims.height - 4) * 2;

        const targetW = Math.max(1, availableW);
        const targetH = Math.max(1, availableH);

        if (image.width > targetW || image.height > targetH) {
          image.scaleToFit({ w: targetW, h: targetH });
        }

        const imgW = image.width;
        const imgH = image.height;
        const termH = Math.ceil(imgH / 2);

        const scaled = imgW !== originalW || imgH !== originalH;
        setImageInfo(
          scaled
            ? `${originalW}x${originalH}px → ${imgW}x${termH} cells`
            : `${imgW}x${termH} cells`,
        );

        const rowData: PixelRow[] = [];
        for (let y = 0; y < termH; y++) {
          const pixels: PixelRow["pixels"] = [];
          for (let x = 0; x < imgW; x++) {
            const topY = y * 2;
            const bottomY = topY + 1;

            const {
              r: tr,
              g: tg,
              b: tb,
            } = intToRGBA(image.getPixelColor(x, topY));
            let br = tr,
              bg = tg,
              bb = tb;

            if (bottomY < imgH) {
              const rgba = intToRGBA(image.getPixelColor(x, bottomY));
              br = rgba.r;
              bg = rgba.g;
              bb = rgba.b;
            }

            pixels.push({
              x,
              fg: rgbToHex(tr, tg, tb),
              bg: rgbToHex(br, bg, bb),
            });
          }
          rowData.push({ y, pixels });
        }

        setRows(rowData);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    })();

    onCleanup(() => {
      cancelled = true;
    });
  });

  return (
    <box flexDirection="column">
      <Show when={loading()}>
        <text>Loading image...</text>
      </Show>
      <Show when={error()}>
        <text>Error: {error()}</text>
      </Show>
      <Show when={imageInfo()}>
        <text>{imageInfo()}</text>
      </Show>
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
  );
}
