"use client";

import { useEffect } from "react";

type ToasterPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type ToasterProps = {
  position?: ToasterPosition;
  richColors?: boolean;
};

const defaultOptions: Required<ToasterProps> = {
  position: "top-center",
  richColors: true,
};

const positionClasses: Record<ToasterPosition, string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
};

let currentOptions = { ...defaultOptions };

// Lightweight in-app toaster without external deps
export function Toaster(props: ToasterProps = {}) {
  const { position = defaultOptions.position, richColors = defaultOptions.richColors } = props;

  useEffect(() => {
    currentOptions = { position, richColors };
    return () => {
      currentOptions = { ...defaultOptions };
    };
  }, [position, richColors]);

  return null;
}

export function showSuccess(message: string) {
  const el = document.createElement("div");
  const paletteClass = currentOptions.richColors
    ? "bg-primary text-primary-foreground shadow"
    : "bg-card text-foreground shadow-sm";

  el.className =
    `fixed z-[9999] ${positionClasses[currentOptions.position]} px-4 py-2 rounded-md border border-border ` +
    `${paletteClass} font-mono text-sm transition-opacity`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2000);
}
