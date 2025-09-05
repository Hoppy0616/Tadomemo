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

