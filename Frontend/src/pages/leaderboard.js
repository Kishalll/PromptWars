import { useEffect, useState } from "react";
import Header from "../components/Header";
import { fetchLeaderboard } from "../lib/api";

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setIsLoaded(true);
    
    // Get current user
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem("pd_username"));
    }
    
    fetchLeaderboard().then(res => {
      setData(res.data.data || []);
    }).catch(e => {
      console.error(e);
    }).finally(() => setLoading(false));
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return "👑";
      case 2: return "🥈";
      case 3: return "🥉";
      case 4: case 5: return "🏅";
      default: return "⚡";
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return "from-yellow-400 via-orange-400 to-red-500";
      case 2: return "from-gray-300 via-gray-400 to-gray-600";
      case 3: return "from-orange-400 via-yellow-500 to-orange-600";
      case 4: case 5: return "from-purple-400 via-pink-400 to-purple-600";
      default: return "from-cyan-400 via-blue-400 to-purple-500";
    }
  };

  const getScoreColor = (points) => {
    if (points >= 100) return "text-yellow-400 neon-text";
    if (points >= 50) return "text-green-400";
    if (points >= 25) return "text-cyan-400";
    return "text-gray-400";
  };

  const getWinRateColor = (rate) => {
    if (rate >= 80) return "text-green-400";
    if (rate >= 60) return "text-cyan-400";
    if (rate >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={currentUser} />
      
      <main className="flex-1 container mx-auto p-6">
        <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block p-6 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-8">
              <span className="text-5xl">👑</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold font-mono mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent neon-text">
                HALL OF CHAMPIONS
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              The elite neural warriors who have mastered the art of <span className="text-cyan-400 font-bold">prompt engineering</span> 
              and claimed their place in the <span className="text-purple-400 font-bold">digital pantheon</span>
            </p>
          </div>

          {loading ? (
            <div className="text-center">
              <div className="cyber-spinner w-24 h-24 mx-auto mb-8"></div>
              <div className="text-xl text-gray-300 font-mono">ACCESSING CHAMPION DATABASE...</div>
              <div className="text-sm text-gray-500 font-mono mt-2">Analyzing neural combat records</div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {data.length === 0 ? (
                <div className="cyber-card p-16 text-center battle-arena">
                  <div className="text-8xl mb-8">🏆</div>
                  <h3 className="text-3xl font-bold mb-6 font-mono text-white neon-text">NO CHAMPIONS RECORDED</h3>
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    The neural battlefield awaits its first legends. Will you be the pioneer who claims the throne?
                  </p>
                  <button 
                    onClick={() => window.location.href = '/game'}
                    className="cyber-btn text-xl px-12 py-6"
                  >
                    🚀 BECOME THE FIRST CHAMPION
                  </button>
                </div>
              ) : (
                <>
                  {/* Top 3 Podium */}
                  {data.length >= 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                      {/* 2nd Place */}
                      <div className="cyber-card p-8 text-center order-1 md:order-1 transform hover:scale-105 transition-all duration-500 bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-400/40">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-2xl shadow-gray-400/30 relative">
                          <span className="text-3xl">🥈</span>
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full blur-xl opacity-50 -z-10 scale-150"></div>
                        </div>
                        <div className="text-sm text-gray-400 font-mono mb-2 tracking-wider">#2 NEURAL CHAMPION</div>
                        <div className="text-2xl font-bold text-white font-mono mb-3 neon-text">{data[1].username}</div>
                        <div className="text-3xl font-bold text-gray-300 font-mono mb-2">{data[1].total_points}</div>
                        <div className="text-xs text-gray-500 font-mono mb-4">NEURAL POINTS</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-black/30 p-2 rounded">
                            <div className="text-green-400 font-bold">{data[1].wins}</div>
                            <div className="text-gray-500">WINS</div>
                          </div>
                          <div className="bg-black/30 p-2 rounded">
                            <div className="text-red-400 font-bold">{data[1].losses}</div>
                            <div className="text-gray-500">LOSSES</div>
                          </div>
                        </div>
                      </div>

                      {/* 1st Place */}
                      <div className="cyber-card p-10 text-center order-2 md:order-2 transform hover:scale-105 transition-all duration-500 border-yellow-500/60 bg-gradient-to-br from-yellow-500/15 to-orange-500/15 battle-arena">
                        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/50 relative">
                          <span className="text-4xl">👑</span>
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full blur-2xl opacity-60 -z-10 scale-150 animate-pulse"></div>
                        </div>
                        <div className="text-sm text-yellow-400 font-mono mb-3 tracking-wider neon-text">SUPREME NEURAL OVERLORD</div>
                        <div className="text-3xl font-bold text-white font-mono mb-4 neon-text">{data[0].username}</div>
                        <div className="text-4xl font-bold text-yellow-400 font-mono mb-3 neon-text">{data[0].total_points}</div>
                        <div className="text-xs text-gray-500 font-mono mb-6">NEURAL POINTS</div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-black/40 p-3 rounded border border-green-500/30">
                            <div className="text-green-400 font-bold text-lg">{data[0].wins}</div>
                            <div className="text-gray-400">VICTORIES</div>
                          </div>
                          <div className="bg-black/40 p-3 rounded border border-red-500/30">
                            <div className="text-red-400 font-bold text-lg">{data[0].losses}</div>
                            <div className="text-gray-400">DEFEATS</div>
                          </div>
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="cyber-card p-8 text-center order-3 md:order-3 transform hover:scale-105 transition-all duration-500 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-400/40">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-400/30 relative">
                          <span className="text-3xl">🥉</span>
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-600 rounded-full blur-xl opacity-50 -z-10 scale-150"></div>
                        </div>
                        <div className="text-sm text-gray-400 font-mono mb-2 tracking-wider">#3 NEURAL CHAMPION</div>
                        <div className="text-2xl font-bold text-white font-mono mb-3 neon-text">{data[2].username}</div>
                        <div className="text-3xl font-bold text-orange-400 font-mono mb-2">{data[2].total_points}</div>
                        <div className="text-xs text-gray-500 font-mono mb-4">NEURAL POINTS</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-black/30 p-2 rounded">
                            <div className="text-green-400 font-bold">{data[2].wins}</div>
                            <div className="text-gray-500">WINS</div>
                          </div>
                          <div className="bg-black/30 p-2 rounded">
                            <div className="text-red-400 font-bold">{data[2].losses}</div>
                            <div className="text-gray-500">LOSSES</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Leaderboard */}
                  <div className="cyber-card overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 p-8 border-b-2 border-gray-700/50">
                      <h3 className="text-2xl font-bold font-mono text-center">
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                          🏆 COMPLETE NEURAL RANKINGS
                        </span>
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-black/40 border-b-2 border-gray-700/50">
                            <th className="px-6 py-5 text-left text-sm font-mono text-gray-300 tracking-wider">RANK</th>
                            <th className="px-6 py-5 text-left text-sm font-mono text-gray-300 tracking-wider">NEURAL WARRIOR</th>
                            <th className="px-6 py-5 text-center text-sm font-mono text-gray-300 tracking-wider">POINTS</th>
                            <th className="px-6 py-5 text-center text-sm font-mono text-gray-300 tracking-wider">VICTORIES</th>
                            <th className="px-6 py-5 text-center text-sm font-mono text-gray-300 tracking-wider">DEFEATS</th>
                            <th className="px-6 py-5 text-center text-sm font-mono text-gray-300 tracking-wider">BATTLES</th>
                            <th className="px-6 py-5 text-center text-sm font-mono text-gray-300 tracking-wider">WIN RATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((warrior, index) => {
                            const rank = index + 1;
                            const winRate = warrior.matches_played > 0 ? ((warrior.wins / warrior.matches_played) * 100).toFixed(1) : "0.0";
                            const isCurrentUser = currentUser === warrior.username;
                            
                            return (
                              <tr 
                                key={warrior.username} 
                                className={`border-b border-gray-700/30 hover:bg-cyan-500/5 transition-all duration-300 ${
                                  isCurrentUser ? 'bg-cyan-500/10 border-cyan-500/30' : ''
                                }`}
                              >
                                <td className="px-6 py-5">
                                  <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-sm font-bold shadow-lg`}>
                                      {rank}
                                    </div>
                                    <span className="text-2xl">{getRankIcon(rank)}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center shadow-lg`}>
                                      <span className="text-white font-bold">{warrior.username[0]?.toUpperCase()}</span>
                                    </div>
                                    <div>
                                      <div className={`font-bold font-mono text-lg ${isCurrentUser ? 'text-cyan-400 neon-text' : 'text-white'}`}>
                                        {warrior.username}
                                        {isCurrentUser && <span className="text-xs text-cyan-400 ml-2">(YOU)</span>}
                                      </div>
                                      {rank <= 3 && (
                                        <div className="text-xs text-gray-500 font-mono">
                                          {rank === 1 ? 'SUPREME OVERLORD' : rank === 2 ? 'NEURAL CHAMPION' : 'ELITE WARRIOR'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <div className={`text-2xl font-bold font-mono ${getScoreColor(warrior.total_points)}`}>
                                    {warrior.total_points}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <div className="text-xl font-bold text-green-400 font-mono">{warrior.wins}</div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <div className="text-xl font-bold text-red-400 font-mono">{warrior.losses}</div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <div className="text-xl font-bold text-gray-300 font-mono">{warrior.matches_played}</div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <div className={`text-xl font-bold font-mono ${getWinRateColor(parseFloat(winRate))}`}>
                                    {winRate}%
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="cyber-card p-6 text-center">
                      <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">{data.length}</div>
                      <div className="text-sm text-gray-400 font-mono">TOTAL WARRIORS</div>
                    </div>
                    <div className="cyber-card p-6 text-center">
                      <div className="text-3xl font-bold text-purple-400 font-mono mb-2">
                        {data.reduce((sum, w) => sum + w.matches_played, 0)}
                      </div>
                      <div className="text-sm text-gray-400 font-mono">BATTLES FOUGHT</div>
                    </div>
                    <div className="cyber-card p-6 text-center">
                      <div className="text-3xl font-bold text-pink-400 font-mono mb-2">
                        {data.reduce((sum, w) => sum + w.total_points, 0)}
                      </div>
                      <div className="text-sm text-gray-400 font-mono">TOTAL POINTS</div>
                    </div>
                    <div className="cyber-card p-6 text-center">
                      <div className="text-3xl font-bold text-green-400 font-mono mb-2">
                        {data.length > 0 ? Math.round(data.reduce((sum, w) => sum + (w.matches_played > 0 ? (w.wins / w.matches_played) * 100 : 0), 0) / data.length) : 0}%
                      </div>
                      <div className="text-sm text-gray-400 font-mono">AVG WIN RATE</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}