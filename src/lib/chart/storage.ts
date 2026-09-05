import { STORAGE_KEY, type ChartDraft } from './types';

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
