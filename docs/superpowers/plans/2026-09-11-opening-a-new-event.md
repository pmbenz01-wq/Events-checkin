# Opening a New Event Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use sp-subagent-driven-development (recommended) or sp-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make opening a new 1NEVE event a job that finishes inside the staff console — banner included — and make the customer-facing pages stop saying things that are not true.

**Architecture:** Two repos, no new services. The Apps Script backend gains a banner-upload endpoint that writes into the script owner's Google Drive and returns a public CDN URL; the console gains one new screen that wires the six `svcSetEventProp_` properties that have no UI today; the customer site gains a real consent checkbox, a privacy policy page, and a branded surface for events with no banner yet. The gate app is not touched.

**Tech Stack:** Google Apps Script (V8, `.gs`), Google Drive via `DriveApp`, vanilla ES5 in `staff/staff.js`, vanilla ES2017 modules-free JS in `customer/app.js`, plain CSS. No frameworks, no build step, no test runner — verification is `node --check` plus browser-driven checks against the live deployment.

**Spec:** `C:\Users\wicht\dev\events-checkin\docs\superpowers\specs\2026-09-11-opening-a-new-event-design.md`

**Confirmed mockup:** https://claude.ai/code/artifact/4e9f0c16-8612-4262-b690-c70e489429af

---

## Global Constraints

- **Repos.** Backend + console: `C:\Users\wicht\dev\staff-console`. Customer site: `C:\Users\wicht\dev\events-checkin`. Never edit `staff-console/gate/**` — the gate app is out of scope.
- **`Code.gs` cannot be syntax-checked by extension.** Always `cp backend/Code.gs /tmp/code-check.js && node --check /tmp/code-check.js` (use the session scratchpad, not `/tmp`, on Windows).
- **Deploying `Code.gs` is a separate act.** Editing the file in the repo changes nothing live. Pushing is `clasp push` from `~/dev/staff-console-clasp`, then `clasp create-version`, then `clasp redeploy` on **both** deployments (the public "Anyone" one and the legacy staff one).
- **`org` is never the Organizer.** In this codebase `org` means the *attendee's own employer* (a `Registrations` column, a badge toggle). The company that hires 1NEVE is the **Organizer** and is spelled out in full, always. See `C:\Users\wicht\dev\events-checkin\CONTEXT.md`.
- **`organizer_name` and `organizer_contact` must never leave via `listEvents`.** That endpoint is public and unauthenticated. They travel only inside `svcBootstrap_`, which is behind `requireStaff_`.
- **`image_url` empty means empty.** Never write the default surface's URL into the sheet. Blank must stay distinguishable from "a banner was chosen".
- **All user-facing copy is Thai.** Every Thai string in this plan is the exact string to use — copy it byte for byte, do not re-translate, do not "improve" it. The customer site is bilingual; where a Thai string is added to `customer/app.js` the English sibling is given alongside it and both must land.
- **Never invent a contact address, a policy sentence, or a Drive URL format.** Where this plan says a value must come from the controller, a missing value is a `BLOCKED` status, not a guess.
- **Existing ES5 style in `staff/staff.js`.** `var`, `function`, string concatenation, no template literals, no arrow functions — match the file. `customer/app.js` uses modern syntax and template literals — match that file instead.
- **Commit after every task.** Small commits, present-tense messages, no attribution footer beyond what the repo already uses.

---

## File Structure

### `C:\Users\wicht\dev\staff-console\backend\Code.gs` (modify)

Single-file Apps Script backend, ~1700 lines, already organised as: constants → public endpoints (`listEvents`, `getEventForm`, `register`, `getMyPass`) → `doGet`/`doPost`/`handle_` → staff dispatcher `svc()` → `svc*_` implementations → team access. New code follows that shape: the Drive URL builder and `svcUploadBanner_` go with the other `svc*_` functions, near `svcSetEventProp_`.

### `C:\Users\wicht\dev\staff-console\staff\staff.js` (modify)

Single-file console, ~993 lines, IIFE, ES5, `state` object + `render()` that rebuilds `app.innerHTML` + `bind()` that re-attaches listeners + `act(action, el)` dispatcher. The new screen is one `renderEvent()` function plus entries in `NAV`, `renderPage()`, `loadScreen()`, `bind()` and `act()`.

### `C:\Users\wicht\dev\events-checkin\customer\app.js` (modify)

Single-file customer SPA. `state` + `setState()` + `render()`. Two places render an event image (`viewPick`'s hero at ~line 235 and the registration banner at ~line 387) and both need the default surface.

### `C:\Users\wicht\dev\events-checkin\customer\styles.css` (modify)

Plain CSS, no preprocessor, hard edges, tokens inlined as literal hex. `.img-placeholder` is deleted; `.brand-surface` and consent-checkbox rules are added.

### `C:\Users\wicht\dev\events-checkin\customer\privacy.html` (create)

A standalone static page — **not** part of the SPA. Self-contained: its own `<style>` block using the same literal hex values as `styles.css`. Opened in a new tab from the consent row, so the half-filled registration form is never disturbed.

---

## Task Ordering and Why

Task 1 is a blocking spike: every later task assumes a Drive URL form that has never been tested. Tasks 2–4 build the console path back-to-front (schema → endpoint → UI). Tasks 5–7 are the customer site, sequential because they share `customer/app.js`. Task 8 is independent of all of them. Task 9 deploys and runs the spec's verification plan.

---

### Task 1: Prove the Google Drive hotlink URL

**This task can fail, and failing is a valid outcome.** The whole feature rests on a claim nobody has tested: that a file created by Apps Script and shared "anyone with the link" can be used as an `<img src>` by a browser that is not signed in to Google. If neither candidate URL works, **stop and report** — do not proceed to Task 2, and do not invent a third form.

**Files:**
- Modify: `C:\Users\wicht\dev\staff-console\backend\Code.gs`

**Interfaces:**
- Consumes: nothing.
- Produces: `driveImageUrl_(fileId)` → `String` — the one URL builder every later task calls. Also `probeDriveHotlink()`, a manually-run diagnostic left in the file.

- [ ] **Step 1: Add the probe function**

Add near the other `svc*_` helpers in `Code.gs`:

```javascript
// Run by hand from the Apps Script editor. Creates one tiny public image and
// logs both candidate hotlink forms so they can be opened from a signed-out
// browser. The whole banner feature depends on one of these working; nothing
// in the codebase had ever tested it.
function probeDriveHotlink() {
  // A 1x1 red PNG — smallest thing that still proves an image decoded.
  var b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', 'hotlink-probe.png');
  var file = DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var id = file.getId();
  Logger.log('fileId: ' + id);
  Logger.log('form 1 (lh3): https://lh3.googleusercontent.com/d/' + id);
  Logger.log('form 2 (thumbnail): https://drive.google.com/thumbnail?id=' + id + '&sz=w1600');
  Logger.log('delete when done: DriveApp.getFileById("' + id + '").setTrashed(true)');
  return id;
}
```

- [ ] **Step 2: Push and run it**

```bash
cd ~/dev/staff-console-clasp && clasp push
```

Then in the Apps Script editor, select `probeDriveHotlink` and Run. Authorise the Drive scope if prompted. Copy both URLs out of the execution log.

- [ ] **Step 3: Test both URLs from a signed-out browser**

Open each URL in a private/incognito window that is **not** signed in to any Google account. This is the only test that matters — a signed-in browser can fetch files it has no link-sharing rights to, so testing while signed in proves nothing.

Record for each form: does it render an image, or does it return an HTML sign-in page / 403 / redirect?

Also test the sized variant `https://lh3.googleusercontent.com/d/<id>=w1600` if form 1 works.

- [ ] **Step 4: Decide, or stop**

- Both work → use form 1 (`lh3`), it is CDN-backed and supports the `=w1600` suffix.
- Only one works → use that one.
- **Neither works → STOP.** Report the exact responses seen. Do not start Task 2.

- [ ] **Step 5: Write the chosen builder**

Replace the probe's guesswork with the decided form. Add to `Code.gs`, immediately above `svcSetEventProp_`:

```javascript
// The one place a Drive file id becomes a URL the customer site can load.
// Verified against a signed-out browser before this line was written — see
// probeDriveHotlink(). Everything that renders a banner goes through here, so
// if Google changes the serving host again there is exactly one line to fix.
function driveImageUrl_(fileId) {
  return 'https://lh3.googleusercontent.com/d/' + fileId + '=w1600';
}

// The inverse, used only to clean up a banner being replaced. Returns '' for
// any URL this function did not produce — an Organizer-supplied https link
// pasted in by hand must never be mistaken for a file we own and trashed.
function driveFileIdFromUrl_(url) {
  var m = String(url || '').match(/^https:\/\/lh3\.googleusercontent\.com\/d\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : '';
}
```

If Step 4 chose form 2 instead, `driveImageUrl_` returns
`'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600'` and
`driveFileIdFromUrl_`'s regex becomes
`/^https:\/\/drive\.google\.com\/thumbnail\?id=([A-Za-z0-9_-]+)/`.

- [ ] **Step 6: Trash the probe file**

In the Apps Script editor run the line the probe logged:

```javascript
DriveApp.getFileById("<the id from the log>").setTrashed(true);
```

- [ ] **Step 7: Syntax check and commit**

```bash
cd ~/dev/staff-console
cp backend/Code.gs "$TMPDIR/code-check.js" && node --check "$TMPDIR/code-check.js"
git add backend/Code.gs
git commit -m "feat(backend): verified Drive hotlink URL builder for event banners"
```

Expected: `node --check` prints nothing.

---

### Task 2: Events schema — two new columns, a lazy column adder, and a createEvent that fills every cell

**Files:**
- Modify: `C:\Users\wicht\dev\staff-console\backend\Code.gs` — `EVENTS_HEADERS`, `allEventsRows_`, `listEvents`, `svcCreateEvent_`, `svcSetEventProp_`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `ensureEventCol_(sh, t, col, name)` → `Number` (1-based column index). `allEventsRows_()` now also returns `organizerName` and `organizerContact` on each row; `listEvents()` strips them.

This task fixes spec bugs **1** (createEvent writes 12 values into a 16-column sheet) and **2** (`pdpa` therefore defaults to off).

- [ ] **Step 1: Extend the headers constant**

In `Code.gs`, `EVENTS_HEADERS` currently reads:

```javascript
var EVENTS_HEADERS = ['event_id', 'name', 'date_display', 'place', 'status_label', 'seats_label', 'price_label', 'accent', 'theme', 'open', 'short_label', 'spreadsheet_id', 'hidden', 'image_url', 'pdpa', 'doors_at'];
```

Append the two new columns:

```javascript
var EVENTS_HEADERS = ['event_id', 'name', 'date_display', 'place', 'status_label', 'seats_label', 'price_label', 'accent', 'theme', 'open', 'short_label', 'spreadsheet_id', 'hidden', 'image_url', 'pdpa', 'doors_at', 'organizer_name', 'organizer_contact'];
```

Also update the comment block above it (near line 50, where `image_url` is documented) by adding:

```javascript
// organizer_name / organizer_contact: who commissioned this event. Staff-only —
// these are read by svcBootstrap_ and never by listEvents, because listEvents is
// public and unauthenticated. See ADR events-checkin-0028: the customer-facing
// privacy notice deliberately names nobody, but somebody at 1NEVE still has to
// be able to answer "who gets this event's data" when an attendee asks.
```

- [ ] **Step 2: Add the lazy column adder**

`pdpa` and `doors_at` each hand-roll this inside `svcSetEventProp_`. Replace both with one helper, placed just above `svcSetEventProp_`:

```javascript
// Columns that post-date a live sheet get added on first write rather than
// making setupSheets() a prerequisite — a settings switch that needs a
// maintenance function run first is a switch that looks broken. Returns the
// 1-based column index either way.
function ensureEventCol_(sh, t, col, name) {
  if (col[name]) return col[name];
  var idx = t.headers.length + 1;
  sh.getRange(1, idx).setValue(name);
  t.headers.push(name);
  col[name] = idx;
  return idx;
}
```

- [ ] **Step 3: Make `svcCreateEvent_` write every column**

The `appendRow` inside `svcCreateEvent_` currently passes 12 values. Replace that call:

```javascript
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.EVENTS).appendRow([
      id, name, String(p.date || 'ยังไม่กำหนดวันที่'), String(p.place || ''), 'เปิดรับ',
      'เปิดรับแล้ว', String(p.price || 'ไม่มีค่าใช้จ่าย'), themes[theme], theme, true, name.toUpperCase(), fileId
    ]);
```

with the full 18-value row:

```javascript
    // Every column, not the first twelve. appendRow fills from column 1 and
    // stops, so a short array silently leaves the tail blank — which is how
    // pdpa ended up defaulting to off for every event ever created here, and
    // how image_url ended up unreachable.
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.EVENTS).appendRow([
      id, name, String(p.date || 'ยังไม่กำหนดวันที่'), String(p.place || ''), 'เปิดรับ',
      'เปิดรับแล้ว', String(p.price || 'ไม่มีค่าใช้จ่าย'), themes[theme], theme, true,
      name.toUpperCase(), fileId,
      false,                                    // hidden
      '',                                       // image_url — blank means "no banner yet"
      true,                                     // pdpa — a new event asks for consent
      String(p.doors || ''),                    // doors_at
      String(p.organizerName || ''),            // organizer_name
      String(p.organizerContact || '')          // organizer_contact
    ]);
```

**Do not change `'ยังไม่กำหนดวันที่'` if the file currently reads `'ยังไม่กำหนดวัน'`** — copy whatever string is already there verbatim; this plan quotes it from memory and the file is authoritative.

- [ ] **Step 4: Carry the Organizer through `allEventsRows_`, strip it in `listEvents`**

In `allEventsRows_`, the returned object ends with `doors: o.doors_at || ''`. Add two fields:

```javascript
      doors: o.doors_at || '',
      // Staff-only. svcBootstrap_ passes these straight through; listEvents
      // deletes them below. Anything new added here is public by default, so
      // the deletion list is the thing to keep in step.
      organizerName: o.organizer_name || '',
      organizerContact: o.organizer_contact || ''
```

Then replace `listEvents`:

```javascript
function listEvents() {
  return allEventsRows_()
    .filter(function (e) { return !e.hidden; })
    .map(function (e) {
      // This endpoint answers anyone, with no token. The Organizer's name and
      // contact are recorded for 1NEVE's own use (ADR events-checkin-0028) and
      // must not ride out on a public response.
      var pub = {};
      Object.keys(e).forEach(function (k) {
        if (k === 'organizerName' || k === 'organizerContact') return;
        pub[k] = e[k];
      });
      return pub;
    });
}
```

- [ ] **Step 5: Extend `svcSetEventProp_`**

Inside the row loop, replace the hand-rolled `pdpa` and `doors` column-adding blocks with `ensureEventCol_` calls, guard `image_url`, and add the two Organizer properties:

```javascript
    if (p.pdpa !== undefined) {
      sh.getRange(i + 2, ensureEventCol_(sh, t, col, 'pdpa')).setValue(p.pdpa === true || p.pdpa === 'true');
    }
    if (p.doors !== undefined) {
      sh.getRange(i + 2, ensureEventCol_(sh, t, col, 'doors_at')).setValue(String(p.doors || ''));
    }
    if (p.image !== undefined) {
      sh.getRange(i + 2, ensureEventCol_(sh, t, col, 'image_url')).setValue(String(p.image || ''));
    }
    if (p.organizerName !== undefined) {
      sh.getRange(i + 2, ensureEventCol_(sh, t, col, 'organizer_name')).setValue(String(p.organizerName || ''));
    }
    if (p.organizerContact !== undefined) {
      sh.getRange(i + 2, ensureEventCol_(sh, t, col, 'organizer_contact')).setValue(String(p.organizerContact || ''));
    }
```

Note the `image_url` change is a real fix: the existing line is `sh.getRange(i + 2, col.image_url)` with no guard, which throws an unreadable error on a sheet that predates the column.

`p.name`, `p.date`, `p.place`, `p.theme`, `p.open`, `p.hidden` keep their existing handling — those columns have always existed.

- [ ] **Step 6: Syntax check**

```bash
cd ~/dev/staff-console
cp backend/Code.gs "$TMPDIR/code-check.js" && node --check "$TMPDIR/code-check.js"
```

Expected: no output.

- [ ] **Step 7: Prove the public endpoint is clean**

Push (`clasp push`, `clasp create-version`, `clasp redeploy` on both deployments), then from any browser console:

```javascript
fetch(APPS_SCRIPT_URL, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({ action: "listEvents" })
}).then(r => r.json()).then(r => {
  const leaked = JSON.stringify(r).match(/organizer/i);
  console.log("leaked organizer field:", leaked ? "YES — BUG" : "no");
  console.log(Object.keys(r.data[0]));
});
```

Expected: `leaked organizer field: no`, and the key list contains `doors` but neither `organizerName` nor `organizerContact`.

- [ ] **Step 8: Commit**

```bash
git add backend/Code.gs
git commit -m "feat(backend): Organizer columns, lazy column add, createEvent fills every cell

createEvent wrote 12 values into a 16-column sheet, so hidden, image_url,
pdpa and doors_at were left blank on every event ever made from the console.
pdpa blank meant no consent was asked for and none recorded. Adds
organizer_name and organizer_contact, staff-only and stripped from the public
listEvents response."
```

---

### Task 3: `svcUploadBanner_` — a banner lands in Drive and its URL lands in the sheet

**Files:**
- Modify: `C:\Users\wicht\dev\staff-console\backend\Code.gs` — new `svcUploadBanner_`, one line in `svc()`

**Interfaces:**
- Consumes: `driveImageUrl_(fileId)` and `driveFileIdFromUrl_(url)` from Task 1; `ensureEventCol_` from Task 2.
- Produces: staff action `uploadBanner`, payload `{ eventId: String, dataB64: String, mimeType: String }`, returns `{ url: String }`.

- [ ] **Step 1: Write the endpoint**

Add immediately after `svcSetEventProp_`:

```javascript
// A banner arrives as base64 in the JSON body — Apps Script web apps cannot
// answer a CORS preflight, so multipart is not available and text/plain JSON is
// the only door. The console resizes before sending; this is the backstop.
var BANNER_MAX_BYTES = 1500000;   // 1.5 MB, matching the console's own limit

function svcUploadBanner_(p) {
  var staff = requireStaff_(p.eventId, 'ADMIN');

  var mime = String(p.mimeType || '');
  if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') {
    throw new Error('bad_image_type');
  }
  var b64 = String(p.dataB64 || '');
  if (!b64) throw new Error('missing_image');

  var bytes;
  try {
    bytes = Utilities.base64Decode(b64);
  } catch (decodeErr) {
    throw new Error('bad_image_data');
  }
  if (bytes.length > BANNER_MAX_BYTES) throw new Error('image_too_large');

  var ev = eventById_(p.eventId);
  if (!ev) throw new Error('event_not_found');

  var ext = mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg';
  var blob = Utilities.newBlob(bytes, mime, 'banner-' + p.eventId + '-' + Date.now() + ext);
  var file = DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = driveImageUrl_(file.getId());

  // Write the new URL before touching the old file. If the sheet write throws,
  // the event keeps the banner it had and we have one orphan in Drive — far
  // better than an event whose banner points at a file we just trashed.
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.EVENTS);
  var t = readSheet_(SHEETS.EVENTS);
  var col = {}; t.headers.forEach(function (h, i) { col[h] = i + 1; });
  var wrote = false;
  for (var i = 0; i < t.rows.length; i++) {
    if (t.rows[i][0] !== p.eventId) continue;
    sh.getRange(i + 2, ensureEventCol_(sh, t, col, 'image_url')).setValue(url);
    wrote = true;
    break;
  }
  if (!wrote) {
    try { file.setTrashed(true); } catch (cleanupErr) {
      Logger.log('svcUploadBanner_ orphan cleanup failed for ' + file.getId() + ': ' + cleanupErr);
    }
    throw new Error('event_not_found');
  }

  // Best effort, and only for files this system made. An Organizer-supplied
  // https link typed in by hand returns '' from driveFileIdFromUrl_ and is
  // left alone — trashing somebody else's file would be unrecoverable.
  var oldId = driveFileIdFromUrl_(ev.image);
  if (oldId && oldId !== file.getId()) {
    try { DriveApp.getFileById(oldId).setTrashed(true); } catch (oldErr) {
      Logger.log('svcUploadBanner_ could not trash previous banner ' + oldId + ': ' + oldErr);
    }
  }

  audit_(staff, 'uploadBanner', p.eventId, '', url);
  return { url: url };
}
```

- [ ] **Step 2: Wire it into the staff dispatcher**

In `svc()`, immediately after `case 'setEventProp': data = svcSetEventProp_(p); break;`:

```javascript
      case 'uploadBanner': data = svcUploadBanner_(p); break;
```

- [ ] **Step 3: Confirm `eventById_` exposes the current URL as `.image`**

`svcUploadBanner_` reads `ev.image`. Check what `eventById_` returns — if it maps rows through `allEventsRows_`'s shape the field is `image`; if it returns raw sheet columns the field is `image_url`. **Read the function and use whichever the file actually returns.** This exact mistake (`ev.date` vs `ev.date_display`) has already cost this project one debugging session.

```bash
cd ~/dev/staff-console && awk '/^function eventById_/,/^}/' backend/Code.gs
```

- [ ] **Step 4: Syntax check**

```bash
cd ~/dev/staff-console
cp backend/Code.gs "$TMPDIR/code-check.js" && node --check "$TMPDIR/code-check.js"
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/Code.gs
git commit -m "feat(backend): uploadBanner writes a public Drive file and its URL to the event"
```

---

### Task 4: The "ตั้งค่างาน" console screen

**Files:**
- Modify: `C:\Users\wicht\dev\staff-console\staff\staff.js` — `NAV`, `state`, `renderPage()`, new `renderEvent()`, `bind()`, `act()`, `createEvent()`

**Interfaces:**
- Consumes: staff actions `setEventProp` (existing, now accepting `organizerName` / `organizerContact` / `open` / `doors` / `name` / `date` / `place`) and `uploadBanner` from Task 3.
- Produces: nothing consumed by later tasks.

This task fixes spec bug **7** (no way to rename an event, fix its date, or close registration).

- [ ] **Step 1: Add the nav entry**

`NAV` currently starts:

```javascript
  var NAV = [
    { id: "dash", label: "ภาพรวมสด" },
```

Insert the new screen second:

```javascript
  var NAV = [
    { id: "dash", label: "ภาพรวมสด" },
    { id: "event", label: "ตั้งค่างาน" },
```

- [ ] **Step 2: Add the screen's state**

In the `state` object, alongside `ne`, add:

```javascript
    // Edits in flight on the ตั้งค่างาน screen. Seeded from the chosen event
    // by loadScreen() so the inputs render with what the sheet actually holds.
    es: { name: "", date: "", place: "", organizerName: "", organizerContact: "", doors: "", price: "", error: "", busy: false },
```

- [ ] **Step 3: Seed it when the screen opens**

In `loadScreen()`, add a branch. The event is already in `state.events` from bootstrap, so nothing is fetched:

```javascript
    } else if (s === "event") {
      // No round trip — bootstrap already carries every field this screen edits.
      var e = ev() || {};
      state.es = {
        name: e.name || "", date: e.date || "", place: e.place || "",
        organizerName: e.organizerName || "", organizerContact: e.organizerContact || "",
        doors: e.doors || "", price: e.price || "", error: "", busy: false
      };
      render();
    } else if (s === "team") {
```

- [ ] **Step 4: Add the case to `renderPage()`**

```javascript
      case "event": return renderEvent();
```

- [ ] **Step 5: Write `renderEvent()`**

Place it directly above `renderFields()`:

```javascript
  function renderEvent() {
    var e = ev() || {};
    var admin = can("ADMIN");
    var es = state.es;

    function textRow(id, label, value, hint) {
      return '<div class="field"><div class="field-label">' + esc(label) + "</div>" +
        '<input id="' + id + '" value="' + esc(value) + '"' + (admin ? "" : " disabled") + ' />' +
        (hint ? '<div class="muted" style="font:300 11px/1.5 Prompt,sans-serif;margin-top:4px">' + esc(hint) + "</div>" : "") +
        "</div>";
    }

    function switchRow(actName, label, on, onText, offText, detail) {
      return '<div class="card" style="padding:16px 20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:220px"><div style="font:500 13px Prompt,sans-serif">' + esc(label) + "</div>" +
        '<div class="muted" style="font:300 11.5px/1.5 Prompt,sans-serif;margin-top:3px">' + esc(detail) + "</div></div>" +
        (admin
          ? '<button class="btn-ghost" data-act="' + actName + '" data-on="' + (on ? "0" : "1") + '"' +
            (on ? ' style="border-color:var(--accent);color:var(--accent)"' : "") + ">" +
            esc(on ? onText : offText) + "</button>"
          : '<span class="muted">ต้องเป็น ADMIN</span>') +
        "</div>";
    }

    var open = !!e.open;
    var priceOn = !!(e.price && String(e.price).trim());

    var bannerPreview = e.image
      ? '<img src="' + esc(e.image) + '" alt="" style="width:100%;display:block;aspect-ratio:16/9;object-fit:cover" />'
      : '<div style="width:100%;aspect-ratio:16/9;background:linear-gradient(148deg,#d8482b 0%,#8e3524 34%,#17150f 82%);' +
        'display:flex;align-items:center;justify-content:center;color:rgba(244,241,230,.72);' +
        'font:600 10px Prompt,sans-serif;letter-spacing:.3em">1NEVE</div>';

    var bannerCard = '<div class="card" style="padding:0;overflow:hidden">' + bannerPreview +
      '<div style="padding:16px 20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
      '<div style="flex:1;min-width:200px"><div style="font:500 13px Prompt,sans-serif">ภาพแบนเนอร์</div>' +
      '<div class="muted" style="font:300 11.5px/1.5 Prompt,sans-serif;margin-top:3px">' +
      (e.image
        ? "ใช้ภาพที่อัพโหลดไว้ · ระบบจะย่อให้กว้างสุด 1600px ก่อนส่ง"
        : "ยังไม่ได้ใส่ภาพ · หน้าลูกค้าจะแสดงพื้นผิวของ 1NEVE แทน") +
      "</div>" +
      '<div class="muted" style="font:300 11px/1.5 Prompt,sans-serif;margin-top:6px">' +
      "ของสำคัญในภาพไม่ควรอยู่ครึ่งล่าง เพราะชื่องานและปุ่มลงทะเบียนทับอยู่</div></div>" +
      (admin
        ? '<input type="file" id="banner-file" accept="image/jpeg,image/png,image/webp" style="display:none" />' +
          '<button class="btn-ghost" data-act="banner-pick" style="border-color:var(--accent);color:var(--accent);padding:11px 16px">' +
          (state.es.busy ? "กำลังอัพโหลด…" : (e.image ? "เปลี่ยนภาพ" : "อัพโหลดภาพ")) + "</button>"
        : '<span class="muted">ต้องเป็น ADMIN</span>') +
      "</div></div>";

    return '<div class="split"><div class="split-main">' +
      '<div><div class="page-title">ตั้งค่างาน</div>' +
      '<div class="page-sub">ค่าทั้งหมดของงานนี้อยู่ที่เดียว · ' +
      "ช่องที่ทำเครื่องหมาย <b>เฉพาะภายใน</b> ไม่เคยถูกส่งออกไปหน้าลูกค้า</div></div>" +

      '<div class="card" style="padding:20px">' +
      textRow("es-name", "ชื่องาน", es.name, "") +
      textRow("es-date", "วันที่จัด", es.date, "ข้อความอิสระ เช่น 15 มี.ค. 70") +
      textRow("es-place", "สถานที่", es.place, "") +
      textRow("es-doors", "เวลาเปิดประตู", es.doors, "ข้อความอิสระ พิมพ์บนบัตร · เว้นว่างได้") +
      "</div>" +

      '<div class="card" style="padding:20px">' +
      '<div class="side-kicker" style="margin-bottom:12px">ผู้จัดงาน · เฉพาะภายใน</div>' +
      textRow("es-org-name", "ชื่อผู้จัดงาน", es.organizerName,
        "ลูกค้าไม่เห็นช่องนี้ · มีไว้ให้ตอบได้ว่าใครรับข้อมูลของงานนี้ไป") +
      textRow("es-org-contact", "ผู้ติดต่อผู้จัดงาน", es.organizerContact, "") +
      "</div>" +

      bannerCard +

      switchRow("toggle-open", "เปิดรับลงทะเบียน", open, "เปิดอยู่", "ปิดอยู่",
        open ? "หน้าลูกค้าเปิดให้ลงทะเบียนได้" : "หน้าลูกค้าแสดงว่าปิดรับแล้ว และปุ่มลงทะเบียนกดไม่ได้") +

      '<div class="card" style="padding:16px 20px">' +
      '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:220px"><div style="font:500 13px Prompt,sans-serif">ค่าเข้างาน</div>' +
      '<div class="muted" style="font:300 11.5px/1.5 Prompt,sans-serif;margin-top:3px">' +
      (priceOn ? "แสดงบรรทัดนี้ในข้อมูลงาน" : "ไม่แสดงบรรทัดค่าเข้างานเลย") + "</div></div>" +
      (admin
        ? '<button class="btn-ghost" data-act="toggle-price" data-on="' + (priceOn ? "0" : "1") + '"' +
          (priceOn ? ' style="border-color:var(--accent);color:var(--accent)"' : "") + ">" +
          (priceOn ? "เปิดอยู่" : "ปิดอยู่") + "</button>"
        : '<span class="muted">ต้องเป็น ADMIN</span>') +
      "</div>" +
      (priceOn ? '<div style="margin-top:14px">' + textRow("es-price", "ข้อความที่แสดง", es.price, "เช่น ฿500 หรือ ฟรีสำหรับสมาชิก") + "</div>" : "") +
      "</div>" +

      (es.error ? '<div class="err">' + esc(es.error) + "</div>" : "") +
      (admin
        ? '<div><button class="btn-gold" data-act="event-save">บันทึกการตั้งค่า</button></div>'
        : '<div class="muted">ต้องเป็น ADMIN จึงจะบันทึกได้</div>') +
      "</div>" +

      '<div class="split-side"><div class="side-kicker">หน้าลูกค้าจะเห็น</div>' +
      '<div class="card" style="padding:0;overflow:hidden">' + bannerPreview +
      '<div style="padding:18px 20px">' +
      '<div class="mono" style="font-size:9.5px;letter-spacing:.26em;color:var(--accent)">' + esc(es.date || "") + "</div>" +
      '<div class="serif" style="font-size:22px;font-weight:200;line-height:1.2;margin-top:9px">' + esc(es.name || "") + "</div>" +
      '<div class="muted" style="font:300 12px Prompt,sans-serif;margin-top:4px">' + esc(es.place || "") + "</div>" +
      '<div style="margin-top:14px;padding:12px 0;text-align:center;font:600 12px Prompt,sans-serif;' +
      (open ? "background:var(--accent);color:#fff" : "background:#ded8c6;color:#57533f") + '">' +
      (open ? "ลงทะเบียน" : "ปิดรับแล้ว") + "</div>" +
      "</div></div></div></div>";
  }
```

- [ ] **Step 6: Bind the inputs and the file picker**

In `bind()`, after the existing `bindInput("ne-place", ...)` line:

```javascript
    bindInput("es-name", state.es, "name");
    bindInput("es-date", state.es, "date");
    bindInput("es-place", state.es, "place");
    bindInput("es-doors", state.es, "doors");
    bindInput("es-price", state.es, "price");
    bindInput("es-org-name", state.es, "organizerName");
    bindInput("es-org-contact", state.es, "organizerContact");

    var bf = document.getElementById("banner-file");
    if (bf) bf.addEventListener("change", function (e2) {
      var f = e2.target.files && e2.target.files[0];
      if (f) uploadBanner(f);
    });
```

- [ ] **Step 7: Add the actions**

In `act()`, alongside the other cases:

```javascript
      case "banner-pick": {
        var picker = document.getElementById("banner-file");
        if (picker) picker.click();
        break;
      }
      case "toggle-open": {
        var wantOpen = el.dataset.on === "1";
        api("setEventProp", { eventId: state.eventId, open: wantOpen }).then(function () {
          var cur = ev(); if (cur) cur.open = wantOpen;
          flash(wantOpen ? "เปิดรับลงทะเบียนแล้ว" : "ปิดรับลงทะเบียนแล้ว");
          render();
        }).catch(fail);
        break;
      }
      case "toggle-price": {
        var wantPrice = el.dataset.on === "1";
        // Off writes an empty string — the customer site skips a fact row whose
        // value is blank, so there is no separate "show price" column to keep
        // in step with the text itself.
        var text = wantPrice ? (state.es.price || "ไม่มีค่าใช้จ่าย") : "";
        api("setEventProp", { eventId: state.eventId, price: text }).then(function () {
          var cur = ev(); if (cur) cur.price = text;
          state.es.price = text;
          render();
        }).catch(fail);
        break;
      }
      case "event-save": saveEventSettings(); break;
```

- [ ] **Step 8: Write `saveEventSettings()` and `uploadBanner()`**

Place both directly above `createEvent()`:

```javascript
  function saveEventSettings() {
    var es = state.es;
    if (!es.name.trim()) { es.error = "กรุณากรอกชื่องาน"; render(); return; }
    es.error = "";
    api("setEventProp", {
      eventId: state.eventId,
      name: es.name.trim(),
      date: es.date.trim(),
      place: es.place.trim(),
      doors: es.doors.trim(),
      organizerName: es.organizerName.trim(),
      organizerContact: es.organizerContact.trim()
    }).then(function () {
      var cur = ev();
      if (cur) {
        cur.name = es.name.trim(); cur.date = es.date.trim(); cur.place = es.place.trim();
        cur.doors = es.doors.trim();
        cur.organizerName = es.organizerName.trim();
        cur.organizerContact = es.organizerContact.trim();
      }
      flash("บันทึกแล้ว");
      render();
    }).catch(function (e2) { es.error = String(e2.message || e2); render(); });
  }

  var BANNER_SRC_MAX = 12 * 1024 * 1024;   // reject before we even try to decode
  var BANNER_OUT_MAX = 1500000;            // must match BANNER_MAX_BYTES in Code.gs
  var BANNER_MAX_W = 1600;

  // Resizing happens here, not on the server. A phone photo is 3-5 MB and grows
  // by a third again in base64; sending that through an Apps Script body is a
  // risk taken for nothing, and a 5 MB hero is the page-load problem this
  // project already had once. 1600px is wider than the hero ever renders.
  function uploadBanner(file) {
    var es = state.es;
    if (file.size > BANNER_SRC_MAX) {
      es.error = "ไฟล์ใหญ่เกินไป (เกิน 12 MB) กรุณาย่อก่อนอัพโหลด";
      render(); return;
    }
    es.error = ""; es.busy = true; render();

    var reader = new FileReader();
    reader.onerror = function () { es.busy = false; es.error = "อ่านไฟล์ไม่สำเร็จ"; render(); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { es.busy = false; es.error = "ไฟล์นี้ไม่ใช่รูปภาพที่เปิดได้"; render(); };
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (w > BANNER_MAX_W) { h = Math.round(h * BANNER_MAX_W / w); w = BANNER_MAX_W; }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        var b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        // base64 carries 3 bytes per 4 characters; padding makes this an
        // over-estimate by at most two bytes, which is the safe direction.
        if (b64.length * 3 / 4 > BANNER_OUT_MAX) {
          es.busy = false;
          es.error = "ย่อแล้วยังใหญ่เกิน 1.5 MB กรุณาใช้ภาพอื่น";
          render(); return;
        }
        api("uploadBanner", { eventId: state.eventId, dataB64: b64, mimeType: "image/jpeg" })
          .then(function (r) {
            var cur = ev(); if (cur) cur.image = r.url;
            es.busy = false;
            flash("อัพโหลดภาพแล้ว");
            render();
          })
          .catch(function (e2) {
            es.busy = false;
            var m = String(e2.message || e2);
            es.error =
              m.indexOf("image_too_large") >= 0 ? "ไฟล์ใหญ่เกินไป" :
              m.indexOf("bad_image_type") >= 0 ? "รองรับเฉพาะ JPG PNG และ WebP" :
              m.indexOf("bad_image_data") >= 0 ? "ข้อมูลภาพเสียหาย" : m;
            render();
          });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
```

- [ ] **Step 9: Send new events to the settings screen**

In `createEvent()`, the success handler sets `state.screen = "fields";`. Change it to:

```javascript
        state.screen = "event";
```

so a freshly created event lands where its banner and Organizer are set.

- [ ] **Step 10: Syntax check**

```bash
cd ~/dev/staff-console && node --check staff/staff.js
```

Expected: no output.

- [ ] **Step 11: Commit**

```bash
git add staff/staff.js
git commit -m "feat(console): ตั้งค่างาน screen — banner upload, Organizer, open and price switches

Six properties svcSetEventProp_ has always accepted had no UI: name, date,
place, open, doors, image. An event could not be renamed or closed after
creation. Banners are resized in the browser to 1600px before upload."
```

---

### Task 5: The default brand surface replaces the fake drop zone

**Files:**
- Modify: `C:\Users\wicht\dev\events-checkin\customer\app.js` — the `hint` strings in both locales, the hero image branch (~line 235), the form banner branch (~line 387)
- Modify: `C:\Users\wicht\dev\events-checkin\customer\styles.css` — delete `.img-placeholder`, add `.brand-surface`

**Interfaces:**
- Consumes: nothing.
- Produces: `brandSurfaceHtml()` → `String`, used by both image call sites.

This task fixes spec bug **6** and implements ADR events-checkin-0024, variant **C — ไล่เฉดแบรนด์**.

- [ ] **Step 1: Add the shared helper**

In `customer/app.js`, next to `esc()`:

```javascript
  // What an event with no banner shows. A designed surface, not a fault: the
  // hatch swatch it replaces read as a broken image and its caption invited
  // people to drop a file on something that could never receive one.
  // The mark sits in the middle band on purpose — .hero-media-scrim darkens
  // the bottom and .hero-topshade the top 120px, so the middle is the only
  // part a surface actually gets to show. See ADR events-checkin-0024.
  function brandSurfaceHtml() {
    return `<div class="brand-surface" aria-hidden="true">
      <span class="bs-ghost">1N</span>
      <span class="bs-mark">1NEVE</span>
      <span class="bs-hair"></span>
    </div>`;
  }
```

- [ ] **Step 2: Use it at the hero**

Replace:

```javascript
            ${e.image ? `<img class="hero-img" src="${esc(e.image)}" alt="">` : `<div class="img-placeholder">${esc(c.hint)}</div>`}
```

with:

```javascript
            ${e.image ? `<img class="hero-img" src="${esc(e.image)}" alt="">` : brandSurfaceHtml()}
```

- [ ] **Step 3: Use it at the registration banner**

Replace:

```javascript
        ${ev.image ? `<img class="ask-banner-img" src="${esc(ev.image)}" alt="">` : `<div class="img-placeholder">${esc(c.pick.hint)}</div>`}
```

with:

```javascript
        ${ev.image ? `<img class="ask-banner-img" src="${esc(ev.image)}" alt="">` : brandSurfaceHtml()}
```

- [ ] **Step 4: Delete the hint strings from both locales**

In the Thai copy object, remove `hint: "วางรูปงานที่นี่",` — leave `loading` and everything else untouched.
In the English copy object, remove `hint: "Drop the event photo",`.

Then confirm nothing else reads them:

```bash
cd ~/dev/events-checkin && grep -n "hint" customer/app.js
```

Expected: no match for the removed keys. If `c.pick.hint` or `c.hint` still appears anywhere, that call site was missed — fix it before moving on.

- [ ] **Step 5: Replace the CSS**

In `customer/styles.css`, delete both `.img-placeholder` rules (the long one near line 24 and `.hero-media .img-placeholder{transition:none}` near line 49). Add in their place:

```css
/* -- shared: the surface an event with no banner gets (ADR 0024, variant C) -- */
.brand-surface{position:absolute;inset:0;overflow:hidden;
  background:linear-gradient(148deg,#d8482b 0%,#8e3524 34%,#17150f 82%)}
.brand-surface .bs-ghost{position:absolute;top:14%;right:-7%;
  font:600 clamp(72px,26vw,140px)/1 Prompt,sans-serif;letter-spacing:-.05em;
  color:rgba(244,241,230,.085);pointer-events:none}
.brand-surface .bs-mark{position:absolute;top:44%;left:22px;
  font:600 10px/1 Prompt,sans-serif;letter-spacing:.3em;color:rgba(244,241,230,.72)}
.brand-surface .bs-hair{position:absolute;top:calc(44% + 22px);left:22px;
  width:44px;height:1px;background:rgba(244,241,230,.5)}
.hero-media .brand-surface{transition:none}
```

- [ ] **Step 6: Syntax check**

```bash
cd ~/dev/events-checkin && node --check customer/app.js
```

Expected: no output.

- [ ] **Step 7: Look at it**

Serve the customer folder and open an event with a blank `image_url` at a 390×760 viewport. Confirm: the gradient runs corner to corner, the `1NEVE` mark is legible in the middle band and not swallowed by either shade, and the event name over the bottom is as readable as it was over a photo.

- [ ] **Step 8: Commit**

```bash
git add customer/app.js customer/styles.css
git commit -m "feat(customer): branded surface for events with no banner yet

Replaces .img-placeholder, whose hatch pattern read as a broken image and
whose caption — วางรูปงานที่นี่ — invited a drop that was never wired to
anything. ADR events-checkin-0024."
```

---

### Task 6: Two places the customer page says something untrue

**Files:**
- Modify: `C:\Users\wicht\dev\events-checkin\customer\app.js` — the `pick-fact` builder (~line 227), the status badge (~line 230 and ~line 237)

**Interfaces:**
- Consumes: `brandSurfaceHtml()` exists from Task 5 but is not used here.
- Produces: nothing.

This task fixes spec bugs **8** and **9**.

- [ ] **Step 1: Skip empty fact rows**

The current builder always emits four rows:

```javascript
        [c.facts[0], e.date], [c.facts[1], e.place], [c.facts[2], e.seats], [c.facts[3], e.price]
      ].map(([k, v]) => `<div class="pick-fact"><span class="k">${esc(k)}</span><span>${esc(v)}</span></div>`).join("");
```

Filter first, so turning the price line off actually removes the line rather than leaving a labelled blank:

```javascript
        [c.facts[0], e.date], [c.facts[1], e.place], [c.facts[2], e.seats], [c.facts[3], e.price]
      ].filter(([, v]) => String(v || "").trim())
       .map(([k, v]) => `<div class="pick-fact"><span class="k">${esc(k)}</span><span>${esc(v)}</span></div>`).join("");
```

- [ ] **Step 2: Make the status badge tell the truth**

The badge's colour already follows `e.open`:

```javascript
      const badgeBg = esc(e.open ? e.accent : "#ded8c6");
```

but its text does not — `e.status` is `status_label`, which `svcCreateEvent_` hardcodes to `เปิดรับ` forever. So closing registration produced a grey badge still reading *เปิดรับ*.

Just above `badgeBg`, add:

```javascript
      // status_label is the wording for an open event. A closed one says so,
      // whatever the sheet holds — a grey pill still reading เปิดรับ is the
      // page contradicting its own disabled button.
      const badgeText = e.open ? (e.status || "เปิดรับ") : "ปิดรับแล้ว";
```

and change the badge element from `${esc(e.status)}` to `${esc(badgeText)}`.

- [ ] **Step 3: Check for an English sibling**

```bash
cd ~/dev/events-checkin && grep -n "เปิดรับ\|ปิดรับ" customer/app.js
```

`status_label` is sheet data and is not translated today, so the closed wording stays Thai for consistency with the open wording it replaces. If this grep shows the copy objects already carry open/closed labels per language, use those keys instead of the literals above.

- [ ] **Step 4: Syntax check**

```bash
cd ~/dev/events-checkin && node --check customer/app.js
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add customer/app.js
git commit -m "fix(customer): drop empty fact rows, and say ปิดรับแล้ว when registration is closed"
```

---

### Task 7: A consent checkbox that gates the button, and a privacy policy that exists

**BLOCKING INPUT:** section 7 of the policy is 1NEVE's own contact channel and this plan does not know it. **Do not invent one, do not write "TBD", do not ship the page without it.** If the controller has not supplied an email address or phone number with this task's brief, return `BLOCKED` and ask for it. Everything else in this task can be written while waiting.

**Files:**
- Create: `C:\Users\wicht\dev\events-checkin\customer\privacy.html`
- Modify: `C:\Users\wicht\dev\events-checkin\customer\app.js` — copy objects, the `pdpa` block (~line 450), its placement (~line 474), `state`, `act()`, `submit()` (~line 726)
- Modify: `C:\Users\wicht\dev\events-checkin\customer\styles.css` — consent row, disabled button

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

This task fixes spec bug **3** and implements ADRs events-checkin-0027 and 0028.

- [ ] **Step 1: Write the policy page**

Create `customer/privacy.html`. It is a plain static page, not part of the SPA, opened in a new tab. Use the site's literal colours: paper `#f4f1e6`, ink `#17150f`, accent `#d8482b`, muted `#7d7767`, rule `#ddd7c4`.

```html
<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>นโยบายข้อมูลส่วนบุคคล · 1NEVE</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@200;300;400;600&display=swap">
<style>
*{box-sizing:border-box}
body{margin:0;background:#f4f1e6;color:#17150f;
  font:300 15px/1.75 Prompt,system-ui,sans-serif;padding:0 22px}
.wrap{max-width:680px;margin:0 auto;padding-block:48px 72px}
.kicker{font:600 9.5px Prompt,sans-serif;letter-spacing:.26em;color:#d8482b;text-transform:uppercase}
h1{font:200 32px/1.2 Prompt,sans-serif;margin:12px 0 0;text-wrap:balance}
.intro{margin:16px 0 0;color:#7d7767;max-width:60ch}
section{margin-top:34px;padding-top:26px;border-top:1px solid #ddd7c4}
h2{font:400 17px/1.35 Prompt,sans-serif;margin:0 0 10px}
p{margin:0 0 12px;max-width:62ch}
p:last-child{margin-bottom:0}
ul{margin:0 0 12px;padding-left:20px;max-width:62ch}
li{margin-bottom:6px}
b{font-weight:400;color:#17150f}
a{color:#d8482b;text-decoration:none}
a:hover{color:#b13a22}
.back{display:inline-block;margin-top:40px;font:400 13px Prompt,sans-serif}
</style>
</head>
<body>
<div class="wrap">
  <div class="kicker">1NEVE</div>
  <h1>นโยบายข้อมูลส่วนบุคคล</h1>
  <p class="intro">นโยบายฉบับนี้ใช้กับทุกงานที่ลงทะเบียนผ่านระบบของ 1NEVE
    อธิบายว่าเราเก็บข้อมูลอะไร เพื่ออะไร ใครได้รับไปบ้าง และคุณทำอะไรกับข้อมูลของตัวเองได้</p>

  <section>
    <h2>1. ใครเป็นผู้ควบคุมข้อมูล</h2>
    <p><b>ผู้จัดงานของงานที่คุณลงทะเบียน</b> เป็นผู้กำหนดว่าจะเก็บข้อมูลอะไร
      และจะนำไปใช้อย่างไร</p>
    <p><b>1NEVE</b> เป็นผู้ให้บริการระบบลงทะเบียนและเช็คอินในนามของผู้จัดงาน
      เราไม่ได้นำข้อมูลของคุณไปใช้เพื่อวัตถุประสงค์ของเราเอง</p>
    <p>หากต้องการทราบว่าใครเป็นผู้จัดงานของงานใด ติดต่อ 1NEVE ตามช่องทางในข้อ 7</p>
  </section>

  <section>
    <h2>2. เราเก็บอะไรบ้าง</h2>
    <ul>
      <li>ชื่อ–นามสกุล อีเมล และเบอร์โทรศัพท์</li>
      <li>ข้อมูลเพิ่มเติมตามที่ผู้จัดงานกำหนดไว้ในแบบฟอร์มของงานนั้น</li>
      <li>วันและเวลาที่คุณลงทะเบียน</li>
      <li>วันเวลาและประตูที่คุณเช็คอินหน้างาน และจำนวนครั้งที่บัตรถูกสแกน</li>
    </ul>
  </section>

  <section>
    <h2>3. ใช้ทำอะไร</h2>
    <ul>
      <li>ออกบัตรเข้างานและรหัส QR ให้คุณ</li>
      <li>ยืนยันตัวตนของคุณที่ประตูในวันงาน</li>
      <li>ส่งข้อมูลการลงทะเบียนให้ผู้จัดงาน</li>
    </ul>
  </section>

  <section>
    <h2>4. ใครได้รับข้อมูลไปบ้าง</h2>
    <p><b>ผู้จัดงาน</b> ได้รับข้อมูลการลงทะเบียนของงานนั้นทั้งชุด
      การนำไปใช้ต่อหลังจากนั้นอยู่ในความรับผิดชอบของผู้จัดงาน</p>
    <p><b>Google</b> ในฐานะผู้ให้บริการโครงสร้างพื้นฐานที่ข้อมูลถูกจัดเก็บไว้</p>
    <p>เราไม่ขายข้อมูลของคุณ และไม่ส่งให้บุคคลอื่นนอกจากที่ระบุไว้ข้างต้น</p>
  </section>

  <section>
    <h2>5. เก็บไว้นานแค่ไหน</h2>
    <p>เก็บไว้จนกว่าคุณหรือผู้จัดงานจะแจ้งให้ลบ
      <b>ระบบไม่ได้ลบข้อมูลตามกำหนดเวลาโดยอัตโนมัติ</b></p>
  </section>

  <section>
    <h2>6. สิทธิของคุณ</h2>
    <p>คุณขอดู ขอแก้ไข ขอลบข้อมูลของคุณ หรือขอถอนความยินยอมได้
      โดยติดต่อ 1NEVE ตามช่องทางในข้อ 7 เราจะประสานกับผู้จัดงานของงานนั้นให้</p>
    <p>เมื่อลบแล้ว ชื่อ อีเมล เบอร์โทรศัพท์ และคำตอบในแบบฟอร์มจะถูกลบออกจากระบบ
      และบัตรเข้างานใบนั้นจะใช้ไม่ได้อีก</p>
  </section>

  <section>
    <h2>7. ติดต่อเรา</h2>
    <p>CONTACT_GOES_HERE</p>
  </section>

  <a class="back" href="./index.html">← กลับหน้าลงทะเบียน</a>
</div>
</body>
</html>
```

Replace `CONTACT_GOES_HERE` with the value supplied in the brief. **If no value was supplied, this task is `BLOCKED` — say so and stop.**

- [ ] **Step 2: Add the consent copy to both locales**

In the Thai copy object, next to the existing `pdpaNotice`, add:

```javascript
      consentAccept: "ยอมรับ",
      consentPolicy: "นโยบายข้อมูลส่วนบุคคล",
```

In the English copy object:

```javascript
      consentAccept: "I accept the",
      consentPolicy: "Privacy Policy",
```

Leave `pdpaNotice` and `consent` in place for now; Step 7 removes whichever is left unused.

- [ ] **Step 3: Add the checkbox to state**

In the `state` object add `consent: false`. Reset it wherever the form is reset — the same place `vals` and `errors` are cleared when a new event is picked.

- [ ] **Step 4: Render the consent row above the actions, not below**

The current block builds the note and drops it *after* `.ask-actions`:

```javascript
    const pdpa = (submits && ev.pdpa)
      ? `<div class="pdpa-note">${esc(c.pdpaNotice)}</div>` : "";
```

```javascript
      <div class="ask-actions">
        <div class="back-btn" data-action="back">←</div>
        <div class="next-btn" data-action="next">${esc(submits ? c.finish : c.next)}</div>
      </div>
      ${pdpa}
```

Replace the builder with a real control:

```javascript
    // A tick, not a sentence under a button. consent_at used to be stamped for
    // anyone who pressed ยืนยัน on an event with the switch on — a record of
    // an act nobody performed. ADR events-checkin-0027.
    const needsConsent = submits && ev.pdpa;
    const pdpa = needsConsent
      ? `<label class="consent-row">
          <input type="checkbox" class="consent-box" data-action="consent" ${state.consent ? "checked" : ""}>
          <span>${esc(c.consentAccept)} <a href="./privacy.html" target="_blank" rel="noopener">${esc(c.consentPolicy)}</a></span>
        </label>`
      : "";
```

and move it above the actions, marking the button when it is not yet allowed:

```javascript
      ${pdpa}
      <div class="ask-actions">
        <div class="back-btn" data-action="back">←</div>
        <div class="next-btn ${needsConsent && !state.consent ? "is-disabled" : ""}" data-action="next">${esc(submits ? c.finish : c.next)}</div>
      </div>
```

The policy link carries `target="_blank"` deliberately: this is a single-page app, so navigating in place would throw away a half-filled form.

- [ ] **Step 5: Handle the tick, and refuse the submit without it**

In the action dispatcher, beside `case "next":`:

```javascript
      case "consent": setState({ consent: !state.consent }); break;
```

Inputs re-render from `state.vals`, so the re-render this triggers keeps every typed value.

Then in `next()`, before it decides to submit, refuse when the box is unticked. Find the branch that calls `submit()` and guard it:

```javascript
    const ev = state.events[state.evIdx];
    if (ev && ev.pdpa && !state.consent) return;
```

- [ ] **Step 6: Send the real value**

In `submit()`, replace:

```javascript
        consent: !!ev.pdpa,
```

with:

```javascript
        // The checkbox's own state. The server checks again — consent_required
        // becomes reachable for the first time, because until now the client
        // sent true whenever the server would have demanded it.
        consent: !!state.consent,
```

and delete the two-line comment above it that described the old behaviour.

- [ ] **Step 7: Remove the dead notice string**

```bash
cd ~/dev/events-checkin && grep -n "pdpaNotice\|c\.consent\b" customer/app.js
```

Delete `pdpaNotice` from both locales if nothing reads it any more. Same for the older `consent:` copy string if it is now unused. Leave `state.consent` alone — that is the checkbox.

- [ ] **Step 8: Style the row and the disabled button**

Append to `customer/styles.css`:

```css
/* -- consent -- */
.consent-row{display:flex;gap:11px;align-items:flex-start;padding:0 26px;margin-top:18px;
  font:300 13px/1.5 Prompt,sans-serif;cursor:pointer}
.consent-box{appearance:none;flex:0 0 auto;width:19px;height:19px;margin:0;
  border:1px solid #bdb6a1;background:#fff;cursor:pointer;position:relative}
.consent-box:checked{background:#d8482b;border-color:#d8482b}
.consent-box:checked::after{content:"";position:absolute;left:6px;top:2px;
  width:5px;height:10px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.consent-box:focus-visible{outline:2px solid #d8482b;outline-offset:2px}
.next-btn.is-disabled{opacity:.42;pointer-events:none}
```

`pointer-events:none` is belt; the `next()` guard in Step 5 is braces. Both are needed — the guard is what actually protects the submit, because CSS can be turned off.

- [ ] **Step 9: Syntax check**

```bash
cd ~/dev/events-checkin && node --check customer/app.js
```

Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add customer/app.js customer/styles.css customer/privacy.html
git commit -m "feat(customer): real consent checkbox and a privacy policy that exists

consent: !!ev.pdpa meant the app ticked the box on the attendee's behalf and
stamped consent_at for an act nobody performed. The notice now points at a
page that exists rather than at an organiser policy that never did.
ADRs events-checkin-0027 and 0028."
```

---

### Task 8: Deleting an attendee actually deletes them

**Files:**
- Modify: `C:\Users\wicht\dev\staff-console\backend\Code.gs` — `svcDeleteAttendee_`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

This task fixes spec bugs **4** and **5**, and is the precondition ADR events-checkin-0029 names: a retention policy of "until asked" is only honest if asking works.

- [ ] **Step 1: Understand what is wrong before changing it**

Today `svcDeleteAttendee_` sets `status = 'deleted'` in the event's own file and stops. Two consequences:

1. `full_name`, `email`, `phone`, `org` and `answers_json` stay in the row in full.
2. The `AllRegistrations` mirror in the Overview file is never touched — and `getMyPass` reads *that* table while filtering `status !== 'deleted'`. It is filtering a column nothing updates, so a deleted attendee still finds their pass by phone number.

- [ ] **Step 2: Replace the function**

```javascript
// Erasure, not a strikethrough. ADR events-checkin-0029 publishes "kept until
// someone asks for it to be gone", which is only true if asking works.
// The identifying columns are cleared; reg_id, event_id, status, registered_at
// and checked_in_at stay, so last year's attendance numbers do not move.
// badge_code and qr_token are cleared too — a pass whose owner asked to be
// forgotten must not still open a door.
function svcDeleteAttendee_(p) {
  var staff = requireStaff_(p.eventId, 'ADMIN');
  var nowIso = new Date().toISOString();
  var wipe = ['full_name', 'email', 'phone', 'org', 'answers_json', 'badge_code', 'qr_token'];

  // Under the same script lock register() takes, because this clears the very
  // columns a concurrent registration is appending.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('busy');

  var found = false;
  try {
    // 1. The event's own file — the source of truth.
    var t = readSheet_(SHEETS.REGISTRATIONS, openEventFile_(p.eventId));
    var col = {}; t.headers.forEach(function (h, i) { col[h] = i + 1; });
    for (var i = 0; i < t.rows.length; i++) {
      var o = rowToObj_(t.headers, t.rows[i]);
      if (o.reg_id !== p.regId) continue;
      wipe.forEach(function (name) {
        if (col[name]) t.sheet.getRange(i + 2, col[name]).setValue('');
      });
      t.sheet.getRange(i + 2, col.status).setValue('deleted');
      t.sheet.getRange(i + 2, col.updated_at).setValue(nowIso);
      t.sheet.getRange(i + 2, col.updated_by).setValue(staff.email);
      found = true;
      break;
    }
    if (!found) throw new Error('not_found');

    // 2. The Overview mirror — what getMyPass actually reads. Best effort for
    // the same reason register()'s mirror write is: the source of truth is
    // already correct, and a mirror failure must be visible in the log rather
    // than undo a deletion the operator was told had happened.
    try {
      var m = readSheet_(SHEETS.ALL_REG);
      var mcol = {}; m.headers.forEach(function (h, i) { mcol[h] = i + 1; });
      for (var j = 0; j < m.rows.length; j++) {
        if (rowToObj_(m.headers, m.rows[j]).reg_id !== p.regId) continue;
        wipe.forEach(function (name) {
          if (mcol[name]) m.sheet.getRange(j + 2, mcol[name]).setValue('');
        });
        m.sheet.getRange(j + 2, mcol.status).setValue('deleted');
        break;
      }
    } catch (mirrorErr) {
      Logger.log('AllRegistrations erase failed for ' + p.regId + ': ' + mirrorErr);
    }
  } finally {
    lock.releaseLock();
  }

  audit_(staff, 'deleteAttendee', p.eventId, p.regId, '');
  return { ok: true };
}
```

Note the audit call no longer passes `o.full_name` — writing the name into the audit log would keep a copy of the thing just erased.

- [ ] **Step 3: Confirm `readSheet_` returns a `sheet` handle for the mirror**

The code above uses `m.sheet`. The event-file branch already relies on `t.sheet`, so the shape exists — but confirm `readSheet_(SHEETS.ALL_REG)` with no second argument returns the same shape:

```bash
cd ~/dev/staff-console && awk '/^function readSheet_/,/^}/' backend/Code.gs
```

- [ ] **Step 4: Syntax check**

```bash
cd ~/dev/staff-console
cp backend/Code.gs "$TMPDIR/code-check.js" && node --check "$TMPDIR/code-check.js"
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/Code.gs
git commit -m "fix(backend): deleting an attendee erases them from both tables

status='deleted' left name, email and phone in the row untouched and never
reached the AllRegistrations mirror — which is the table getMyPass reads,
filtering a status column nothing updated. A deleted attendee could still
look up their own pass by phone number."
```

---

### Task 9: Deploy and run the spec's verification plan

**Files:** none — verification only.

**Interfaces:**
- Consumes: everything from Tasks 1–8.
- Produces: a pass/fail record for each of the spec's 14 steps.

- [ ] **Step 0: The blocking gate — refuse to deploy with the contact placeholder in place**

`customer/privacy.html` ships section 7 with the literal `CONTACT_PENDING_1NEVE`
standing in for 1NEVE's real contact channel, which nobody has supplied yet. The
policy page is linked from the consent checkbox on every registration form, so
that marker must never reach a customer.

Run this **before** anything is pushed. Vercel deploys on push, so a check placed
after Step 1 would run when the marker is already live:

```bash
cd ~/dev/events-checkin
if grep -rn "CONTACT_PENDING_1NEVE" customer/; then
  echo "BLOCKED: the privacy policy still has the contact placeholder. Get the"
  echo "real address from the human partner and replace it before deploying."
  exit 1
fi
```

Expected: no output and no exit. If it prints, **stop** — this is not a step to
work around.

- [ ] **Step 1: Push the customer site first**

The three surfaces deploy independently, and the order is not a preference. All
three call one pinned Apps Script deployment, so a partial deploy is a real state
the system can sit in for minutes.

**Customer site first, because it is the only one that is safe in every
direction.** It reads nothing the old backend does not already send: the brand
surface, the empty-fact-row filter and the honest status pill are all pure
front-end, and the consent checkbox sends `consent: true` exactly where the old
backend would have inferred it.

```bash
cd ~/dev/events-checkin && git push origin open-new-event
```

Then merge to `main` (or push `main` directly if that is how this project
deploys) — Vercel builds the production branch. **Check once and do not poll:** a
wait loop against Vercel got this user's home IP challenged by the firewall, and
the same class of mitigation has since been seen on `script.google.com`.

- [ ] **Step 2: Push and redeploy the backend second**

This must land **before** the console, not after. The console's new settings
screen sends `organizerName`, `organizerContact` and `price` to `setEventProp`.
The old backend reads only `theme, open, hidden, pdpa, doors, image, name, date,
place` — it **silently ignores** unknown properties and returns `{ok:true}`. So a
console deployed ahead of the backend would flash บันทึกแล้ว, update its own
local copy, and store nothing. A staff member would record the Organizer's
contact — the single reason those fields exist under ADR 0028 — and lose it
without any error. `uploadBanner` at least fails loudly with
`unknown_action:uploadBanner`; the settings fields do not.

```bash
cp ~/dev/staff-console/backend/Code.gs ~/dev/staff-console-clasp/CODE.js
cd ~/dev/staff-console-clasp && clasp push -f && clasp create-version && clasp redeploy
```

`clasp push` moves HEAD only. The live deployments are **pinned to a version**, so
nothing changes for customers until `clasp redeploy` runs. Redeploy **both**
deployments — the "customer api" one that all three sites actually call, and the
legacy "staff console" one. A green `clasp push` with no redeploy serves the old
code, which is exactly how two commits were silently swallowed on this project
before.

Note the window this step opens in the other direction: once the backend is live,
new events are created with `pdpa = true`, and any customer bundle older than
Step 1's would still send `consent: !!ev.pdpa` — stamping `consent_at` for an act
nobody performed, which is ADR 0027's exact defect recreated by deploy order.
That window is closed by having done Step 1 first.

- [ ] **Step 3: Push the console last**

```bash
cd ~/dev/staff-console && git push origin open-new-event
```

Then merge to `main` as above.

- [ ] **Step 4: Confirm each deploy actually landed**

Fetch a changed file from each live origin and grep it, rather than trusting a
deploy dashboard.

```bash
curl -s https://1neve.vercel.app/app.js | grep -c "brand-surface"
curl -s https://1neve.vercel.app/privacy.html | grep -c "CONTACT_PENDING_1NEVE"
curl -s https://1neve-console.vercel.app/staff.js | grep -c "ตั้งค่างาน"
```

Expected: **non-zero**, **exactly 0**, **non-zero**. The middle one is Step 0's
gate again, this time against what is actually being served — it catches a stale
build serving an older bundle.

- [ ] **Step 5: Run the spec's verification plan, steps 3–14**

Step 1 of the spec's list (the Drive URL) was proven in Task 1: all three
candidate URLs returned 200, `image/png`, and real PNG magic bytes from an
unauthenticated client, and `drive.google.com/thumbnail` 302s to the `lh3` form.
Step 2 (`node --check`) ran per task.

Work through steps 3–14 of the spec's **แผนการตรวจสอบ** in order, recording
pass/fail and the observed value for each. Four that have caught real defects on
this project and must not be skipped:

- **step 3** — create an event and confirm **all 18 columns** are written. The
  live Events sheet's header row may still have 16; `ensureEventCol_` lands
  `organizer_name` and `organizer_contact` at 17 and 18, exactly where
  `svcCreateEvent_` writes them, but that alignment has never been exercised
  against the real sheet.
- **step 8** — close registration: the pill must be grey **and read ปิดรับแล้ว**,
  the button dead, `register()` answering `event_closed` when called directly,
  and no ที่นั่ง row contradicting the pill.
- **step 11** — `listEvents` from a signed-out client must contain neither
  `organizerName` nor `organizerContact`.
- **step 12** — delete an attendee, then look their pass up by phone: must be
  `not_found`, both sheets must show the personal columns blank, and the badge
  must be refused at the gate.

- [ ] **Step 6: Report**

Write the outcome of each step with the observed value. A step that was skipped
is reported as skipped, not as passed.

---

## Self-Review

**1. Spec coverage.** Every spec section maps to a task: หน้า "ตั้งค่างาน" → Task 4; สองคอลัมน์ใหม่ต้องเพิ่มแบบขี้เกียจ → Task 2; banner ทางเดินของไฟล์ + ย่อรูป + URL + ไฟล์เก่า + สิทธิ์ → Tasks 1, 3, 4; พื้นผิวเริ่มต้น → Task 5; ค่าเข้างาน และป้ายสถานะ → Task 6; ความยินยอม และหน้านโยบาย → Task 7; ลบข้อมูลให้ลบจริง → Task 8; all nine bugs in the spec's table → Tasks 2 (1, 2), 4 (7), 5 (6), 6 (8, 9), 7 (3), 8 (4, 5); แผนการตรวจสอบ → Task 9. The spec's known-limitations section needs no task by definition.

**2. Placeholders.** One deliberate marker: `CONTACT_PENDING_1NEVE` ships in Task 7 Step 1 in place of a contact address only the human partner can supply. Task 9 Step 0 is a hard pre-push gate that greps for it and refuses to deploy while it is present, and Step 4 greps the deployed page for it again. Two places instruct the implementer to read the file and trust it over this plan — `eventById_`'s field name (Task 3 Step 3) and the exact Thai default-date string (Task 2 Step 3) — because both are quoted from memory and the file is authoritative.

**3. Type consistency.** `driveImageUrl_(fileId)` / `driveFileIdFromUrl_(url)` defined in Task 1, used in Task 3. `ensureEventCol_(sh, t, col, name)` defined in Task 2, used in Tasks 2 and 3. `organizerName` / `organizerContact` are the camelCase API names throughout; `organizer_name` / `organizer_contact` are the sheet column names throughout; the two are never mixed. `brandSurfaceHtml()` defined and used in Task 5. `state.es` fields in Task 4 match the keys `saveEventSettings()` sends. `BANNER_OUT_MAX` in `staff.js` and `BANNER_MAX_BYTES` in `Code.gs` are both `1500000` and Task 4 Step 8 says so in a comment.
