import { plugin, type BunPlugin } from "bun"

const solidClientRuntimePatch: BunPlugin = {
  name: "solid-client-runtime-patch",
  setup: (build) => {
    build.onLoad({ filter: /[\\/]node_modules[\\/]solid-js[\\/]dist[\\/]server\.js$/ }, async (args) => {
      const path = args.path.replace(/server\.js$/, "solid.js")
      const code = await Bun.file(path).text()
      return { contents: code, loader: "js" }
    })

    build.onLoad({ filter: /[\\/]node_modules[\\/]solid-js[\\/]store[\\/]dist[\\/]server\.js$/ }, async (args) => {
      const path = args.path.replace(/server\.js$/, "store.js")
      const code = await Bun.file(path).text()
      return { contents: code, loader: "js" }
    })
  },
}

plugin(solidClientRuntimePatch)
