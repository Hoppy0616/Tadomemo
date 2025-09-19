"use client";

import { Button } from "@/components/ui/button";
import { Clock, Edit3, Hash } from "lucide-react";

export type TabKey = "input" | "tags" | "timeline";

const tabs: Array<{ key: TabKey; label: string; Icon: typeof Edit3 }> = [
  { key: "input", label: "Input", Icon: Edit3 },
  { key: "tags", label: "By Tag", Icon: Hash },
  { key: "timeline", label: "Timeline", Icon: Clock },
];

export function BottomTabs({ value, onChange }: { value: TabKey; onChange: (v: TabKey) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex" role="tablist" aria-label="ビュー切り替え">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = value === key;
          return (
            <Button
              key={key}
              id={`tab-${key}`}
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${key}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(key)}
              className={`flex-1 py-4 rounded-none ${
                isActive ? "text-background bg-primary/20 border-t-2 border-primary" : "text-muted-foreground"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
