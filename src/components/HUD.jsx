"use client";

import useGameStore from "../store/gameStore";
import { motion } from "framer-motion";

export default function HUD() {
  const { runValidation, validation } = useGameStore();

  const badge = validation.ok
    ? "bg-emerald-100 text-emerald-700 border-emerald-300"
    : "bg-rose-100 text-rose-700 border-rose-300";

  return (
    <div className='flex items-center gap-3'>
      <motion.button
        whileTap={{ scale: 0.98 }}
        className='px-3 py-1.5 rounded-md border bg-white shadow-sm text-sm'
        onClick={() => runValidation()}
      >
        Validate Board
      </motion.button>
      <span className={`px-2.5 py-1 rounded-md border text-xs ${badge}`}>
        {validation.ok ? "Board valid" : `${validation.issues.length} issue(s)`}
      </span>
    </div>
  );
}
