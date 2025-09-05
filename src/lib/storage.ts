"use client";

import { Item, TAGS, isItem, sanitizeItems, Tag } from "@/lib/types";
import { monotonicUlidFactory } from "@/lib/ulid";

export const STORAGE_KEY = "memo.v1.items";

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const nextUlid = monotonicUlidFactory();

export class LocalStorageManager {
  constructor(private key: string) {}

  load(): Item[] {
    const ls = getLocalStorage();
    if (!ls) return [];
    try {
      const raw = ls.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return sanitizeItems(parsed);
    } catch {
      return [];
    }
  }

  save(items: Item[]): void {
    const ls = getLocalStorage();
    if (!ls) return;
    try {
      const safe = sanitizeItems(items);
      ls.setItem(this.key, JSON.stringify(safe));
    } catch {
      // ignore
    }
  }

  create(content: string): Item {
    const now = Date.now();
    return {
      id: nextUlid(now),
      content,
      tags: [],
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }

  toggleTag(item: Item, tag: Tag): Item {
    const t = TAGS.includes(tag) ? tag : "other";
    const tags = item.tags.includes(t)
      ? item.tags.filter((x) => x !== t)
      : [...item.tags, t];
    return { ...item, tags, updatedAt: Date.now() };
  }
}

export const itemsStore = new LocalStorageManager(STORAGE_KEY);

