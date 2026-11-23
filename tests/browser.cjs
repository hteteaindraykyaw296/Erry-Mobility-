// Run with node tests/browser.cjs and set ERRY_CHROME to the Chromium executable.
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {setTimeout: delay} = require('node:timers/promises');

const root = path.resolve(__dirname, '..');
const prefix = '/Erry-Mobility-/';
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.css': 'text/css', '.woff2': 'font/woff2'};
const server = http.createServer(async (request, response) => {
  const route = new URL(request.url, 'http://localhost').pathname;
  if (!route.startsWith(prefix)) return response.writeHead(404).end();
  const name = route.slice(prefix.length);
  const file = path.resolve(root, name.endsWith('/') || !name ? name + 'index.html' : name);
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try {
    const body = await fs.readFile(file);
    response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'}).end(body);
  } catch {
    response.writeHead(404).end();
  }
});

async function run() {
  assert.ok(process.env.ERRY_CHROME, 'Set ERRY_CHROME to a Chromium executable');
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'erry-chrome-'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + prefix;
  const browser = spawn(process.env.ERRY_CHROME, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], {stdio: 'ignore'});
  browser.on('error', error => { console.error(error); });
  let socket;
  try {
    let port;
    for (let attempt = 0; attempt < 100 && !port; attempt++) {
      try { [port] = (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n'); }
      catch { await delay(100); }
    }
    assert.ok(port, 'Chromium remote debugging did not start');
    const [target] = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, {once: true});
      socket.addEventListener('error', reject, {once: true});
    });
    let nextId = 0;
    const pending = new Map();
    const failures = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text + ' ' + message.params.exceptionDetails.exception?.description);
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    });
    async function send(method, params = {}) {
      const id = ++nextId;
      const result = await new Promise(resolve => {
        pending.set(id, resolve);
        socket.send(JSON.stringify({id, method, params}));
      });
      assert.ok(!result.error, JSON.stringify(result.error));
      return result.result;
    }
    async function evaluate(expression) {
      const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
      return result.result.value;
    }
    async function ready(expression) {
      for (let attempt = 0; attempt < 60; attempt++) {
        if (await evaluate(expression)) return;
        await delay(100);
      }
      assert.fail(expression);
    }
    async function go(page, title) {
      await send('Page.navigate', {url: base + page});
      await ready('document.readyState === "complete" && document.title.includes(' + JSON.stringify(title) + ')');
    }
    const key = (type, key, virtualKey) => send('Input.dispatchKeyEvent', {type, key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: virtualKey});
    await send('Runtime.enable');
    await send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]});
    for (const width of [320, 768, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: false});
      for (const [page, title] of [['', 'Forward'], ['typing.html', 'Typing Setup Lab'], ['engineering.html', 'Engineering Lab']]) {
        await go(page, title);
        assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, page + ' at ' + width);
        assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'auto');
      }
    }
    await send('Emulation.setDeviceMetricsOverride', {width: 320, height: 900, deviceScaleFactor: 1, mobile: false});
    await go('', 'Forward');
    await key('keyDown', 'Tab', 9);
    await key('keyUp', 'Tab', 9);
    assert.equal(await evaluate('document.activeElement.textContent'), 'Skip to content');
    assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'solid');
    await evaluate('document.querySelector(".home-menu").click()');
    assert.equal(await evaluate('document.querySelector(".home-menu").getAttribute("aria-expanded")'), 'true');
    await evaluate('document.querySelector(".purpose-hero .button").click()');
    await ready('document.title.includes("Typing Setup Lab") && document.readyState === "complete"');
    await go('typing/', 'Typing Setup Lab');
    assert.equal(await evaluate('location.pathname'), prefix + 'typing.html');
    await evaluate('document.querySelector("[data-view=guard]").click()');
    assert.equal(await evaluate('document.querySelector(".keyguard-demo").dataset.view'), 'guard');

    await evaluate('document.querySelector("#start").focus()');
    await key('rawKeyDown', ' ', 32);
    await key('keyUp', ' ', 32);
    assert.equal(await evaluate('document.activeElement.id'), 'message');
    await send('Input.insertText', {text: 'meet me at noonx'});
    await key('keyDown', 'Backspace', 8);
    await key('keyUp', 'Backspace', 8);
    await evaluate('document.querySelector("#pause").click()');
    assert.equal(await evaluate('document.querySelector("#message").disabled'), true);
    await delay(1050);
    await evaluate('document.querySelector("#pause").click(); document.querySelector("#keep").click()');
    const first = await evaluate('document.querySelector("#results li").textContent');
    assert.match(first, /0 final text errors · 1 correction actions/);
    assert.ok(Number(first.match(/([\d.]+) s/)[1]) < 1.05, first);

    await evaluate('document.querySelector("[data-mode=adapted]").click(); document.querySelector("#adaptation").value="onscreen"; document.querySelector("#adaptation").dispatchEvent(new Event("change")); document.querySelector("#start").click()');
    assert.equal(await evaluate('document.querySelector("#keyboard").classList.contains("large-lab-keys")'), true);
    await evaluate('Array.from("meet me at non").forEach(letter => [...document.querySelector("#keyboard").children].find(button => button.textContent === (letter === " " ? "Space" : letter)).click()); document.querySelector("#keep").click()');
    assert.match(await evaluate('document.querySelector("#results article:nth-child(2)").textContent'), /1 final text errors/);
    await evaluate('document.querySelector("#comfort").value="4"; document.querySelector("#comfort").dispatchEvent(new Event("change")); document.querySelector("[name=preference][value=\\"Setup B\\"]").click()');
    await evaluate('document.querySelector("#start").click(); document.querySelector("#skip").click()');
    assert.equal(await evaluate('document.querySelectorAll("#results li").length'), 2);
    await evaluate('document.querySelector("#start").click()');
    await send('Input.insertText', {text: 'meet me at noon'});
    await evaluate('document.querySelector("#keep").click()');
    assert.equal(await evaluate('document.querySelectorAll("#results li").length'), 3);
    await evaluate('document.querySelector("#save-form button").click()');
    assert.match(await evaluate('localStorage.getItem("eri-mobility-journal-v1")'), /Trial 3/);
    assert.doesNotMatch(await evaluate('localStorage.getItem("eri-mobility-journal-v1")'), /meet me at noon/);
    await send('Browser.setDownloadBehavior', {behavior: 'allow', downloadPath: profile});
    await evaluate('document.querySelector("#export").click()');
    const exported = path.join(profile, 'erry-mobility-typing-trials.csv');
    let csv;
    for (let attempt = 0; attempt < 40 && !csv; attempt++) {
      try { csv = await fs.readFile(exported, 'utf8'); }
      catch { await delay(50); }
    }
    assert.ok(csv);
    assert.equal(csv.trim().split('\r\n').length, 4);
    assert.match(csv, /"4","Setup B"/);
    await evaluate('document.querySelector("#restart").click()');
    assert.equal(await evaluate('document.querySelectorAll("#results li").length'), 0);
    await go('journal.html', 'Journal');
    assert.match(await evaluate('document.querySelector("#typing-discoveries").textContent'), /Trial 3.*final text errors/);
    await go('hands.html#spoon', 'Hands');
    assert.equal(await evaluate('document.querySelector("#spoon-mechanism").open'), true);
    await go('balance.html#bus-access', 'Balance');
    assert.match(await evaluate('document.querySelector("#lesson-content h2").textContent'), /Bus journeys/);
    await evaluate('document.querySelector("#access").click()');
    assert.equal(await evaluate('document.body.classList.contains("large")'), true);
    await go('anatomy.html?still&model=hand', 'Anatomy');
    await ready('Boolean(document.querySelector("[data-fallback=true] img"))');
    assert.deepEqual(failures, []);
    console.log('Chromium checks passed: routes, 320/768/1440px fit, keyboard focus, reduced motion, keyguard, timer/pause, scoring, repeated trials, comfort, CSV, journal, reset, lessons, and 3D fallback.');
  } finally {
    socket?.close();
    browser.kill();
    server.close();
    await fs.rm(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 200}).catch(() => {});
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
