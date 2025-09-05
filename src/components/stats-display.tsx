"use client";

import { Badge } from "@/components/ui/badge";
import type { Note } from "@/lib/notes";

export function StatsDisplay({ notes }: { notes: Note[] }) {
  const todayCount = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return notes.filter((n) => {
      const d = new Date(n.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
  })();

  return (
    <Badge variant="secondary" className="text-xs">
      {todayCount} today
    </Badge>
  );
}

