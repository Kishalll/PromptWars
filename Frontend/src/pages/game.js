import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { getSocket, disconnectSocket } from "../lib/socket";
import RoundResult from "../components/RoundResult";

export default function GamePage() {
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [status, setStatus] = useState("idle");
  const [matchId, setMatchId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState("");
  const [prompt, setPrompt] = useState("");
  const [roundResults, setRoundResults] = useState([]);
  const [totals, setTotals] = useState({ p1: 0, p2: 0 });
  const [mySide, setMySide] = useState(null);

  const submittedRef = useRef(false);
  const playersRef = useRef({});

  useEffect(() => {
    setIsLoaded(true);
    const u = typeof window !== "undefined" ? localStorage.getItem("pd_username") : null;
    if (!u) {
      router.push("/login");
      return;
    }
    setUsername(u);

    const s = getSocket();
    setSocket(s);
    s.emit("register", { username: u });

    const onQueued = () => setStatus("queued");
    s.on("queued", onQueued);

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

    const onNextRound = (n) => {
      setRound(n.round);
      setTarget(n.target);
      setPrompt("");
      submittedRef.current = false;
      setStatus("in-round");
    };
    s.on("nextRound", onNextRound);

    const onRoundResult = (r) => {
      try {
        const normalizeParticipant = (raw, fallbackName) => {
          if (!raw || typeof raw !== "object") {
            return { username: fallbackName, prompt: "—", score: "—", total: "—" };
          }
          const username = raw.username ?? raw.name ?? raw.player ?? raw._username ?? fallbackName;
          const prompt = raw.prompt ?? raw.text ?? raw.description ?? raw.p ?? "—";
          const score = typeof raw.score === "number" ? raw.score : (typeof raw.points === "number" ? raw.points : (raw.score ? Number(raw.score) : "—"));
          const total = typeof raw.total === "number" ? raw.total : (typeof raw.total_points === "number" ? raw.total_points : (raw.points_total ? Number(raw.points_total) : (raw.total ? Number(raw.total) : "—")));
          return { username, prompt, score: Number.isFinite(score) ? score : score, total: Number.isFinite(total) ? total : total };
        };

        let rawP1 = r.p1 ?? r.player1 ?? r.p1Data ?? r.p1_data ?? null;
        let rawP2 = r.p2 ?? r.player2 ?? r.p2Data ?? r.p2_data ?? null;

        if (!rawP1 && r.p1Prompt) rawP1 = { prompt: r.p1Prompt, score: r.p1Score, total: r.p1Total, username: r.p1Name };
        if (!rawP2 && r.p2Prompt) rawP2 = { prompt: r.p2Prompt, score: r.p2Score, total: r.p2Total, username: r.p2Name };

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

        setRoundResults(prev => [...prev, normalized]);

        const safeTotal = (v) => (typeof v === "number" ? v : (Number.isFinite(Number(v)) ? Number(v) : 0));
        setTotals({ p1: safeTotal(normalized.p1.total), p2: safeTotal(normalized.p2.total) });

        setStatus("matched");
      } catch (err) {
        console.error("Error handling roundResult:", err);
      }
    };
    s.on("roundResult", onRoundResult);

    const onGameOver = (g) => {
      setStatus("finished");
      setTotals(g.totals || {});
      setRoundResults(g.rounds || []);
    };
    s.on("gameOver", onGameOver);

    s.on("errorMsg", (e) => {
      console.warn("socket error:", e);
    });

    return () => {
      s.off("queued", onQueued);
      s.off("matchStarted", onMatchStarted);
      s.off("nextRound", onNextRound);
      s.off("roundResult", onRoundResult);
      s.off("gameOver", onGameOver);
      s.off("errorMsg");
    };
  }, []);

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
    setMatchId(null);
    setOpponent(null);
    setRound(1);
    setTarget("");
    setPrompt("");
    setRoundResults([]);
    setTotals({ p1: 0, p2: 0 });
    setStatus("idle");
    if (socket) socket.emit("joinQueue");
  }

  function goHome() {
    router.push("/");
  }

  function viewLeaderboard() {
    router.push("/leaderboard");
  }

  const getStatusDisplay = () => {
    switch (status) {
      case "idle": return { text: "READY", color: "text-cyan-400", icon: "⚡" };
      case "queued": return { text: "SEARCHING", color: "text-yellow-400", icon: "🔍" };
      case "matched": return { text: "MATCHED", color: "text-green-400", icon: "🎯" };
      case "in-round": return { text: "COMBAT", color: "text-red-400", icon: "⚔️" };
      case "waiting": return { text: "WAITING", color: "text-purple-400", icon: "⏳" };
      case "finished": return { text: "COMPLETE", color: "text-blue-400", icon: "🏆" };
      default: return { text: "UNKNOWN", color: "text-gray-400", icon: "❓" };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={username} />
      
      <main className="flex-1 container mx-auto p-6">
        <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold font-mono mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                NEURAL BATTLEFIELD
              </span>
            </h2>
            
            {/* Status Display */}
            <div className="cyber-card p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">{statusDisplay.icon}</span>
                <span className="font-mono text-gray-300">STATUS:</span>
                <span className={`font-bold font-mono ${statusDisplay.color} neon-text`}>
                  {statusDisplay.text}
                </span>
              </div>
            </div>
          </div>

          {/* Idle State */}
          {status === "idle" && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="cyber-card p-8 mb-6">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <span className="text-4xl">⚡</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 font-mono text-white">READY FOR COMBAT</h3>
                <p className="text-gray-300 mb-6">
                  Enter the neural battlefield and test your prompt engineering skills against other warriors.
                </p>
                <button 
                  className="cyber-btn text-lg px-8 py-4 transform hover:scale-105 transition-transform" 
                  onClick={joinQueue}
                >
                  🚀 FIND OPPONENT
                </button>
              </div>
            </div>
          )}

          {/* Queued State */}
          {status === "queued" && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="cyber-card p-8">
                <div className="cyber-spinner w-16 h-16 mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold mb-4 font-mono text-white">SCANNING FOR OPPONENTS</h3>
                <p className="text-gray-300 mb-6">
                  Neural network is searching for a worthy adversary...
                </p>
                <button 
                  className="cyber-btn-secondary px-6 py-3" 
                  onClick={leaveQueue}
                >
                  ❌ ABORT SEARCH
                </button>
              </div>
            </div>
          )}

          {/* Matched State */}
          {status === "matched" && (
            <div className="max-w-3xl mx-auto">
              <div className="cyber-card p-8 mb-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{username?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-2xl">⚔️</span>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{opponent?.[0]?.toUpperCase()}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-mono">
                    <span className="text-cyan-400">{username}</span> VS <span className="text-purple-400">{opponent}</span>
                  </h3>
                  <div className="text-sm text-gray-400 font-mono">ROUND {round} PREPARATION</div>
                </div>

                <div className="bg-black/30 p-6 rounded-lg border border-gray-700/50 mb-6">
                  <div className="text-sm text-gray-400 font-mono mb-2">TARGET PREVIEW</div>
                  <div className="text-xl font-bold text-white font-mono">{target}</div>
                </div>

                <div className="text-center">
                  <p className="text-gray-300 mb-6">
                    Both warriors must submit their neural prompts. The AI will judge accuracy and award points.
                  </p>
                  <button 
                    className="cyber-btn-success px-8 py-4" 
                    onClick={() => { setStatus("in-round"); setPrompt(""); }}
                  >
                    ⚡ BEGIN ROUND {round}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* In Round State */}
          {status === "in-round" && (
            <div className="max-w-3xl mx-auto">
              <div className="cyber-card p-8 mb-6">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-400 font-mono mb-2">ROUND {round} — NEURAL TARGET</div>
                  <div className="text-2xl font-bold text-white font-mono mb-4 neon-text">{target}</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(round / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      NEURAL PROMPT
                    </label>
                    <textarea 
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder="Craft your neural prompt to match the target..." 
                      className="cyber-input w-full h-32 resize-none"
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                      {prompt.length}/500 characters
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      className="cyber-btn flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                      onClick={submitPrompt} 
                      disabled={!prompt || submittedRef.current}
                    >
                      {submittedRef.current ? "⏳ SUBMITTED" : "🚀 SUBMIT & EVALUATE"}
                    </button>
                    <button 
                      className="cyber-btn-secondary px-6 py-3" 
                      onClick={() => setPrompt("")}
                    >
                      🗑️ CLEAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Waiting State */}
          {status === "waiting" && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="cyber-card p-8">
                <div className="cyber-spinner w-16 h-16 mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold mb-4 font-mono text-white">AWAITING OPPONENT</h3>
                <p className="text-gray-300">
                  Your neural prompt has been submitted. Waiting for opponent to complete their submission...
                </p>
              </div>
            </div>
          )}

          {/* Round Results */}
          {roundResults.length > 0 && (
            <div className="max-w-4xl mx-auto mb-8">
              <h3 className="text-2xl font-bold mb-6 text-center font-mono">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                  BATTLE RESULTS
                </span>
              </h3>
              <div className="space-y-4">
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
            </div>
          )}

          {/* Finished State */}
          {status === "finished" && (
            <div className="max-w-3xl mx-auto text-center">
              <div className="cyber-card p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <span className="text-4xl">🏆</span>
                </div>
                
                <h3 className="text-3xl font-bold mb-6 font-mono">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent neon-text">
                    BATTLE COMPLETE
                  </span>
                </h3>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="cyber-card p-6">
                    <div className="text-sm text-gray-400 font-mono mb-2">YOUR SCORE</div>
                    <div className="text-3xl font-bold text-cyan-400 font-mono">
                      {mySide === "p1" ? totals.p1 : totals.p2}
                    </div>
                  </div>
                  <div className="cyber-card p-6">
                    <div className="text-sm text-gray-400 font-mono mb-2">OPPONENT SCORE</div>
                    <div className="text-3xl font-bold text-purple-400 font-mono">
                      {mySide === "p1" ? totals.p2 : totals.p1}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button className="cyber-btn px-6 py-3" onClick={goHome}>
                    🏠 RETURN HOME
                  </button>
                  <button className="cyber-btn-success px-6 py-3" onClick={handlePlayAgain}>
                    🔄 BATTLE AGAIN
                  </button>
                  <button className="cyber-btn-secondary px-6 py-3" onClick={viewLeaderboard}>
                    👑 VIEW CHAMPIONS
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}