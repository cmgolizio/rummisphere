"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tile from "./Tile";
import { useDroppable } from "@dnd-kit/core";

export default function DroppableSet({ set, setIndex, onDragStart }) {
  const { setNodeRef } = useDroppable({ id: `set-${setIndex}` });

  return (
    <div
      ref={setNodeRef}
      className='flex gap-1 bg-green-300 p-1 rounded min-h-[60px] min-w-[60px]'
    >
      <AnimatePresence>
        {set.map((tile, idx) => (
          <motion.div
            key={tile.id}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onMouseDown={() =>
              onDragStart({ active: { id: tile.id } }, set.slice(idx))
            }
          >
            <Tile tile={tile} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
