"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Note } from "@/lib/notes";

type ShowDate = "date" | "time" | "dateTime";

export function ItemCard({
  note,
  onToggleComplete,
  showDate = "dateTime",
  tagClickable = false,
  selectedTags,
  onClickTag,
}: {
  note: Note;
  onToggleComplete?: (id: string) => void;
  showDate?: ShowDate;
  tagClickable?: boolean;
  selectedTags?: string[];
  onClickTag?: (tag: string) => void;
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
          <p className={`text-sm ${note.completed ? "line-through text-muted-foreground" : ""}`}>{note.content}</p>
          <div className="flex items-center gap-2 mt-2">
            {note.tags.map((tag) => {
              const active = selectedTags?.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={active ? "default" : "outline"}
                  className={`text-xs ${tagClickable ? "cursor-pointer" : ""}`}
                  onClick={tagClickable ? () => onClickTag?.(tag) : undefined}
                >
                  #{tag}
                </Badge>
              );
            })}
            <span className="text-xs text-muted-foreground font-mono">{datetime}</span>
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

