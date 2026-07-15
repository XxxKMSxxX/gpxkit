# GPXKit

View, merge, and simplify GPS tracks — entirely in your browser. GPX files
are parsed and rendered client-side; nothing is ever uploaded.

Live at [gpxkit.com](https://gpxkit.com) (domain pending).

## Stack

- [Astro](https://astro.build) (static export) + [`@astrojs/react`](https://docs.astro.build/en/guides/integrations-guide/react/) for interactive islands
- [MapLibre GL JS](https://maplibre.org/) with [OpenFreeMap](https://openfreemap.org/) tiles (no API key, no cost)
- [`@we-gold/gpxjs`](https://github.com/We-Gold/gpxjs) for GPX parsing
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)

See `lib/engine/gpx/` for the framework-agnostic parsing/stats layer (no
React/Astro imports — enforced by ESLint) and `src/components/` for the UI.

## Commands

```sh
pnpm install
pnpm dev              # dev server at localhost:4321
pnpm build             # static build to ./dist/
pnpm lint && pnpm typecheck
pnpm test:unit          # vitest (jsdom — gpxjs needs window.DOMParser)
pnpm build && pnpm test:e2e   # playwright against the built dist/
```

## License

MIT — see [LICENSE](./LICENSE). See [CONTRIBUTING.md](./CONTRIBUTING.md) for
this project's contribution policy (open source, not open contribution).
