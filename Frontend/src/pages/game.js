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
  const timerRef = useRef(null);
  const [promptError, setPromptError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

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
      setTimeLeft(30);
      setTimerActive(true);
      startTimer();
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

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          if (!submittedRef.current && socket && matchId) {
            const currentPrompt = prompt.trim() || "No response provided";
            socket.emit("submitPrompt", { matchId, prompt: currentPrompt });
            submittedRef.current = true;
            setStatus("waiting");
          }
          setTimerActive(false);
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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

  function validatePrompt(prompt, target) {
    if (!prompt || !target) return { valid: true, error: "" };
    
    const promptLower = prompt.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();
    
    // Split target into individual words (2+ characters to avoid common words like "a", "an", "the")
    const targetWords = targetLower.split(/\s+/).filter(word => word.length >= 2);
    
    // Check if any target words appear in the prompt
    const foundWords = targetWords.filter(word => {
      // Check for exact word matches (with word boundaries)
      const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return wordRegex.test(promptLower);
    });
    
    if (foundWords.length > 0) {
      return {
        valid: false,
        error: `Your prompt contains target words: "${foundWords.join('", "')}" - Please describe the target without using these exact words!`
      };
    }
    
    return { valid: true, error: "" };
  }

  function submitPrompt() {
    if (!socket || !matchId || submittedRef.current) return;
    
    const validation = validatePrompt(prompt, target);
    if (!validation.valid) {
      setPromptError(validation.error);
      return;
    }
    
    setPromptError("");
    socket.emit("submitPrompt", { matchId, prompt: prompt.trim() });
    submittedRef.current = true;
    setStatus("waiting");
    setTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
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
      case "idle": return { text: "READY", color: "text-cyan-400", icon: "⚡", bg: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/40" };
      case "queued": return { text: "SEARCHING", color: "text-yellow-400", icon: "🔍", bg: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/40" };
      case "matched": return { text: "MATCHED", color: "text-green-400", icon: "🎯", bg: "from-green-500/20 to-cyan-500/20", border: "border-green-500/40" };
      case "in-round": return { text: "COMBAT", color: "text-red-400", icon: "⚔️", bg: "from-red-500/20 to-pink-500/20", border: "border-red-500/40" };
      case "waiting": return { text: "WAITING", color: "text-purple-400", icon: "⏳", bg: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/40" };
      case "finished": return { text: "COMPLETE", color: "text-blue-400", icon: "🏆", bg: "from-blue-500/20 to-purple-500/20", border: "border-blue-500/40" };
      default: return { text: "UNKNOWN", color: "text-gray-400", icon: "❓", bg: "from-gray-500/20 to-gray-600/20", border: "border-gray-500/40" };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={username} />
      
      <main className="flex-1 container mx-auto p-6">
        <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-6">
              <span className="text-4xl">⚔️</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold font-mono mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                NEURAL BATTLEFIELD
              </span>
            </h2>
            
            {/* Enhanced Status Display */}
            <div className={`cyber-card p-6 max-w-md mx-auto bg-gradient-to-r ${statusDisplay.bg} border-2 ${statusDisplay.border}`}>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-3xl animate-pulse">{statusDisplay.icon}</div>
                <div>
                  <div className="font-mono text-gray-300 text-sm">SYSTEM STATUS</div>
                  <div className={`font-bold font-mono text-xl ${statusDisplay.color} neon-text`}>
                    {statusDisplay.text}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Idle State */}
          {status === "idle" && (
            <div className="max-w-3xl mx-auto text-center">
              <div className="cyber-card p-12 mb-8 battle-arena">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/40 relative">
                  <span className="text-6xl">⚡</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full blur-2xl opacity-50 -z-10 scale-150 animate-pulse"></div>
                </div>
                
                <h3 className="text-3xl font-bold mb-6 font-mono text-white neon-text">COMBAT SYSTEMS ONLINE</h3>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                  Neural battlefield is operational and ready for engagement. 
                  Initialize combat protocols to begin your journey to neural supremacy.
                </p>
                
                <button 
                  className="cyber-btn text-2xl px-12 py-6 transform hover:scale-110 transition-all duration-300 shadow-2xl" 
                  onClick={joinQueue}
                >
                  🚀 INITIATE COMBAT SEARCH
                </button>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-black/30 rounded-lg border border-gray-700/50">
                    <div className="text-cyan-400 font-mono font-bold">⚡ INSTANT</div>
                    <div className="text-gray-400">Matchmaking</div>
                  </div>
                  <div className="p-4 bg-black/30 rounded-lg border border-gray-700/50">
                    <div className="text-purple-400 font-mono font-bold">🤖 AI</div>
                    <div className="text-gray-400">Powered Scoring</div>
                  </div>
                  <div className="p-4 bg-black/30 rounded-lg border border-gray-700/50">
                    <div className="text-pink-400 font-mono font-bold">🏆 RANKED</div>
                    <div className="text-gray-400">Competition</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Queued State */}
          {status === "queued" && (
            <div className="max-w-3xl mx-auto text-center">
              <div className="cyber-card p-12 battle-arena">
                <div className="cyber-spinner w-24 h-24 mx-auto mb-8"></div>
                <h3 className="text-3xl font-bold mb-6 font-mono text-white neon-text">SCANNING NEURAL NETWORK</h3>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Advanced matchmaking algorithms are analyzing the global warrior database 
                  to find an opponent of matching skill level...
                </p>
                
                <div className="mb-8">
                  <div className="progress-bar mb-4">
                    <div className="progress-fill" style={{ width: '60%' }}></div>
                  </div>
                  <div className="text-sm text-gray-400 font-mono">Analyzing combat profiles...</div>
                </div>
                
                <button 
                  className="cyber-btn-secondary px-8 py-4 text-lg" 
                  onClick={leaveQueue}
                >
                  ❌ ABORT SEARCH PROTOCOL
                </button>
              </div>
            </div>
          )}

          {/* Matched State */}
          {status === "matched" && (
            <div className="max-w-4xl mx-auto">
              <div className="cyber-card p-10 mb-8 battle-arena">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-6 font-mono text-white neon-text">OPPONENT ACQUIRED</h3>
                  
                  <div className="flex items-center justify-center space-x-8 mb-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/40">
                        <span className="text-white font-bold text-xl">{username?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="text-cyan-400 font-mono font-bold">{username}</div>
                      <div className="text-xs text-gray-500">YOU</div>
                    </div>
                    
                    <div className="text-4xl animate-pulse">⚔️</div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-purple-500/40">
                        <span className="text-white font-bold text-xl">{opponent?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="text-purple-400 font-mono font-bold">{opponent}</div>
                      <div className="text-xs text-gray-500">OPPONENT</div>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 p-6 rounded-lg border border-gray-700/50 mb-8">
                    <div className="text-sm text-gray-400 font-mono mb-2">ROUND {round} TARGET PREVIEW</div>
                    <div className="text-2xl font-bold text-white font-mono neon-text">{target}</div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                    Neural link established with opponent. Both warriors must submit their combat prompts. 
                    The AI core will evaluate accuracy and award points based on target precision.
                  </p>
                  <button 
                    className="cyber-btn-success text-xl px-12 py-6" 
                    onClick={() => { setStatus("in-round"); setPrompt(""); }}
                  >
                    ⚡ COMMENCE ROUND {round}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* In Round State */}
          {status === "in-round" && (
            <div className="max-w-4xl mx-auto">
              <div className="cyber-card p-10 mb-8 battle-arena">
                <div className="text-center mb-8">
                  <div className="text-sm text-gray-400 font-mono mb-2">ROUND {round} — NEURAL TARGET</div>
                  <div className="text-3xl font-bold text-white font-mono mb-6 neon-text">{target}</div>
                  
                  <div className="max-w-md mx-auto mb-6">
                    {/* Timer Display */}
                    <div className="mb-6">
                      <div className={`text-center p-4 rounded-lg border-2 backdrop-blur-sm ${
                        timeLeft <= 10 
                          ? 'bg-red-900/30 border-red-500/40 text-red-400' 
                          : timeLeft <= 20 
                          ? 'bg-yellow-900/30 border-yellow-500/40 text-yellow-400'
                          : 'bg-green-900/30 border-green-500/40 text-green-400'
                      }`}>
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-2xl">
                            {timeLeft <= 10 ? '⚠️' : timeLeft <= 20 ? '⏰' : '⏱️'}
                          </span>
                          <div>
                            <div className="font-mono font-bold text-sm mb-1">
                              {timerActive ? 'NEURAL SYNC TIMER' : 'TIMER EXPIRED'}
                            </div>
                            <div className={`font-mono text-2xl font-bold ${
                              timeLeft <= 10 ? 'animate-pulse' : ''
                            }`}>
                              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                              {String(timeLeft % 60).padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="progress-bar">
                      <div 
                        className="progress-fill transition-all duration-500"
                        style={{ width: `${(round / 3) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-2">
                      BATTLE PROGRESS: {round}/3 ROUNDS
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-mono text-gray-300 mb-4">
                      🧠 NEURAL PROMPT INTERFACE
                    </label>
                    <textarea 
                      value={prompt} 
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        setPromptError(""); // Clear error when user starts typing
                      }} 
                      placeholder="Craft your neural prompt to precisely match the target. Use descriptive language and specific details to maximize accuracy..." 
                      className={`cyber-input w-full h-40 resize-none text-lg ${promptError ? 'border-red-500/60' : ''}`}
                      maxLength={500}
                      disabled={submittedRef.current}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-sm text-gray-500 font-mono">
                        Character count: {prompt.length}/500
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {prompt.split(' ').filter(w => w.length > 0).length} words
                      </div>
                    </div>
                  </div>

                  {promptError && (
                    <div className="bg-red-900/30 border-2 border-red-500/40 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3 text-red-400">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">PROMPT VALIDATION ERROR</div>
                          <div className="font-mono text-sm">{promptError}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      className="cyber-btn flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                      onClick={submitPrompt} 
                      disabled={!prompt.trim() || submittedRef.current}
                    >
                      {submittedRef.current ? "⏳ PROMPT SUBMITTED" : "🚀 SUBMIT & EVALUATE"}
                    </button>
                    <button 
                      className="cyber-btn-secondary px-8 py-4 text-lg" 
                      onClick={() => {
                        setPrompt("");
                        setPromptError("");
                      }}
                      disabled={submittedRef.current}
                    >
                      🗑️ CLEAR
                    </button>
                  </div>
                  
                  {prompt.trim() && !submittedRef.current && !promptError && timerActive && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-green-400 text-sm font-mono">
                        <span>✅</span>
                        <span>Neural prompt ready for submission</span>
                      </div>
                    </div>
                  )}
                  
                  {!timerActive && timeLeft === 0 && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-red-400 text-sm font-mono">
                        <span>⏰</span>
                        <span>Time expired - prompt auto-submitted</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Waiting State */}
          {status === "waiting" && (
            <div className="max-w-3xl mx-auto text-center">
              <div className="cyber-card p-12 battle-arena">
                <div className="cyber-spinner w-24 h-24 mx-auto mb-8"></div>
                <h3 className="text-3xl font-bold mb-6 font-mono text-white neon-text">AWAITING OPPONENT</h3>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Your neural prompt has been submitted to the AI evaluation core. 
                  Waiting for opponent to complete their submission...
                </p>
                
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-center space-x-3 text-cyan-400">
                    <span className="text-2xl">🧠</span>
                    <span className="font-mono">AI CORE ANALYZING SUBMISSIONS...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Round Results */}
          {roundResults.length > 0 && (
            <div className="max-w-6xl mx-auto mb-12">
              <h3 className="text-3xl font-bold mb-8 text-center font-mono">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                  🏆 BATTLE ANALYSIS
                </span>
              </h3>
              <div className="space-y-6">
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
            <div className="max-w-4xl mx-auto text-center">
              <div className="cyber-card p-16 battle-arena">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/40 relative">
                  <span className="text-6xl">🏆</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full blur-2xl opacity-50 -z-10 scale-150 animate-pulse"></div>
                </div>
                
                <h3 className="text-4xl font-bold mb-8 font-mono">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent neon-text">
                    NEURAL COMBAT COMPLETE
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="cyber-card p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/40">
                    <div className="text-sm text-gray-400 font-mono mb-2">YOUR FINAL SCORE</div>
                    <div className="text-5xl font-bold text-cyan-400 font-mono neon-text mb-2">
                      {mySide === "p1" ? totals.p1 : totals.p2}
                    </div>
                    <div className="text-sm text-gray-500 font-mono">NEURAL POINTS</div>
                  </div>
                  <div className="cyber-card p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/40">
                    <div className="text-sm text-gray-400 font-mono mb-2">OPPONENT SCORE</div>
                    <div className="text-5xl font-bold text-purple-400 font-mono neon-text mb-2">
                      {mySide === "p1" ? totals.p2 : totals.p1}
                    </div>
                    <div className="text-sm text-gray-500 font-mono">NEURAL POINTS</div>
                  </div>
                </div>

                {/* Victory/Defeat Message */}
                <div className="mb-12">
                  {((mySide === "p1" && totals.p1 > totals.p2) || (mySide === "p2" && totals.p2 > totals.p1)) ? (
                    <div className="bg-green-900/30 border-2 border-green-500/40 rounded-lg p-6">
                      <div className="text-3xl mb-2">🎉</div>
                      <div className="text-2xl font-bold text-green-400 font-mono neon-text">VICTORY ACHIEVED</div>
                      <div className="text-green-300 mt-2">Neural supremacy established. Your prompt engineering skills have proven superior.</div>
                    </div>
                  ) : ((mySide === "p1" && totals.p1 < totals.p2) || (mySide === "p2" && totals.p2 < totals.p1)) ? (
                    <div className="bg-red-900/30 border-2 border-red-500/40 rounded-lg p-6">
                      <div className="text-3xl mb-2">⚔️</div>
                      <div className="text-2xl font-bold text-red-400 font-mono">COMBAT DEFEAT</div>
                      <div className="text-red-300 mt-2">The opponent's neural patterns proved more effective. Analyze and adapt for future battles.</div>
                    </div>
                  ) : (
                    <div className="bg-yellow-900/30 border-2 border-yellow-500/40 rounded-lg p-6">
                      <div className="text-3xl mb-2">🤝</div>
                      <div className="text-2xl font-bold text-yellow-400 font-mono">NEURAL STALEMATE</div>
                      <div className="text-yellow-300 mt-2">Equal neural prowess detected. Both warriors demonstrate exceptional skill.</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 justify-center">
                  <button className="cyber-btn px-8 py-4 text-lg" onClick={goHome}>
                    🏠 RETURN TO BASE
                  </button>
                  <button className="cyber-btn-success px-8 py-4 text-lg" onClick={handlePlayAgain}>
                    🔄 INITIATE NEW BATTLE
                  </button>
                  <button className="cyber-btn-secondary px-8 py-4 text-lg" onClick={viewLeaderboard}>
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