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
    if (score >= 40) return "text-green-400 neon-text";
    if (score >= 30) return "text-cyan-400";
    if (score >= 20) return "text-yellow-400";
    if (score >= 10) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreIcon = (score) => {
    if (typeof score !== "number") return "❓";
    if (score >= 40) return "🎯";
    if (score >= 30) return "✅";
    if (score >= 20) return "⚡";
    if (score >= 10) return "⚠️";
    return "❌";
  };

  const getScoreBg = (score) => {
    if (typeof score !== "number") return "from-gray-500/10 to-gray-600/10";
    if (score >= 40) return "from-green-500/15 to-cyan-500/15";
    if (score >= 30) return "from-cyan-500/15 to-blue-500/15";
    if (score >= 20) return "from-yellow-500/15 to-orange-500/15";
    if (score >= 10) return "from-orange-500/15 to-red-500/15";
    return "from-red-500/15 to-pink-500/15";
  };

  const getScoreBorder = (score) => {
    if (typeof score !== "number") return "border-gray-500/30";
    if (score >= 40) return "border-green-500/40";
    if (score >= 30) return "border-cyan-500/40";
    if (score >= 20) return "border-yellow-500/40";
    if (score >= 10) return "border-orange-500/40";
    return "border-red-500/40";
  };

  return (
    <div className="cyber-card p-8 mb-6 transform hover:scale-[1.02] transition-all duration-500 battle-arena">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="text-sm text-gray-400 font-mono tracking-wider">ROUND</span>
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 relative">
            <span className="text-white font-bold font-mono text-lg">{round}</span>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 rounded-full blur-lg opacity-50 -z-10 scale-150"></div>
          </div>
          <span className="text-sm text-gray-400 font-mono tracking-wider">ANALYSIS</span>
        </div>
        
        <div className="bg-black/40 p-6 rounded-lg border-2 border-gray-700/50 backdrop-blur-sm">
          <div className="text-xs text-gray-400 font-mono mb-2 tracking-wider">NEURAL TARGET</div>
          <div className="text-2xl font-bold text-white font-mono neon-text">{target}</div>
        </div>
      </div>

      {/* Battle Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Player 1 */}
        <div className={`bg-gradient-to-br ${getScoreBg(a.score)} p-8 rounded-lg border-2 ${getScoreBorder(a.score)} backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 relative">
                <span className="text-white font-bold text-xl">{a.username[0]?.toUpperCase()}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-lg opacity-50 -z-10 scale-125"></div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-mono tracking-wider">NEURAL WARRIOR</div>
                <div className="font-bold text-white font-mono text-lg">{a.username}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{getScoreIcon(a.score)}</span>
                <span className={`text-3xl font-bold font-mono ${getScoreColor(a.score)}`}>
                  {a.score}
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">ROUND POINTS</div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-xs text-gray-400 font-mono mb-3 tracking-wider">NEURAL PROMPT</div>
            <div className="bg-black/40 p-4 rounded-lg border border-gray-700/50 backdrop-blur-sm">
              <div className="text-sm text-gray-300 font-mono break-words leading-relaxed">{a.prompt}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400 font-mono tracking-wider">CUMULATIVE SCORE</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono neon-text">{a.total}</div>
          </div>
        </div>

        {/* Player 2 */}
        <div className={`bg-gradient-to-br ${getScoreBg(b.score)} p-8 rounded-lg border-2 ${getScoreBorder(b.score)} backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/40 relative">
                <span className="text-white font-bold text-xl">{b.username[0]?.toUpperCase()}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-lg opacity-50 -z-10 scale-125"></div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-mono tracking-wider">NEURAL WARRIOR</div>
                <div className="font-bold text-white font-mono text-lg">{b.username}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{getScoreIcon(b.score)}</span>
                <span className={`text-3xl font-bold font-mono ${getScoreColor(b.score)}`}>
                  {b.score}
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">ROUND POINTS</div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-xs text-gray-400 font-mono mb-3 tracking-wider">NEURAL PROMPT</div>
            <div className="bg-black/40 p-4 rounded-lg border border-gray-700/50 backdrop-blur-sm">
              <div className="text-sm text-gray-300 font-mono break-words leading-relaxed">{b.prompt}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400 font-mono tracking-wider">CUMULATIVE SCORE</div>
            <div className="text-2xl font-bold text-purple-400 font-mono neon-text">{b.total}</div>
          </div>
        </div>
      </div>

      {/* Round Winner Indicator */}
      {typeof a.score === "number" && typeof b.score === "number" && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 bg-black/40 px-8 py-4 rounded-full border-2 border-gray-700/50 backdrop-blur-sm">
            <span className="text-sm text-gray-400 font-mono tracking-wider">ROUND VICTOR:</span>
            {a.score > b.score ? (
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400 font-bold font-mono text-lg neon-text">{a.username}</span>
                <span className="text-2xl">🏆</span>
              </div>
            ) : b.score > a.score ? (
              <div className="flex items-center space-x-2">
                <span className="text-purple-400 font-bold font-mono text-lg neon-text">{b.username}</span>
                <span className="text-2xl">🏆</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400 font-bold font-mono text-lg neon-text">NEURAL STALEMATE</span>
                <span className="text-2xl">🤝</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}