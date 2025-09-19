import { useEffect, useState } from "react";
import Header from "../components/Header";
import { fetchLeaderboard } from "../lib/api";

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    fetchLeaderboard().then(res => {
      setData(res.data.data || []);
    }).catch(e => {
      console.error(e);
    }).finally(() => setLoading(false));
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "🔸";
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return "from-yellow-400 to-orange-500";
      case 2: return "from-gray-300 to-gray-500";
      case 3: return "from-orange-400 to-yellow-600";
      default: return "from-cyan-400 to-purple-500";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={typeof window !== 'undefined' ? localStorage.getItem('pd_username') : null} />
      
      <main className="flex-1 container mx-auto p-6">
        <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <span className="text-4xl">👑</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-mono mb-4">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent neon-text">
                HALL OF CHAMPIONS
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The elite neural warriors who have mastered the art of prompt engineering
            </p>
          </div>

          {loading ? (
            <div className="text-center">
              <div className="cyber-spinner w-16 h-16 mx-auto mb-4"></div>
              <div className="text-gray-300 font-mono">LOADING CHAMPION DATA...</div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {data.length === 0 ? (
                <div className="cyber-card p-12 text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold mb-4 font-mono text-white">NO CHAMPIONS YET</h3>
                  <p className="text-gray-300">
                    Be the first to claim your place in the Hall of Champions!
                  </p>
                </div>
              ) : (
                <>
                  {/* Top 3 Podium */}
                  {data.length >= 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                      {/* 2nd Place */}
                      <div className="cyber-card p-6 text-center order-1 md:order-1 transform hover:scale-105 transition-transform duration-300">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-2xl">🥈</span>
                        </div>
                        <div className="text-sm text-gray-400 font-mono mb-1">#2 CHAMPION</div>
                        <div className="text-xl font-bold text-white font-mono mb-2">{data[1].username}</div>
                        <div className="text-2xl font-bold text-gray-300 font-mono">{data[1].total_points}</div>
                        <div className="text-xs text-gray-500 font-mono">POINTS</div>
                      </div>

                      {/* 1st Place */}
                      <div className="cyber-card p-8 text-center order-2 md:order-2 transform hover:scale-105 transition-transform duration-300 border-yellow-500/50">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                          <span className="text-3xl">👑</span>
                        </div>
                        <div className="text-sm text-yellow-400 font-mono mb-1 neon-text">SUPREME CHAMPION</div>
                        <div className="text-2xl font-bold text-white font-mono mb-2">{data[0].username}</div>
                        <div className="text-3xl font-bold text-yellow-400 font-mono neon-text">{data[0].total_points}</div>
                        <div className="text-xs text-gray-500 font-mono">POINTS</div>
                      </div>

                      {/* 3rd Place */}
                      <div className="cyber-card p-6 text-center order-3 md:order-3 transform hover:scale-105 transition-transform duration-300">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-2xl">🥉</span>
                        </div>
                        <div className="text-sm text-gray-400 font-mono mb-1">#3 CHAMPION</div>
                        <div className="text-xl font-bold text-white font-mono mb-2">{data[2].username}</div>
                        <div className="text-2xl font-bold text-orange-400 font-mono">{data[2].total_points}</div>
                        <div className="text-xs text-gray-500 font-mono">POINTS</div>
                      </div>
                    </div>
                  )}

                  {/* Full Leaderboard */}
                  <div className="cyber-card overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 border-b border-gray-700/50">
                      <h3 className="text-xl font-bold font-mono text-center">
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                          COMPLETE RANKINGS
                        </span>
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-black/30 border-b border-gray-700/50">
                            <th className="px-6 py-4 text-left text-sm font-mono text-gray-300">RANK</th>
                            <th className="px-6 py-4 text-left text-sm font-mono text-gray-300">WARRIOR</th>
                            <th className="px-6 py-4 text-center text-sm font-mono text-gray-300">POINTS</th>
                            <th className="px-6 py-4 text-center text-sm font-mono text-gray-300">VICTORIES</th>
                            <th className="px-6 py-4 text-center text-sm font-mono text-gray-300">DEFEATS</th>
                            <th className="px-6 py-4 text-center text-sm font-mono text-gray-300">BATTLES</th>
                            <th className="px-6 py-4 text-center text-sm font-mono text-gray-300">WIN RATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((warrior, index) => {
                            const rank = index + 1;
                            const winRate = warrior.matches_played > 0 ? ((warrior.wins / warrior.matches_played) * 100).toFixed(1) : "0.0";
                            
                            return (
                              <tr 
                                key={warrior.username} 
                                className="border-b border-gray-700/30 hover:bg-cyan-500/5 transition-colors duration-200"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-sm font-bold`}>
                                      {rank}
                                    </div>
                                    <span className="text-lg">{getRankIcon(rank)}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-white font-mono text-lg">{warrior.username}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="text-xl font-bold text-cyan-400 font-mono">{warrior.total_points}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="text-lg font-bold text-green-400 font-mono">{warrior.wins}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="text-lg font-bold text-red-400 font-mono">{warrior.losses}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="text-lg font-bold text-gray-300 font-mono">{warrior.matches_played}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="text-lg font-bold text-purple-400 font-mono">{winRate}%</div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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