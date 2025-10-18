"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { generateMockGameState } from "@/lib/mockGameState";
import Board from "@/components/Board";
import PlayerTray from "@/components/PlayerTray";

const DEBUG_LOCAL_GAME = true; // toggle off for real multiplayer
let socket;

export default function GamePage() {
  const { roomId } = useParams();
  const [board, setBoard] = useState([]);
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

      setBoard(mock.board);
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
      setBoard(data.board);
      setPlayerTiles(data.yourTiles);
      setPlayers(data.players);
      setCurrentTurn(data.currentTurn);
      setIsYourTurn(data.players[data.currentTurn].id === socket.id);
      setYourId(socket.id);
    });

    socket.on("move_made", ({ board: newBoard, playerTiles: newTiles }) => {
      setBoard(newBoard);
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
      setBoard(newBoard);
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

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <div className='flex flex-col items-center justify-center w-full h-screen bg-green-100 p-4'>
      <h2 className='text-2xl mb-2'>
        {DEBUG_LOCAL_GAME ? "🧩 Local Test Mode" : `RummiSphere ID: ${roomId}`}
      </h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => console.log("drag start", e)}
        onDragEnd={(e) => console.log("drag end", e)}
      >
        {/* <div className='flex-1 w-full max-w-6xl flex flex-col'> */}
        <Board
          board={board}
          playerTiles={playerTiles}
          setBoard={setBoard}
          setPlayerTiles={setPlayerTiles}
          submitMove={submitMove}
          initialMeldDone={initialMeldDone}
          setInitialMeldDone={setInitialMeldDone}
        />
        <PlayerTray tiles={playerTiles} />
        {/* </div> */}
      </DndContext>

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
