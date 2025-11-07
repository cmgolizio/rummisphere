"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
// import Tile from "./Tile";

const colorMap = {
  red: "border-red-500 text-red-600",
  blue: "border-blue-500 text-blue-600",
  yellow: "border-yellow-500 text-yellow-600",
  black: "border-slate-700 text-slate-800",
};

function Tile({ tile }) {
  const cls = colorMap[tile.color] || "border-slate-400 text-slate-700";
  return (
    <motion.div
      layout
      whileTap={{ scale: 0.96 }}
      className={`w-10 h-12 rounded-md border-2 bg-white shadow-sm font-bold flex items-center justify-center select-none ${cls}`}
    >
      {tile.value}
    </motion.div>
  );
}

export default function DraggableTile({ tile }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tile.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-70" : ""
      }`}
      data-dnd-draggable
    >
      <Tile tile={tile} />
    </div>
  );
}
