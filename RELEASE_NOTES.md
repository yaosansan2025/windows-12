# Windows 12 concept — V1.2.0

This release adds portable workspace backups, more natural window handling, and optional PWA installation for the hosted site. Download `index.html` and double-click it for the standalone desktop; it still needs no runtime dependencies, CDN, build step, or backend.

- Settings can export and import a validated JSON backup of files, folders, Recycle Bin, to-dos, appearance, and window layout. Copilot credentials are excluded.
- Drag windows to an edge to snap or maximize them, including on touch devices. Hover over taskbar apps for a window preview.
- Hosted HTTPS builds provide a manifest, install icons, and an offline service worker. The single `index.html` file still opens locally by double-clicking.
- GitHub Pages deployment is manual until the repository owner enables Pages; this stops an unconfigured site from producing new failed runs. Cloudflare's existing Worker continues to deploy from `main`.

The BIOS/login screens and cloud, AI demo, and system integrations remain an unofficial UI concept. Login is simulated. The optional Copilot API connection remains client-side; no backend proxy is included.
