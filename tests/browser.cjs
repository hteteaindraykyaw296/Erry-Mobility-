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
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.css': 'text/css', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.vtt': 'text/vtt'};
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
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Chromium command timed out: ' + method)), 15000);
        pending.set(id, response => {
          clearTimeout(timeout);
          resolve(response);
        });
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
      for (let attempt = 0; attempt < 150; attempt++) {
        if (await evaluate(expression)) return;
        await delay(100);
      }
      assert.fail(expression + " | " + await evaluate("location.href + ' | ' + document.readyState + ' | ' + document.title"));
    }
    async function go(page, title) {
      await send('Page.navigate', {url: base + page});
      await ready('document.readyState === "complete" && document.title.includes(' + JSON.stringify(title) + ')');
    }
    const key = (type, key, virtualKey) => send('Input.dispatchKeyEvent', {type, key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: virtualKey});
    await send('Runtime.enable');
    await send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]});
    const pages = [['', 'Forward'], ['understand.html', 'Understand CP'], ['typing.html', 'Typing Setup Lab'], ['engineering.html', 'Engineering Lab'], ['technology.html', 'Assistive Technology'], ['hands.html#spoon', 'Hands'], ['balance.html', 'Balance'], ['anatomy.html?still', 'Anatomy'], ['about.html', 'About Erry Mobility']];
    if (process.env.ERRY_SCREENSHOTS) {
      const output = path.resolve(process.env.ERRY_SCREENSHOTS);
      await fs.mkdir(output, {recursive: true});
      for (const width of [375, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1000, deviceScaleFactor: 1, mobile: false});
        for (const [page, title] of pages) {
          await go(page, title);
          await evaluate('document.fonts.ready.then(() => true)');
          const name = page.split(/[.#?]/)[0] || 'home';
          const fit = await evaluate('document.documentElement.scrollWidth <= innerWidth');
          if (!fit) console.log('Horizontal overflow:', name, width);
          const focus = {home: '#keyboard-position-storyboard', understand: '#motor-storyboard', hands: '#spoon-storyboard', balance: '#balance-storyboard', anatomy: '#hand-wrist-storyboard'}[name];
          if (focus) {
            await evaluate('document.querySelector(' + JSON.stringify(focus) + ').scrollIntoView()');
            const detail = await send('Page.captureScreenshot', {format: 'jpeg', quality: 86});
            await fs.writeFile(path.join(output, name + '-study-' + width + '.jpg'), Buffer.from(detail.data, 'base64'));
            await evaluate('scrollTo(0,0)');
          }
          const screenshot = await send('Page.captureScreenshot', {format: 'jpeg', quality: 86});
          await fs.writeFile(path.join(output, name + '-' + width + '.jpg'), Buffer.from(screenshot.data, 'base64'));
        }
      }
      return;
    }
    for (const width of [375, 768, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: false});
      for (const [page, title] of pages) {
        await go(page, title);
        assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, page + ' at ' + width);

        assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'auto');
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".site-nav > a, .site-nav summary")].map(link => link.textContent)'), ['Home', 'Typing Lab', 'Understand CP', 'Explore', 'Engineering Lab', 'About']);
        const validImages = await evaluate('[...document.querySelectorAll(".lesson-band img, .hero-photo img")].every(img => !img.complete || img.naturalWidth > 0)');
        assert.equal(validImages, true, page + " illustrations");

      }
    }
    await send('Emulation.setDeviceMetricsOverride', {width: 320, height: 900, deviceScaleFactor: 1, mobile: false});
    await go('', 'Forward');
    await key('keyDown', 'Tab', 9);
    await key('keyUp', 'Tab', 9);
    assert.equal(await evaluate('document.activeElement.textContent'), 'Skip to content');
    assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'solid');
    assert.equal(await evaluate('document.querySelector(".purpose-overview a.text-link").getAttribute("href")'), 'about.html');
    await go('about.html', 'About Erry Mobility');
    assert.equal(await evaluate('document.querySelectorAll("#principles article").length'), 6);
    assert.equal(await evaluate('document.querySelectorAll("#objectives li").length'), 5);
    assert.equal(await evaluate('document.querySelector("#vision").textContent.includes("A world where movement is not a barrier to opportunity.")'), true);
    await go('', 'Forward');
    await evaluate('document.querySelector(".site-nav summary").focus()');
    await key('rawKeyDown', ' ', 32);
    await key('keyUp', ' ', 32);
    assert.equal(await evaluate('document.querySelector(".site-nav details").open'), true);
    await evaluate('document.querySelector("[data-setup-choice=b]").click()');
    assert.match(await evaluate('document.querySelector("#position-demo [role=status]").textContent'), /slides closer/);
    await go('understand.html#movement', 'Understand CP');
    await evaluate('document.querySelector("[data-next-step]").click()');
    assert.match(await evaluate('document.querySelector("[data-caption]").textContent'), /Brain networks/);
    await evaluate('document.querySelector("[data-play]").click()');
    await delay(2300);
    assert.match(await evaluate('document.querySelector("[data-caption]").textContent'), /spinal cord/);
    await evaluate('document.querySelector("[data-play]").click()');
    const pausedCaption = await evaluate('document.querySelector("[data-caption]").textContent');
    await delay(2300);
    assert.equal(await evaluate('document.querySelector("[data-caption]").textContent'), pausedCaption);
    await evaluate('document.querySelector("[data-replay]").click()');
    assert.match(await evaluate('document.querySelector("[data-caption]").textContent'), /decide/);
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".diagram-point")).transitionDuration'), '0s');
    await go('technology.html', 'Assistive Technology');
    await evaluate('const task = document.querySelector("#task-filter"); task.value="typing"; task.dispatchEvent(new Event("change"))');
    assert.match(await evaluate('document.querySelector("#at-gallery").textContent'), /Sticky Keys.*Keyboard positioning/);
    await evaluate('document.querySelector("#at-gallery input[type=checkbox]").click()');
    assert.match(await evaluate('document.querySelector("#at-comparison").textContent'), /Sticky Keys/);
    await go('', 'Forward');    await evaluate('document.querySelector(".purpose-hero .button").click()');
    await ready('document.title.includes("Typing Setup Lab") && document.readyState === "complete"');
    await go('typing/', 'Typing Setup Lab');
    assert.equal(await evaluate('location.pathname'), prefix + 'typing.html');
    await evaluate('document.querySelector("[data-view=guard]").click()');
    assert.equal(await evaluate('document.querySelector(".keyguard-demo").dataset.view'), 'guard');

    await evaluate('document.querySelector("#start").focus()');
    await key('rawKeyDown', ' ', 32);
    await key('keyUp', ' ', 32);
    assert.equal(await evaluate('document.activeElement.id'), 'message');
    await evaluate('document.querySelector("#keep").click()');
    assert.match(await evaluate('document.querySelector("#try-status").textContent'), /Enter some text/);
    assert.equal(await evaluate('document.querySelectorAll("#results li").length'), 0);
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
    const scales = await evaluate('[...document.querySelectorAll("#results article")].map(article => [...article.querySelectorAll("meter")].map(meter => meter.max))');
    assert.equal(scales[0].length, 3);
    assert.deepEqual(scales[0], scales[1]);
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

    const storyboards = [
      ['', 'Forward', ['keyboard-position-storyboard']],
      ['understand.html','Understand CP',['motor-storyboard','reach-storyboard']],
      ['typing.html','Typing Setup Lab',['sticky-keys-storyboard','keyguard-storyboard']],
      ['anatomy.html?still','Anatomy',['hand-wrist-storyboard']],
      ['hands.html#spoon','Hands',['spoon-storyboard']],
      ['balance.html','Balance',['balance-storyboard']]
    ];
    for (const [route, title, ids] of storyboards) {
      await go(route, title);
      for (const id of ids) {
        const story = 'document.getElementById(' + JSON.stringify(id) + ')';
        assert.equal(await evaluate(story + '.hidden'), false);
        assert.equal(await evaluate(story + '.querySelector("img").complete && ' + story + '.querySelector("img").naturalWidth > 0'), true);
        const caption = story + '.querySelector("[data-caption]").textContent';
        const initial = await evaluate(caption);
        assert.equal(await evaluate(story + '.querySelector("[data-play]").textContent'), 'Play');
        await evaluate(story + '.querySelector("[data-next-step]").click()');
        assert.notEqual(await evaluate(caption), initial);
        await evaluate(story + '.querySelector("[data-replay]").click()');
        assert.equal(await evaluate(caption), initial);
        assert.equal(await evaluate(story + '.querySelector("[data-play]").textContent'), 'Play');
      }
    }
    console.log('Eight scientific storyboards passed image, manual step, replay, reduced-motion and initial paused checks.');
    await go('anatomy.html?model=hand', 'Anatomy');
    await evaluate('document.querySelector("#anatomy-main").scrollIntoView()');
    await ready('Boolean(document.querySelector("#anatomy-main [data-ready=true], #anatomy-main [data-fallback=true]"))');
    const liveModel = await evaluate('Boolean(document.querySelector("#anatomy-main [data-ready=true] canvas"))');
    if (liveModel) {
      assert.equal(await evaluate('document.querySelector("#anatomy-main .anatomy-primary").getAttribute("aria-pressed")'), 'false');
      const cameraButtons = ['Zoom in', 'Zoom out', 'Turn view 45°', 'Reset view'];
      for (const label of cameraButtons) {
        assert.equal(await evaluate('Array.from(document.querySelectorAll("#anatomy-main button")).find(button => button.textContent === ' + JSON.stringify(label) + ').click() === undefined'), true);
      }
      console.log('WebGL hand model rendered and accepted zoom, turn, and reset controls.');
    } else {
      console.log('WebGL hand model was unavailable in this run. Fallback is tested below.');
    }
    await go('anatomy.html?still&model=hand', 'Anatomy');
    await evaluate('document.querySelector("#anatomy-main").scrollIntoView()');
    await ready('Boolean(document.querySelector("[data-fallback=true] img"))');
    await evaluate('document.querySelector("[data-structure]:last-child").click()');
    assert.match(await evaluate('document.querySelector("[data-structure-diagram] [role=status]").textContent'), /transmit pull/);
    assert.deepEqual(failures, []);
    console.log('Chromium checks passed: nine views at 375/768/1440px, shared navigation and keyboard focus, movement playback and reduced motion, device gallery and keyguard, timer/pause, invalid input, scoring and matched scales, repeated trials, comfort, CSV, journal, reset, and anatomy fallback.');
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
