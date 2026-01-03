import { render } from "@opentui/solid"
import { For, createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { readdir } from "node:fs/promises"
import { basename, dirname, extname, join } from "node:path"
import { ImageViewer } from "./ImageViewer"

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp", ".tiff"])

type BrowserItem =
  | { kind: "up"; path: string }
  | { kind: "dir"; path: string }
  | { kind: "file"; path: string }

function isImageFile(name: string) {
  return IMAGE_EXTENSIONS.has(extname(name).toLowerCase())
}

render(() => (
  (() => {
    const [currentDir, setCurrentDir] = createSignal(process.cwd())
    const [imagePath, setImagePath] = createSignal("./test.png")
    const [browserItems, setBrowserItems] = createSignal<Array<{ name: string; value: BrowserItem }>>([])
    const [browserLoading, setBrowserLoading] = createSignal(true)
    const [browserError, setBrowserError] = createSignal<string | null>(null)
    const [selectedIndex, setSelectedIndex] = createSignal(0)

    const selectedFileName = createMemo(() => basename(imagePath()))
    const browserStats = createMemo(() => {
      let dirs = 0
      let files = 0
      for (const item of browserItems()) {
        if (item.value.kind === "dir") dirs++
        if (item.value.kind === "file") files++
      }
      return { dirs, files }
    })

    createEffect(() => {
      const dir = currentDir()
      let cancelled = false

      setBrowserLoading(true)
      setBrowserError(null)

      ;(async () => {
        try {
          const dirents = await readdir(dir, { withFileTypes: true })
          if (cancelled) return

          const parent = dirname(dir)
          const items: Array<{ name: string; value: BrowserItem }> = []

          if (parent && parent !== dir) {
            items.push({ name: "[..]", value: { kind: "up", path: parent } })
          }

          const dirs: Array<{ name: string; value: BrowserItem }> = []
          const files: Array<{ name: string; value: BrowserItem }> = []

          for (const d of dirents) {
            if (d.name === "node_modules" || d.name === ".git") continue
            const fullPath = join(dir, d.name)

            if (d.isDirectory()) {
              dirs.push({ name: `[D] ${d.name}`, value: { kind: "dir", path: fullPath } })
              continue
            }

            if (d.isFile() && isImageFile(d.name)) {
              files.push({ name: d.name, value: { kind: "file", path: fullPath } })
            }
          }

          dirs.sort((a, b) => a.name.localeCompare(b.name))
          files.sort((a, b) => a.name.localeCompare(b.name))

          items.push(...dirs, ...files)
          setBrowserItems(items)
          setSelectedIndex(0)
          setBrowserLoading(false)
        } catch (e) {
          if (cancelled) return
          setBrowserError(e instanceof Error ? e.message : String(e))
          setBrowserLoading(false)
        }
      })()

      onCleanup(() => {
        cancelled = true
      })
    })

    return (
      <box flexDirection="row" padding={1} flexGrow={1}>
        <box flexDirection="column" width={40} flexShrink={0}>
          <text>Open an image</text>
          <text>Directory: {basename(currentDir())}</text>
          <text>{currentDir()}</text>
          <text>
            {browserStats().dirs} folders, {browserStats().files} images
          </text>
          <text>Use arrows + Enter. Select [D] to open folders.</text>
          {browserLoading() && <text>Loading files...</text>}
          {browserError() && <text>Error: {browserError()}</text>}
          <box marginTop={1} flexDirection="column">
            <For each={browserItems()}>
              {(item, index) => (
                <text>
                  {index() === selectedIndex() ? "▶ " : "  "}
                  {item.name}
                </text>
              )}
            </For>
          </box>
          <box marginTop={1} flexGrow={1}>
            <select
              focused
              showDescription={false}
              options={browserItems().map((i) => ({ name: i.name, description: "", value: i.value }))}
              selectedIndex={selectedIndex()}
              onChange={(index) => setSelectedIndex(index)}
              onSelect={(_, option) => {
                const item = option?.value as BrowserItem | undefined
                if (!item) return
                if (item.kind === "up" || item.kind === "dir") {
                  setCurrentDir(item.path)
                  return
                }
                setImagePath(item.path)
              }}
            />
          </box>
        </box>

        <box flexDirection="column" flexGrow={1} marginLeft={2}>
          <text>Selected: {selectedFileName()}</text>
          <text>{imagePath()}</text>
          <box marginTop={1}>
            <ImageViewer src={imagePath()} />
          </box>
        </box>
      </box>
    )
  })()
))
