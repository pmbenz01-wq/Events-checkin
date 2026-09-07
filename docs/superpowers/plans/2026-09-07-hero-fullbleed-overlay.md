# Hero Banner Full-Bleed + Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use sp-subagent-driven-development (recommended) or sp-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the picker screen's scroll-linked hero image grow to true full-bleed (edge-to-edge, breaking out of the 440px column) instead of just filling its column, and have the event name/date/CTA switch from below-image to overlaid-on-image once fully expanded — with no new dependencies and no change to the existing continuous, non-pinned scroll mechanism.

**Architecture:** Extends the existing `onHeroScroll()` function in `customer/app.js` (already scroll-position-driven, rAF-throttled, no library) with three pure, independently-testable interpolation functions (width/height/radius), plus one CSS-shell change in `customer/styles.css` that lets `.hero-media` break out of its centered column via `left:50%; transform:translateX(-50%)`, and one class-toggle for the overlay switch.

**Tech Stack:** Vanilla JS (no framework, no build step), plain CSS. Verification uses `node --check` for syntax, `node -e` for pure-function correctness (no test framework exists in this repo and none is being introduced — see events-checkin-0003's reasoning against adding moving parts), and the chrome-devtools MCP browser tools for live DOM/visual verification, matching how every prior change in this project was verified.

**Spec:** `docs/superpowers/specs/2026-09-07-hero-fullbleed-overlay-design.md` (backed by ADRs `events-checkin-0001`, `0002`, `0003` in `docs/adr/`)

## Global Constraints

- No new npm packages, no build step, no test framework — this repo is a static site with zero dependencies by design (spec's "Out of scope", ADR events-checkin-0003).
- The registration flow after the CTA click (4-step form → QR) must not change — `hero-enter` action stays exactly as-is.
- Every JS edit gets `node --check` before it's considered done.
- Deploy via the existing `sync-docs.sh` → commit → push → verify-on-Vercel flow already used for every change to this repo this session.

---

## File Structure

- `customer/styles.css` — one task: CSS shell for the full-bleed breakout and the (initially dormant) `.is-full` overlay rules.
- `customer/app.js` — two tasks: (1) extend `onHeroScroll()` with full-bleed width/height interpolation and the radius easing curve, via three new pure helper functions; (2) add the `is-full` class toggle that switches the info block to overlay.

## Task 1: CSS shell — full-bleed breakout + dormant overlay styles

**Files:**
- Modify: `customer/styles.css:36` (`.hero-media` rule)
- Modify: `customer/styles.css:34` (`.hero-event` rule)
- Modify: `customer/styles.css:39` (`.hero-media-scrim` rule)
- Modify: `customer/styles.css:42-47` (`.hero-info` block — add new rules after it)

**Interfaces:**
- Consumes: nothing (pure CSS).
- Produces: the `.hero-event.is-full` selector surface that Task 3's JS will toggle. Until Task 3 adds the class, these rules are dormant (never match) — this task is fully visually inert on its own except for the full-bleed breakout capability itself, which Task 2's JS makes visible.

- [ ] **Step 1: Add position/transform to `.hero-event` and `.hero-media`, drop the height cap**

In `customer/styles.css`, change line 34 from:

```css
.hero-event{padding:0 0 46px}
```

to:

```css
.hero-event{padding:0 0 46px;position:relative}
```

Change line 36 from:

```css
.hero-media{position:relative;width:56%;height:64vh;max-height:560px;margin:0 auto;border-radius:0;overflow:hidden;background:#e8e4d6;box-shadow:0 18px 40px rgba(23,21,15,.22);transition:width .08s linear,border-radius .08s linear}
```

to:

```css
.hero-media{position:relative;left:50%;transform:translateX(-50%);width:56%;height:64vh;border-radius:0;overflow:hidden;background:#e8e4d6;box-shadow:0 18px 40px rgba(23,21,15,.22)}
```

Two things changed besides the new `left`/`transform`: `max-height:560px` is dropped (it capped the card state; a full-bleed hero must be able to reach true `100vh`), and the `transition` property is removed (Task 2 makes `onHeroScroll()` set `width`/`height`/`border-radius` on every scroll tick already, so a CSS transition would fight the per-frame updates and introduce lag — the existing per-frame update is the source of smoothness here, not a CSS transition).

**Step 1 has no independent runtime check** — `left:50%;transform:translateX(-50%)` on a `56%`-wide, fixed-percentage element is visually identical to plain centering at this width (both center it), so there's nothing new to observe until Task 2's JS starts driving `width` past the column's own width. Proceed to Step 2.

- [ ] **Step 2: Strengthen the scrim gradient's bottom stop**

Change line 39 from:

```css
.hero-media-scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(19,17,12,.75) 0%,rgba(19,17,12,.15) 55%,rgba(19,17,12,0) 100%);pointer-events:none}
```

to:

```css
.hero-media-scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(19,17,12,.85) 0%,rgba(19,17,12,.3) 35%,rgba(19,17,12,0) 100%);pointer-events:none}
```

- [ ] **Step 3: Add the dormant `.is-full` overlay rules**

After line 47 (`.hero-info .cta{margin-top:18px}`), insert:

```css
.hero-event.is-full .hero-info{position:absolute;left:0;right:0;bottom:46px;padding:0 26px 26px;color:#fff}
.hero-event.is-full .hero-kicker{color:#ffb3a2}
.hero-event.is-full .hero-place{color:rgba(255,255,255,.82)}
```

(`bottom:46px` compensates for `.hero-event`'s own `padding:0 0 46px` — see the spec's "Info/CTA overlay switch" section for why a naive `bottom:0` would land 46px low.)

- [ ] **Step 4: Verify the CSS is syntactically sane**

There's no CSS linter in this repo, so verify by loading the file locally — this doubles as the check for Steps 1–3 together, since none of them are independently observable without a browser.

Run (from repo root):

```bash
start "" "file:///$(pwd | sed 's|^/c/|C:/|')/customer/index.html"
```

(On Windows Git Bash, `start ""` opens the default browser. If that doesn't resolve, open `customer/index.html` directly in any browser via its `file://` path.)

Confirm in the browser:
- The page loads with no visible layout break (the hero card still looks the same as before this task — expected, since nothing new is active yet).
- Open devtools console — confirm zero errors.

- [ ] **Step 5: Commit**

```bash
cd "$(git -C customer rev-parse --show-toplevel 2>/dev/null || echo .)"
git add customer/styles.css
git commit -m "Hero CSS shell: full-bleed breakout capability + dormant overlay rules

Part 1/3 of the full-bleed + overlay hero redesign (see
docs/superpowers/specs/2026-09-07-hero-fullbleed-overlay-design.md).
Purely additive/dormant until Task 2 (width/height interpolation) and
Task 3 (is-full toggle) land — visually a no-op on its own."
```

---

## Task 2: `onHeroScroll()` — full-bleed width/height interpolation + radius easing

**Files:**
- Modify: `customer/app.js:238-253` (`onHeroScroll()`)

**Interfaces:**
- Consumes: `wrap` (a `[data-hero-media]` DOM element, i.e. `.hero-media-wrap`), `p` (already-computed scroll progress, `0..1`) — both already exist in `onHeroScroll()`'s current body, unchanged.
- Produces: three new pure functions — `heroWidthPx(p, startW, endW)`, `heroHeightPx(p, vh)`, `heroRadiusPx(p)` — all taking and returning plain numbers, no DOM access. Task 3 does not consume these directly, but must not collide with their names.

- [ ] **Step 1: Write the three pure interpolation functions above `onHeroScroll()`**

In `customer/app.js`, immediately before line 238 (`function onHeroScroll() {`), insert:

```js
  // Pure interpolation helpers for the hero reveal — no DOM access, so
  // they're checkable with plain `node -e` (see Task 2's verification
  // steps) without a browser or a test framework.
  function heroWidthPx(p, startW, endW) {
    return startW + p * (endW - startW);
  }
  function heroHeightPx(p, vh) {
    const startH = vh * 0.64, endH = vh;
    return startH + p * (endH - startH);
  }
  function heroRadiusPx(p) {
    // Rises to 22px through the first 70% of the reveal, eases back to 0
    // through the last 30% — a rounded corner at true full-bleed (p=1)
    // would sit at the literal edge of the screen and read as a bug.
    return p < 0.7 ? (p / 0.7) * 22 : 22 * (1 - (p - 0.7) / 0.3);
  }

```

- [ ] **Step 2: Verify the three functions' boundary values with plain `node -e`**

These are pure functions of numbers, so they can be checked without launching a browser. Run each of these from the repo root (they exercise the exact formulas just written — copy them verbatim, don't approximate):

```bash
node -e "
function heroWidthPx(p, startW, endW) { return startW + p * (endW - startW); }
console.assert(heroWidthPx(0, 246, 800) === 246, 'width at p=0 should equal startW');
console.assert(heroWidthPx(1, 246, 800) === 800, 'width at p=1 should equal endW');
console.assert(heroWidthPx(0.5, 200, 400) === 300, 'width at p=0.5 should be the midpoint');
console.log('heroWidthPx: OK');
"
```

Expected output: `heroWidthPx: OK` (an `assert` failure throws and prints `Assertion failed:` instead — if you see that, the formula was mistyped, fix it before continuing).

```bash
node -e "
function heroHeightPx(p, vh) { const startH = vh * 0.64, endH = vh; return startH + p * (endH - startH); }
console.assert(heroHeightPx(0, 1000) === 640, 'height at p=0 should be 64% of vh');
console.assert(heroHeightPx(1, 1000) === 1000, 'height at p=1 should equal vh');
console.log('heroHeightPx: OK');
"
```

```bash
node -e "
function heroRadiusPx(p) { return p < 0.7 ? (p / 0.7) * 22 : 22 * (1 - (p - 0.7) / 0.3); }
console.assert(heroRadiusPx(0) === 0, 'radius at p=0 should be 0');
console.assert(heroRadiusPx(0.7) === 22, 'radius should peak at p=0.7');
console.assert(heroRadiusPx(1) === 0, 'radius at p=1 (full-bleed) should return to 0');
console.log('heroRadiusPx: OK');
"
```

All three must print their `OK` line with no `Assertion failed` output before continuing — this is the "run it and confirm it fails/passes" cycle for pure logic in a repo with no test runner: write the assertion against the not-yet-written function first is skipped here only because the functions are being authored directly from the spec's already-worked-out formulas (Step 1 and this check happen together); the assertions still must actually run and pass, not be assumed.

- [ ] **Step 3: Wire the three functions into `onHeroScroll()`'s body**

Replace lines 246-249 (inside the `wraps.forEach` callback):

```js
      if (media) {
        media.style.width = (56 + p * 44) + "%";
        media.style.borderRadius = (p * 22) + "px";
      }
```

with:

```js
      if (media) {
        const startW = wrap.clientWidth * 0.56;
        media.style.width = heroWidthPx(p, startW, window.innerWidth) + "px";
        media.style.height = heroHeightPx(p, vh) + "px";
        media.style.borderRadius = heroRadiusPx(p) + "px";
      }
```

(`vh` is already in scope — it's computed once per `onHeroScroll()` call on the line above the `forEach`, unchanged from the current code.)

- [ ] **Step 4: `node --check`**

```bash
node --check customer/app.js
```

Expected: no output, exit code 0. If it errors, the most likely cause is a stray brace from the Step 3 replacement — re-check the block matches exactly.

- [ ] **Step 5: Live browser verification at three scroll depths**

Open `customer/index.html` via `file://` in a browser with devtools (or use the chrome-devtools MCP tools if running inside this session). Run this in the page's console at each scroll position below — it reads the live computed values and checks them against the same formulas Step 2 already validated in isolation, closing the loop from "pure function is correct" to "the DOM actually reflects it":

```js
(() => {
  const wrap = document.querySelector("[data-hero-media]");
  const media = wrap.querySelector(".hero-media");
  const rect = wrap.getBoundingClientRect();
  const vh = window.innerHeight;
  const p = Math.max(0, Math.min(1, (vh - rect.top) / vh));
  const gotW = parseFloat(media.style.width);
  const gotH = parseFloat(media.style.height);
  const gotR = parseFloat(media.style.borderRadius);
  console.log({ p: p.toFixed(2), width: gotW, height: gotH, radius: gotR, viewportWidth: window.innerWidth });
})();
```

- At page load (`p` near 0): `width` should be close to 56% of the column's own content width (a few hundred px, well under `window.innerWidth`), `radius` should be close to 0.
- Scroll down until the hero section is roughly centered in the viewport (`p` near 0.5–0.7): `radius` should be at or near its peak (~22), `width` should be growing past the 440px column.
- Scroll until the hero's top has reached the very top of the viewport (`p` at or near 1): `width` should equal (or be very close to) `window.innerWidth`, `height` should be very close to `window.innerHeight`, `radius` should be back near 0.
- At every point: no visible layout jump, no console errors.

- [ ] **Step 6: Commit**

```bash
git add customer/app.js
git commit -m "onHeroScroll: full-bleed width/height interpolation + radius easing

Part 2/3 of the full-bleed + overlay hero redesign. Extracts the
interpolation math into three pure functions (heroWidthPx/heroHeightPx/
heroRadiusPx) so it's checkable with plain \`node -e\`, no test framework
needed. Width now grows to true window.innerWidth at p=1 (paired with
Task 1's left:50%/translateX(-50%) breakout), height grows to
window height, and radius rises then eases back to 0 instead of just
rising, so a rounded corner never sits at the literal screen edge."
```

---

## Task 3: `is-full` overlay class toggle

**Files:**
- Modify: `customer/app.js:238-253` (`onHeroScroll()`, as extended by Task 2 — the file now has different line numbers than the pre-Task-2 listing; the block to change is the one Task 2 just committed)

**Interfaces:**
- Consumes: `wrap` (the `[data-hero-media]` element, i.e. `.hero-media-wrap`) — already in scope inside `onHeroScroll()`'s `forEach`.
- Produces: the `is-full` class on the ancestor `.hero-event` element, consumed by Task 1's CSS (`.hero-event.is-full .hero-info` etc).

- [ ] **Step 1: Add the class toggle at the end of the `forEach` callback**

In `customer/app.js`, inside `onHeroScroll()`'s `wraps.forEach(wrap => { ... })` callback, after the existing `img.style.transform = ...` line (the last line of the callback body Task 2 left in place) and before the callback's closing `});`, add:

```js
      const heroEvent = wrap.closest(".hero-event");
      if (heroEvent) heroEvent.classList.toggle("is-full", p >= 0.96);
```

- [ ] **Step 2: `node --check`**

```bash
node --check customer/app.js
```

Expected: no output, exit code 0.

- [ ] **Step 3: Live browser verification — class appears only near full expansion, and the overlay is legible**

In the same local `file://` preview from Task 2, run this at three points:

```js
(() => {
  const heroEvent = document.querySelector(".hero-event");
  console.log({ isFull: heroEvent.classList.contains("is-full"), infoPosition: getComputedStyle(document.querySelector(".hero-info")).position });
})();
```

- Mid-scroll (`p` well under 0.96, e.g. hero roughly centered in viewport): `isFull` must be `false`, `infoPosition` must be `"static"` — the info block renders exactly as it did before this task, below the image.
- Scrolled to where the hero's top is at or very near the viewport's top: `isFull` must be `true`, `infoPosition` must be `"absolute"`.
- Visually at that second point: the event name and CTA button sit on top of the now-full-bleed photo, near the bottom of the screen, legible against the strengthened scrim from Task 1 — not clipped, not overlapping the badge in the top-right corner.
- Scroll back up past the threshold: confirm `isFull` flips back to `false` and the info block returns to its normal below-image position (this is the class toggling both ways, not just forward — `classList.toggle`'s second argument already makes this bidirectional, but confirm it live since this is the first point in the plan that exercises scrolling backward).

- [ ] **Step 4: Click the CTA in both states**

Still in the local preview: scroll to the resting state, click "ลงทะเบียนงานนี้" (or the EN equivalent) — confirm it opens the same 4-step registration form as before this plan (the `hero-enter` action and everything downstream of it is untouched by this plan; this step exists to catch a regression, not because the CTA's own behavior was supposed to change). Reload, scroll to the full-bleed/overlay state, click the now-overlaid CTA — confirm the same form opens.

- [ ] **Step 5: Commit**

```bash
git add customer/app.js
git commit -m "onHeroScroll: toggle is-full class for the overlay switch

Part 3/3 of the full-bleed + overlay hero redesign. Adds the ancestor
.hero-event.is-full class once scroll progress reaches ~96%, which
Task 1's CSS uses to move the info block from below the image to an
overlay on top of it. A simple threshold class toggle rather than a
separately-timed transition, per ADR events-checkin-0003 — everything
in this reveal stays a pure function of scroll position."
```

---

## Task 4: Deploy and verify live

**Files:**
- Modify: `docs/app.js`, `docs/styles.css` (regenerated, not hand-edited — see `sync-docs.sh`)

**Interfaces:**
- Consumes: the finished, committed state of `customer/app.js` and `customer/styles.css` from Tasks 1–3.
- Produces: nothing further downstream — this is the terminal task.

- [ ] **Step 1: Rebuild `docs/` from `customer/`**

```bash
cd "$(git rev-parse --show-toplevel)"
sh sync-docs.sh
git status --short
```

Expected: `docs/app.js` and `docs/styles.css` show as modified (mirroring Tasks 1–3's changes to `customer/`), nothing else.

- [ ] **Step 2: Commit the rebuilt `docs/`**

```bash
git add docs/app.js docs/styles.css
git commit -m "Rebuild docs/ for the full-bleed + overlay hero redesign"
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

- [ ] **Step 4: Verify on the live Vercel deployment**

Wait for the auto-deploy (roughly 10-15 seconds after push, matching every prior deploy this session), then load the live URL, clear any stale `localStorage` pass first (this project's picker screen jumps straight to a saved pass if one exists from earlier testing):

```js
localStorage.clear(); sessionStorage.clear(); location.reload();
```

Repeat the same three checks as Task 2 Step 5 and Task 3 Step 3, this time against the live URL instead of the local `file://` copy:
- Console has zero errors at every scroll depth.
- Width/height/radius track the expected curve from rest to full-bleed.
- The info block switches to overlay only near full expansion, and switches back when scrolling up.
- The CTA opens the registration form correctly from both states.

- [ ] **Step 5: Update the spec's Verification plan checklist**

The spec at `docs/superpowers/specs/2026-09-07-hero-fullbleed-overlay-design.md` has a "Verification plan" section with 5 unchecked items. Re-read it, confirm each item was actually exercised by Tasks 1-4 above (it was — items 1-2 by Task 2/3's local checks, item 3 implicitly by Task 3 Step 3's scroll-back-up check reaching the lookup link, item 4 by Task 3 Step 4, item 5 by this task), and mark the plan complete by committing this file unchanged (no edit needed) — its role was to seed this plan, not to be checked off separately.

---

## Self-Review

**Spec coverage:**
- Full-bleed width/height at `p=1` → Task 2.
- Radius rises then eases to 0 → Task 2.
- Breaking out of the 440px column via `left:50%`/`translateX(-50%)` → Task 1.
- Info/CTA overlay switch at `p >= 0.96`, with color overrides and scrim strengthening → Task 1 (CSS) + Task 3 (toggle).
- "No pinning/scroll-jacking" constraint → satisfied by construction: no task adds `position:sticky`, `position:fixed`, or any scroll-event-blocking code; `onHeroScroll()`'s existing rAF-throttled, non-blocking structure is extended, never replaced.
- Verification plan's 5 items → Task 4 Step 4-5.

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N" language above — every step carries the literal code or command to run.

**Type consistency:** `heroWidthPx`, `heroHeightPx`, `heroRadiusPx` are defined once in Task 2 Step 1 and referenced by those exact names in Task 2 Step 3 and nowhere else claims different names for them. `is-full` (the class string) is used identically in Task 1 Step 3's CSS selector and Task 3 Step 1's `classList.toggle` call.
