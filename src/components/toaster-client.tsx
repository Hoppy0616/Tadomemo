"use client";

import dynamic from "next/dynamic";

export const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

export async function showSuccess(message: string) {
  const mod = await import("sonner");
  mod.toast.success(message);
}

