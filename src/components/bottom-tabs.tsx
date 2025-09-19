"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Clock, Edit3, Hash } from "lucide-react";

export type TabKey = "input" | "tags" | "timeline";

const tabs: Array<{ key: TabKey; label: string; Icon: typeof Edit3 }> = [
  { key: "input", label: "Input", Icon: Edit3 },
  { key: "tags", label: "By Tag", Icon: Hash },
  { key: "timeline", label: "Timeline", Icon: Clock },
];

export function BottomTabs({ value, onChange }: { value: TabKey; onChange: (v: TabKey) => void }) {
  const [focusedKey, setFocusedKey] = useState<TabKey>(value);

  useEffect(() => {
    setFocusedKey(value);
  }, [value]);

  const focusTab = (key: TabKey) => {
    if (typeof document === "undefined") return;
    const node = document.getElementById(`tab-${key}`);
    if (node instanceof HTMLButtonElement) {
      node.focus();
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = tabs.length - 1;
    const withModifier = event.metaKey || event.ctrlKey;
    const moveFocus = (nextIndex: number) => {
      const nextTab = tabs[nextIndex];
      setFocusedKey(nextTab.key);
      focusTab(nextTab.key);
      if (withModifier && nextTab.key !== value) {
        onChange(nextTab.key);
      }
    };

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown": {
        event.preventDefault();
        const nextIndex = index === lastIndex ? 0 : index + 1;
        moveFocus(nextIndex);
        break;
      }
      case "ArrowLeft":
      case "ArrowUp": {
        event.preventDefault();
        const nextIndex = index === 0 ? lastIndex : index - 1;
        moveFocus(nextIndex);
        break;
      }
      case "Home": {
        event.preventDefault();
        moveFocus(0);
        break;
      }
      case "End": {
        event.preventDefault();
        moveFocus(lastIndex);
        break;
      }
      case "Enter":
      case " ":
      case "Spacebar": {
        event.preventDefault();
        onChange(tabs[index]!.key);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex" role="tablist" aria-label="ビュー切り替え">
        {tabs.map(({ key, label, Icon }, index) => {
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
              tabIndex={focusedKey === key ? 0 : -1}
              onClick={() => onChange(key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onFocus={() => setFocusedKey(key)}
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
