/** Marker file Kaje places after obtaining a Swiss Ephemeris Professional License. */
export const LICENCE_MARKER = '/se/commercial.ok';

export async function isCommercialLicencePresent(): Promise<boolean> {
  try {
    const res = await fetch(LICENCE_MARKER, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}
