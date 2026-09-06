# Event Check-in

Live customer registration site for the Event Check-in system, implemented from the
Claude Design handoff bundle below.

## What's here

- **`customer/`** — the public registration site (vanilla HTML/CSS/JS): event picker →
  5-step form → real scannable QR pass, TH/EN. Hosted on GitHub Pages.
- **`staff/`** — the Staff Console UI (dark "Onyx" theme): live dashboard, camera QR
  scanning, attendee search / manual check-in / walk-in, scan history + CSV export,
  form fields, badge config, team roles. Hosted on GitHub Pages but *loaded by* the
  Apps Script page, so Google sign-in works — see `backend/README.md`.
- **`backend/`** — the Apps Script project source: `Code.gs` (public API + staff API),
  `Staff.html`, `Badge.html` (A6 print), plus deploy instructions.
- **`docs/`** — **build output, don't edit.** GitHub Pages can only serve `/` or
  `/docs`, so this holds a copy of `customer/` (at the root) and `staff/` (under
  `/staff`). Regenerate with `./sync-docs.sh` after any UI change, and commit it.
- **`project/`, `chats/`** — the original Claude Design handoff bundle. Reference only.

## The two live URLs

| | Who | Where |
|---|---|---|
| Registration site | Public, no login | `https://pmbenz01-wq.github.io/Events-checkin/` |
| Staff Console | Google login, allowlisted | the Apps Script `/exec` URL of deploy #2 |

Pages is enabled under **Settings → Pages → Deploy from a branch → main /docs**.

## Making a change

```
# edit customer/ or staff/
./sync-docs.sh                      # refresh docs/ from source
git add -A && git commit && git push
```
That's the whole loop for UI work — GitHub Pages picks it up in a minute or two.
Only edits to `backend/Code.gs` additionally require re-pasting it into Apps Script
and redeploying.

## Known gaps

- Staff can edit an event's form fields and they save to the sheet, but the customer
  form still renders its fixed 5 questions — the two aren't wired together yet.
- Per-event images/banners (the design's "ภาพและแบนเนอร์" screen) aren't built; the
  customer cards show placeholder panels.

---

# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 2 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/Event Check-in - Customer.dc.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `Event registration web app` project files (HTML prototypes, assets, components)
