import { searchPlace } from './nominatim';
import { saveDraft } from './storage';
import type { GeoHit } from './types';

export function bindChartForm(form: HTMLFormElement): void {
  const date = form.querySelector<HTMLInputElement>('#birth-date');
  const time = form.querySelector<HTMLInputElement>('[data-birth-time]');
  const unknown = form.querySelector<HTMLInputElement>('[data-time-unknown]');
  const place = form.querySelector<HTMLInputElement>('#birth-place');
  const lat = form.querySelector<HTMLInputElement>('#birth-lat');
  const lon = form.querySelector<HTMLInputElement>('#birth-lon');
  const suggest = form.querySelector<HTMLUListElement>('[data-place-suggest]');
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  if (!date || !time || !unknown || !place || !lat || !lon || !suggest || !status) return;

  const syncTime = () => {
    time.disabled = unknown.checked;
    if (unknown.checked) time.value = '';
  };
  unknown.addEventListener('change', syncTime);
  syncTime();

  let timer: number | undefined;
  let hits: GeoHit[] = [];

  const renderHits = () => {
    suggest.replaceChildren();
    for (const h of hits) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = h.label;
      b.addEventListener('click', () => choose(h));
      li.append(b);
      suggest.append(li);
    }
    suggest.hidden = hits.length === 0;
  };

  const choose = (h: GeoHit) => {
    place.value = h.label;
    lat.value = String(h.lat);
    lon.value = String(h.lon);
    hits = [];
    renderHits();
    status.textContent = `${h.lat.toFixed(4)}°, ${h.lon.toFixed(4)}° — OpenStreetMap Nominatim. The chart itself is calculated in this browser.`;
  };

  place.addEventListener('input', () => {
    lat.value = '';
    lon.value = '';
    window.clearTimeout(timer);
    const q = place.value;
    timer = window.setTimeout(async () => {
      if (q.trim().length < 3) {
        hits = [];
        renderHits();
        return;
      }
      status.textContent = 'Looking up that place through OpenStreetMap Nominatim…';
      try {
        hits = await searchPlace(q);
        renderHits();
        status.textContent = hits.length
          ? 'Choose a place from the list. Nominatim is a network lookup for coordinates only.'
          : 'No place matched. You can enter latitude and longitude instead.';
      } catch {
        status.textContent = 'The place lookup could not be reached. Enter latitude and longitude instead.';
      }
    }, 500);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const latN = Number(lat.value);
    const lonN = Number(lon.value);
    if (!date.value) {
      status.textContent = 'A date of birth is required.';
      return;
    }
    if (!unknown.checked && !time.value) {
      status.textContent = 'Enter a time, or mark that the time is unknown.';
      return;
    }
    if (!Number.isFinite(latN) || !Number.isFinite(lonN) || lat.value === '' || lon.value === '') {
      status.textContent = 'Choose a place from the list, or enter latitude and longitude.';
      return;
    }
    saveDraft({
      date: date.value,
      time: unknown.checked ? '' : time.value,
      timeUnknown: unknown.checked,
      placeLabel: place.value.trim() || `${latN.toFixed(4)}, ${lonN.toFixed(4)}`,
      lat: latN,
      lon: lonN,
    });
    window.location.href = '/reading';
  });
}
