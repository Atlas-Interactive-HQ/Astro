# Swiss Ephemeris — commercial path

Astro calculates natal charts **in the browser** with Swiss Ephemeris **2.10.03**, via the MIT-licensed WASM binding `@fusionstrings/swisseph-wasm`. The Swiss Ephemeris library itself remains dual-licensed (AGPL or Professional). This product is on the **Professional / commercial** path. Do not switch the repo to AGPL.

## What you must place locally

1. Obtain a [Swiss Ephemeris Professional License](https://www.astro.com/swisseph/) from Astrodienst AG.
2. Copy the marker that tells the site it may calculate:

   ```bash
   cp public/se/commercial.ok.example public/se/commercial.ok
   ```

   `commercial.ok` is gitignored. Without it, `/reading` shows a calm empty state and invents no positions.

3. Optional later: JPL `.se1` files. This slice uses the Moshier theory built into Swiss Ephemeris 2.10.03 (named on the method line). Loading `.se1` through a virtual filesystem is a follow-up; do not commit paid dumps.

## What the WASM binding is

| | |
| --- | --- |
| Binding | `@fusionstrings/swisseph-wasm` 0.1.5 (MIT wrapper) |
| Library | Swiss Ephemeris **2.10.03** |
| Where it runs | Browser WebAssembly, after `commercial.ok` is present |
| Houses | Placidus, from SE sidereal time + SE obliquity (the WASM build does not export `swe_houses`) |

## Out of scope here

Aspects, interpretive copy, server-side ephemeris, AGPL relicensing, Hostinger deploy, DNS.
