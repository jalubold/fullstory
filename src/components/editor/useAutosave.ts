'use client';

import { useEffect } from 'react';
import { useEditor } from './store';

const DEBOUNCE_MS = 1200;
/** Even while the user keeps editing, save at least this often. */
const MAX_WAIT_MS = 5000;
/** A save that hasn't answered by now is abandoned and retried. */
const REQUEST_TIMEOUT_MS = 15_000;
export const backupKey = (id: string) => `fs:backup:${id}`;

export interface LocalBackup {
  doc: unknown;
  title: string;
  baseVersion: number;
  at: number;
}

/**
 * Autosave: debounced PUT with optimistic concurrency, retry with backoff,
 * a localStorage backup for crash/offline recovery, and a beacon on exit.
 */
/** Module-level save engine (one editor is mounted at a time). */
const engine = (() => {
  const state = { inflight: false, timer: null as ReturnType<typeof setTimeout> | null, retry: 0, dirtySince: 0 };
  const schedule = () => {
    const now = Date.now();
    if (!state.dirtySince) state.dirtySince = now;
    if (state.timer) clearTimeout(state.timer);
    const wait = Math.max(0, Math.min(DEBOUNCE_MS, state.dirtySince + MAX_WAIT_MS - now));
    state.timer = setTimeout(() => void save(), wait);
  };
  async function save(): Promise<boolean> {
    const s = useEditor.getState();
    if (s.saveState === 'saved' || s.saveState === 'conflict') return s.saveState === 'saved';
    if (state.inflight) return false;
    state.inflight = true;
    state.dirtySince = 0;
    const counter = s.changeCounter;
    s.markSaving();
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/projects/${s.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: s.doc, title: s.title, version: s.version }),
        signal: ctrl.signal,
      });
      if (res.status === 409) {
        useEditor.getState().markSaveError(true);
        return false;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { version: number };
      state.retry = 0;
      useEditor.getState().markSaved(data.version, counter);
      if (useEditor.getState().saveState === 'saved') {
        try {
          localStorage.removeItem(backupKey(s.projectId));
        } catch {}
      }
      return useEditor.getState().saveState === 'saved';
    } catch {
      useEditor.getState().markSaveError(false);
      state.retry = Math.min(state.retry + 1, 6);
      if (state.timer) clearTimeout(state.timer);
      state.timer = setTimeout(() => void save(), 2000 * 2 ** state.retry);
      return false;
    } finally {
      clearTimeout(timeout);
      state.inflight = false;
      if (useEditor.getState().saveState === 'dirty') schedule();
    }
  }
  /**
   * Saves now and waits for it — including a save already in flight — so the
   * next page loads the latest album. Gives up after timeoutMs (the local
   * backup still has the changes).
   */
  async function flush(timeoutMs = 10_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const st = useEditor.getState().saveState;
      if (st === 'saved') return true;
      if (st === 'conflict') return false;
      if (!state.inflight) {
        if (state.timer) clearTimeout(state.timer);
        state.timer = null;
        if (await save()) return true;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    return useEditor.getState().saveState === 'saved';
  }
  return { save, schedule, flush };
})();

export const flushSave = engine.flush;

export function useAutosave() {
  useEffect(() => {
    const { save, schedule } = engine;
    let backupTimer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useEditor.subscribe((s, prev) => {
      if (s.changeCounter === prev.changeCounter || !s.projectId) return;
      schedule();
      if (backupTimer) clearTimeout(backupTimer);
      backupTimer = setTimeout(() => {
        const cur = useEditor.getState();
        if (cur.saveState === 'saved') return;
        try {
          const b: LocalBackup = { doc: cur.doc, title: cur.title, baseVersion: cur.version, at: Date.now() };
          localStorage.setItem(backupKey(cur.projectId), JSON.stringify(b));
        } catch {}
      }, 400);
    });
    const onUnload = (e: BeforeUnloadEvent) => {
      const s = useEditor.getState();
      if (s.saveState === 'saved') return;
      try {
        const blob = new Blob([JSON.stringify({ document: s.doc, title: s.title, version: s.version })], { type: 'application/json' });
        navigator.sendBeacon(`/api/projects/${s.projectId}/save`, blob);
      } catch {}
      e.preventDefault();
    };
    const onOnline = () => {
      if (useEditor.getState().saveState === 'error') void save();
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('online', onOnline);
    return () => {
      unsub();
      if (backupTimer) clearTimeout(backupTimer);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return engine.save;
}
