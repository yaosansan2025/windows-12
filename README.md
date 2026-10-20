# Windows 12 concept

A responsive desktop concept with a dark wallpaper, floating taskbar, desktop apps, draggable windows, widgets, calendar, and a Copilot sidebar.

**One HTML file. The offline desktop needs no dependencies, CDN, build step, or backend.** An optional Copilot API connection needs internet access and a compatible endpoint. This is an unofficial design concept, not a Microsoft product or a real operating system.

## Run locally

Download [`index.html`](index.html) and double-click it to open it in a modern browser. All styles, scripts, icons, and wallpaper artwork are included in that file, so the desktop works offline.

The page begins with a simulated BIOS boot sequence, then opens the Windows-style lock screen. Click the lock screen or press **Enter** to reveal the sign-in form:

- **Username:** `User`
- **Password:** `1234`

Enter the password to open the desktop. An incorrect password keeps the sign-in screen open. Locking or signing out requires the password again; restarting replays the boot sequence. Files, open-window layout, and preferences remain in browser storage where available.

Single-click a desktop icon to select it, double-click to open it, drag a window by its title bar, and use its minimize, maximize, and close controls. Explore Start, Search, Widgets, Copilot, Quick Settings, and Settings from the taskbar. Click the clock for the calendar or right-click the desktop for its context menu. Press **Esc** to dismiss open panels.

File Explorer supports browser-local text files (`.txt`, `.md`, `.json`, `.csv`, `.log`). Use **Import text** to select files, **New folder** to organize them, **Download** to save a copy to your device, and Recycle Bin to restore deleted files. Notepad edits the selected file automatically. Imports are limited to 256 KB per file, 60 active files, and 1.5 million characters total. Browser storage has its own quota, so use **Download** for an independent copy of anything important. Local files never sync between devices or between different site URLs.

The desktop restores open windows, their sizes and positions, minimized/maximized state, and active window after sign-in or page reload. Keyboard shortcuts (when the browser lets the page receive them):

| Action | Shortcut |
| --- | --- |
| Open Start | `Ctrl+Space` |
| Switch windows | `Alt+Tab`, or `Ctrl+Shift+Space` |
| Close active window | `Alt+F4`, or `Ctrl+Alt+W` |
| Snap active window left/right | `Ctrl+Shift+Left/Right` |
| Maximize or restore/minimize | `Ctrl+Shift+Up/Down` |

Browsers and operating systems may reserve `Alt+Tab` and `Alt+F4`; the alternative shortcuts are provided for that reason.

## Deploy to GitHub Pages

The included [deployment workflow](.github/workflows/deploy.yml) publishes only `index.html` and runs on pushes to `main` or manually.

1. In this repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as the source. GitHub Pages availability depends on repository visibility and the account plan.
3. Push these files to `main`, or open **Actions → Deploy static site to Pages → Run workflow**.
4. After the deployment succeeds, the workflow summary links to the live website. For this repository, the default URL is `https://yaosansan2025.github.io/windows-12/`.

You can also upload `index.html` to any static website host. Serve it as the site's index document; no server runtime, environment variables, or package installation is required.

## Cloudflare deployment

The same `index.html` is deployed at [`https://sbti.christmas/windows12`](https://sbti.christmas/windows12) through the existing Cloudflare Worker named `windows-12`. The Cloudflare routes are `sbti.christmas/windows12` and `sbti.christmas/windows12/*`; the rest of `sbti.christmas` remains on the `sbti` Pages project.

The repository includes [`windows12/index.html`](windows12/index.html) as an exact copy of the original [`index.html`](index.html). Cloudflare's connected build deploys the repository as static assets, so both `/windows12` (redirecting to `/windows12/`) and `/windows12/` serve the original app. No separate client or backend is deployed. The optional Copilot API connection still requires a separately configured compatible endpoint, as described below.

Pushes to `main` trigger an automatic Cloudflare Worker deployment. When changing the app, update `index.html` and copy the same contents to `windows12/index.html` in the same commit. After the build completes, verify [`https://sbti.christmas/windows12/`](https://sbti.christmas/windows12/) and keep the Worker route patterns in place.

The Cloudflare site and the GitHub Pages site have separate browser storage because they use different origins. Files and preferences created at one URL do not automatically appear at the other.

## Connect Copilot to an LLM API

Copilot starts in **Offline demo** mode. The API key is shipped **blank**, with `your-api-key` as the input placeholder. No AI service is contacted until you apply an API connection and send a message.

The sidebar supports **OpenAI-compatible Chat Completions JSON endpoints**. The Copilot name is part of this concept's interface: a Microsoft Copilot or GitHub Copilot subscription is not a general-purpose Chat Completions API key. You can use Azure OpenAI, GitHub Models, another compatible provider, or your own server gateway. Copilot Studio/Direct Line and Microsoft 365 Copilot APIs use different authentication and conversation protocols; they need a server adapter to the contract below and cannot be pasted in as a Chat Completions endpoint.

### Configure the sidebar

1. Sign in to the desktop, open **Copilot**, and expand **Connection settings**.
2. Choose **API connection**.
3. Enter the **complete chat completions URL**, including any provider-required query parameters. A same-origin path such as `/api/copilot` also works when served by your own backend.
4. Enter the provider's model or deployment name. Leave it blank only if your gateway selects the model or the provider encodes the deployment in its URL.
5. Choose authentication:
   - **No key · server proxy**: leave the key blank; your backend supplies the upstream credential.
   - **Bearer token**: enter your provider token in the password field. Requests use `Authorization: Bearer …`.
   - **api-key header · Azure OpenAI**: enter your Azure resource key. Requests use `api-key: …`.
6. Select **Apply connection**, then send a message. The header changes from **API configured** to **API connected** only after a successful reply.

Example endpoint formats (use a model your account can access):

| Service | Full endpoint | Model | Authentication |
| --- | --- | --- | --- |
| Your server proxy | `/api/copilot` or `https://your-server.example/api/copilot` | Optional if chosen on the server | No key |
| Azure OpenAI v1 | `https://YOUR-RESOURCE.openai.azure.com/openai/v1/chat/completions` | Your deployment name | api-key header |
| GitHub Models | `https://models.github.ai/inference/chat/completions` | A catalog model ID, e.g. `openai/gpt-4.1` | Bearer token with Models read access |

Check your provider's current endpoint, permissions, model availability, and billing requirements: [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference) · [GitHub Models](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models). These services have separate access requirements from consumer Copilot products.

Settings, keys, and API conversation history stay in memory in the current tab; they are not saved to browser storage. Refreshing resets the connection. **New chat** clears the conversation, **Stop response** cancels a pending browser request, and applying a different connection starts a fresh conversation. Switching back to Offline demo clears the active key. Canceling a browser request does not guarantee the provider stops processing it.

### Hosting, keys, and CORS

For a public website, use an authenticated server proxy or serverless function that keeps the upstream key in a server environment variable and controls caller access. Leave this page's key field blank and choose **No key**. GitHub Pages serves static files only, so host that proxy separately or use a host with server functions. Never commit a real key to `index.html`; keys embedded in frontend code are visible to visitors. Entering a key in this tab is intended for personal testing with a provider that allows browser calls.

Direct API calls work only when the endpoint permits the page's origin through **CORS**, including preflight `OPTIONS`, `POST`, and the headers you use (`Content-Type`, `Authorization`, or `api-key`). Use HTTPS; HTTP is accepted only for localhost development. Opening `index.html` directly can send an origin of `null`, which many APIs reject. To preview the static page with a normal local origin, run this in the repository and open `http://localhost:8000`:

```sh
python3 -m http.server 8000
```

That preview command serves the page only; it does not create an API proxy. A relative `/api/copilot` URL requires a backend serving that route.

### API/proxy contract and troubleshooting

The client sends a JSON `POST` with a system message, up to 20 messages from successful API turns, the new user message, an optional `model`, and `stream: false`. For example:

```json
{
  "model": "your-model-name",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello" }
  ],
  "stream": false
}
```

Return a normal JSON response using this shape:

```json
{
  "choices": [
    { "message": { "role": "assistant", "content": "Hello! How can I help?" } }
  ]
}
```

Text content arrays are also supported. Replies render as plain text; HTML is never executed. SSE/streaming responses and tool calls are not supported. Redirects are rejected, browser cookies are not sent, requests time out after 45 seconds, and API failures display an error rather than an offline demo answer.

- **401/403**: check the credential, authentication header type, and access to the endpoint/model.
- **429**: check the provider's quota or rate limits and retry later.
- **Could not reach the API**: check the URL, internet connection, HTTPS, and the endpoint's CORS settings.
- **Invalid JSON / no assistant text**: verify the endpoint returns the non-streaming response format above.

## Demo behavior

- Boot and sign-in are client-side demonstrations, not real firmware or authentication. The demo password is included in the HTML source; it does not protect files or accounts. Signing in makes no network request and requires no backend.
- The clock and calendar use the browser's local date and time.
- Battery percentage and charging status use the browser's Battery Status API and update as the device reports changes. The indicator is hidden when the API is unsupported, blocked, or provides no usable reading. It also hides the ambiguous full/plugged-in fallback commonly reported by battery-free desktops until a real battery change is observed; a fully charged laptop can initially be hidden for the same reason. Once a battery is detected, it stays visible when fully charged during that page session. Browser and device support varies; Safari does not expose this API.
- Preferences, text files, and window layout use browser storage where available; storage behavior can vary when opening a local file.
- Copilot uses local scripted replies by default. In API mode it sends chat messages and the required credential to your configured endpoint; no key or live service connection is included in this repository.
- Weather, news, cloud sync, device continuity, biometric login, and system controls are illustrative UI. They do not access accounts or change operating-system settings.
- External links in the browser demo require an internet connection.

The source is organized into commented CSS and JavaScript sections inside `index.html`. Reduced-motion preferences are respected.
