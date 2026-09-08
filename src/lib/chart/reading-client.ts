import { requireStudio } from '../auth/guard';
import { calculateChart } from './engine';
import { toDms } from './format';
import { loadDraft, loadRecall, rememberReading } from './storage';
import { wheelSvg } from './wheel';
import type { ChartDraft, ChartResult, PlanetRow } from './types';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

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

function metaBlock(draft: ChartDraft, tzid: string, offsetLabel: string): string {
  const time = draft.timeUnknown || !draft.time ? 'Time unknown' : draft.time;
  return `<dl class="reading-meta">
    <div><dt>Date</dt><dd>${escapeHtml(draft.date)}</dd></div>
    <div><dt>Place</dt><dd>${escapeHtml(draft.placeLabel)}</dd></div>
    <div><dt>Timezone</dt><dd>${escapeHtml(tzid)} (${escapeHtml(offsetLabel)})</dd></div>
    <div><dt>Time</dt><dd>${escapeHtml(time)}</dd></div>
  </dl>`;
}

function recallList(): string {
  const rows = loadRecall();
  if (!rows.length) return '';
  const items = rows
    .map(
      (r) =>
        `<li>${escapeHtml(r.date)} · ${escapeHtml(r.placeLabel)} · ${escapeHtml(r.tzid)}</li>`,
    )
    .join('');
  return `<section class="recall" aria-label="Recent studio readings"><h2 class="h3">Recent in this browser</h2><ul>${items}</ul></section>`;
}

export async function mountReading(root: HTMLElement): Promise<void> {
  if (!requireStudio('/reading')) return;
  const draft = loadDraft();
  if (!draft) {
    root.innerHTML = empty(
      'No chart is waiting.',
      'Begin from the chart form. The three facts stay in this browser and are not written into the address. Google is not sent the birth moment.',
    );
    return;
  }

  try {
    const chart = calculateChart(draft);
    renderReady(root, draft, chart);
  } catch {
    renderError(root, draft);
  }
}

function renderReady(root: HTMLElement, draft: ChartDraft, chart: ChartResult): void {
  rememberReading({
    date: draft.date,
    time: draft.time,
    timeUnknown: draft.timeUnknown,
    placeLabel: draft.placeLabel,
    tzid: chart.zone.tzid,
  });
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
    ? `<p class="note">Time of birth unknown. Houses and the rising sign are not drawn. Planetary positions are for local noon in ${escapeHtml(chart.zone.tzid)}.</p>`
    : '';

  root.innerHTML = `
      <p class="eyebrow">Reading</p>
      <h1>The sky as it stood.</h1>
      ${metaBlock(draft, chart.zone.tzid, chart.zone.offsetLabel)}
      ${unknown}
      <div class="reading-grid">
        <div class="wheel-wrap">${wheelSvg(chart)}</div>
        <div class="sheet flow reading-data">
          <h2 class="h3">Positions</h2>
          ${planetTable(chart.planets, withHouses)}
          ${houseBlock}
        </div>
      </div>
      <p class="method-line">${escapeHtml(chart.methodLine)}</p>
      <p class="note">Mean and true lunar nodes are not in this slice. Aspects and interpretive copy are later.</p>
      ${recallList()}
      <div class="actions"><a class="button button--quiet" href="/chart">Back to the chart form</a></div>
    `;
}

function renderError(root: HTMLElement, draft: ChartDraft): void {
  root.innerHTML = `
    <p class="eyebrow">Reading</p>
    <h1>The chart could not be calculated.</h1>
    ${metaBlock(draft, '—', 'offset unknown')}
    <div class="empty-state" role="alert">
      <p class="empty-state-title">The sky calculation stopped.</p>
      <p class="empty-state-hint">Nothing was sent to Google. Retry here, or return to the form and check the date, place, and time.</p>
      <div class="actions">
        <button type="button" class="button" data-retry>Retry</button>
        <a class="button button--quiet" href="/chart">Back to the chart form</a>
      </div>
    </div>
    ${recallList()}
  `;
  root.querySelector('[data-retry]')?.addEventListener('click', () => {
    void mountReading(root);
  });
}

function empty(title: string, body: string): string {
  return `<p class="eyebrow">Reading</p>
    <h1>${escapeHtml(title)}</h1>
    <div class="empty-state" role="status">
      <p class="empty-state-title">${escapeHtml(title)}</p>
      <p class="empty-state-hint">${escapeHtml(body)}</p>
      <p><a class="button" href="/chart">Begin a chart</a></p>
    </div>`;
}
