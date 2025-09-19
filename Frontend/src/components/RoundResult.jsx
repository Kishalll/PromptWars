import React from "react";

export default function RoundResult(props) {
  const { round = "—", target = "—", p1 = {}, p2 = {} } = props || {};

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

  const getScoreColor = (score) => {
    if (typeof score !== "number") return "text-gray-400";
    if (score >= 40) return "text-green-400";
    if (score >= 20) return "text-yellow-400";
    if (score >= 10) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreIcon = (score) => {
    if (typeof score !== "number") return "❓";
    if (score >= 40) return "🎯";
    if (score >= 20) return "✅";
    if (score >= 10) return "⚠️";
    return "❌";
  };

  return (
    <div className="cyber-card p-6 mb-4 transform hover:scale-[1.02] transition-transform duration-300">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-sm text-gray-400 font-mono">ROUND</span>
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold font-mono">{round}</span>
          </div>
        </div>
        <div className="bg-black/30 p-4 rounded-lg border border-gray-700/50">
          <div className="text-xs text-gray-400 font-mono mb-1">NEURAL TARGET</div>
          <div className="text-xl font-bold text-white font-mono neon-text">{target}</div>
        </div>
      </div>

      {/* Battle Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player 1 */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 rounded-lg border border-cyan-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{a.username[0]?.toUpperCase()}</span>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-mono">WARRIOR</div>
                <div className="font-bold text-white font-mono">{a.username}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getScoreIcon(a.score)}</span>
                <span className={`text-2xl font-bold font-mono ${getScoreColor(a.score)}`}>
                  {a.score}
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono">POINTS</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs text-gray-400 font-mono mb-2">NEURAL PROMPT</div>
            <div className="bg-black/30 p-3 rounded border border-gray-700/50">
              <div className="text-sm text-gray-300 font-mono break-words">{a.prompt}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400 font-mono">TOTAL SCORE</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">{a.total}</div>
          </div>
        </div>

        {/* Player 2 */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-lg border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{b.username[0]?.toUpperCase()}</span>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-mono">WARRIOR</div>
                <div className="font-bold text-white font-mono">{b.username}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getScoreIcon(b.score)}</span>
                <span className={`text-2xl font-bold font-mono ${getScoreColor(b.score)}`}>
                  {b.score}
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono">POINTS</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs text-gray-400 font-mono mb-2">NEURAL PROMPT</div>
            <div className="bg-black/30 p-3 rounded border border-gray-700/50">
              <div className="text-sm text-gray-300 font-mono break-words">{b.prompt}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400 font-mono">TOTAL SCORE</div>
            <div className="text-lg font-bold text-purple-400 font-mono">{b.total}</div>
          </div>
        </div>
      </div>

      {/* Round Winner Indicator */}
      {typeof a.score === "number" && typeof b.score === "number" && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-full border border-gray-700/50">
            <span className="text-sm text-gray-400 font-mono">ROUND VICTOR:</span>
            {a.score > b.score ? (
              <span className="text-cyan-400 font-bold font-mono">{a.username} 🏆</span>
            ) : b.score > a.score ? (
              <span className="text-purple-400 font-bold font-mono">{b.username} 🏆</span>
            ) : (
              <span className="text-yellow-400 font-bold font-mono">TIE 🤝</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}