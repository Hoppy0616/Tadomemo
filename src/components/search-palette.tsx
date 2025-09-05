"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItemCard } from "@/components/item-card";
import type { Note } from "@/lib/notes";
import { Search, X } from "lucide-react";

export function SearchPalette({
  open,
  onClose,
  query,
  onQuery,
  notes,
  onToggleComplete,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  onQuery: (v: string) => void;
  notes: Note[];
  onToggleComplete: (id: string) => void;
}) {
  const results = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Note[];
    return notes.filter(
      (note) =>
        note.content.toLowerCase().includes(q) ||
        note.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  })();

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-9"
              autoFocus
            />
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {query ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-muted-foreground uppercase tracking-wide">Search Results</h2>
              <Badge variant="outline" className="text-xs">
                {results.length} found
              </Badge>
            </div>

            {results.length === 0 ? (
              <Card className="p-6 bg-card border-border">
                <div className="text-center">
                  <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No notes found matching "{query}"</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.map((note) => (
                  <ItemCard
                    key={note.id}
                    note={note}
                    onToggleComplete={onToggleComplete}
                    showDate="dateTime"
                    highlightQuery={query}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Start typing to search your notes...</p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Press Escape to close • Use Cmd/Ctrl+K to search
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

