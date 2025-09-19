"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Note } from "@/lib/notes";
import { normalizeTag } from "@/lib/notes";
import { Plus, X } from "lucide-react";

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
  editable = false,
  onUpdateTags,
}: {
  note: Note;
  onToggleComplete?: (id: string) => void;
  showDate?: ShowDate;
  tagClickable?: boolean;
  selectedTags?: string[];
  onClickTag?: (tag: string) => void;
  highlightQuery?: string;
  editable?: boolean;
  onUpdateTags?: (id: string, tags: string[]) => void;
}) {
  const datetime =
    showDate === "date"
      ? note.timestamp.toLocaleDateString()
      : showDate === "time"
        ? note.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : `${note.timestamp.toLocaleDateString()} ${note.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  const [isEditing, setIsEditing] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>(note.tags);
  const [draftInput, setDraftInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftTags(note.tags);
  }, [note.tags]);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isEditing]);

  const normalizedDraft = useMemo(() => {
    const set = new Set<string>();
    draftTags.forEach((tag) => {
      const normalized = normalizeTag(tag);
      if (normalized) set.add(normalized);
    });
    return Array.from(set);
  }, [draftTags]);

  const startEditing = () => {
    if (!editable) return;
    setDraftTags(note.tags);
    setDraftInput("");
    setIsEditing(true);
  };

  const handleTagClick = (tag: string) => {
    if (tagClickable) {
      onClickTag?.(tag);
      return;
    }
    if (editable) {
      startEditing();
    }
  };

  const handleAddTag = () => {
    const normalized = normalizeTag(draftInput);
    if (!normalized) return;
    setDraftTags((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setDraftInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setDraftTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSaveTags = () => {
    if (!onUpdateTags) {
      setIsEditing(false);
      return;
    }
    onUpdateTags(note.id, normalizedDraft);
    setIsEditing(false);
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className={`text-sm ${note.completed ? "line-through text-muted-foreground" : ""}`}>
            {highlight(String(note.content), highlightQuery)}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {(isEditing ? normalizedDraft : note.tags).map((tag) => {
              const active = selectedTags?.includes(tag);
              const isAi = Array.isArray(note.aiTags) && note.aiTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={active ? "default" : "outline"}
                  className={`text-xs transition-colors duration-200 ${
                    isAi ? "border-[#2dd4bf] text-[#2dd4bf] bg-[#2dd4bf]/10" : ""
                  } ${tagClickable || editable ? "cursor-pointer" : ""}`}
                  onClick={() => handleTagClick(tag)}
                >
                  #{tag}
                </Badge>
              );
            })}
            {!isEditing && editable && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={startEditing}
              >
                Edit Tags
              </Button>
            )}
            {isEditing && (
              <div className="w-full space-y-2">
                <div className="flex flex-wrap gap-2">
                  {normalizedDraft.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
                  {normalizedDraft.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs">
                      #{tag}
                      <button
                        type="button"
                        aria-label={`Remove ${tag}`}
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={draftInput}
                    onChange={(event) => setDraftInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add new tag"
                    className="text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setDraftTags(note.tags);
                      setDraftInput("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleSaveTags}>
                    Save
                  </Button>
                </div>
              </div>
            )}
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
