# Windows 12 concept — V1.1.0

This release makes the browser desktop useful across sessions. Download `index.html` and double-click it, or open the hosted site. The page still contains all HTML, CSS, JavaScript, icons, and wallpaper artwork in one file, with no runtime dependencies, CDN, build step, or backend.

- Open windows now restore after reload or sign-in, including position, size, minimized/maximized state, and focus.
- File Explorer supports local text-file import, folders, move, download, Recycle Bin, and restore. Notepad edits the selected file with automatic browser-local saving.
- Window switching, closing, and snap layouts have keyboard shortcuts, with alternatives for browser-reserved keys.
- The existing Cloudflare Worker deployment at `sbti.christmas/windows12/` receives the same update as GitHub Pages.

The BIOS/login screens and cloud, AI demo, and system integrations remain an unofficial UI concept. Login is simulated. The optional Copilot API connection remains client-side; this release does not add a backend proxy.
