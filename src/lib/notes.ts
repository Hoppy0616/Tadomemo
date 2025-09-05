"use client";

import { ulid } from "@/lib/ulid";

export interface Note {
  id: string;
  content: string;
  tags: string[];
  timestamp: Date;
  completed?: boolean;
}

export const NOTES_STORAGE_KEY = "tadomemo-notes";
export const NOTES_BACKUP_KEY = "tadomemo-notes.backup";
export const NOTES_BACKUP_AT_KEY = "tadomemo-notes.backupAt";

function isNoteLike(x: any): x is Omit<Note, "timestamp"> & { timestamp: string | number } {
  return (
    x &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.content === "string" &&
    Array.isArray(x.tags) && x.tags.every((t: any) => typeof t === "string") &&
    (typeof x.timestamp === "string" || typeof x.timestamp === "number")
  );
}

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isNoteLike)
      .map((n) => ({
        id: n.id,
        content: String(n.content),
        tags: Array.from(new Set((n.tags as string[]).filter((t) => typeof t === "string"))),
        timestamp: new Date(n.timestamp),
        completed: Boolean(n.completed),
      }));
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  if (typeof window === "undefined") return;
  try {
    const safe = notes.map((n) => ({
      ...n,
      // JSON.stringify on Date produces ISO string; keep it explicit
      timestamp: n.timestamp.toISOString(),
    }));
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // ignore
  }
}

export function createNote(partial: Pick<Note, "content" | "tags">): Note {
  return {
    id: ulid(),
    content: partial.content,
    tags: Array.from(new Set(partial.tags)),
    timestamp: new Date(),
    completed: false,
  };
}

// --- Export / Import / Backup ---

export function serializeNotes(notes: Note[]): string {
  const payload = notes.map((n) => ({
    id: String(n.id),
    content: String(n.content ?? ""),
    tags: Array.from(new Set((n.tags ?? []).filter((t) => typeof t === "string"))),
    timestamp: new Date(n.timestamp).toISOString(),
    completed: Boolean(n.completed),
  }));
  return JSON.stringify(payload, null, 2);
}

export function parseNotes(json: string): Note[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error("Invalid format: expected an array");
  const out: Note[] = [];
  for (const n of parsed) {
    if (!isNoteLike(n)) continue;
    const ts = new Date(n.timestamp);
    if (isNaN(ts.getTime())) continue;
    out.push({
      id: String(n.id),
      content: String(n.content),
      tags: Array.from(new Set((n.tags as string[]).filter((t) => typeof t === "string"))),
      timestamp: ts,
      completed: Boolean(n.completed),
    });
  }
  return out;
}

export function backupNotes(): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
  if (raw == null) return;
  try {
    window.localStorage.setItem(NOTES_BACKUP_KEY, raw);
    window.localStorage.setItem(NOTES_BACKUP_AT_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

export function restoreBackup(): Note[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(NOTES_BACKUP_KEY);
  if (!raw) return null;
  try {
    const notes = parseNotes(raw);
    saveNotes(notes);
    return notes;
  } catch {
    return null;
  }
}

export function getBackupMeta(): { at: Date | null; exists: boolean } {
  if (typeof window === "undefined") return { at: null, exists: false };
  const at = window.localStorage.getItem(NOTES_BACKUP_AT_KEY);
  const exists = !!window.localStorage.getItem(NOTES_BACKUP_KEY);
  return { at: at ? new Date(at) : null, exists };
}

