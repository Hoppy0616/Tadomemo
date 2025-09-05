"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferred) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs"
      onClick={async () => {
        try {
          await deferred.prompt();
          await deferred.userChoice;
        } finally {
          setVisible(false);
          setDeferred(null);
        }
      }}
    >
      Install
    </Button>
  );
}

