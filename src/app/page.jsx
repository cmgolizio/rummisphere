"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

let socket;

export default function LandingPage() {
  const [username, setUsername] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleJoinQueue = async () => {
    if (!username.trim()) {
      setError("Please enter a name.");
      return;
    }
    setError("");
    setConnecting(true);

    socket = io("http://localhost:3001");

    socket.emit("join_queue", username);

    // Listen for assigned room
    socket.on("match_found", ({ roomId }) => {
      router.push(`/game/${roomId}`);
    });

    socket.on("connect_error", () => {
      setError("Failed to connect to server.");
      setConnecting(false);
    });
  };

  return (
    <div className='flex flex-col items-center justify-center h-screen p-6'>
      <h1 className='text-4xl font-bold mb-4'>Welcome to the RummiSphere!</h1>
      <p className='text-lg mb-8'>Play Rummikub in real-time against others</p>

      <input
        className='border border-gray-400 rounded px-3 py-2 mb-4 w-64 text-center'
        type='text'
        placeholder='Enter your name'
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <button
        onClick={handleJoinQueue}
        disabled={connecting}
        className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50'
      >
        {connecting ? "Looking for match..." : "Join Matchmaking"}
      </button>

      {error && <p className='text-red-600 mt-3'>{error}</p>}
    </div>
  );
}

/**
 * "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

let socket;

export default function LandingPage() {
  const [username, setUsername] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleJoinQueue = async () => {
    if (!username.trim()) {
      setError("Please enter a name.");
      return;
    }
    setError("");
    setConnecting(true);

    try {
      socket = io("http://localhost:3001");

      socket.emit("join_queue", username);

      // Listen for assigned room
      socket.on("match_found", ({ roomId }) => {
        router.push(`/game/${roomId}`);
      });

      socket.on("connect_error", () => {
        setError("Failed to connect to server.");
        setConnecting(false);
      });
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server.");
      setConnecting(false);
    }
  };

  const handleMockGame = () => {
    // Skip matchmaking → just go to a local test game
    router.push("/mock");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">Welcome to the RummiSphere!</h1>
      <p className="text-lg mb-8 text-gray-700">
        Play Rummikub in real-time against others — or test locally
      </p>

      <input
        className="border border-gray-400 rounded px-3 py-2 mb-4 w-64 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <div className="flex flex-col gap-3">
        <button
          onClick={handleJoinQueue}
          disabled={connecting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50 transition-all"
        >
          {connecting ? "Looking for match..." : "Join Matchmaking"}
        </button>

        <button
          onClick={handleMockGame}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-all"
        >
          Play Mock Game (Offline)
        </button>
      </div>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}

*/
