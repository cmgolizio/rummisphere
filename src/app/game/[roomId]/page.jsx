"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "framer-motion";

import GameBoard from "@/components/GameBoard";
import HUD from "@/components/HUD";
import TileTray from "@/components/TileTray";
import { connectSocket } from "@/lib/socket";
import { generateMockGameState } from "@/lib/mockGameState";
import {
  gatherGroupForTile,
  handleDropWithRules,
  planGroupDrop,
} from "@/lib/rummiRules";
import useGameStore from "@/store/gameStore";

const LOCAL_ROOM_ID = "local";

export default function GamePage() {
  const { roomId } = useParams();
  const isLocal = roomId === LOCAL_ROOM_ID;

  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [yourId, setYourId] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  const loadState = useGameStore((s) => s.loadState);
  const resetState = useGameStore((s) => s.resetState);
  const board = useGameStore((s) => s.board);
  const tiles = useGameStore((s) => s.tiles);
  const trayOrder = useGameStore((s) => s.trayOrder);
  const moveTileToCell = useGameStore((s) => s.moveTileToCell);
  const moveTileToTray = useGameStore((s) => s.moveTileToTray);
  const placeBatch = useGameStore((s) => s.placeBatch);
  const setDragMeta = useGameStore((s) => s.setDragMeta);
  const dragMeta = useGameStore((s) => s.dragMeta);
  const runValidation = useGameStore((s) => s.runValidation);

  const requestedStateRef = useRef(false);

  useEffect(() => {
    resetState();
    setPlayers([]);
    setCurrentTurn(0);
    setYourId(null);
    setIsYourTurn(false);
    setStatusMessage("");
    requestedStateRef.current = false;

    if (isLocal) {
      const mock = generateMockGameState();
      loadState({
        board: mock.board,
        tiles: mock.tiles,
        trayOrder: mock.trayOrder,
      });
      setPlayers(mock.players);
      setCurrentTurn(mock.currentTurn ?? 0);
      setYourId(mock.players?.[0]?.id ?? "local-player");
      setIsYourTurn(true);
      setStatusMessage("Local practice mode");
      return;
    }

    const activeSocket = connectSocket();

    const applyStateFromServer = (payload, message) => {
      if (!payload) return;
      loadState({
        board: payload.board,
        tiles: payload.tiles,
        trayOrder: payload.trayOrder,
      });
      setPlayers(payload.players ?? []);
      setCurrentTurn(payload.currentTurn ?? 0);
      setYourId(payload.playerId ?? activeSocket.id);
      setIsYourTurn(Boolean(payload.isYourTurn));
      if (message) {
        setStatusMessage(message);
      } else if (payload.isYourTurn) {
        setStatusMessage("Your turn");
      } else {
        const currentPlayer = payload.players?.[payload.currentTurn];
        setStatusMessage(
          currentPlayer
            ? `Waiting for ${currentPlayer.name}`
            : "Waiting for other players..."
        );
      }
    };

    const handleGameStart = (payload) => {
      requestedStateRef.current = true;
      applyStateFromServer(payload);
    };

    const handleGameUpdate = (payload) => {
      applyStateFromServer(payload);
    };

    const handleYourTurn = () => {
      setIsYourTurn(true);
      setStatusMessage("Your turn");
    };

    const handleInvalidMove = (payload = {}) => {
      setStatusMessage(payload.message ?? "Move rejected by server.");
      setIsYourTurn(true);
    };

    activeSocket.on("game_start", handleGameStart);
    activeSocket.on("game_update", handleGameUpdate);
    activeSocket.on("your_turn", handleYourTurn);
    activeSocket.on("invalid_move", handleInvalidMove);

    const requestState = () => {
      if (requestedStateRef.current) return;
      requestedStateRef.current = true;
      activeSocket.emit("request_state", { roomId });
    };

    if (activeSocket.connected) {
      requestState();
    } else {
      activeSocket.once("connect", requestState);
    }

    return () => {
      activeSocket.off("game_start", handleGameStart);
      activeSocket.off("game_update", handleGameUpdate);
      activeSocket.off("your_turn", handleYourTurn);
      activeSocket.off("invalid_move", handleInvalidMove);
    };
  }, [roomId, isLocal, loadState, resetState]);

  function onDragStart(event) {
    const { active } = event;
    const group = gatherGroupForTile(board, tiles, active.id);
    if (group.ids.length > 1) {
      setDragMeta({ type: "group", group });
    } else {
      setDragMeta({ type: "single", group });
    }
  }

  function onDragEnd(event) {
    const { active, over } = event;
    const meta = dragMeta;
    setDragMeta(null);

    if (!over || !over.id.startsWith("cell-")) {
      moveTileToTray(active.id);
      return;
    }

    const [, r, c] = over.id.split("-");
    const dropRow = parseInt(r, 10);
    const dropCol = parseInt(c, 10);

    if (meta?.type === "group" && meta.group.ids.length > 1) {
      const plan = planGroupDrop(board, tiles, meta.group, dropRow, dropCol);
      if (plan.ok) {
        placeBatch(plan.placements);
      }
      return;
    }

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

  const handleSubmitMove = () => {
    const validation = runValidation();
    if (!validation.ok) {
      setStatusMessage("Resolve validation issues before submitting.");
      return;
    }

    if (isLocal) {
      setStatusMessage("Local move recorded.");
      return;
    }

    const state = useGameStore.getState();
    const boardPayload = state.board.map((row) =>
      row.map((cell) => ({ tileId: cell.tileId ?? null }))
    );

    const activeSocket = connectSocket();

    activeSocket.emit("player_move", {
      roomId,
      board: boardPayload,
      trayOrder: [...state.trayOrder],
    });

    setIsYourTurn(false);
    setStatusMessage("Waiting for other players...");
  };

  return (
    <div className='max-w-6xl mx-auto p-4 grid grid-cols-12 gap-4'>
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className='col-span-12 flex flex-col items-center gap-2 text-center'
      >
        <h1 className='text-3xl font-extrabold tracking-tight'>Rummisphere</h1>
        <h2 className='text-xl text-gray-600'>
          {isLocal ? "🧩 Local Test Mode" : `Room: ${roomId}`}
        </h2>
      </motion.header>

      <section className='col-span-12 lg:col-span-8'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <GameBoard />

          <DragOverlay>
            {dragMeta?.type === "group" && dragMeta.group.ids.length > 1 ? (
              <div className='flex gap-1'>
                {dragMeta.group.ids.map((id) => {
                  const tile = tiles[id];
                  return (
                    <div
                      key={id}
                      className='w-10 h-12 rounded-md border-2 bg-white shadow-sm font-bold flex items-center justify-center'
                    >
                      <span className='text-xs'>
                        {tile?.isJoker ? "★" : tile?.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </DragOverlay>

          <TileTray />
        </DndContext>
      </section>

      <aside className='col-span-12 lg:col-span-4 flex flex-col gap-4'>
        <HUD />

        <div className='rounded-lg border bg-white shadow-sm p-4'>
          <h3 className='text-lg font-semibold mb-2'>Players</h3>
          <ul className='space-y-1 text-sm text-gray-700'>
            {players.map((player, index) => {
              const isCurrent = index === currentTurn;
              const isSelf = player.id === yourId;
              return (
                <li
                  key={player.id}
                  className={
                    "flex items-center justify-between" +
                    (isCurrent ? " font-semibold text-blue-700" : "")
                  }
                >
                  <span>
                    {player.name || player.username}
                    {isSelf ? " (You)" : ""}
                  </span>
                  {isCurrent && <span className='text-xs uppercase'>Turn</span>}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          onClick={handleSubmitMove}
          disabled={!isLocal && !isYourTurn}
          className='px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:bg-indigo-700 transition-colors'
        >
          Submit Move
        </button>

        <div className='text-sm text-gray-600 min-h-[1.5rem]'>
          {statusMessage}
        </div>
      </aside>
    </div>
  );
}
