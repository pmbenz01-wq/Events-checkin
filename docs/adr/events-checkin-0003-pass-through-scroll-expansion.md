# Hero section keeps the existing pass-through reveal mechanism, not a pinned scroll

```mermaid
flowchart TD
    Q{"what does the screen do while the image is mid-expansion?"} -->|chosen| A["pass-through reveal (today's mechanism):\nsection keeps moving up the page while\nexpanding, briefly full-size only when centered"]
    Q -->|rejected| B["section pins (position: sticky) for a fixed\nscroll distance; screen holds still while the\nimage grows, then unpins (\"Apple product page\" style)"]
```

Pinned/scroll-jacked sections were considered first but rejected once the
mechanics were made concrete — the user preferred keeping the mechanism
that's already shipped and proven (`onHeroScroll()` in `customer/app.js`,
computing progress continuously from `getBoundingClientRect()` as the
section crosses the viewport, no `position: sticky`, no scroll-locking).
Reaching full-bleed and the info/CTA overlay (events-checkin-0001/0002)
now both need to slot into that same continuous progress value instead of
a separately-timed pinned run — simpler, and avoids the jank/compatibility
risk scroll-jacking carries on mobile, which is where this customer site is
mostly used.
