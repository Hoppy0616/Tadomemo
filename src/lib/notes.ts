"use client";

import { ulid } from "@/lib/ulid";

export interface Note {
  id: string;
  content: string;
  tags: string[];
  timestamp: Date;
  completed?: boolean;
  pending?: boolean;
  // B1: AI tagging fields
  aiTagged?: boolean;
  aiConfidence?: number; // 0..1
  processingStatus?: "idle" | "queued" | "processing" | "done" | "error";
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

function isProcessingStatus(x: unknown): x is NonNullable<Note["processingStatus"]> {
  return x === "idle" || x === "queued" || x === "processing" || x === "done" || x === "error";
}

function migrateNote(n: Omit<Note, "timestamp"> & { timestamp: string | number }): Note {
  const ts = new Date(n.timestamp);
  const aiTagged = typeof (n as any).aiTagged === "boolean" ? (n as any).aiTagged : false;
  const aiConfidenceRaw = (n as any).aiConfidence;
  const aiConfidence = typeof aiConfidenceRaw === "number" ? Math.min(1, Math.max(0, aiConfidenceRaw)) : undefined;
  const processing = isProcessingStatus((n as any).processingStatus) ? (n as any).processingStatus : "idle";
  return {
    id: n.id,
    content: String(n.content),
    tags: Array.from(new Set((n.tags as string[]).filter((t) => typeof t === "string"))),
    timestamp: ts,
    completed: Boolean((n as any).completed),
    pending: Boolean((n as any).pending),
    aiTagged,
    aiConfidence,
    processingStatus: processing,
  };
}

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isNoteLike).map(migrateNote);
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
    pending: Boolean(n.pending),
    aiTagged: Boolean(n.aiTagged),
    aiConfidence: typeof n.aiConfidence === "number" ? Math.min(1, Math.max(0, n.aiConfidence)) : undefined,
    processingStatus: isProcessingStatus(n.processingStatus) ? n.processingStatus : "idle",
  }));
  return JSON.stringify(payload, null, 2);
}

export function parseNotes(json: string): Note[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error("Invalid format: expected an array");
  const out: Note[] = [];
  for (const n of parsed) {
    if (!isNoteLike(n)) continue;
    const migrated = migrateNote(n);
    if (!isNaN(migrated.timestamp.getTime())) out.push(migrated);
  }
  return out;
}

export function markPending(note: Note): Note {
  return { ...note, pending: true };
}

export function markAllSynced(notes: Note[]): Note[] {
  return notes.map((n) => (n.pending ? { ...n, pending: false } : n));
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
