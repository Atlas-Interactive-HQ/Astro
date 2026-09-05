# Astro

Atlas Interactive's public astrology product. A birth chart, drawn from the real sky.

**Status: v1, slice A.** Warm Geo shell plus a natal chart calculated **in the browser** with Swiss Ephemeris 2.10.03. No aspects, no interpretive copy, no server-side ephemeris.

- Public site, later: `https://astro.atlas-interactive.com` (DNS, hosting and deployment are gated and handled outside this repository)
- Studio: [Atlas Interactive](https://atlas-interactive.com)
- Brand: Warm Geo v2. Calm printmaking, not SaaS.

## What v1 is

| Route | What it is |
| --- | --- |
| `/` | Home. One idea: a chart from real positions, not approximations. A single call to action to the chart form. |
| `/chart` | Date, time (unknown-time toggle) and place. Place suggestions use Nominatim (coordinates only). Birth facts stay in session storage — not in the URL. |
| `/reading` | Wheel + degree table + method line, calculated in WASM. Without `public/se/commercial.ok`, a calm empty state. No invented positions. |
| `/learn` | Editorial placeholder. Three short notes in a plain voice. |
| `/404` | Not found. |

What this slice is **not**: no aspects list, no interpretive or medical copy, no accounts, no server-side ephemeris, no AGPL relicensing, no Hostinger/DNS changes from this branch. Mean/true lunar nodes are later.

## Run locally

Requires Node 22.12 or newer and npm.

```bash
npm install
cp public/se/commercial.ok.example public/se/commercial.ok   # requires a Swiss Ephemeris Professional License
npm run dev        # http://localhost:4321
```

Without `commercial.ok`, `/reading` will not calculate. See `public/se/README.md`.

Other scripts:

```bash
npm run build      # static build to dist/
npm run preview    # serve dist/ locally
npm run check      # astro check (types) + the brand check + mutation test
npm run test       # golden SE fixtures + format tests
npm run check:brand
npm run check:dist # brand check against dist/ (run after build)
npm run fixtures:se
```

## Structure

```
astro.config.mjs        static output, site URL for canonical links only
src/
  styles/tokens.css     the nine Warm Geo hues, roles, type scale, spacing, grain
  styles/global.css     fonts, base, type, layout, controls, forms
  layouts/Base.astro    document shell: head, skip link, header, main, footer
  components/
    Header.astro        wordmark "Astro" and the quiet nav (Home, Chart, Learn)
    Footer.astro        teal band with the Atlas Interactive credit
    SkyMark.astro       the mark: a medallion holding a sun over three waves
    GeoRule.astro       geometric separator
    ChartForm.astro     chart input (Nominatim + session storage)
  lib/site.ts           site name, URLs, nav
  lib/chart/            Swiss Ephemeris WASM, TZ, geocode, wheel
  pages/                index, chart, reading, learn, 404
public/favicon.svg
public/se/              commercial.ok.example + licence README (no dumps)
scripts/generate-se-fixtures.mjs  writes golden J2000 positions from SE
scripts/brand-check.mjs the brand rules as an executable check (`--dist` scans the build)
scripts/brand-check-mutate.mjs  injects 21 violations and expects each to fail
.github/workflows/ci.yml  check + build + dist brand check on pull requests (no deploy)
```

## Design system

Nine hues, used flat. Components refer to roles, never to hues directly.

| Hue | Hex | Role in Astro |
| --- | --- | --- |
| Warm Ochre | `#E6A24A` | `--field`, the page ground |
| Soft Sand | `#F2D6A2` | `--paper`, sheets laid on the field; type on the teal ground |
| Deep Teal | `#1F4E4A` | `--ink`, headlines and structure; `--ground`, the footer band |
| Dark Petrol | `#153937` | `--ink-deep`, body and UI text; focus ring |
| Burnt Orange | `#C65A2E` | `--accent`, reserved. 1.96:1 on the ochre field — too low for links or chrome |
| Terracotta | `#A63D2F` | `--accent-deep`, the sun, numerals, the geo-rule mark |
| Muted Sage | `#7FA39A` | `--rule`, decorative hairlines; the far wave |
| Dusty Coral | `#D97A5B` | reserved |
| Clay Brown | `#8C4A2F` | the grain tint |

Type: Playfair Display for headlines (600, 700, 400 italic), Inter for body and UI (400, 500, 600). Both are self-hosted through Fontsource; the site makes no third-party font request.

Rules, as canon states them and as `scripts/brand-check.mjs` enforces them:

- No `#000000`, no `#FFFFFF`, no hex outside the nine, no `rgb()`, `hsl()`, `color-mix()`, no named CSS colours, no `transparent` (the bundler emits `#0000`).
- No gradients, no shadows, no glass. Flat fields only. Texture comes from a matte grain tile whose colour is pinned to Clay Brown.
- Only Playfair Display and Inter, with generic fallbacks.
- Every declared text/background pairing meets WCAG AA. The check prints the measured ratios. Two consequences worth knowing: Deep Teal on Warm Ochre is 4.29:1, so it is used for large type only, and body text on the ochre field is Dark Petrol at 5.76:1. Link underlines and the active-nav mark use Dark Petrol / Deep Teal for the same reason: Burnt Orange and Terracotta fall below 3:1 on the ochre field.

## Accessibility

Semantic landmarks, a skip link, visible focus rings on every ground, labels bound to every control, help text through `aria-describedby`, `aria-current` on the active nav item, and a form that works without JavaScript (the "unknown time" toggle is progressive). A single light colour scheme is declared; a dark scheme is a later brand decision, not an omission.

## Later, and gated

Each of these waits for its own review and Kaje's explicit go. None is started here.

- **Calculation (this slice).** Swiss Ephemeris 2.10.03 in the browser (`@fusionstrings/swisseph-wasm`, MIT wrapper). Commercial / Professional licence from Astrodienst. Marker file `public/se/commercial.ok` (gitignored). Moshier theory until `.se1` loading is a follow-up. Method line names the library, version, tropical zodiac, Placidus, TZ, and “calculated in browser”.
- **Place and time (this slice).** Nominatim for geocode (1 req/s, session cache). IANA tzdb via `luxon` + `tz-lookup` for the historical offset on the birth date.
- **Later.** Aspects, interpretive copy, lunar nodes, `.se1` files, Hostinger/DNS, Dutch.
- **Hosting.** `astro.atlas-interactive.com` on Hostinger. This branch does not deploy.

Astro gives no medical, psychological or financial advice, and shows no chart it has not calculated.

## Working agreement

Changes arrive by pull request against `main`. Nothing merges without Kaje's explicit yes. Nothing in this repository deploys.
