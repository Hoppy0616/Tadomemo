"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Note } from "@/lib/notes";

type ShowDate = "date" | "time" | "dateTime";

function highlight(text: string, query?: string) {
  if (!query) return text;
  try {
    const q = query.trim();
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`, "ig");
    const parts = text.split(re);
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <mark key={`${part}-${index}`} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    );
  } catch {
    return text;
  }
}

export function ItemCard({
  note,
  onToggleComplete,
  showDate = "dateTime",
  tagClickable = false,
  selectedTags,
  onClickTag,
  highlightQuery,
}: {
  note: Note;
  onToggleComplete?: (id: string) => void;
  showDate?: ShowDate;
  tagClickable?: boolean;
  selectedTags?: string[];
  onClickTag?: (tag: string) => void;
  highlightQuery?: string;
}) {
  const datetime =
    showDate === "date"
      ? note.timestamp.toLocaleDateString()
      : showDate === "time"
        ? note.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : `${note.timestamp.toLocaleDateString()} ${note.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className={`text-sm ${note.completed ? "line-through text-muted-foreground" : ""}`}>
            {highlight(String(note.content), highlightQuery)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {note.tags.map((tag) => {
              const active = selectedTags?.includes(tag);
              const isAi = Array.isArray(note.aiTags) && note.aiTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={active ? "default" : "outline"}
                  className={`text-xs transition-colors duration-200 ${
                    isAi ? "border-[#2dd4bf] text-[#2dd4bf] bg-[#2dd4bf]/10" : ""
                  } ${tagClickable ? "cursor-pointer" : ""}`}
                  onClick={tagClickable ? () => onClickTag?.(tag) : undefined}
                >
                  #{tag}
                </Badge>
              );
            })}
            <span className="text-xs text-muted-foreground font-mono">{datetime}</span>
            {note.pending && (
              <Badge variant="secondary" className="text-[10px]">pending</Badge>
            )}
          </div>
        </div>
        {note.tags.includes("ToDo") && onToggleComplete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleComplete(note.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <div className={`w-4 h-4 border border-border rounded ${note.completed ? "bg-primary" : ""}`} />
          </Button>
        )}
      </div>
    </Card>
  );
}
