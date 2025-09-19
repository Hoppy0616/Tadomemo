"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ItemCard } from "@/components/item-card";
import type { Note } from "@/lib/notes";
import { Clock } from "lucide-react";

function groupByDate(notes: Note[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);

  const groups = {
    today: [] as Note[],
    yesterday: [] as Note[],
    thisWeek: [] as Note[],
    older: [] as Note[],
  };

  const sorted = [...notes].sort((a, b) => {
    const at = a.timestamp?.getTime?.() ?? 0;
    const bt = b.timestamp?.getTime?.() ?? 0;
    if (bt !== at) return bt - at; // desc by time
    // fallback: ULID lexicographic (desc)
    return b.id.localeCompare(a.id);
  });

  sorted.forEach((note) => {
    const d = new Date(note.timestamp.getFullYear(), note.timestamp.getMonth(), note.timestamp.getDate());
    if (d.getTime() === today.getTime()) groups.today.push(note);
    else if (d.getTime() === yesterday.getTime()) groups.yesterday.push(note);
    else if (d.getTime() >= thisWeekStart.getTime()) groups.thisWeek.push(note);
    else groups.older.push(note);
  });

  return groups;
}

export function TimelineView({
  notes,
  onToggleComplete,
  onUpdateTags,
}: {
  notes: Note[];
  onToggleComplete: (id: string) => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
}) {
  const timeline = groupByDate(notes);
  const hasAnyNotes = notes.length > 0;
  if (!hasAnyNotes) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No notes yet. Start capturing your thoughts!</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {(["today", "yesterday", "thisWeek", "older"] as const).map((key) => {
        const label =
          key === "today" ? "Today" : key === "yesterday" ? "Yesterday" : key === "thisWeek" ? "This Week" : "Older";
        const list = timeline[key];
        if (list.length === 0) return null;
        return (
          <div key={key} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm text-muted-foreground uppercase tracking-wide font-mono">{label}</h2>
              <div className="flex-1 h-px bg-border"></div>
              <Badge variant="outline" className="text-xs font-mono">
                {list.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {list.map((note) => (
                <ItemCard
                  key={note.id}
                  note={note}
                  onToggleComplete={onToggleComplete}
                  showDate={key === "today" || key === "yesterday" ? "time" : "dateTime"}
                  editable
                  onUpdateTags={onUpdateTags}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
