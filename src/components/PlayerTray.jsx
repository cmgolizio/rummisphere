"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";

import DraggableTile from "./DraggableTile";

export default function PlayerTray({ tiles }) {
  return (
    <div className='w-full bg-gray-200 p-2 rounded flex flex-wrap justify-center gap-1 mt-4'>
      <AnimatePresence>
        {tiles?.map((tile) => (
          <DraggableTile key={tile.id} tile={tile} />
        ))}
      </AnimatePresence>
    </div>
  );
}
