import { RECALL_CAP, RECALL_KEY, STORAGE_KEY, type ChartDraft } from './types';

export interface ReadingRecall {
  date: string;
  time: string;
  timeUnknown: boolean;
  placeLabel: string;
  tzid: string;
}

export function saveDraft(draft: ChartDraft): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadDraft(): ChartDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as ChartDraft;
    if (typeof d.date !== 'string' || typeof d.lat !== 'number' || typeof d.lon !== 'number') return null;
    return d;
  } catch {
    return null;
  }
}

export function loadRecall(): ReadingRecall[] {
  try {
    const raw = sessionStorage.getItem(RECALL_KEY);
    if (!raw) return [];
    const rows = JSON.parse(raw) as ReadingRecall[];
    if (!Array.isArray(rows)) return [];
    return rows.filter(
      (r) =>
        r &&
        typeof r.date === 'string' &&
        typeof r.placeLabel === 'string' &&
        typeof r.tzid === 'string',
    );
  } catch {
    return [];
  }
}

export function rememberReading(entry: ReadingRecall): ReadingRecall[] {
  const prior = loadRecall().filter(
    (r) => !(r.date === entry.date && r.placeLabel === entry.placeLabel && r.tzid === entry.tzid),
  );
  const next = [entry, ...prior].slice(0, RECALL_CAP);
  sessionStorage.setItem(RECALL_KEY, JSON.stringify(next));
  return next;
}
