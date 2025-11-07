"use client";

import { useDroppable } from "@dnd-kit/core";

export default function DroppableCell({ id, children, invalid = false }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const base =
    "aspect-square rounded-md border text-xs flex items-center justify-center transition-colors";
  const okClasses = isOver
    ? "bg-amber-100 border-amber-400"
    : "bg-slate-50 border-slate-300";
  const badClasses = isOver
    ? "bg-rose-100 border-rose-500"
    : "bg-rose-50 border-rose-400";

  return (
    <div
      ref={setNodeRef}
      className={`${base} ${invalid ? badClasses : okClasses}`}
    >
      {children}
    </div>
  );
}
