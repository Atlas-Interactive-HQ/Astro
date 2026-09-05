import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as internal from '../node_modules/@fusionstrings/swisseph-wasm/esm/lib/swisseph_wasm.internal.js';
import { __wbg_set_wasm } from '../node_modules/@fusionstrings/swisseph-wasm/esm/lib/swisseph_wasm.internal.js';

const root = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(root, '../node_modules/@fusionstrings/swisseph-wasm/esm/lib/swisseph_wasm.wasm');
const wasmModule = new WebAssembly.Module(readFileSync(wasmPath));
const wasmInstance = new WebAssembly.Instance(wasmModule, {
  './swisseph_wasm.internal.js': internal,
});
__wbg_set_wasm(wasmInstance.exports);
if (wasmInstance.exports.__wbindgen_start) wasmInstance.exports.__wbindgen_start();

export { swe_julday, swe_calc_ut, swe_sidtime } from '../node_modules/@fusionstrings/swisseph-wasm/esm/lib/swisseph_wasm.internal.js';
