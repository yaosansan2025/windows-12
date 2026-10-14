# Windows 12 concept

A responsive desktop concept with a dark wallpaper, floating taskbar, desktop apps, draggable windows, widgets, calendar, and a Copilot sidebar.

**One HTML file. No dependencies, CDN, build step, or backend.** This is an unofficial design concept, not a Microsoft product or a real operating system.

## Run locally

Download [`index.html`](index.html) and double-click it to open it in a modern browser. All styles, scripts, icons, and wallpaper artwork are included in that file, so the desktop works offline.

The page begins with a simulated BIOS boot sequence, then opens the Windows-style lock screen. Click the lock screen or press **Enter** to reveal the sign-in form:

- **Username:** `User`
- **Password:** `1234`

Enter the password to open the desktop. An incorrect password keeps the sign-in screen open. Locking or signing out requires the password again; restarting replays the boot sequence. Saved notes and preferences remain in browser storage where available.

Single-click a desktop icon to select it, double-click to open it, drag a window by its title bar, and use its minimize, maximize, and close controls. Explore Start, Search, Widgets, Copilot, Quick Settings, and Settings from the taskbar. Click the clock for the calendar or right-click the desktop for its context menu. Press **Esc** to dismiss open panels.

## Deploy to GitHub Pages

The included [deployment workflow](.github/workflows/deploy.yml) publishes only `index.html` and runs on pushes to `main` or manually.

1. In this repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as the source. GitHub Pages availability depends on repository visibility and the account plan.
3. Push these files to `main`, or open **Actions → Deploy static site to Pages → Run workflow**.
4. After the deployment succeeds, the workflow summary links to the live website. For this repository, the default URL is `https://yaosansan2025.github.io/windows-12/`.

You can also upload `index.html` to any static website host. Serve it as the site's index document; no server runtime, environment variables, or package installation is required.

## Demo behavior

- Boot and sign-in are client-side demonstrations, not real firmware or authentication. The demo password is included in the HTML source; it does not protect files or accounts. Signing in makes no network request and requires no backend.
- The clock and calendar use the browser's local date and time.
- Preferences and editable demo content use browser storage where available; storage behavior can vary when opening a local file.
- Copilot replies are local scripted demo responses, not a connected AI service.
- Weather, news, cloud sync, device continuity, biometric login, and system controls are illustrative UI. They do not access accounts or change operating-system settings.
- External links in the browser demo require an internet connection.

The source is organized into commented CSS and JavaScript sections inside `index.html`. Reduced-motion preferences are respected.
