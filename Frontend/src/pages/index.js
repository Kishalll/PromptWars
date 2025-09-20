import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import { health, testOllama } from "../lib/api";

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState({
    backend: 'checking',
    ollama: 'checking'
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setIsLoaded(true);
    
    // Get current user
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem("pd_username"));
    }
    
    // Check backend connection
    health()
      .then(() => setConnectionStatus(prev => ({ ...prev, backend: 'connected' })))
      .catch(() => setConnectionStatus(prev => ({ ...prev, backend: 'failed' })));

    // Check Ollama connection
    testOllama()
      .then((res) => {
        if (res.data.ollama_connected) {
          setConnectionStatus(prev => ({ ...prev, ollama: 'connected' }));
        } else {
          setConnectionStatus(prev => ({ ...prev, ollama: 'failed' }));
        }
      })
      .catch(() => setConnectionStatus(prev => ({ ...prev, ollama: 'failed' })));
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'status-connected';
      case 'failed': return 'status-failed';
      default: return 'status-checking';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return '✓ ONLINE';
      case 'failed': return '✗ OFFLINE';
      default: return '⏳ SCANNING...';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'failed': return '🔴';
      default: return '🟡';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={currentUser} />
      
      <main className="flex-1 relative">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-cyan-900/30"></div>
          
          <div className="container mx-auto px-6 py-20">
            <div className={`text-center transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="mb-8">
                <div className="inline-block p-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-6">
                  <span className="text-4xl">🧠⚡</span>
                </div>
              </div>
              
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black font-mono mb-8 glitch neon-text" data-text="PROMPT WARS">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  PROMPT WARS
                </span>
              </h1>
              
              <div className="max-w-4xl mx-auto mb-12">
                <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-6 leading-relaxed font-medium">
                  Enter the <span className="text-cyan-400 font-bold neon-text">neural battlefield</span> where words become weapons.
                </p>
                <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                  Battle opponents in <span className="text-purple-400 font-semibold">3 intense rounds</span> of AI-powered combat. 
                  Master the art of <span className="text-pink-400 font-semibold">prompt engineering</span> and claim your place among the champions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href={currentUser ? "/game" : "/login"}>
                  <button className="cyber-btn text-xl px-12 py-6 transform hover:scale-110 transition-all duration-300 shadow-2xl">
                    {currentUser ? '⚔️ ENTER BATTLE' : '🚀 JOIN THE WAR'}
                  </button>
                </Link>
                <Link href="/leaderboard">
                  <button className="cyber-btn-secondary text-xl px-12 py-6 transform hover:scale-110 transition-all duration-300">
                    👑 HALL OF FAME
                  </button>
                </Link>
              </div>

              {/* Stats Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
                <div className="cyber-card p-6 text-center">
                  <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">∞</div>
                  <div className="text-sm text-gray-400 font-mono">NEURAL BATTLES</div>
                </div>
                <div className="cyber-card p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 font-mono mb-2">AI</div>
                  <div className="text-sm text-gray-400 font-mono">POWERED SCORING</div>
                </div>
                <div className="cyber-card p-6 text-center">
                  <div className="text-3xl font-bold text-pink-400 font-mono mb-2">24/7</div>
                  <div className="text-sm text-gray-400 font-mono">COMBAT READY</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="container mx-auto px-6 mb-16">
          <div className={`cyber-card p-8 max-w-3xl mx-auto transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h3 className="text-2xl font-bold mb-8 text-center font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                🖥️ SYSTEM STATUS
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="battle-arena p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{getStatusIcon(connectionStatus.backend)}</span>
                    <div>
                      <div className="font-mono text-gray-300 text-sm">BACKEND CORE</div>
                      <div className="font-mono text-xs text-gray-500">Neural Network Hub</div>
                    </div>
                  </div>
                  <span className={`font-bold font-mono text-lg ${getStatusColor(connectionStatus.backend)}`}>
                    {getStatusText(connectionStatus.backend)}
                  </span>
                </div>
              </div>
              
              <div className="battle-arena p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{getStatusIcon(connectionStatus.ollama)}</span>
                    <div>
                      <div className="font-mono text-gray-300 text-sm">AI CORE</div>
                      <div className="font-mono text-xs text-gray-500">Ollama Engine</div>
                    </div>
                  </div>
                  <span className={`font-bold font-mono text-lg ${getStatusColor(connectionStatus.ollama)}`}>
                    {getStatusText(connectionStatus.ollama)}
                  </span>
                </div>
              </div>
            </div>

            {(connectionStatus.backend === 'failed' || connectionStatus.ollama === 'failed') && (
              <div className="mt-8 p-6 bg-red-900/30 border-2 border-red-500/40 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3 text-red-400 mb-3">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-mono font-bold text-lg">CRITICAL SYSTEM ERROR</span>
                </div>
                <p className="text-red-300 text-sm leading-relaxed">
                  Neural network components are offline. Combat operations suspended until systems are restored.
                  Please check your configuration and restart the affected services.
                </p>
              </div>
            )}

            {(connectionStatus.backend === 'connected' && connectionStatus.ollama === 'connected') && (
              <div className="mt-8 p-6 bg-green-900/30 border-2 border-green-500/40 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3 text-green-400 mb-3">
                  <span className="text-2xl">✅</span>
                  <span className="font-mono font-bold text-lg">ALL SYSTEMS OPERATIONAL</span>
                </div>
                <p className="text-green-300 text-sm leading-relaxed">
                  Neural battlefield is fully operational. All combat systems are online and ready for engagement.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* How to Play */}
        <div className="container mx-auto px-6 mb-16">
          <div className={`transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                ⚔️ COMBAT PROTOCOL
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "NEURAL LINK",
                  description: "Initialize your combat profile and establish secure neural connection to the battlefield network",
                  icon: "🔐",
                  color: "from-cyan-400 to-blue-500"
                },
                {
                  step: "02", 
                  title: "MATCHMAKING",
                  description: "Advanced AI algorithm pairs you with opponents of similar skill level for balanced combat",
                  icon: "🎯",
                  color: "from-purple-400 to-pink-500"
                },
                {
                  step: "03",
                  title: "NEURAL COMBAT",
                  description: "Engage in 3 rounds of intense prompt battles. Craft precise neural commands to dominate targets",
                  icon: "⚡",
                  color: "from-green-400 to-cyan-500"
                },
                {
                  step: "04",
                  title: "VICTORY PROTOCOL",
                  description: "Highest cumulative score claims victory. Ascend the leaderboard and earn your place among legends",
                  icon: "👑",
                  color: "from-yellow-400 to-orange-500"
                }
              ].map((item, index) => (
                <div key={index} className="cyber-card p-8 text-center group hover:scale-105 transition-all duration-500">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-3xl shadow-2xl transform group-hover:rotate-12 transition-transform duration-500`}>
                    {item.icon}
                  </div>
                  <div className="text-sm font-mono text-gray-400 mb-3 tracking-wider">PHASE {item.step}</div>
                  <h3 className="text-xl font-bold mb-4 text-white font-mono neon-text">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                  
                  {/* Progress indicator */}
                  <div className="mt-6 w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 delay-${index * 200}`}
                      style={{ width: isLoaded ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 mb-16">
          <div className={`transform transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-mono">
              <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent neon-text">
                🧠 NEURAL FEATURES
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "🤖",
                  title: "AI-POWERED SCORING",
                  description: "Advanced neural networks evaluate prompt accuracy with unprecedented precision",
                  color: "cyan"
                },
                {
                  icon: "⚡",
                  title: "REAL-TIME BATTLES",
                  description: "Instant matchmaking and live combat with warriors from around the globe",
                  color: "purple"
                },
                {
                  icon: "🏆",
                  title: "DYNAMIC LEADERBOARDS",
                  description: "Climb the ranks and establish your dominance in the neural hierarchy",
                  color: "pink"
                },
                {
                  icon: "🎯",
                  title: "ADAPTIVE TARGETS",
                  description: "AI-generated challenges that evolve and adapt to test your skills",
                  color: "green"
                },
                {
                  icon: "📊",
                  title: "DETAILED ANALYTICS",
                  description: "Comprehensive battle statistics and performance metrics tracking",
                  color: "orange"
                },
                {
                  icon: "🔮",
                  title: "SKILL PROGRESSION",
                  description: "Advanced ELO system tracks your evolution as a prompt engineer",
                  color: "blue"
                }
              ].map((feature, index) => (
                <div key={index} className="cyber-card p-6 text-center group hover:scale-105 transition-all duration-300">
                  <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-white font-mono">{feature.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="container mx-auto px-6 pb-20">
          <div className={`text-center transform transition-all duration-1000 delay-900 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="cyber-card p-16 max-w-5xl mx-auto battle-arena">
              <div className="mb-8">
                <div className="inline-block p-6 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-2 border-cyan-500/50 mb-6">
                  <span className="text-6xl">🔥</span>
                </div>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 font-mono">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent neon-text glitch" data-text="READY FOR NEURAL WARFARE?">
                  READY FOR NEURAL WARFARE?
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
                Join the elite ranks of <span className="text-cyan-400 font-bold">prompt engineers</span>. 
                Every battle sharpens your skills, every victory brings you closer to <span className="text-purple-400 font-bold">neural mastery</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href={currentUser ? "/game" : "/login"}>
                  <button className="cyber-btn text-2xl px-16 py-8 transform hover:scale-110 transition-all duration-300 shadow-2xl">
                    🚀 {currentUser ? 'ENTER COMBAT' : 'BEGIN TRAINING'}
                  </button>
                </Link>
                {!currentUser && (
                  <Link href="/login">
                    <button className="cyber-btn-secondary text-xl px-12 py-6 transform hover:scale-105 transition-all duration-300">
                      📋 REGISTER NOW
                    </button>
                  </Link>
                )}
              </div>
              
              <div className="mt-12 text-sm text-gray-500 font-mono">
                <p>🔒 Secure Neural Link • 🌐 Global Network • ⚡ Instant Combat</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}