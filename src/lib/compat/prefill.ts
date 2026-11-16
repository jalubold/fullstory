/**
 * Carries the visitor's answer from the landing page's "try one question"
 * into the quiz. Browser-only and best-effort: if storage is unavailable the
 * quiz simply starts empty.
 */

const KEY = 'awc_prefill';
const MAX_AGE_MS = 6 * 3600_000;

export function savePrefill(questionId: string, optionId: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ q: questionId, a: optionId, t: Date.now() }));
  } catch {
    // Private mode or blocked storage.
  }
}

/** Reads and clears the saved answer (once). */
export function takePrefill(): { questionId: string; optionId: string } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const p = JSON.parse(raw) as { q?: unknown; a?: unknown; t?: unknown };
    if (typeof p.q !== 'string' || typeof p.a !== 'string' || typeof p.t !== 'number') return null;
    if (Date.now() - p.t > MAX_AGE_MS) return null;
    return { questionId: p.q, optionId: p.a };
  } catch {
    return null;
  }
}
