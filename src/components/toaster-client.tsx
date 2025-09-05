"use client";

// Lightweight in-app toaster without external deps
export function Toaster() {
  return null;
}

export function showSuccess(message: string) {
  const el = document.createElement("div");
  el.className =
    "fixed z-[9999] top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md border border-border shadow " +
    "bg-primary text-primary-foreground font-mono text-sm transition-opacity";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2000);
}
