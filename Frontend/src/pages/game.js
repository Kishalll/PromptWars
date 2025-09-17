// src/pages/game.js
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { getSocket, disconnectSocket } from "../lib/socket";
import RoundResult from "../components/RoundResult";

export default function GamePage() {
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [socket, setSocket] = useState(null);

  const [status, setStatus] = useState("idle"); // idle, queued, matched, in-round, waiting, finished
  const [matchId, setMatchId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState("");
  const [prompt, setPrompt] = useState("");
  const [roundResults, setRoundResults] = useState([]); // normalized round results
  const [totals, setTotals] = useState({ p1: 0, p2: 0 });
  const [mySide, setMySide] = useState(null); // 'p1' or 'p2'

  const submittedRef = useRef(false);
  const playersRef = useRef({}); // store { p1: name, p2: name } for handler fallback

  useEffect(() => {
    const u = typeof window !== "undefined" ? localStorage.getItem("pd_username") : null;
    if (!u) {
      router.push("/login");
      return;
    }
    setUsername(u);

    const s = getSocket();
    setSocket(s);

    // Register user with socket server
    s.emit("register", { username: u });

    // queued
    const onQueued = () => setStatus("queued");
    s.on("queued", onQueued);

    // match started
    const onMatchStarted = (m) => {
      setStatus("matched");
      setMatchId(m.matchId);
      const p1 = m.players?.p1;
      const p2 = m.players?.p2;
      playersRef.current = { p1, p2 };
      if (p1 === u) setMySide("p1");
      else setMySide("p2");
      setOpponent(p1 === u ? p2 : p1);
      setRound(m.round || 1);
      setTarget(m.target || "");
      setRoundResults([]);
      setTotals({ p1: 0, p2: 0 });
    };
    s.on("matchStarted", onMatchStarted);

    // next round
    const onNextRound = (n) => {
      setRound(n.round);
      setTarget(n.target);
      setPrompt("");
      submittedRef.current = false;
      setStatus("in-round");
    };
    s.on("nextRound", onNextRound);

    // round result (robust normalization)
    const onRoundResult = (r) => {
      try {
        console.log("ROUND RESULT RAW:", r);

        // helper: normalize participant payloads to { username, prompt, score, total }
        const normalizeParticipant = (raw, fallbackName) => {
          if (!raw || typeof raw !== "object") {
            return { username: fallbackName, prompt: "—", score: "—", total: "—" };
          }
          // accept multiple possible property names
          const username = raw.username ?? raw.name ?? raw.player ?? raw._username ?? fallbackName;
          const prompt = raw.prompt ?? raw.text ?? raw.description ?? raw.p ?? "—";
          const score = typeof raw.score === "number" ? raw.score : (typeof raw.points === "number" ? raw.points : (raw.score ? Number(raw.score) : "—"));
          const total = typeof raw.total === "number" ? raw.total : (typeof raw.total_points === "number" ? raw.total_points : (raw.points_total ? Number(raw.points_total) : (raw.total ? Number(raw.total) : "—")));
          return { username, prompt, score: Number.isFinite(score) ? score : score, total: Number.isFinite(total) ? total : total };
        };

        // Find raw p1/p2 in multiple possible shapes
        let rawP1 = r.p1 ?? r.player1 ?? r.p1Data ?? r.p1_data ?? null;
        let rawP2 = r.p2 ?? r.player2 ?? r.p2Data ?? r.p2_data ?? null;

        // Some older versions might send field names like p1Prompt/p1Score
        if (!rawP1 && r.p1Prompt) rawP1 = { prompt: r.p1Prompt, score: r.p1Score, total: r.p1Total, username: r.p1Name };
        if (!rawP2 && r.p2Prompt) rawP2 = { prompt: r.p2Prompt, score: r.p2Score, total: r.p2Total, username: r.p2Name };

        // If the backend already emitted p1/p2 as nested p1: { username, prompt ... } this will handle it.
        const fallbackP1Name = playersRef.current?.p1 ?? "Player 1";
        const fallbackP2Name = playersRef.current?.p2 ?? "Player 2";

        const p1n = normalizeParticipant(rawP1, fallbackP1Name);
        const p2n = normalizeParticipant(rawP2, fallbackP2Name);

        const normalized = {
          round: r.round ?? r.roundNumber ?? round ?? 1,
          target: r.target ?? r.t ?? target ?? "—",
          p1: { username: p1n.username, prompt: p1n.prompt, score: p1n.score, total: p1n.total },
          p2: { username: p2n.username, prompt: p2n.prompt, score: p2n.score, total: p2n.total }
        };

        console.log("ROUND RESULT NORMALIZED:", normalized);

        setRoundResults(prev => [...prev, normalized]);

        // update totals defensively (coerce to number or fallback to 0)
        const safeTotal = (v) => (typeof v === "number" ? v : (Number.isFinite(Number(v)) ? Number(v) : 0));
        setTotals({ p1: safeTotal(normalized.p1.total), p2: safeTotal(normalized.p2.total) });

        setStatus("matched");
      } catch (err) {
        console.error("Error handling roundResult:", err);
      }
    };
    s.on("roundResult", onRoundResult);

    // gameOver
    const onGameOver = (g) => {
      setStatus("finished");
      setTotals(g.totals || {});
      setRoundResults(g.rounds || []);
    };
    s.on("gameOver", onGameOver);

    s.on("errorMsg", (e) => {
      console.warn("socket error:", e);
    });

    // cleanup function
    return () => {
      s.off("queued", onQueued);
      s.off("matchStarted", onMatchStarted);
      s.off("nextRound", onNextRound);
      s.off("roundResult", onRoundResult);
      s.off("gameOver", onGameOver);
      s.off("errorMsg");
      // do not disconnect socket here to allow reuse across pages if desired.
      // If you prefer to fully disconnect:
      // disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI actions
  function joinQueue() {
    if (!socket || !username) return;
    setStatus("queued");
    socket.emit("joinQueue");
  }

  function leaveQueue() {
    if (!socket) return;
    socket.emit("leaveQueue");
    setStatus("idle");
  }

  function submitPrompt() {
    if (!socket || !matchId || submittedRef.current) return;
    socket.emit("submitPrompt", { matchId, prompt: prompt || "" });
    submittedRef.current = true;
    setStatus("waiting");
  }

  function handlePlayAgain() {
    // Reset local state and re-queue
    setMatchId(null);
    setOpponent(null);
    setRound(1);
    setTarget("");
    setPrompt("");
    setRoundResults([]);
    setTotals({ p1: 0, p2: 0 });
    setStatus("idle");
    // ask server to join queue again
    if (socket) socket.emit("joinQueue");
  }

  function goHome() {
    router.push("/");
  }

  function viewLeaderboard() {
    router.push("/leaderboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={username} />
      <main className="flex-1 container mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Game</h2>

        <div className="mb-4">
          <div className="text-sm text-gray-500">Status: <span className="font-medium">{status}</span></div>
          {status === "idle" && (
            <div className="mt-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded mr-2" onClick={joinQueue}>Play (Auto-match)</button>
            </div>
          )}
          {status === "queued" && (
            <div className="mt-3">
              <div className="mb-2">Waiting for another player to join...</div>
              <button className="px-4 py-2 border rounded" onClick={leaveQueue}>Leave Queue</button>
            </div>
          )}
        </div>

        {status === "matched" && (
          <div className="bg-white p-4 rounded shadow mb-4">
            <div className="text-sm text-gray-500">Matched with:</div>
            <div className="text-lg font-semibold mb-2">{opponent}</div>
            <div className="text-sm text-gray-500">Round {round} target preview</div>
            <div className="text-md font-medium">{target}</div>
            <div className="mt-3">When both players submit, round result will be shown to both.</div>
            <div className="mt-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => { setStatus("in-round"); setPrompt(""); }}>Start Round</button>
            </div>
          </div>
        )}

        {status === "in-round" && (
          <div className="bg-white p-4 rounded shadow mb-4">
            <div className="text-sm text-gray-500">Round {round} — Target</div>
            <div className="text-lg font-semibold mb-3">{target}</div>

            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your prompt/description..." className="w-full p-3 border rounded mb-3" rows={4} />

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submitPrompt} disabled={!prompt || submittedRef.current}>Submit & Evaluate</button>
              <button className="px-4 py-2 border rounded" onClick={() => setPrompt("")}>Clear</button>
            </div>
          </div>
        )}

        {roundResults.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Round Results</h3>
            {roundResults.map((r, idx) => (
              <RoundResult
                key={idx}
                round={r.round}
                target={r.target}
                p1={r.p1}
                p2={r.p2}
              />
            ))}
          </div>
        )}

        {status === "waiting" && (
          <div className="bg-white p-4 rounded shadow">
            Waiting for opponent to submit...
          </div>
        )}

        {status === "finished" && (
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold">Game Over</h3>
            <div className="mt-3">Totals — You: {mySide === "p1" ? totals.p1 : totals.p2} | Opponent: {mySide === "p1" ? totals.p2 : totals.p1}</div>
            <div className="mt-4 flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={goHome}>Return Home</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handlePlayAgain}>Play Again</button>
              <button className="px-4 py-2 border rounded" onClick={viewLeaderboard}>View Leaderboard</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
