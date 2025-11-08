"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "framer-motion";

import { generateMockGameState } from "@/lib/mockGameState";
import useGameStore from "../../../store/gameStore";
import {
  handleDropWithRules,
  gatherGroupForTile,
  planGroupDrop,
} from "../../../lib/rummiRules";
import HUD from "@/components/HUD";
import GameBoard from "@/components/GameBoard";
import TileTray from "@/components/TileTray";

const DEBUG_LOCAL_GAME = true; // toggle off for real multiplayer
let socket;

export default function GamePage() {
  const { roomId } = useParams();
  const [gameBoard, setGameBoard] = useState([]);
  const [playerTiles, setPlayerTiles] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [yourId, setYourId] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [initialMeldDone, setInitialMeldDone] = useState(false);

  // 🧩 Setup: Mock local game OR multiplayer socket
  useEffect(() => {
    if (DEBUG_LOCAL_GAME) {
      const mock = generateMockGameState();

      setGameBoard(mock.board);
      setPlayerTiles(mock.playerTiles);
      setPlayers([
        { id: "1", name: "You" },
        { id: "2", name: "AI Opponent" },
      ]);
      setYourId("1");
      setIsYourTurn(true);
      setCurrentTurn(0);
      return; // skip socket connection
    }

    // --- Multiplayer setup ---
    socket = io("http://localhost:3001");
    const username = `Guest${Math.floor(Math.random() * 1000)}`;
    socket.emit("join_queue", username);

    socket.on("game_start", (data) => {
      setGameBoard(data.board);
      setPlayerTiles(data.yourTiles);
      setPlayers(data.players);
      setCurrentTurn(data.currentTurn);
      setIsYourTurn(data.players[data.currentTurn].id === socket.id);
      setYourId(socket.id);
    });

    socket.on("move_made", ({ board: newBoard, playerTiles: newTiles }) => {
      setGameBoard(newBoard);
      setPlayerTiles(newTiles);
    });

    socket.on("your_turn", () => setIsYourTurn(true));
    socket.on("invalid_move", (data) => alert(data.message));

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  // 🚀 Submit move (mock or live)
  const submitMove = (newBoard, tilesUsedThisTurn) => {
    if (DEBUG_LOCAL_GAME) {
      setGameBoard(newBoard);
      return;
    }

    socket.emit("player_move", {
      roomId,
      newBoard,
      tilesUsedThisTurn,
      initialMeld: !initialMeldDone,
    });

    setIsYourTurn(false);
    if (!initialMeldDone) setInitialMeldDone(true);
  };

  // const sensors = useSensors(useSensor(PointerSensor));
  // const sensors = useSensors(
  //   useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  // );
  const sensors = useSensors(
    useSensor(PointerSensor) // no activation delay
  );

  const {
    tiles,
    board,
    moveTileToCell,
    moveTileToTray,
    setDragMeta,
    dragMeta,
    placeBatch,
  } = useGameStore();

  function onDragStart(evt) {
    const { active } = evt;
    // Build group from the tile under pointer
    const group = gatherGroupForTile(board, tiles, active.id);
    if (group.ids.length > 1) {
      setDragMeta({ type: "group", group });
    } else {
      setDragMeta({ type: "single", group });
    }
  }

  function onDragEnd(evt) {
    const { active, over } = evt;
    const meta = dragMeta;
    setDragMeta(null);

    if (!over || !over.id.startsWith("cell-")) {
      // dropped off board => send active (or group) to tray
      if (meta?.type === "group" && meta.group.ids.length > 1) {
        // Return all grouped tiles to tray if anchor came from board; for simplicity we’ll just return anchor
        // Better UX could keep previous positions, but spec doesn’t demand.
        moveTileToTray(active.id);
      } else {
        moveTileToTray(active.id);
      }
      return;
    }

    const [_, r, c] = over.id.split("-");
    const dropRow = parseInt(r, 10);
    const dropCol = parseInt(c, 10);

    // GROUP DROP
    if (meta?.type === "group" && meta.group.ids.length > 1) {
      const plan = planGroupDrop(board, tiles, meta.group, dropRow, dropCol);
      if (plan.ok) {
        placeBatch(plan.placements);
      } else {
        // collision / bounds -> no-op (or send anchor to tray)
        // Keep positions as-is (safer). Could show an invalid shake.
      }
      return;
    }

    // SINGLE DROP (with run-aware autosnap)
    const result = handleDropWithRules({
      board,
      tiles,
      dropRow,
      dropCol,
      tileId: active.id,
    });

    if (result.type === "place") {
      moveTileToCell(active.id, result.row, result.col);
    } else {
      moveTileToTray(active.id);
    }
  }

  return (
    <div className='max-w-6xl mx-auto p-4 grid grid-cols-12 gap-4'>
      {/* <h2 className='text-2xl mb-2'>
        {DEBUG_LOCAL_GAME ? "🧩 Local Test Mode" : `RummiSphere ID: ${roomId}`}
      </h2> */}

      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className='col-span-12 flex flex-col items-center justify-between'
      >
        <h1 className='text-3xl font-extrabold tracking-tight'>Rummisphere</h1>
        <h2 className='text-2xl mb-2'>
          {DEBUG_LOCAL_GAME
            ? "🧩 Local Test Mode"
            : `RummiSphere ID: ${roomId}`}
        </h2>
        <HUD />
      </motion.header>

      <section className='col-span-12 lg:col-span-8'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <GameBoard />

          {/* Drag overlay for grouped visual (simple horizontal stack) */}
          <DragOverlay>
            {/* <SortableContext items={dragMeta?.group.ids || []}> */}
            {dragMeta?.type === "group" && dragMeta.group.ids.length > 1 ? (
              <div className='flex gap-1'>
                {dragMeta.group.ids.map((id) => {
                  const t = tiles[id];
                  return (
                    <div
                      key={id}
                      className='w-10 h-12 rounded-md border-2 bg-white shadow-sm font-bold flex items-center justify-center'
                    >
                      <span className={`text-xs`}>{t.value}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {/* </SortableContext> */}
          </DragOverlay>
          <TileTray />
        </DndContext>
      </section>

      {/**
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => console.log("drag start", e)}
        onDragEnd={(e) => console.log("drag end", e)}
      >
        <div className='flex-1 w-full max-w-6xl flex flex-col'>
        <GameBoard
          board={board}
          playerTiles={playerTiles}
          setBoard={setBoard}
          setPlayerTiles={setPlayerTiles}
          submitMove={submitMove}
          initialMeldDone={initialMeldDone}
          setInitialMeldDone={setInitialMeldDone}
        />
        <TileTray tiles={playerTiles} />
      </DndContext>
*/}
      <div className='mt-2'>
        {isYourTurn ? (
          <span>Your turn!</span>
        ) : (
          <span>Waiting for other players...</span>
        )}
      </div>
    </div>
  );
}
