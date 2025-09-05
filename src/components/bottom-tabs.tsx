"use client";

import { Button } from "@/components/ui/button";
import { Clock, Edit3, Hash } from "lucide-react";

export type TabKey = "input" | "tags" | "timeline";

export function BottomTabs({ value, onChange }: { value: TabKey; onChange: (v: TabKey) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex">
        <Button
          variant="ghost"
          onClick={() => onChange("input")}
          className={`flex-1 py-4 rounded-none ${
            value === "input" ? "text-background bg-primary/20 border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <Edit3 className="w-5 h-5" />
            <span className="text-xs">Input</span>
          </div>
        </Button>

        <Button
          variant="ghost"
          onClick={() => onChange("tags")}
          className={`flex-1 py-4 rounded-none ${
            value === "tags" ? "text-background bg-primary/20 border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <Hash className="w-5 h-5" />
            <span className="text-xs">By Tag</span>
          </div>
        </Button>

        <Button
          variant="ghost"
          onClick={() => onChange("timeline")}
          className={`flex-1 py-4 rounded-none ${
            value === "timeline" ? "text-background bg-primary/20 border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-5 h-5" />
            <span className="text-xs">Timeline</span>
          </div>
        </Button>
      </div>
    </div>
  );
}

