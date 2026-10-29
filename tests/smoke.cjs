/* Browser checks are development-only; index.html still runs without packages. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'win12-update-'));
for (const name of ['index.html', 'sw.js', 'manifest.webmanifest', 'pwa']) {
  fs.cpSync(path.join(root, name), path.join(fixture, name), { recursive: true });
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const updating = pathname.startsWith('/update/');
  const base = updating ? fixture : root;
  const relative = updating ? pathname.slice('/update/'.length) : pathname.slice(1);
  const target = path.resolve(base, relative.endsWith('/') || !relative ? relative + 'index.html' : relative);
  if (!target.startsWith(base + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    response.writeHead(404).end(); return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'text/plain', 'Cache-Control': 'no-store' });
  response.end(fs.readFileSync(target));
});

async function login(page, wrongPassword = false) {
  await page.locator('#skip-boot').click();
  await page.locator('#lock-screen').click();
  if (wrongPassword) {
    await page.locator('#login-password').fill('wrong');
    await page.locator('#login-password').press('Enter');
    await page.locator('#login-password[aria-invalid="true"]').waitFor();
    assert.match(await page.locator('#login-error').textContent(), /isn’t right/);
  }
  await page.locator('#login-password').fill('1234');
  await page.locator('#login-password').press('Enter');
  await page.locator('body:not(.session-locked)').waitFor();
  await page.locator('#session-shell').waitFor({ state: 'hidden' });
}
async function search(page, value) {
  await page.locator('#taskbar [aria-label="Search"]').click();
  await page.locator('#start-search').fill(value);
}
async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 }); await page.mouse.up();
}

let browser, current;
const errors = [];
function watch(page) { current = page; page.on('pageerror', error => errors.push(error.message)); }
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--disable-crash-reporter']
  });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage(); watch(page);
  await page.goto(base + '/'); await login(page, true);

  // Marquee selection, group drag, collision rejection, and persisted grid positions.
  await drag(page, { x: 3, y: 8 }, { x: 96, y: 197 });
  assert.equal(await page.locator('.desktop-icon.selected').count(), 2);
  await drag(page, { x: 50, y: 55 }, { x: 218, y: 55 });
  const shortcut = page.locator('[data-desktop-app="files"]');
  assert.equal(Math.round((await shortcut.boundingBox()).x), 180);
  assert.equal(Math.round((await page.locator('[data-desktop-app="recycle"]').boundingBox()).x), 180);
  await shortcut.click();
  await drag(page, { x: 215, y: 55 }, { x: 47, y: 235 });
  assert.equal(Math.round((await shortcut.boundingBox()).x), 180, 'Cannot overwrite another icon slot');
  await page.reload(); await login(page);
  assert.equal(Math.round((await shortcut.boundingBox()).x), 180);
  console.log('PASS desktop selection, group dragging, collisions and reload persistence');

  await search(page, 'does-not-exist');
  await page.locator('#start-search').press('Enter');
  assert.equal(await page.locator('.window').count(), 0, 'An empty search must not launch a hidden app');
  await page.locator('#start-search').press('Escape');
  assert.equal(await page.locator('#start-search').inputValue(), '');
  await page.locator('#start-search').fill('note');
  await page.locator('#start-search').press('ArrowDown');
  assert.match(await page.locator('#search-results [aria-selected="true"]').textContent(), /Notes.txt/);
  await page.locator('#start-search').press('Enter');
  await page.locator('#window-notepad').waitFor();
  const content = 'A saved note from the unified search.';
  await page.locator('.note-editor').fill(content);
  await search(page, 'visual effects');
  await page.locator('#start-search').press('Enter');
  await page.locator('#performance-mode').selectOption('low');
  await page.locator('body.low-effects').waitFor();
  assert.equal(await page.locator('.window').count(), 2);
  await page.locator('#window-settings [data-window-action="minimize"]').click();
  await page.locator('#taskbar [data-task-app="settings"]').click();
  await page.locator('#window-settings:not(.minimized)').waitFor();
  await page.locator('#window-settings [data-window-action="maximize"]').click();
  await page.locator('#window-settings.maximized').waitFor();
  await page.locator('#window-settings [data-window-action="maximize"]').click();
  await page.reload(); await login(page);
  assert.equal(await page.locator('.note-editor').inputValue(), content);
  await page.locator('body.low-effects').waitFor();
  await page.locator('#taskbar [aria-label="Start"]').click();
  assert.match(await page.locator('.recommend-grid').textContent(), /Visual effects/);
  await page.keyboard.press('Escape');
  console.log('PASS app/file/settings search, keyboard navigation, note persistence and window controls');

  // High-frequency ResizeObserver callbacks should coalesce into a final save.
  await page.evaluate(() => {
    window.workspaceWrites = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if (key === 'win12-workspace') window.workspaceWrites++; return original.call(this, key, value); };
  });
  await page.locator('#window-settings').evaluate(async element => {
    for (let i = 0; i < 15; i++) { element.style.width = `${600 + i}px`; await new Promise(requestAnimationFrame); }
  });
  await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => window.workspaceWrites < 5), 'Resize saves should be coalesced');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#backup-export').click();
  const download = await downloadPromise;
  const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  assert.equal(backup.data.preferences.performance, 'low');
  assert.equal(backup.data.desktopIcons.files.col, 2);
  assert.ok(backup.data.files.some(file => file.content === content));
  // Older version-1 backups omit the new optional fields and must remain importable.
  delete backup.data.desktopIcons; delete backup.data.preferences.performance;
  page.once('dialog', dialog=>dialog.accept());
  await Promise.all([
    page.waitForEvent('load'),
    page.locator('#backup-picker').setInputFiles({name:'previous-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))})
  ]);
  await login(page);
  assert.equal(await page.locator('.note-editor').inputValue(), content);
  assert.equal(await page.locator('#performance-mode').inputValue(), 'auto');
  console.log('PASS debounced storage, complete backup export and older backup import');

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await mobileContext.newPage(); watch(mobile);
  await mobile.goto(base + '/windows12/'); await login(mobile);
  await mobile.locator('[data-desktop-app="files"]').tap();
  await mobile.locator('#window-files').evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)));
  const bounds = await mobile.locator('#window-files').boundingBox();
  assert.ok(bounds.width >= 370 && bounds.x >= 0 && bounds.x + bounds.width <= 390);
  assert.equal(await mobile.locator('#window-files [data-window-action="maximize"]').isVisible(), false);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.locator('#window-files [data-window-action="close"]').tap();
  await mobile.locator('#taskbar [aria-label="Search"]').tap();
  await mobile.locator('#start-search').fill('notepad');
  await mobile.locator('#search-result-0').tap();
  await mobile.locator('.note-editor').fill('Mobile note');
  await mobile.locator('#window-notepad').evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)));
  await mobile.setViewportSize({ width: 390, height: 480 });
  await mobile.waitForFunction(()=>document.getElementById('window-notepad').getBoundingClientRect().bottom<=480);
  const small = await mobile.locator('#window-notepad').boundingBox();
  assert.ok(small.y + small.height <= 480, 'App stays inside the reduced viewport');
  console.log('PASS mirrored mobile site, touch launch, full-screen app and small viewport');

  // Exercise a real waiting worker, explicit activation, editor preservation, and offline reload.
  const updateContext = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  const update = await updateContext.newPage(); watch(update);
  await update.goto(base + '/update/'); await login(update);
  await update.waitForFunction(() => !!navigator.serviceWorker.controller);
  await update.locator('[data-desktop-app="notepad"]').dblclick();
  await update.locator('.note-editor').fill('Keep this note through an update.');
  await update.evaluate(() => window.updateProbe = 'still running');
  fs.appendFileSync(path.join(fixture, 'sw.js'), '\n// Browser smoke test update\n');
  const worker = fs.readFileSync(path.join(fixture, 'sw.js'), 'utf8').replace(/const CACHE = '[^']+';/, "const CACHE = 'windows-12-concept-smoke-update';");
  fs.writeFileSync(path.join(fixture, 'sw.js'), worker);
  await update.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await update.locator('#pwa-update-banner:not([hidden])').waitFor();
  assert.equal(await update.evaluate(() => window.updateProbe), 'still running');
  assert.equal(await update.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).waiting), true);
  await Promise.all([update.waitForEvent('load'), update.locator('#pwa-update').click()]);
  await login(update);
  assert.equal(await update.locator('.note-editor').inputValue(), 'Keep this note through an update.');
  await updateContext.setOffline(true);
  await update.reload(); await login(update);
  assert.equal(await update.locator('.note-editor').inputValue(), 'Keep this note through an update.');
  console.log('PASS PWA waiting update, explicit activation, saved notes and offline reload');

  if (!process.env.SMOKE_SKIP_FILE) {
    const local = await browser.newPage(); watch(local);
    await local.goto(pathToFileURL(path.join(root, 'index.html')).href); await login(local);
    await local.locator('[data-desktop-app="notepad"]').dblclick();
    await local.locator('.note-editor').fill('Standalone file works.');
    assert.equal(await local.locator('.note-editor').inputValue(), 'Standalone file works.');
    console.log('PASS double-click standalone HTML');
  } else console.log('SKIP file:// navigation (managed local Chromium policy); CI checks it with bundled Chromium');
  assert.deepEqual(errors, [], 'No uncaught JavaScript errors');
})().catch(async error => {
  console.error(error);
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
  await current?.screenshot({ path: path.join(root, 'test-results', 'failure.png') }).catch(() => {});
  process.exitCode = 1;
}).finally(async () => {
  await browser?.close(); server.close(); fs.rmSync(fixture, { recursive: true, force: true });
});
