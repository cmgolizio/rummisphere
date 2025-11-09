"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import socket, { connectSocket } from "@/lib/socket";

const USERNAME_STORAGE_KEY = "rummisphere:last-username";

export default function LandingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const connectingRef = useRef(connecting);
  const usernameRef = useRef(username);

  useEffect(() => {
    connectingRef.current = connecting;
  }, [connecting]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(USERNAME_STORAGE_KEY);
    if (stored) {
      setUsername(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (username) {
      sessionStorage.setItem(USERNAME_STORAGE_KEY, username);
    }
  }, [username]);

  useEffect(() => {
    let mounted = true;

    const handleMatchFound = ({ roomId }) => {
      if (!mounted) return;
      setConnecting(false);
      setError("");
      router.push(`/game/${roomId}`);
    };

    const handleConnectionFailure = () => {
      if (!mounted) return;
      setError("Failed to connect to the game server. Please try again.");
      setConnecting(false);
    };

    const handleDisconnect = () => {
      if (!mounted) return;
      if (connectingRef.current) {
        setError("Connection lost while matchmaking. Please try again.");
        setConnecting(false);
      }
    };

    socket.on("match_found", handleMatchFound);
    socket.on("connect_error", handleConnectionFailure);
    socket.on("connect_timeout", handleConnectionFailure);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("error", handleConnectionFailure);
    socket.io.on("reconnect_error", handleConnectionFailure);

    return () => {
      mounted = false;
      socket.off("match_found", handleMatchFound);
      socket.off("connect_error", handleConnectionFailure);
      socket.off("connect_timeout", handleConnectionFailure);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("error", handleConnectionFailure);
      socket.io.off("reconnect_error", handleConnectionFailure);
    };
  }, [router]);

  const handleJoinQueue = () => {
    const trimmed = usernameRef.current.trim();
    if (!trimmed) {
      setError("Please enter a name.");
      return;
    }

    setError("");
    setConnecting(true);

    const activeSocket = connectSocket();
    activeSocket.emit("join_queue", trimmed);
  };

  const handleLocalGame = () => {
    router.push("/game/local");
  };

  return (
    <div className='flex flex-col items-center justify-center h-screen p-6 bg-gray-50'>
      <h1 className='text-4xl font-bold mb-4'>Welcome to the RummiSphere!</h1>
      <p className='text-lg mb-8 text-gray-700'>
        Play Rummikub in real-time against others — or test locally
      </p>

      <input
        className='border border-gray-400 rounded px-3 py-2 mb-4 w-64 text-center focus:outline-none focus:ring-2 focus:ring-blue-400'
        type='text'
        placeholder='Enter your name'
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <div className='flex flex-col gap-3'>
        <button
          onClick={handleJoinQueue}
          disabled={connecting}
          className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50 transition-all'
        >
          {connecting ? "Looking for match..." : "Join Matchmaking"}
        </button>

        <button
          onClick={handleLocalGame}
          className='bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-all'
        >
          Play Mock Game (Offline)
        </button>
      </div>

      {error && <p className='text-red-600 mt-3'>{error}</p>}
    </div>
  );
}
