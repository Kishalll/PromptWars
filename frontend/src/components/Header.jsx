import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header({ username }) {
  const [particles, setParticles] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Create floating particles
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 4 + 6
      });
    }
    setParticles(newParticles);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("pd_username");
      window.location.href = "/";
    }
  };

  return (
    <>
      {/* Enhanced floating particles */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      <header className="relative z-50 bg-gradient-to-r from-gray-900/95 via-purple-900/95 to-gray-900/95 backdrop-blur-xl border-b-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Enhanced Logo */}
            <Link href="/" className="group">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-cyan-500/30">
                    <span className="text-white font-bold text-2xl font-mono">⚡</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity duration-500 -z-20 scale-150"></div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black font-mono bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent neon-text group-hover:scale-105 transition-transform duration-300">
                    PROMPT WARS
                  </h1>
                  <div className="text-xs text-gray-400 font-mono opacity-75">
                    NEURAL BATTLEFIELD
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="relative group">
                <span className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-semibold font-mono text-sm tracking-wider">
                  HOME
                </span>
                <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
                <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 blur-sm group-hover:w-full transition-all duration-300"></div>
              </Link>
              <Link href="/leaderboard" className="relative group">
                <span className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-semibold font-mono text-sm tracking-wider">
                  CHAMPIONS
                </span>
                <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
                <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 blur-sm group-hover:w-full transition-all duration-300"></div>
              </Link>
              <Link href="/game" className="relative group">
                <span className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-semibold font-mono text-sm tracking-wider">
                  BATTLE
                </span>
                <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
                <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 blur-sm group-hover:w-full transition-all duration-300"></div>
              </Link>
            </nav>

            {/* User info and mobile menu */}
            <div className="flex items-center space-x-4">
              {username ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:flex items-center space-x-3 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 px-6 py-3 rounded-full border-2 border-cyan-500/40 backdrop-blur-sm">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-cyan-300 font-bold font-mono text-sm tracking-wider">{username}</span>
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{username[0]?.toUpperCase()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="hidden md:block cyber-btn-secondary text-xs px-4 py-2"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <button className="cyber-btn text-sm px-6 py-2">
                    NEURAL ACCESS
                  </button>
                </Link>
              )}

              {/* Mobile menu button */}
              <button 
                className="lg:hidden cyber-btn-secondary text-sm px-3 py-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`lg:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="mt-6 pb-4 space-y-4">
              <Link href="/" className="block text-gray-300 hover:text-cyan-400 transition-colors font-semibold font-mono text-sm tracking-wider py-2">
                🏠 HOME
              </Link>
              <Link href="/leaderboard" className="block text-gray-300 hover:text-cyan-400 transition-colors font-semibold font-mono text-sm tracking-wider py-2">
                👑 CHAMPIONS
              </Link>
              <Link href="/game" className="block text-gray-300 hover:text-cyan-400 transition-colors font-semibold font-mono text-sm tracking-wider py-2">
                ⚔️ BATTLE
              </Link>
              {username && (
                <>
                  <div className="flex items-center space-x-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-cyan-300 font-bold font-mono text-sm">{username}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left text-red-400 hover:text-red-300 transition-colors font-semibold font-mono text-sm tracking-wider py-2"
                  >
                    🚪 LOGOUT
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header glow effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
      </header>
    </>
  );
}