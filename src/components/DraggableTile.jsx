// "use client";

// import React from "react";
// // import { motion } from "framer-motion";
// import { useDraggable } from "@dnd-kit/core";
// import { motion, useMotionValue, useTransform } from "framer-motion";

// import Tile from "./Tile";

// export default function DraggableTile({ tile }) {
//   const { attributes, listeners, setNodeRef, transform } = useDraggable({
//     id: tile.id,
//   });

//   console.log("Tile:", tile.id, "Transform:", transform);

//   const x = useMotionValue(0);
//   const y = useMotionValue(0);

//   const rotate = useTransform(x, [-100, 100], [-15, 15]);

//   const style = {
//     transform: transform
//       ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
//       : undefined,
//     zIndex: transform ? 999 : "auto",
//     cursor: "grab",
//     x,
//     y,
//     rotate,
//   };

//   return (
//     // <motion.div
//     //   ref={setNodeRef}
//     //   style={style}
//     //   {...listeners}
//     //   {...attributes}
//     //   layout
//     //   initial={{ y: -50, opacity: 0 }}
//     //   animate={{ y: 0, opacity: 1 }}
//     //   exit={{ y: -50, opacity: 0 }}
//     //   transition={{ type: "spring", stiffness: 300, damping: 20 }}
//     // >
//     <motion.div
//       className='bg-transparent text-white px-6 py-4 rounded-lg cursor-grab active:cursor-grabbing select-none'
//       drag
//       dragMomentum={false}
//       // style={{
//       //   x,
//       //   y,
//       //   rotate,
//       // }}
//       style={style}
//       whileTap={{ scale: 1.1 }}
//       whileHover={{ scale: 1.05 }}
//       onDragStart={() => console.log("drag start")}
//       onDrag={(e, info) => console.log("drag", info.point)}
//       onDragEnd={() => console.log("drag end")}
//     >
//       <Tile tile={tile} />
//     </motion.div>
//   );
// }

// // "use client";

// // import { motion, useMotionValue, useTransform } from "framer-motion";

// // export default function HomePage() {
// //   const x = useMotionValue(0);
// //   const y = useMotionValue(0);

// //   const rotate = useTransform(x, [-100, 100], [-15, 15]);

// //   return (
// //     <div className="flex flex-col items-center justify-center h-screen">
// //       <h1 className="text-3xl font-bold mb-6">Drag the Tile!</h1>

// //       <motion.div
// //         className="bg-blue-500 text-white px-6 py-4 rounded-lg cursor-grab active:cursor-grabbing select-none"
// //         drag
// //         dragMomentum={false}
// //         style={{
// //           x,
// //           y,
// //           rotate,
// //         }}
// //         whileTap={{ scale: 1.1 }}
// //         whileHover={{ scale: 1.05 }}
// //         onDragStart={() => console.log("drag start")}
// //         onDrag={(e, info) => console.log("drag", info.point)}
// //         onDragEnd={() => console.log("drag end")}
// //       >
// //         🀄 Tile
// //       </motion.div>
// //     </div>
// //   );
// // }

"use client";
import React from "react";
import { motion, useMotionValue } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import Tile from "./Tile";

export default function DraggableTile({ tile, onDrop }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tile.id,
  });

  const x = useMotionValue(tile.x ?? 0);
  const y = useMotionValue(tile.y ?? 0);

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      drag
      dragMomentum={false}
      style={{
        x,
        y,
        position: "absolute",
        zIndex: transform ? 999 : "auto",
      }}
      onDragEnd={(e, info) => {
        const boardX = info.point.x - e.target.offsetParent.offsetLeft;
        const boardY = info.point.y - e.target.offsetParent.offsetTop;
        onDrop(tile.id, boardX, boardY);
      }}
    >
      <Tile tile={tile} />
    </motion.div>
  );
}
