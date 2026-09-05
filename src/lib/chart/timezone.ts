import { DateTime } from 'luxon';
import tzlookup from 'tz-lookup';
import type { TimeZoneInfo } from './types';

export function zoneForCoordinates(lat: number, lon: number): string {
  return tzlookup(lat, lon);
}

/**
 * Civil date/time in the IANA zone that covers this place, using the
 * historical offset in force on that date (not "now").
 */
export function resolveZone(lat: number, lon: number, date: string, time: string): TimeZoneInfo {
  const tzid = zoneForCoordinates(lat, lon);
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '12:00').split(':').map(Number);
  const dt = DateTime.fromObject(
    { year: y, month: m, day: d, hour: hh, minute: mm, second: 0 },
    { zone: tzid },
  );
  if (!dt.isValid) {
    throw new Error(dt.invalidExplanation ?? 'That date and time are not valid in this time zone.');
  }
  const utcOffsetMinutes = dt.offset;
  const sign = utcOffsetMinutes >= 0 ? '+' : '−';
  const abs = Math.abs(utcOffsetMinutes);
  const oh = Math.floor(abs / 60);
  const om = abs % 60;
  const offsetLabel = `UTC${sign}${oh}${om ? ':' + String(om).padStart(2, '0') : ''}`;
  return { tzid, offsetLabel, utcOffsetMinutes };
}

export function toUtcParts(date: string, time: string, tzid: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '12:00').split(':').map(Number);
  const dt = DateTime.fromObject(
    { year: y, month: m, day: d, hour: hh, minute: mm, second: 0 },
    { zone: tzid },
  ).toUTC();
  if (!dt.isValid) {
    throw new Error(dt.invalidExplanation ?? 'Could not convert that moment to UTC.');
  }
  return { year: dt.year, month: dt.month, day: dt.day, hour: dt.hour + dt.minute / 60 + dt.second / 3600 };
}
