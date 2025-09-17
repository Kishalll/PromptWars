// src/components/RoundResult.jsx
import React from "react";

export default function RoundResult(props) {
  // props may be partially undefined while data streams in.
  const { round = "—", target = "—", p1 = {}, p2 = {} } = props || {};

  // safe accessor with fallback values
  const a = {
    username: (p1 && p1.username) || "Player 1",
    prompt: (p1 && p1.prompt) || "—",
    score: typeof (p1 && p1.score) === "number" ? p1.score : "—",
    total: typeof (p1 && p1.total) === "number" ? p1.total : "—"
  };
  const b = {
    username: (p2 && p2.username) || "Player 2",
    prompt: (p2 && p2.prompt) || "—",
    score: typeof (p2 && p2.score) === "number" ? p2.score : "—",
    total: typeof (p2 && p2.total) === "number" ? p2.total : "—"
  };

  return (
    <div className="bg-white shadow rounded p-4 mb-3">
      <div className="text-sm text-gray-500 mb-2">Round {round} — Target</div>
      <div className="text-lg font-semibold mb-3">{target}</div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 border rounded">
          <div className="text-xs text-gray-500">Player</div>
          <div className="font-medium">{a.username}</div>
          <div className="mt-2 text-sm">Prompt: <span className="text-gray-700">{a.prompt}</span></div>
          <div className="mt-2 text-sm">Score: <span className="font-semibold">{a.score}</span></div>
          <div className="mt-1 text-xs text-gray-500">Total: {a.total}</div>
        </div>

        <div className="p-3 border rounded">
          <div className="text-xs text-gray-500">Player</div>
          <div className="font-medium">{b.username}</div>
          <div className="mt-2 text-sm">Prompt: <span className="text-gray-700">{b.prompt}</span></div>
          <div className="mt-2 text-sm">Score: <span className="font-semibold">{b.score}</span></div>
          <div className="mt-1 text-xs text-gray-500">Total: {b.total}</div>
        </div>
      </div>
    </div>
  );
}
