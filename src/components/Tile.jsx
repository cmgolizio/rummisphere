// function Tile({ id, value, color, x, y, onDrop }) {
//   const motionX = useMotionValue(x);
//   const motionY = useMotionValue(y);

//   const colors = {
//     red: "#e74c3c",
//     blue: "#3498db",
//     yellow: "#f1c40f",
//     black: "#2c3e50",
//   };

//   return (
//     <motion.div
//       className={
//         "absolute flex items-center justify-center w-[70px] h-[70px] rounded-md font-bold text-lg cursor-grab active:cursor-grabbing select-none"
//       }
//       drag
//       dragMomentum={false}
//       style={{
//         x: motionX,
//         y: motionY,
//         color: colors[color],
//         borderColor: colors[color],
//       }}
//       onDragEnd={(e, info) => {
//         const boardX = info.point.x - e.target.offsetParent.offsetLeft;
//         const boardY = info.point.y - e.target.offsetParent.offsetTop;
//         onDrop(boardX, boardY);
//       }}
//     >
//       {value}
//     </motion.div>
//   );
// }

"use client";

import React from "react";

export default function Tile({ tile }) {
  const colors = {
    red: "#e74c3c",
    blue: "#3498db",
    yellow: "#f1c40f",
    black: "#2c3e50",
  };

  // If tile has x/y we render absolutely so it sits on the board grid.
  // If not, render as inline fallback (tray usage handled elsewhere).
  const hasPos = tile && tile.x != null && tile.y != null;

  const styleBase = {
    color: colors[tile?.color] || "#111",
    borderColor: colors[tile?.color] || "#ccc",
  };

  if (hasPos) {
    return (
      <div
        className='absolute w-[70px] h-[70px] flex items-center justify-center text-xl font-bold rounded-md border-2 shadow-md bg-white select-none cursor-grab active:cursor-grabbing transition-transform'
        style={{
          left: `${tile.x}px`,
          top: `${tile.y}px`,
          ...styleBase,
        }}
      >
        {tile.is_joker ? "J" : tile.number}
      </div>
    );
  }

  // fallback (e.g., tile inside tray)
  return (
    <div
      className='w-12 h-16 flex items-center justify-center text-xl font-bold rounded-md border-2 shadow-md bg-white select-none cursor-grab active:cursor-grabbing'
      style={{
        ...styleBase,
      }}
    >
      {tile?.is_joker ? "J" : tile?.number}
    </div>
  );
}
