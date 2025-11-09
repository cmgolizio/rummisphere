"use client";

import { motion } from "framer-motion";

const colorMap = {
  red: "border-red-500 text-red-600",
  blue: "border-blue-500 text-blue-600",
  yellow: "border-yellow-500 text-yellow-600",
  black: "border-slate-700 text-slate-800",
  joker: "border-purple-500 text-purple-700",
};

export default function Tile({ tile }) {
  const cls = colorMap[tile.color] || "border-slate-400 text-slate-700";
  const display = tile.isJoker || tile.color === "joker" ? "★" : tile.value;
  return (
    // <motion.div
    //   layout
    //   whileTap={{ scale: 0.96 }}
    //   className={`w-10 h-12 rounded-md border-2 bg-white shadow-sm font-bold flex items-center justify-center select-none ${cls}`}
    // >
    //   {tile.value}
    // </motion.div>
    <motion.div
      whileTap={{ scale: 0.92 }} // keep a tap feedback; NOT layout-affecting
      className={`w-10 h-12 rounded-md border-2 bg-white shadow-sm font-bold flex items-center justify-center select-none ${cls}`}
      style={{
        touchAction: "none", // CRITICAL for good pointer drag responsiveness
      }}
    >
      {display}
    </motion.div>
  );
}
