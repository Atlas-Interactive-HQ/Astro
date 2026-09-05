import { houseOf, toDms } from './format';
import { placidusHouses } from './houses';
import { isCommercialLicencePresent } from './licence';
import { resolveZone, toUtcParts } from './timezone';
import {
  HOUSE_SYSTEM,
  PLANET_IDS,
  SE_BINDING,
  SE_VERSION,
  ZODIAC,
  type ChartDraft,
  type ChartResult,
  type PlanetRow,
} from './types';

const SE_GREG_CAL = 1;
const SE_ECL_NUT = -1;
const SEFLG_MOSEPH = 4;
const SEFLG_SPEED = 256;

export interface SweApi {
  swe_julday: (y: number, m: number, d: number, hour: number, gregflag: number) => number;
  swe_calc_ut: (
    jd: number,
    ipl: number,
    iflag: number,
  ) => { longitude: number; latitude: number; rc_flags: number };
  swe_sidtime: (jd: number) => number;
}

let cached: SweApi | null | undefined;

export async function loadSwe(): Promise<SweApi | null> {
  if (cached !== undefined) return cached;
  try {
    const [internalMod, wasmMod] = await Promise.all([
      import('@se-internal'),
      import('@fusionstrings/swisseph-wasm/wasm?url'),
    ]);
    const wasmUrl = (wasmMod as { default: string }).default;
    const buf = await fetch(wasmUrl).then((r) => {
      if (!r.ok) throw new Error(`WASM ${r.status}`);
      return r.arrayBuffer();
    });
    const { instance } = await WebAssembly.instantiate(buf, {
      './swisseph_wasm.internal.js': internalMod as unknown as WebAssembly.ModuleImports,
    });
    internalMod.__wbg_set_wasm(instance.exports);
    const start = (instance.exports as { __wbindgen_start?: () => void }).__wbindgen_start;
    if (start) start();
    cached = {
      swe_julday: internalMod.swe_julday,
      swe_calc_ut: internalMod.swe_calc_ut,
      swe_sidtime: internalMod.swe_sidtime,
    };
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export async function configured(): Promise<boolean> {
  if (!(await isCommercialLicencePresent())) return false;
  return Boolean(await loadSwe());
}

export async function calculateChart(draft: ChartDraft, swe: SweApi): Promise<ChartResult> {
  const noonUsed = draft.timeUnknown || !draft.time;
  const civilTime = noonUsed ? '12:00' : draft.time;
  const zone = resolveZone(draft.lat, draft.lon, draft.date, civilTime);
  const utc = toUtcParts(draft.date, civilTime, zone.tzid);
  const jd = swe.swe_julday(utc.year, utc.month, utc.day, utc.hour, SE_GREG_CAL);
  const flags = SEFLG_MOSEPH | SEFLG_SPEED;

  const planets: PlanetRow[] = PLANET_IDS.map(({ id, name }) => {
    const pos = swe.swe_calc_ut(jd, id, flags);
    if (typeof pos?.longitude !== 'number' || Number.isNaN(pos.longitude)) {
      throw new Error(`Swiss Ephemeris returned no longitude for ${name}.`);
    }
    return { name, longitude: pos.longitude, dms: toDms(pos.longitude), house: null };
  });

  let houses = null;
  if (!noonUsed) {
    const nut = swe.swe_calc_ut(jd, SE_ECL_NUT, 0);
    const eps = nut.longitude;
    const sid = swe.swe_sidtime(jd);
    houses = placidusHouses(sid, draft.lat, draft.lon, eps);
    if (houses) {
      for (const p of planets) p.house = houseOf(p.longitude, houses.cusps);
    }
  }

  const ephemeris = `Swiss Ephemeris ${SE_VERSION} (Moshier)`;
  const houseBit = noonUsed || !houses ? 'no houses (time unknown)' : HOUSE_SYSTEM;
  const noonBit = noonUsed ? ' · planets at local noon' : '';
  const methodLine = `${ephemeris} · ${ZODIAC} · ${houseBit} · TZ ${zone.tzid} (${zone.offsetLabel})${noonBit} · calculated in browser · ${SE_BINDING}`;

  return {
    planets,
    houses: noonUsed ? null : houses,
    timeUnknown: noonUsed,
    noonUsed,
    methodLine,
    zone,
    julianDay: jd,
    ephemeris,
  };
}
