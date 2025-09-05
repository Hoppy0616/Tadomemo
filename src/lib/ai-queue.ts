"use client";

// B3: Simple client-side AI processing queue with localStorage persistence

export type QueueStatus = "queued" | "processing" | "done" | "error";

export interface QueueItem {
  id: string;
  noteId: string;
  content: string;
  attempts: number;
  status: QueueStatus;
  lastError?: string;
  scheduledAt?: number; // epoch ms for backoff scheduling
  result?: { tags: string[]; confidence?: number };
}

export interface ProcessResult {
  tags: string[];
  confidence?: number;
}

export type Processor = (item: QueueItem) => Promise<ProcessResult>;

const STORAGE_KEY = "ai.queue.v1";

function now() {
  return Date.now();
}

function load(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: QueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function backoffDelayMs(attempts: number): number {
  // Exponential backoff base 500ms: 1->500, 2->1000, 3->2000 (capped)
  const base = 500;
  const exp = Math.min(3, Math.max(1, attempts));
  return base * Math.pow(2, exp - 1);
}

export class AIQueueManager {
  private maxRetries = 2; // 最大2回のリトライ

  enqueue(noteId: string, content: string): QueueItem {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      noteId,
      content,
      attempts: 0,
      status: "queued",
    };
    const items = load();
    items.push(item);
    save(items);
    return item;
  }

  list(): QueueItem[] {
    return load();
  }

  clear(): void {
    save([]);
  }

  /** Returns the next due item (queued or scheduled and time passed) */
  nextDue(): QueueItem | undefined {
    const items = load();
    const t = now();
    return items.find((i) => i.status === "queued" || (i.scheduledAt && i.scheduledAt <= t));
  }

  /** Persist an updated item */
  private upsert(updated: QueueItem): void {
    const items = load();
    const idx = items.findIndex((i) => i.id === updated.id);
    if (idx >= 0) items[idx] = updated; else items.push(updated);
    save(items);
  }

  /** Process one due item with the provided processor */
  async processOne(processor: Processor): Promise<QueueItem | undefined> {
    const item = this.nextDue();
    if (!item) return undefined;

    item.status = "processing";
    this.upsert(item);
    try {
      const res = await processor(item);
      item.status = "done";
      item.result = res;
      this.upsert(item);
      return item;
    } catch (e: any) {
      item.attempts += 1;
      if (item.attempts > this.maxRetries) {
        item.status = "error";
        item.lastError = String(e?.message || e);
        this.upsert(item);
      } else {
        item.status = "queued";
        item.lastError = String(e?.message || e);
        item.scheduledAt = now() + backoffDelayMs(item.attempts);
        this.upsert(item);
      }
      return item;
    }
  }
}

