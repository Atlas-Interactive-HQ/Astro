import { calculateChart, configured, loadSwe } from './ephemeris';
import { toDms } from './format';
import { loadDraft } from './storage';
import { wheelSvg } from './wheel';
import type { PlanetRow } from './types';

function planetTable(rows: PlanetRow[], withHouses: boolean): string {
  const head = withHouses
    ? '<tr><th scope="col">Body</th><th scope="col">Sign</th><th scope="col">Degree</th><th scope="col">House</th></tr>'
    : '<tr><th scope="col">Body</th><th scope="col">Sign</th><th scope="col">Degree</th></tr>';
  const body = rows
    .map((p) => {
      const house = withHouses ? `<td>${p.house ?? '—'}</td>` : '';
      return `<tr><th scope="row">${p.name}</th><td>${p.dms.sign}</td><td>${p.dms.deg}° ${String(p.dms.min).padStart(2, '0')}′</td>${house}</tr>`;
    })
    .join('');
  return `<table class="planet-table"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

export async function mountReading(root: HTMLElement): Promise<void> {
  const draft = loadDraft();
  if (!draft) {
    root.innerHTML = empty(
      'No chart is waiting.',
      'Begin from the chart form. The three facts stay in this browser (session storage) and are not written into the address.',
    );
    return;
  }
  if (!(await configured())) {
    root.innerHTML = empty(
      'Calculation is not configured.',
      'Swiss Ephemeris is present as a WASM binding, but the commercial-licence marker is missing. Place public/se/commercial.ok as described in the README. Until then Astro draws no chart and invents no positions.',
    );
    return;
  }
  const swe = await loadSwe();
  if (!swe) {
    root.innerHTML = empty(
      'Calculation is not configured.',
      'The Swiss Ephemeris WASM module did not load. Nothing is invented in its place.',
    );
    return;
  }

  try {
    const chart = await calculateChart(draft, swe);
    const withHouses = Boolean(chart.houses);
    const houseBlock = chart.houses
      ? `<h3>Houses (Placidus)</h3>
        <table class="planet-table">
          <thead><tr><th scope="col">Cusp</th><th scope="col">Sign</th><th scope="col">Degree</th></tr></thead>
          <tbody>${chart.houses.cusps
            .slice(1)
            .map((c, i) => {
              const d = toDms(c);
              const label = ['I ASC', 'II', 'III', 'IV IC', 'V', 'VI', 'VII DSC', 'VIII', 'IX', 'X MC', 'XI', 'XII'][i];
              return `<tr><th scope="row">${label}</th><td>${d.sign}</td><td>${d.deg}° ${String(d.min).padStart(2, '0')}′</td></tr>`;
            })
            .join('')}</tbody>
        </table>`
      : '';

    const unknown = chart.timeUnknown
      ? `<p class="note">Time of birth unknown. Houses and the rising sign are not drawn. Planetary positions are for local noon in ${chart.zone.tzid}.</p>`
      : '';

    root.innerHTML = `
      <p class="eyebrow">Reading</p>
      <h1>The sky as it stood.</h1>
      <p class="lede measure">${draft.placeLabel}. ${draft.date}${draft.timeUnknown ? ', time unknown' : ', ' + draft.time} · ${chart.zone.tzid} (${chart.zone.offsetLabel}).</p>
      ${unknown}
      <div class="reading-grid">
        <div class="wheel-wrap">${wheelSvg(chart)}</div>
        <div class="sheet flow reading-data">
          <h2 class="h3">Positions</h2>
          ${planetTable(chart.planets, withHouses)}
          ${houseBlock}
        </div>
      </div>
      <p class="method-line">${chart.methodLine}</p>
      <p class="note">Mean and true lunar nodes are not in this slice. Aspects and interpretive copy are later.</p>
      <div class="actions"><a class="button button--quiet" href="/chart">Back to the chart form</a></div>
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The chart could not be calculated.';
    root.innerHTML = empty('The chart could not be calculated.', message);
  }
}

function empty(title: string, body: string): string {
  return `<p class="eyebrow">Reading</p>
    <h1>${title}</h1>
    <p class="lede measure">${body}</p>
    <p><a class="button" href="/chart">Begin a chart</a></p>`;
}
