# TagStack (Nuxt 4 + Electron)

Desktop app for browsing and tagging local image collections. This directory is the in-progress **port of the original Nuxt 3 app (`../electron`) to Nuxt 4**, rebuilt on a hardened Electron foundation rather than migrated file-by-file.

**Current state:** the foundation only — the app boots, opens a folder via the native dialog, and displays the image files in it. The tagging/SQLite layer from the original app is not ported yet (see [Roadmap](#roadmap)).

## Quickstart

```bash
npm install
npm run dev        # dev server + Electron window, with HMR
npm run generate   # production build → .output/public (static SPA)
npx electron .     # run the production build unpackaged (after generate)
npm run package    # generate + electron-builder → release/<version>/
```

> **Use `generate`, not `build`, for production.** `nuxt build` emits a Nitro `node-server` bundle with no `index.html`, which the Electron main process cannot `loadFile()`. `nuxt generate` emits the static SPA shell with relative asset paths that work over `file://`.

## Running & packaging the production build

`.output/public` is not a website — the app needs `window.api` (from the preload) and the `app-media://` protocol, which only exist inside Electron. Serving it over HTTP (`npx serve .output/public`) or opening it in a browser will never work. The two ways to run it:

```bash
npm run generate && npx electron .   # unpackaged: Electron loads .output/public over file://
npm run package                      # packaged: NSIS installer + portable exe
```

`npm run package` output (config lives in `electron-builder.yml`):

```
release/<version>/
  TagStack Setup <version>.exe    # NSIS installer
  win-unpacked/TagStack.exe       # portable build — run directly
```

Packaging rules, all learned the hard way:

- **Keep `"dependencies"` empty.** Main and preload are fully bundled by vite-plugin-electron and the renderer is static, so nothing under `node_modules` is needed at runtime. electron-builder packs everything listed in `"dependencies"` (its dependency walker ignores `files` negations) — a single package there balloons `app.asar` from ~0.2 MB to over a gigabyte. All packages belong in `"devDependencies"`.
- **Never run `electron-builder` without this repo's config.** Its default output directory is `dist/`, and Nuxt creates a `dist` junction pointing into `.output/public` — a default run therefore writes the packaged app *into the renderer's own static output*, and every subsequent build recursively bundles the previous one. `electron-builder.yml` pins output to `release/`.
- **Known quirk:** the packaged window's address bar shows a doubled path after launch. Nuxt's no-`pages/` router shim rewrites the URL with `history.replaceState(joinURL('./', absolutePath))` after hydration. It is cosmetic — mount, preload, and styles are verified working — but a manual reload (Ctrl+R) of the rewritten URL fails. The proper fix is hash routing (`router.options.hashMode: true`) once a `pages/` directory is introduced.

### Troubleshooting

- **Electron exits instantly**, or crashes with `Cannot read properties of undefined (reading 'registerSchemesAsPrivileged')`: the `ELECTRON_RUN_AS_NODE` env var is set (some editor-integrated terminals leak it into child processes), which turns the Electron binary into plain Node. Clear it and relaunch.

## Project structure

```
electron/            Electron main-process code (privileged side)
  main.ts            Window creation, app lifecycle
  protocol.ts        app-media:// custom protocol (serves image bytes)
  ipc/files.ts       Folder dialog + directory listing + granted-roots allowlist
  preload.ts         contextBridge: maps the shared contract onto ipcRenderer.invoke
shared/              Code visible to BOTH processes — must never import from electron/
  ipc.ts             Single source of truth: IPC channel names, types, toMediaUrl()
  types/electron.d.ts  window.api global typing
app/                 Nuxt 4 renderer (untrusted side)
  app.vue            Root view: open folder → thumbnail list
  composables/useElectronApi.ts  Null-safe access to window.api
  components/ui/     shadcn-vue (reka-ui) components
```

There is deliberately **no `server/` directory**: Nitro server routes do not exist in a packaged Electron app (the production build is static), so all native work lives in the main process behind IPC. Don't add `/api` routes — they will work in dev and silently 404 in production.

## Architecture

Three processes, standard Electron security posture (`sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`):

```
renderer (app/)          preload                 main (electron/)
window.api.method() ──► ipcRenderer.invoke ──► ipcMain.handle
                                                 │ validates input, does fs work
<img src="app-media://local/…"> ─────────────► protocol.handle('app-media')
                                                 │ allowlist check → streams file
```

- **The IPC contract lives in `shared/ipc.ts`** — channel name constants plus the `ElectronApi` interface. Preload's implementation is typed against the interface, so adding a contract method without wiring it is a compile error. Dependencies flow `electron → shared` only; importing anything from `electron/` inside `shared/` will bundle main-process code into the preload/renderer and break it at runtime.
- **Granted-roots allowlist** (`electron/ipc/files.ts`): the main process only reads directories the user actually picked in the native dialog. Every IPC handler treats renderer input as untrusted (`unknown` + runtime checks), because with a sandboxed renderer the TypeScript types are a convenience, not a boundary.
- **Images render via the `app-media://` custom protocol**, not raw file paths and not `webSecurity: false` (which is how the original app did it — that setting lets the page read the entire disk and is the main thing this port removes). The protocol handler enforces the same allowlist, so even injected markup can only read files under folders the user opened.

### `app-media://` URL format

The scheme is registered `standard: true`, so Chromium parses it with `http://` rules — **the segment after `//` must be a valid host**. `toMediaUrl()` therefore emits a dummy host and per-segment-encoded path:

```
C:\Users\me\Pictures\cat (2).png
→ app-media://local/C%3A/Users/me/Pictures/cat%20(2).png
```

Encoding the whole path as one slash-free component (`app-media:///C%3A%5C…`) makes Chromium treat it as a hostname and reject the URL before the handler ever runs — the image just silently doesn't load. Always build these URLs with `toMediaUrl()`.

## The nuxt-electron dev/prod split

`nuxt-electron`'s default options (`ssr: false`, `app.baseURL: './'`, hash routing) are required for the packaged app to load over `file://`, but the relative `baseURL` **breaks the Nuxt 4 dev server** — every request returns "Not Found". Hence in `nuxt.config.ts`:

```ts
electron: {
    ...
    disableDefaultOptions: process.env.NODE_ENV === 'development'
}
```

Defaults off in dev (normal dev server), on for `generate` (file://-compatible output). See [nuxt-electron#110](https://github.com/caoxiemeihao/nuxt-electron/issues/110#issuecomment-3172476435). Symptoms if this regresses: dev shows "Not Found" → defaults leaked into dev; packaged app is blank/unstyled with `/_nuxt/...` 404s → defaults missing from the production build.

## Roadmap

Rough priority order, informed by what exists in the original app:

1. **Hardening** — CSP, `setWindowOpenHandler`, `will-navigate` guard; size window from `screen.workAreaSize`.
2. **SQLite persistence** (the bulk of the port): `tags` / `aliases` / `entries` / `fields` schema in `userData`. Expose **narrow IPC methods** (`tags:list`, `entries:set-tag`, …) — not the original app's generic `sqlite-operations` SQL pass-through, which let the renderer run arbitrary SQL.
3. **Tagging UI** — tag creation form, tag manager palette, applied-tag chips.
4. **Recent directories** — persisted MRU list; when reopening a recent folder, main re-adds it to the granted roots itself.

## Stack

Nuxt 4 · Vue 3 · Electron (via `nuxt-electron` / `vite-plugin-electron`) · electron-builder · Tailwind CSS v4 · shadcn-nuxt / reka-ui · TypeScript
