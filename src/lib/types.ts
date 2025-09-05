export type Tag = "todo" | "idea" | "memo" | "other";
export type Status = "active" | "done" | "archived";

export interface Item {
  id: string; // ulid()
  content: string;
  tags: Tag[];
  status: Status;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

export interface Settings {
  theme: "terminal-dark";
  accent: string; // e.g. '#2dd4bf'
  showCounter: boolean;
  version: "v1";
}

export const TAGS: readonly Tag[] = ["todo", "idea", "memo", "other"] as const;

export function isTag(x: unknown): x is Tag {
  return typeof x === "string" && (TAGS as readonly string[]).includes(x);
}

export function isStatus(x: unknown): x is Status {
  return x === "active" || x === "done" || x === "archived";
}

export function isItem(x: unknown): x is Item {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.content === "string" &&
    Array.isArray(o.tags) && o.tags.every(isTag) &&
    isStatus(o.status) &&
    typeof o.createdAt === "number" &&
    typeof o.updatedAt === "number"
  );
}

export function sanitizeItems(arr: unknown): Item[] {
  if (!Array.isArray(arr)) return [];
  const items = arr.filter(isItem) as Item[];
  // Ensure stable fields
  return items.map((it) => ({
    ...it,
    content: String(it.content),
    tags: Array.from(new Set(it.tags.filter(isTag))),
    status: isStatus(it.status) ? it.status : "active",
  }));
}

