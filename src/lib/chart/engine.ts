import { Body, Ecliptic, GeoVector, MakeTime, SiderealTime, e_tilt } from 'astronomy-engine';
import { houseOf, toDms } from './format';
import { placidusHouses } from './houses';
import { resolveZone, toUtcParts } from './timezone';
import {
  ENGINE_NAME,
  ENGINE_VERSION,
  HOUSE_SYSTEM,
  PLANET_NAMES,
  ZODIAC,
  type ChartDraft,
  type ChartResult,
  type PlanetRow,
} from './types';

const BODY: Record<(typeof PLANET_NAMES)[number], Body> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
  Pluto: Body.Pluto,
};

export function utcDate(date: string, time: string, tzid: string): Date {
  const utc = toUtcParts(date, time, tzid);
  const whole = Math.floor(utc.hour);
  const minutes = Math.round((utc.hour - whole) * 60);
  return new Date(Date.UTC(utc.year, utc.month - 1, utc.day, whole, minutes, 0));
}

export function tropicalLongitude(body: Body, when: Date): number {
  const vec = GeoVector(body, when, true);
  const ecl = Ecliptic(vec);
  if (typeof ecl.elon !== 'number' || Number.isNaN(ecl.elon)) {
    throw new Error(`astronomy-engine returned no ecliptic longitude for ${body}.`);
  }
  return ecl.elon;
}

export function calculateChart(draft: ChartDraft): ChartResult {
  const noonUsed = draft.timeUnknown || !draft.time;
  const civilTime = noonUsed ? '12:00' : draft.time;
  const zone = resolveZone(draft.lat, draft.lon, draft.date, civilTime);
  const when = utcDate(draft.date, civilTime, zone.tzid);
  const time = MakeTime(when);
  const julianDay = 2451545 + time.ut;

  const planets: PlanetRow[] = PLANET_NAMES.map((name) => {
    const longitude = tropicalLongitude(BODY[name], when);
    return { name, longitude, dms: toDms(longitude), house: null };
  });

  let houses = null;
  if (!noonUsed) {
    const eps = e_tilt(time).tobl;
    const sid = SiderealTime(time);
    houses = placidusHouses(sid, draft.lat, draft.lon, eps);
    if (houses) {
      for (const p of planets) p.house = houseOf(p.longitude, houses.cusps);
    }
  }

  const ephemeris = `${ENGINE_NAME} ${ENGINE_VERSION}`;
  const houseBit = noonUsed || !houses ? 'no houses (time unknown)' : HOUSE_SYSTEM;
  const noonBit = noonUsed ? ' · planets at local noon' : '';
  const methodLine = `${ephemeris} · ${ZODIAC} · ${houseBit} · TZ ${zone.tzid} (${zone.offsetLabel})${noonBit} · calculated in browser`;

  return {
    planets,
    houses: noonUsed ? null : houses,
    timeUnknown: noonUsed,
    noonUsed,
    methodLine,
    zone,
    julianDay,
    ephemeris,
  };
}
