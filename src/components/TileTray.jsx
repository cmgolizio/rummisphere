"use client";

import useGameStore from "../store/gameStore";
import DraggableTile from "./DraggableTile";

export default function TileTray() {
  const { trayOrder, tiles } = useGameStore();

  return (
    <div className='rounded-lg border bg-white shadow-sm p-3'>
      <h2 className='text-lg font-semibold mb-2'>Your Tiles</h2>
      <div className='flex flex-wrap gap-2'>
        {trayOrder.map((id) => (
          <DraggableTile key={id} tile={tiles[id]} />
        ))}
      </div>
    </div>
  );
}
