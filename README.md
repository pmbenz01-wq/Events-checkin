# Event Check-in

Live customer registration site for the Event Check-in system, implemented from the
Claude Design handoff bundle below.

## What's here

- **`customer/`** — the real implementation (vanilla HTML/CSS/JS): event picker →
  5-step registration form → QR pass, TH/EN, calling the Apps Script backend.
- **`docs/`** — a straight copy of `customer/`, served by **GitHub Pages** (Pages can
  only serve `/` or `/docs` from a branch, not an arbitrary folder name). **After
  editing anything in `customer/`, copy it into `docs/` and commit both** — GitHub
  Pages will not pick up `customer/` changes on its own:
  ```
  cp -r customer/. docs/
  ```
- **`backend/`** — the Google Apps Script backend (`Code.gs`) plus its setup/deploy
  instructions (`backend/README.md`). Deployed separately at script.google.com; this
  repo just holds the source.
- **`project/`, `chats/`** — the original Claude Design handoff bundle (prototypes +
  the design conversation). Kept for reference; not part of the live site.

## Live site

Enable it once under **Settings → Pages → Source: Deploy from a branch → main /docs**.
The URL will be `https://pmbenz01-wq.github.io/events-checkin/`.

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
