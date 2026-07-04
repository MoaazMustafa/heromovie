# HeroMovie

Paste a direct video link and stream it instantly — with smart chunked buffering, resumable playback, a fully custom player and a clean HeroUI interface.

Built with **Next.js (App Router)**, **HeroUI v3**, **Tailwind CSS v4** and **TypeScript**.

## Features

- **Universal link playback** — paste any direct `http(s)` video URL and hit Play.
- **Smart streaming pipeline** — HTTP Range Requests, 2 MiB chunks, adaptive look-ahead (2–6 chunks based on measured throughput), IndexedDB chunk cache with automatic eviction.
- **Long-video optimization** — for videos over 40 minutes only ~10 minutes behind the playhead are kept; older chunks are deleted and re-fetched on backward seeks.
- **Custom player** — play/pause/stop, seek bar with buffer indicator, ±10s skip, playback speed, volume/mute, captions with `.vtt` upload, Picture-in-Picture, fullscreen, double-click fullscreen, keyboard shortcuts, Media Session API.
- **Resume watching** — playback positions persist locally; a "Continue watching?" dialog offers resume or start-over.
- **History** — cards with progress, relative dates, resume and remove actions.
- **Settings** — theme (light/dark/system), autoplay, default volume/speed, subtitles, cache budget, clear history/cache.
- **Graceful degradation** — every browser API (MSE, IndexedDB, PiP, Media Session, Fullscreen) is feature-detected with fallbacks.

## Getting started

```bash
npm install
npm run dev
```

## Architecture

```
app/            Pages (home, watch, history, settings) — RSC where possible
components/     UI: player/, home/, history/, settings/, watch/
hooks/          use-video-player, use-player-shortcuts, use-media-session, …
services/       chunk-cache (IndexedDB), local-storage, streaming/
  streaming/    stream-probe, network-monitor, chunk-manager, mse-engine, stream-engine
stores/         Lightweight useSyncExternalStore stores (settings, history)
lib/            constants, format, video-url, capabilities
types/          Shared domain types
```

### How the streaming pipeline works

1. **Probe** ([services/streaming/stream-probe.ts](services/streaming/stream-probe.ts)) — a 1-byte range request detects range support, total size and content type, and classifies failures (CORS, expired link, timeout…) into friendly errors.
2. **Engine selection** ([services/streaming/stream-engine.ts](services/streaming/stream-engine.ts)) — sources whose container/codec can be appended to a `SourceBuffer` (WebM, fragmented MP4) use the chunked MSE pipeline; everything else uses native progressive playback, where the browser itself issues range requests.
3. **Chunk manager** ([services/streaming/chunk-manager.ts](services/streaming/chunk-manager.ts)) — downloads the chunk under the playhead plus an adaptive look-ahead window, deduplicates in-flight requests, retries with exponential backoff, serves cache hits from IndexedDB and evicts chunks far behind the playhead.
4. **Network monitor** ([services/streaming/network-monitor.ts](services/streaming/network-monitor.ts)) — smooths observed throughput (EMA) and sizes the look-ahead window: slow → 2 chunks, medium → 4, fast → 6.
5. **MSE engine** ([services/streaming/mse-engine.ts](services/streaming/mse-engine.ts)) — appends chunks to the `SourceBuffer` in order and drives the chunk-manager focus from `timeupdate`. If the user seeks outside the appended range (impossible for byte-range MSE without a container index), it transparently hands playback over to the native engine, preserving position.
6. **Persistence** — chunks live in IndexedDB under a global size budget with LRU eviction; positions/history in `localStorage`; active playback state in memory only.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space / K | Play / pause |
| ← / → | Seek ±10s |
| ↑ / ↓ | Volume |
| M | Mute |
| F | Fullscreen |
| P | Picture-in-Picture |
| C | Toggle captions |
| Home / End | Jump to start / end |

## License

MIT
