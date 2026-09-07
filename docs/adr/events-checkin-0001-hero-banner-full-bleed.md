# Hero banner breaks out to true full-bleed on scroll

```mermaid
flowchart TD
    Q{"how far does the hero image grow at max scroll?"} -->|chosen| A["full-bleed: edge-to-edge,\nbreaks out of the 440px column"]
    Q -->|rejected| B["stays inside the 440px column,\njust grows to viewport height"]
```

The picker screen (and every other screen — ask/lookup/pass) is built on a
centered `.screen-inner{max-width:440px}` column. The new scroll-reveal hero
banner is the first element allowed to break out of that column at full
scroll, rather than staying framed inside it. Chosen because the user's own
framing was "เต็มจอ" (fills the screen) taken literally, and a true full-bleed
image reads as more cinematic/dramatic than one that's merely tall but still
framed — which is the effect being asked for.
