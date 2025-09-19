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

  useEffect(() => {
    setIsLoaded(true);
    
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
      <Header />
      
      <main className="flex-1 relative">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>
          
          <div className="container mx-auto px-6 py-20">
            <div className={`text-center transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-6xl md:text-8xl font-black font-mono mb-6 glitch neon-text" data-text="PROMPT WARS">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  PROMPT WARS
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Enter the <span className="text-cyan-400 font-semibold">neural battlefield</span> where words become weapons. 
                Battle your opponents in <span className="text-purple-400 font-semibold">3 intense rounds</span> of AI-powered combat.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="/login">
                  <button className="cyber-btn text-lg px-8 py-4 transform hover:scale-105 transition-transform">
                    🚀 ENTER BATTLE
                  </button>
                </Link>
                <Link href="/leaderboard">
                  <button className="cyber-btn-secondary text-lg px-8 py-4 transform hover:scale-105 transition-transform">
                    👑 VIEW CHAMPIONS
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="container mx-auto px-6 mb-16">
          <div className={`cyber-card p-8 max-w-2xl mx-auto transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h3 className="text-2xl font-bold mb-6 text-center font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                SYSTEM STATUS
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(connectionStatus.backend)}</span>
                  <span className="font-mono text-gray-300">BACKEND</span>
                </div>
                <span className={`font-bold font-mono ${getStatusColor(connectionStatus.backend)}`}>
                  {getStatusText(connectionStatus.backend)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(connectionStatus.ollama)}</span>
                  <span className="font-mono text-gray-300">AI CORE</span>
                </div>
                <span className={`font-bold font-mono ${getStatusColor(connectionStatus.ollama)}`}>
                  {getStatusText(connectionStatus.ollama)}
                </span>
              </div>
            </div>

            {(connectionStatus.backend === 'failed' || connectionStatus.ollama === 'failed') && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-red-400">
                  <span className="text-xl">⚠️</span>
                  <span className="font-mono font-semibold">SYSTEM MALFUNCTION DETECTED</span>
                </div>
                <p className="text-red-300 mt-2 text-sm">
                  Some neural networks are offline. Please check your system configuration.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* How to Play */}
        <div className="container mx-auto px-6 mb-16">
          <div className={`transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl font-bold text-center mb-12 font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                COMBAT PROTOCOL
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "INITIALIZE",
                  description: "Register your neural signature or login to existing profile",
                  icon: "🔐",
                  color: "from-cyan-400 to-blue-500"
                },
                {
                  step: "02", 
                  title: "MATCHMAKING",
                  description: "AI system pairs you with an opponent of similar skill level",
                  icon: "🎯",
                  color: "from-purple-400 to-pink-500"
                },
                {
                  step: "03",
                  title: "NEURAL COMBAT",
                  description: "Submit prompts for 3 AI-generated targets. Precision is key.",
                  icon: "⚡",
                  color: "from-green-400 to-cyan-500"
                },
                {
                  step: "04",
                  title: "VICTORY",
                  description: "Highest total score wins. Climb the leaderboard rankings.",
                  icon: "👑",
                  color: "from-yellow-400 to-orange-500"
                }
              ].map((item, index) => (
                <div key={index} className="cyber-card p-6 text-center group hover:scale-105 transition-transform duration-300">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="text-sm font-mono text-gray-400 mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-bold mb-3 text-white font-mono">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="container mx-auto px-6 pb-20">
          <div className={`text-center transform transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="cyber-card p-12 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-mono">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent neon-text">
                  READY FOR NEURAL WARFARE?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join the elite ranks of prompt engineers. Every battle sharpens your skills.
              </p>
              <Link href="/login">
                <button className="cyber-btn text-xl px-12 py-6 transform hover:scale-110 transition-all duration-300">
                  🔥 BEGIN TRAINING
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}