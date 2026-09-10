# Scan Wait Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use sp-subagent-driven-development (recommended) or sp-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the five seconds between reading a badge and getting the answer visible, so the operator stops holding the phone at the QR waiting for a sign that never comes.

**Architecture:** One full-screen panel with two phases. It goes up the instant `jsQR` decodes a badge, in a neutral colour, and the *same element* is recoloured in place when the answer lands — `paintVerdict()` already rewrites one persistent `#verdict` node, so the recolour needs a CSS transition rather than new machinery. A small state model decides when a panel may take the screen: an unacknowledged rejection is never painted over.

**Tech Stack:** Plain ES5-style browser JS (no build step, no framework, no bundler), CSS custom properties, `jsQR` for decoding, Web Audio for tones, `navigator.vibrate` where supported. Verification is browser-driven through chrome-devtools against a local Node harness — this repo has no unit-test runner and none is being added.

**Spec:** `~/dev/events-checkin/docs/superpowers/specs/2026-09-10-scan-wait-feedback-design.md`

## Global Constraints

- Two files only: `~/dev/staff-console/gate/gate.js` and `~/dev/staff-console/gate/gate.css`. No backend change, no clasp push, no Apps Script redeploy.
- The neutral phase must never resemble a verdict: no tick glyph, no green, no verdict wording. It uses `--well` (`#13110c`), already defined in `gate.css`.
- `ok` clears itself after `PASS_CLEAR_MS` (1900). `duplicate`, `bad_signature`, `wrong_event`, `not_found` and the offline verdict wait to be dismissed.
- The held verdict is **one deep** — a newer answer replaces an older waiting one.
- Cancel abandons *waiting*, never the check-in, and clears `lastCode` so the same badge can be presented again. The 25s timeout keeps `lastCode` set, deliberately.
- `SCAN_TIMEOUT_MS` stays 25000. Do not change it.
- Style comes from the app's own tokens in `gate.css`. Do not introduce new colours.
- `navigator.vibrate` is absent on iOS Safari; every call must be guarded and the design must not depend on it.
- Verification harness: `node mock-scan.js` in `C:/Users/wicht/AppData/Local/Temp/claude/C--Users-wicht/9ac5f78b-51a4-478e-8f31-f1d0fb299818/scratchpad`, serving the gate app at `http://localhost:8797/gate/`. Open pages with `isolatedContext` so a stale cached bundle is never what gets tested.

---

## File Structure

| file | responsibility after this change |
|---|---|
| `gate/gate.js` | adds a panel-phase state model (`panelPhase`, `heldVerdict`, `inFlight`), routes every paint through one gate, raises the neutral phase in `submitScan()`, drives the counter and cancel, and skips frame work while a check is in flight |
| `gate/gate.css` | one `.v-scan` class, one `.lapse` line style, and a `background-color` transition on `.verdict` |

No files are created. No file is split — `gate.js` is 883 lines with one clear job and the change adds about 70.

---

### Task 1: The neutral phase, and the rule about who may take the screen

**Files:**
- Modify: `~/dev/staff-console/gate/gate.js` (module state near line 33; `MARKS` near line 473; `paintVerdict` at 522; `hideVerdict` at 543; `submitScan` at 434)
- Modify: `~/dev/staff-console/gate/gate.css` (append)
- Test: browser probe against `http://localhost:8797/gate/`

**Interfaces:**
- Produces: `panelPhase` (`"idle" | "scan" | "verdict"`), `heldVerdict` (`null` or an args object), `showPanel(kind, said, name, meta, code, acts, autoClear)` — the single gate every paint goes through. Task 3 and Task 4 both call `showPanel`; Task 2 reads `panelPhase`.
- Consumes: nothing from earlier tasks.

- [ ] **Step 1: Start the harness and write the probe that fails**

Start the harness if it is not already listening:

```bash
cd "C:/Users/wicht/AppData/Local/Temp/claude/C--Users-wicht/9ac5f78b-51a4-478e-8f31-f1d0fb299818/scratchpad"
netstat -ano | grep -q ":8797.*LISTENING" || (node mock-scan.js > mock-scan.log 2>&1 &)
```

Open `http://localhost:8797/gate/` with `isolatedContext: "t1"`, then run this probe with `mcp__chrome-devtools__evaluate_script`. It captures what the screen shows in the moment *between* the badge being submitted and the answer arriving:

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const v = () => document.getElementById("verdict");
  // Hold the response open so the in-flight moment can be observed at all.
  const real = window.fetch;
  let release;
  const gate = new Promise(r => { release = r; });
  window.fetch = async (u, o) => {
    try { if (JSON.parse(o.body).action === "checkin") await gate; } catch (e) {}
    return real(u, o);
  };
  const i = document.getElementById("manual");
  i.value = "TT-1A2B-901"; i.dispatchEvent(new Event("input"));
  document.querySelector('[data-act="manual"]').click();
  await sleep(600);
  const during = { cls: v().className, bg: getComputedStyle(v()).backgroundColor,
                   said: (v().querySelector(".said") || {}).textContent,
                   code: (v().querySelector(".code") || {}).textContent };
  release(); window.fetch = real;
  await sleep(900);
  return { during, after: { cls: v().className, sameNode: v() === v() } };
}
```

- [ ] **Step 2: Run it and confirm it fails**

Expected today: `during.cls` is `"verdict"` with no `up` class and `during.said` is `undefined` — nothing is on screen while the check is in flight. That is the bug.

- [ ] **Step 3: Add the phase state and the paint gate**

In `gate.js`, extend the module state line (currently `var app, camNode = null, scanning = false, lastCode = "", lastCodeAt = 0;`):

```js
  var app, camNode = null, scanning = false, lastCode = "", lastCodeAt = 0;
  // Which of the panel's two phases is on screen, and an answer that arrived
  // while an unacknowledged one was still up. See ADR 0020 and 0023.
  var panelPhase = "idle";        // "idle" | "scan" | "verdict"
  var heldVerdict = null;         // one deep, never a queue
```

Add the neutral glyph to `MARKS` — a scan frame, deliberately not a tick:

```js
  var MARKS = {
    scan: '<path d="M4 9V5h4M24 9V5h-4M4 19v4h4M24 19v4h-4"/><path d="M3 14h22"/>',
    ok:   '<path d="M5 13l5 5L23 5"/>',
    dup:  '<path d="M12 6v9"/><path d="M12 20h.01"/>',
    bad:  '<path d="M6 6l16 16M22 6L6 22"/>',
    wait: '<circle cx="14" cy="14" r="11"/><path d="M14 8v6l4 3"/>'
  };
```

Rename the existing `paintVerdict` to `paintPanel` and put a gate in front of it. Replace the whole of `paintVerdict` (line 522) with:

```js
  // Every paint goes through here. Two rules live in this one place:
  //
  //   A verdict the operator has not acknowledged is never painted over. The
  //   newer answer waits — one deep, because nobody at a door wants to tap
  //   through a backlog to reach the person in front of them.
  //
  //   The neutral phase is not queued, it is skipped. Holding it would mean
  //   dismissing a rejection and being shown "กำลังตรวจ" for a check that
  //   finished long ago.
  function showPanel(kind, said, name, meta, code, acts, autoClear) {
    var neutral = kind === "scan";
    if (panelPhase === "verdict") {
      if (neutral) return false;
      heldVerdict = [kind, said, name, meta, code, acts, autoClear];
      return false;
    }
    paintPanel(kind, said, name, meta, code, acts, autoClear);
    return true;
  }

  function paintPanel(kind, said, name, meta, code, acts, autoClear) {
    var el = document.getElementById("verdict");
    if (!el) return;
    panelPhase = kind === "scan" ? "scan" : "verdict";
    // The same node, recoloured. Nothing closes and reopens, so the CSS
    // transition on background-color carries one phase into the next.
    el.className = "verdict v-" + kind + " up";
    el.innerHTML =
      '<svg class="mark" viewBox="0 0 28 28">' + (MARKS[kind] || "") + "</svg>" +
      '<div class="said">' + esc(said) + "</div>" +
      '<div class="name">' + esc(name) + "</div>" +
      '<div class="meta">' + meta + "</div>" +
      (code ? '<div class="code">' + code + "</div>" : "") +
      '<div class="lapse" id="lapse" hidden></div>' +
      '<div class="act">' + acts + "</div>" +
      (kind === "scan" ? "" : '<div class="tap">แตะที่ใดก็ได้เพื่อปิด</div>');
    el.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function (ev) { ev.stopPropagation(); act(b.dataset.act, b); });
    });
    clearTimeout(verdictTimer);
    // Only a pass clears itself — it is the one the operator does nothing
    // about, and a full screen left up blocks the camera behind it.
    if (autoClear) verdictTimer = setTimeout(hideVerdict, PASS_CLEAR_MS);
  }
```

Point the two existing callers at `showPanel`. In `showResult` (line 511) change `paintVerdict(` to `showPanel(`, and in `showOfflineVerdict` (line 515) change `paintVerdict(` to `showPanel(`.

Replace `hideVerdict` (line 543) with:

```js
  function hideVerdict() {
    clearTimeout(verdictTimer);
    var el = document.getElementById("verdict");
    // Only the visibility class comes off. Clearing the whole className would
    // take the colour with it at once, so the panel would blink transparent
    // while the opacity was still fading.
    if (el) el.classList.remove("up");
    panelPhase = "idle";
    if (heldVerdict) {
      var h = heldVerdict;
      heldVerdict = null;
      paintPanel(h[0], h[1], h[2], h[3], h[4], h[5], h[6]);
    }
  }
```

- [ ] **Step 4: Raise the neutral phase when a scan goes out**

In `submitScan` (line 434), immediately after `state.busy = true;` and before the `payload.eventId` lines, add:

```js
    // The receipt: up before anything is sent, so the operator can lower the
    // phone. Deliberately colourless — at this moment the app knows only that
    // it read a code, and a forged badge decodes as cleanly as a real one.
    var shownCode = payload.qr ? String(payload.qr).split("|")[1] || "" : (payload.badgeCode || "");
    showPanel("scan", "รับรหัสแล้ว", "กำลังตรวจ…", "", esc(shownCode), "", false);
```

- [ ] **Step 5: Add the two CSS rules**

Append to `gate/gate.css`:

```css
/* The panel's first phase. --well is the colour of the camera well it covers,
   so it reads as the picture holding still rather than as a judgement — and it
   collides with none of the four verdict colours. */
.v-scan{background:var(--well)}
.verdict{transition:opacity .14s ease, background-color .22s ease}
.lapse{font:500 12px Prompt,sans-serif;margin-top:12px;color:rgba(255,255,255,.62);
       font-variant-numeric:tabular-nums}
```

- [ ] **Step 6: Run the probe again**

Reopen the page with a fresh `isolatedContext` (`"t1b"`) so no cached bundle is tested, and run the Step 1 probe.

Expected now: `during.cls` is `"verdict v-scan up"`, `during.bg` is `rgb(19, 17, 12)`, `during.said` is `"รับรหัสแล้ว"`, `during.code` is `"TT-1A2B-901"`, and `after.cls` is `"verdict v-ok up"`.

- [ ] **Step 7: Confirm a rejection is never painted over**

With a fresh context, run:

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const v = () => document.getElementById("verdict");
  const scan = async code => {
    const i = document.getElementById("manual");
    i.value = code; i.dispatchEvent(new Event("input"));
    document.querySelector('[data-act="manual"]').click();
    await sleep(1200);
  };
  await scan("TT-0000-000");                 // not found -> red, waits
  const red = v().className;
  await scan("TT-3C4D-902");                 // a good badge, while red is up
  const stillRed = v().className;
  v().querySelector('[data-act="dismiss"]').click();
  await sleep(300);
  const released = v().className;
  return { red, stillRed, released };
}
```

Expected: `red` and `stillRed` are both `"verdict v-bad up"`; `released` is `"verdict v-ok up"`. The green waited and then appeared.

- [ ] **Step 8: Commit**

```bash
cd ~/dev/staff-console
git add gate/gate.js gate/gate.css
git commit -m "The panel goes up when the badge is read, not when the answer lands

A check-in takes about five seconds and the screen showed nothing for all of
them, so operators held the phone at the QR waiting for a sign. The panel now
goes up the instant jsQR decodes a badge, in the colour of the camera well it
covers, carrying the badge code and กำลังตรวจ — and the same element is
recoloured in place when the answer arrives.

Colourless on purpose. At that moment the app knows only that it read a code:
not whether the badge is real, not whether it belongs to this event. A tick
there would be read as let them in, and a forged badge decodes as cleanly as
a real one.

One paint gate now holds both rules. An unacknowledged rejection is never
painted over — the newer answer waits, one deep, and appears the moment the
old one is dismissed. The neutral phase is skipped rather than queued, because
dismissing a rejection and being shown กำลังตรวจ for a finished check would be
a lie.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: The receipt you do not have to look at

**Files:**
- Modify: `~/dev/staff-console/gate/gate.js` (`beep` at 552; `submitScan`)
- Test: browser probe

**Interfaces:**
- Consumes: `showPanel` from Task 1.
- Produces: `receipt()` — plays the short tone and vibrates. Nothing else calls it.

- [ ] **Step 1: Write the probe that fails**

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const tones = []; let vibrated = 0;
  const C = window.AudioContext || window.webkitAudioContext;
  const realOsc = C.prototype.createOscillator;
  C.prototype.createOscillator = function () {
    const o = realOsc.call(this);
    const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(o), "frequency");
    setTimeout(() => tones.push(o.frequency.value), 0);
    return o;
  };
  navigator.vibrate = () => { vibrated++; return true; };
  const i = document.getElementById("manual");
  i.value = "TT-5E6F-903"; i.dispatchEvent(new Event("input"));
  document.querySelector('[data-act="manual"]').click();
  await sleep(1400);
  C.prototype.createOscillator = realOsc;
  return { tones, vibrated };
}
```

- [ ] **Step 2: Run it and confirm it fails**

Expected today: `tones` has exactly one entry (the verdict tone, 880 or 220) and `vibrated` is `0` — the read itself makes no sound and no buzz.

- [ ] **Step 3: Add the receipt**

Directly below `beep` (line 552) in `gate.js`:

```js
  // The read gets a sound of its own, higher and much shorter than either
  // verdict tone, so an operator learns the difference without being told.
  // Vibration is a bonus: Safari on iOS has no Vibration API at all, which is
  // why the panel — not the buzz — is the signal the design leans on.
  function receipt() {
    beep(1320, 0.07);
    try { if (navigator.vibrate) navigator.vibrate(35); } catch (e) {}
  }
```

Give `beep` an optional length so the receipt can be shorter than a verdict. Replace `beep` (line 552) with:

```js
  function beep(freq, seconds) {
    var dur = seconds || 0.18;
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      var ctx = new C(), o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur + .02);
    } catch (e) { /* sound is a bonus, never the only signal */ }
  }
```

In `submitScan`, call it on the line after the `showPanel("scan", …)` added in Task 1:

```js
    // Fires whether or not the panel could take the screen: if an
    // unacknowledged rejection is still up the panel was skipped, and the
    // sound is then the only thing telling the operator the badge was read.
    receipt();
```

- [ ] **Step 4: Run the probe again**

Expected: `tones` is `[1320, 880]` — the receipt first, the verdict second — and `vibrated` is `1`.

- [ ] **Step 5: Commit**

```bash
cd ~/dev/staff-console
git add gate/gate.js
git commit -m "A sound and a buzz for the read, distinct from the verdict tones

A door is loud and the phone is often not being looked at, so the receipt
arrives without asking for attention: a short high tone, well clear of the 880
and 220 the verdicts use, and a 35ms vibration.

It fires even when the panel could not take the screen — if an unacknowledged
rejection is still up, the sound is the only thing telling the operator the
badge was read at all.

Safari on iOS has no Vibration API, so the buzz simply does not happen there.
That is why the panel and not the buzz is what the design leans on.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: A slow check counts up, and can be abandoned

**Files:**
- Modify: `~/dev/staff-console/gate/gate.js` (module state; `submitScan`; `act` at 795)
- Test: browser probe

**Interfaces:**
- Consumes: `showPanel`, `panelPhase`, `paintPanel` from Task 1.
- Produces: `inFlight` (`null` or `{ settled, timer, interval, startedAt }`) — Task 4 does not use it; `act("cancel")` does.

- [ ] **Step 1: Write the probe that fails**

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const real = window.fetch;
  let release; const gate = new Promise(r => { release = r; });
  window.fetch = async (u, o) => {
    try { if (JSON.parse(o.body).action === "checkin") await gate; } catch (e) {}
    return real(u, o);
  };
  const i = document.getElementById("manual");
  i.value = "TT-1A2B-901"; i.dispatchEvent(new Event("input"));
  document.querySelector('[data-act="manual"]').click();
  await sleep(1500);
  const at1 = { lapse: (document.getElementById("lapse") || {}).hidden,
                cancel: !!document.querySelector('[data-act="cancel"]') };
  await sleep(2200);
  const at4 = { lapseText: (document.getElementById("lapse") || {}).textContent,
                cancel: !!document.querySelector('[data-act="cancel"]') };
  await sleep(5000);
  const at9 = { cancel: !!document.querySelector('[data-act="cancel"]') };
  if (at9.cancel) document.querySelector('[data-act="cancel"]').click();
  await sleep(400);
  const after = { cls: document.getElementById("verdict").className };
  release(); window.fetch = real;
  return { at1, at4, at9, after };
}
```

- [ ] **Step 2: Run it and confirm it fails**

Expected today: `at4.lapseText` is `""` and `at9.cancel` is `false` — nothing counts and there is nothing to press.

- [ ] **Step 3: Track the in-flight check**

Add to the module state added in Task 1:

```js
  var inFlight = null;            // the check currently being waited on
  var LAPSE_AFTER_MS = 3000;      // when the seconds start showing
  var CANCEL_AFTER_MS = 8000;     // past the worst honest response measured
```

Rewrite `submitScan`'s body from `state.busy = true;` down to `return true;`. The `settled` flag and the timeout move onto `inFlight` so `act("cancel")` can reach them:

```js
    state.busy = true;

    // The receipt: up before anything is sent, so the operator can lower the
    // phone. Deliberately colourless — at this moment the app knows only that
    // it read a code, and a forged badge decodes as cleanly as a real one.
    var shownCode = payload.qr ? String(payload.qr).split("|")[1] || "" : (payload.badgeCode || "");
    showPanel("scan", "รับรหัสแล้ว", "กำลังตรวจ…", "", esc(shownCode), "", false);
    // Fires whether or not the panel could take the screen: if an
    // unacknowledged rejection is still up the panel was skipped, and the
    // sound is then the only thing telling the operator the badge was read.
    receipt();

    payload.eventId = state.eventId;
    payload.device = deviceId();
    payload.clientScanId = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    var run = inFlight = { settled: false, startedAt: Date.now(), timer: null, interval: null };

    function finish() {
      run.settled = true;
      clearTimeout(run.timer);
      clearInterval(run.interval);
      if (inFlight === run) inFlight = null;
      state.busy = false;
    }

    // Under normal conditions this never draws anything: the answer lands at
    // about five seconds and the counter starts at three. It exists for the
    // stalls — Apps Script was measured taking 38s and 48s in one session, and
    // a still panel through that is indistinguishable from a frozen app.
    run.interval = setInterval(function () {
      if (run.settled || panelPhase !== "scan") return;
      var secs = Math.floor((Date.now() - run.startedAt) / 1000);
      if (secs * 1000 < LAPSE_AFTER_MS) return;
      var lapse = document.getElementById("lapse");
      if (lapse) { lapse.hidden = false; lapse.textContent = "รอมาแล้ว " + secs + " วินาที"; }
      if (secs * 1000 >= CANCEL_AFTER_MS && !document.querySelector('[data-act="cancel"]')) {
        var acts = document.querySelector("#verdict .act");
        if (acts) {
          acts.innerHTML = '<button class="ghost" data-act="cancel">ยกเลิกแล้วยิงใหม่</button>';
          acts.querySelectorAll("[data-act]").forEach(function (b) {
            b.addEventListener("click", function (ev) { ev.stopPropagation(); act(b.dataset.act, b); });
          });
        }
      }
    }, 500);

    run.timer = setTimeout(function () {
      if (run.settled) return;
      finish();
      markOnline(false);
      // lastCode is left set on purpose: clearing it would make a badge still
      // held in frame look new and re-send itself with nobody asking. A cancel
      // does the opposite, because a cancel is somebody asking for another go.
      showOfflineVerdict();
    }, SCAN_TIMEOUT_MS);

    api("checkin", payload).then(function (r) {
      if (run.settled) return;
      finish();
      showResult(r);
      if (state.tab === "recent") loadTab();
    }).catch(function (e) {
      if (run.settled) return;
      finish();
      var kind = handleFailure(e);
      if (kind === "offline") showOfflineVerdict();
      else if (kind === "server") { fail(e); }
      // an auth failure has already taken the app to the sign-in screen
    });
    return true;
```

- [ ] **Step 4: Add the cancel action**

In `act` (line 795), directly after the `} else if (what === "dismiss") { hideVerdict(); }` branch, add:

```js
    } else if (what === "cancel") {
      // Abandons waiting, never the check-in: the request may already have
      // reached the server. Presenting the badge again is what tells the
      // operator what really happened — gold means the first attempt landed,
      // green means it did not.
      if (inFlight) {
        inFlight.settled = true;
        clearTimeout(inFlight.timer);
        clearInterval(inFlight.interval);
        inFlight = null;
      }
      state.busy = false;
      lastCode = "";                 // so the same badge can be read straight away
      hideVerdict();
```

- [ ] **Step 5: Run the probe again**

Expected: `at1.lapse` is `true` (still hidden at 1.5s), `at4.lapseText` matches `รอมาแล้ว 4 วินาที`, `at9.cancel` is `true`, and `after.cls` is `"verdict v-scan"` — the `up` class gone, the panel dismissed.

- [ ] **Step 6: Confirm the same badge can be re-scanned immediately after a cancel**

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const i = document.getElementById("manual");
  i.value = "TT-1A2B-901"; i.dispatchEvent(new Event("input"));
  document.querySelector('[data-act="manual"]').click();
  await sleep(1500);
  return { cls: document.getElementById("verdict").className,
           name: (document.querySelector("#verdict .name") || {}).textContent };
}
```

Expected: a verdict class (`v-ok` or `v-dup` depending on harness state) with a real name — the app was not left stuck busy.

- [ ] **Step 7: Commit**

```bash
cd ~/dev/staff-console
git add gate/gate.js
git commit -m "A slow check shows it is still going, and can be given up on

Apps Script was measured stalling for 38 and 48 seconds in a single session
while the gate app waits 25s before declaring failure. A still panel through
that is indistinguishable from a frozen app, and an operator who believes the
app has frozen starts pressing things or waving people through.

Three seconds in, the panel counts the seconds — under normal conditions it
never appears, because the answer lands at about five. Eight seconds in,
comfortably past the worst honest response measured, ยกเลิก appears.

Cancel abandons waiting, not the check-in: the request may already have reached
the server and a client cannot take that back. It clears lastCode so the same
badge can be presented again, and the answer to that second attempt tells the
operator what actually happened. That is the opposite of the 25s timeout, which
keeps lastCode set so a badge sitting in frame does not re-send itself unasked
— a timeout is the app giving up, a cancel is a person asking for another go.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Stop reading frames while a check is in flight

**Files:**
- Modify: `~/dev/staff-console/gate/gate.js` (`tick` at 399)
- Test: browser probe

**Interfaces:**
- Consumes: `state.busy`, maintained by Task 3's `finish()`.
- Produces: nothing new.

- [ ] **Step 1: Write the probe that fails**

This counts how many times `jsQR` is called while a check is in flight. It needs the camera, which the harness browser cannot open, so it drives `tick` through a fake stream — a canvas `captureStream` is a real `MediaStream` with a real video track.

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cv = document.createElement("canvas"); cv.width = 480; cv.height = 480;
  const cx = cv.getContext("2d");
  setInterval(() => { cx.fillStyle = "#fff"; cx.fillRect(0, 0, 480, 480); }, 60);
  navigator.mediaDevices.getUserMedia = async () => cv.captureStream(30);
  let calls = 0;
  const realJsQR = window.jsQR;
  window.jsQR = function () { calls++; return realJsQR.apply(this, arguments); };

  document.querySelector('[data-act="camon"]').click();
  await sleep(1500);
  const before = calls;
  await sleep(1000);
  const idleRate = calls - before;              // frames read while idle

  const real = window.fetch;
  let release; const gate = new Promise(r => { release = r; });
  window.fetch = async (u, o) => {
    try { if (JSON.parse(o.body).action === "checkin") await gate; } catch (e) {}
    return real(u, o);
  };
  const i = document.getElementById("manual");
  i.value = "TT-3C4D-902"; i.dispatchEvent(new Event("input"));
  document.querySelector('[data-act="manual"]').click();
  const atSubmit = calls;
  await sleep(1500);
  const duringWait = calls - atSubmit;          // frames read while in flight
  release(); window.fetch = real;
  window.jsQR = realJsQR;
  return { idleRate, duringWait };
}
```

- [ ] **Step 2: Run it and confirm it fails**

Expected today: `idleRate` is tens of calls per second and `duringWait` is a similar number — jsQR runs over every frame for the whole wait and the result is thrown away by `submitScan`'s busy guard.

- [ ] **Step 3: Skip the frame work while busy**

In `tick` (line 399), insert immediately after the existing first line:

```js
  function tick(gen) {
    if (!scanning || gen !== scanGen) return;
    // Nothing is read while a check is in flight. submitScan would refuse it
    // anyway, so running jsQR over every frame for five seconds only to throw
    // the answer away is battery a phone working a door all day does not have
    // to spare. The rAF loop itself keeps running: it costs nothing and means
    // reading resumes the moment the answer lands, with no camera restart.
    if (state.busy) {
      raf = requestAnimationFrame(function () { tick(gen); });
      return;
    }
```

- [ ] **Step 4: Run the probe again**

Expected: `idleRate` unchanged (tens per second) and `duringWait` is `0`.

- [ ] **Step 5: Confirm reading resumes without a camera restart**

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const tracksBefore = [...document.querySelectorAll("#cam video")]
    .map(v => v.srcObject && v.srcObject.getTracks()[0]);
  const i = document.getElementById("manual");
  i.value = "TT-5E6F-903"; i.dispatchEvent(new Event("input"));
  document.querySelector('[data-act="manual"]').click();
  await sleep(1600);
  document.getElementById("verdict").click();
  await sleep(400);
  const v = document.querySelector("#cam video");
  return { sameTrack: v.srcObject && v.srcObject.getTracks()[0] === tracksBefore[0],
           live: v.srcObject && v.srcObject.getTracks()[0].readyState === "live" };
}
```

Expected: both `true` — the stream was never released.

- [ ] **Step 6: Commit**

```bash
cd ~/dev/staff-console
git add gate/gate.js
git commit -m "Stop reading frames while a check is in flight

The tick loop ran jsQR over every frame for the whole five seconds a check
takes, and submitScan threw every result away because state.busy was set. On a
phone working a door all day that is real battery spent on nothing.

The rAF loop itself keeps running — it costs nothing and means reading resumes
the instant the answer lands, with no getUserMedia restart. Releasing the
stream would cost one to two seconds per person and turn a five second cycle
into seven.

Measured against a canvas captureStream standing in for the camera: tens of
jsQR calls per second while idle, zero during the wait, and the same track
still live afterwards.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Prove the whole flow on the deployed app

**Files:**
- No code changes. This task is verification and deployment only.

**Interfaces:**
- Consumes: everything from Tasks 1–4.

- [ ] **Step 1: Syntax check**

```bash
cd ~/dev/staff-console && node --check gate/gate.js && echo "syntax ok"
```

- [ ] **Step 2: Run the untouched behaviour, to confirm nothing regressed**

With a fresh isolated context on the harness, confirm each of these still holds:

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const v = () => document.getElementById("verdict");
  const scan = async c => {
    const i = document.getElementById("manual");
    i.value = c; i.dispatchEvent(new Event("input"));
    document.querySelector('[data-act="manual"]').click();
    await sleep(1400);
  };
  const out = {};
  await scan("TT-1A2B-901");
  out.pass = { cls: v().className, bg: getComputedStyle(v()).backgroundColor };
  await sleep(2200);
  out.passCleared = !v().classList.contains("up");
  await scan("TT-1A2B-901");
  out.duplicate = v().className;
  v().click(); await sleep(300);
  out.printOpens = (() => {
    let u = null; const ow = window.open; window.open = x => { u = x; return null; };
    return { restore: () => { window.open = ow; }, get url() { return u; } };
  })();
  return out;
}
```

Expected: `pass.cls` is `"verdict v-ok up"` with `rgb(47, 107, 79)`; `passCleared` is `true`; `duplicate` is `"verdict v-dup up"`.

- [ ] **Step 3: Confirm offline still blocks entry**

```js
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const real = window.fetch;
  window.fetch = async () => { throw new TypeError("Failed to fetch"); };
  const i = document.getElementById("manual");
  i.value = "TT-5E6F-903"; i.dispatchEvent(new Event("input"));
  document.querySelector('[data-act="manual"]').click();
  await sleep(1200);
  const v = document.getElementById("verdict");
  const out = { cls: v.className, bg: getComputedStyle(v).backgroundColor,
                bar: (document.querySelector(".net") || {}).textContent };
  window.fetch = real;
  await sleep(6500);
  out.recovered = (document.querySelector(".net") || {}).textContent;
  return out;
}
```

Expected: `cls` is `"verdict v-wait up"`, `bg` is `rgb(47, 77, 140)`, `bar` reads `ออฟไลน์ · หยุดรับ`, and `recovered` reads `ออนไลน์`.

- [ ] **Step 4: Deploy**

```bash
cd ~/dev/staff-console && git push origin main
```

Vercel serves `gate/` directly (Root Directory `gate`) — there is no mirror to sync. Then check **once**, not in a polling loop:

```bash
curl -s https://1neve-gate.vercel.app/gate.js | grep -c "showPanel"
```

If it returns `0`, the deploy has not landed yet; wait and check again rather than looping.

- [ ] **Step 5: One real scan on a real phone**

Open `https://1neve-gate.vercel.app` on a phone, sign in, start scanning, and present one badge from `C:\Users\wicht\dev\qa-gate-qr\test.html`. Confirm by eye:

- the panel appears **before** the answer, dark and colourless, with the badge code
- a short high tone and a buzz land at the same moment
- the panel becomes green in place about five seconds later, with the person's name — no flicker, nothing closing and reopening
- the counter never appears, because the answer arrives before three seconds of waiting are up

This is the only step that exercises the real five-second wait; the harness answers in about one second.

- [ ] **Step 6: Commit nothing, report findings**

There is nothing to commit here. Report what the phone showed, and whether the timing felt right at a real door.

---

## Self-Review

**Spec coverage** — every section of the spec maps to a task:

| spec requirement | task |
|---|---|
| neutral panel raised at decode, carrying the badge code | 1 |
| recoloured in place, one element | 1 |
| `--well` neutral colour, no new colours | 1 |
| receipt never resembles a verdict (no tick, no green) | 1 (glyph + colour), 2 (tone) |
| beep + vibration, guarded for iOS | 2 |
| counter at 3s, ยกเลิก at 8s, deadline stays 25s | 3 |
| cancel clears `lastCode`; timeout does not | 3 |
| decoding pauses in flight, camera stream stays open | 4 |
| unacknowledged verdict never overwritten, one deep | 1 |
| `ok` still auto-clears at 1900ms | 1 (preserved in `paintPanel`) |
| typed-code path comes free | 1 — every probe drives it through `#manual`, which routes to `submitScan` |
| nothing on the backend changes | all — no task touches `backend/` |

**Placeholder scan** — no TBDs, no "handle edge cases", no "similar to Task N". Every code step carries the actual code, and every probe carries the actual script and its expected values.

**Type consistency** — `showPanel` and `paintPanel` take the same seven arguments in the same order throughout; `heldVerdict` is stored and replayed as a seven-element array matching that order; `inFlight` is created in Task 3 with `{ settled, startedAt, timer, interval }` and every reader in `act("cancel")` uses those four names; `receipt()` is defined in Task 2 and called only from `submitScan`.

**One gap found and closed while writing:** the spec did not say what the *neutral* phase should do when an unacknowledged rejection is already up. Painting it would destroy the red before the answer even arrived — worse than the bug being fixed. Task 1 skips the neutral paint in that case and Task 2 still fires the receipt, so the operator learns the badge was read even when the screen is not free to say so. This is recorded in the Task 1 commit message and belongs in ADR 0023's scope note.
