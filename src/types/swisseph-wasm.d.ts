declare module '*.wasm?url' {
  const src: string;
  export default src;
}

declare module '@fusionstrings/swisseph-wasm/wasm?url' {
  const src: string;
  export default src;
}

declare module '@se-internal' {
  export function __wbg_set_wasm(val: unknown): void;
  export function swe_julday(y: number, m: number, d: number, hour: number, gregflag: number): number;
  export function swe_calc_ut(
    jd: number,
    ipl: number,
    iflag: number,
  ): { longitude: number; latitude: number; distance: number; rc_flags: number };
  export function swe_sidtime(jd: number): number;
  export function swe_get_planet_name(ipl: number): string;
}
