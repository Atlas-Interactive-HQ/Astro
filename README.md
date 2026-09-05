# Astro

Atlas Interactive's public astrology product. A birth chart, drawn from the real sky.

**Status: Atlas engine + studio sign-in.** Warm Geo shell, natal calculation in the browser with **astronomy-engine 2.1.19** (MIT), Google Identity Services for `@atlas-interactive.com` staff. No Swiss Ephemeris in this slice. No aspects, no interpretive copy.

- Public site, later: `https://astro.atlas-interactive.com` (DNS, hosting and deployment are gated and handled outside this repository)
- Studio: [Atlas Interactive](https://atlas-interactive.com)
- Brand: Warm Geo v2. Calm printmaking, not SaaS.

## What v1 is

| Route | What it is |
| --- | --- |
| `/` | Home. Public. Chart CTA and studio sign-in. |
| `/learn` | Public editorial stub. |
| `/auth` | Google sign-in. `@atlas-interactive.com` only. |
| `/chart` | Studio only. Date, time, place. Nominatim for coordinates. Birth facts in session storage, not the URL, not sent to Google. |
| `/reading` | Studio only. Wheel + degree table + method line from astronomy-engine. |
| `/404` | Not found. |

What this slice is **not**: no Swiss Ephemeris, no `commercial.ok`, no aspects list, no interpretive or medical copy, no public accounts, no Hostinger/DNS changes from this branch.

## Run locally

Requires Node 22.12 or newer and npm.

```bash
cp .env.example .env          # then paste PUBLIC_GOOGLE_CLIENT_ID
npm install
npm run dev                   # http://localhost:4321
```

Sign in at `/auth` with an `@atlas-interactive.com` Google account, then `/chart`. Without the client ID, `/auth` explains that studio sign-in is not configured.

Other scripts:

```bash
npm run build
npm run preview
npm run check
npm run test                  # astronomy-engine goldens + format + domain allowlist
npm run check:brand
npm run check:dist
npm run fixtures:atlas
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
  lib/chart/            astronomy-engine, TZ, geocode, wheel
  lib/auth/             Google GIS, domain allowlist, session
  pages/                index, auth, chart, reading, learn, 404
public/favicon.svg
.env.example            PUBLIC_GOOGLE_CLIENT_ID
scripts/generate-atlas-fixtures.mjs  writes golden J2000 positions from astronomy-engine
scripts/brand-check.mjs the brand rules as an executable check (`--dist` scans the build)
scripts/brand-check-mutate.mjs  injects 21 violations and expects each to fail
.github/workflows/ci.yml  check + test + build on pull requests (no deploy)
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

## Calculation (this slice)

**Library:** `astronomy-engine` **2.1.19**, MIT (Don Cross / CosineKitty). Tropical ecliptic of date: `GeoVector` + `Ecliptic`. Greenwich apparent sidereal time and true obliquity from the same library feed Placidus when a birth time is present.

Method line example: `astronomy-engine 2.1.19 · tropical · Placidus · TZ Europe/London (UTC+0) · calculated in browser`.

Swiss Ephemeris is not shipped. There is no `commercial.ok` gate.

## Studio sign-in (Google)

Auth is **static Google Identity Services** (ID token). There is no httpOnly cookie and no Node auth server in this PR — the site remains a static Astro build. Limits, stated plainly:

- The Google button loads `https://accounts.google.com/gsi/client` (only on `/auth`).
- The ID token is checked with Google’s `tokeninfo` endpoint (signature, audience, expiry). Birth facts are not included.
- A valid `@atlas-interactive.com` session is stored in **sessionStorage**. That is a **UI gate**. A determined user can skip it in the browser. Labelled studio access, not a fortress.
- A small httpOnly-cookie backend (Hostinger Node or KVM) is a later hardening step. Do not provision it in this PR.

### Google Cloud OAuth setup (Kaje)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and pick (or create) the Atlas project.
2. **APIs & Services → OAuth consent screen**
   - User type: **Internal** if this is a Google Workspace for `atlas-interactive.com`. Otherwise **External** and add studio accounts as test users.
   - App name: `Atlas Astro — studio`
   - User support email and developer contact: an `@atlas-interactive.com` address.
   - Authorized domain: `atlas-interactive.com`
   - Scopes: the GIS ID token uses `openid`, `email`, `profile` (default). Do not request extra scopes.
3. **Credentials → Create credentials → OAuth client ID → Web application**
   - Name: `Astro studio (web)`
   - **Authorized JavaScript origins**
     - `http://localhost:4321`
     - `http://127.0.0.1:4321`
     - `https://astro.atlas-interactive.com`
   - Authorized redirect URIs: not required for GIS popup / ID token. Add `http://localhost:4321/auth` and `https://astro.atlas-interactive.com/auth` only if you later switch `ux_mode` to `redirect`.
4. Copy the **Client ID** (looks like `….apps.googleusercontent.com`). It is not a client secret. Still do not commit a production ID unless you mean to.
5. Locally:

   ```bash
   cp .env.example .env
   # PUBLIC_GOOGLE_CLIENT_ID=<the client id>
   npm run dev
   ```

   Open `/auth`, sign in with a real `@atlas-interactive.com` account. A Gmail address on another domain must be refused with the studio message.
6. **Before a later deploy** (not this PR): set `PUBLIC_GOOGLE_CLIENT_ID` in the Hostinger/KVM build environment so the static bundle contains the same origin-authorized client ID. Rebuild after changing it. Shared Hostinger PHP/static docroot can serve the built files; a Node/KVM box is only needed if you later add httpOnly cookies.

## Later, and gated

- Aspects, interpretive copy, lunar nodes, Dutch.
- httpOnly session cookie / small auth API.
- Hostinger or KVM production env for the client ID. This branch does not deploy.

Astro gives no medical, psychological or financial advice, and shows no chart it has not calculated.

## Working agreement

Changes arrive by pull request against `main`. Nothing merges without Kaje's explicit yes. Nothing in this repository deploys.
