"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import Tile from "./Tile";

function DraggableTile({ tile }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tile.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition: isDragging ? "none" : "transform 0.08s linear",
        cursor: "grab",
      }}
      className={isDragging ? "opacity-70" : ""}
    >
      <Tile tile={tile} />
    </div>
  );
}

export default React.memo(DraggableTile);
