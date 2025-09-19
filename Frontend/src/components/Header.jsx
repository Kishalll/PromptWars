import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header({ username }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Create floating particles
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        size: Math.random() * 3 + 1
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <>
      {/* Floating particles */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`
            }}
          />
        ))}
      </div>

      <header className="relative z-10 bg-gradient-to-r from-gray-900/90 via-purple-900/90 to-gray-900/90 backdrop-blur-md border-b border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="group">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                    <span className="text-white font-bold text-xl font-mono">⚡</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                </div>
                <h1 className="text-2xl font-bold font-mono bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent neon-text">
                  PROMPT WARS
                </h1>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="relative group">
                <span className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium">
                  HOME
                </span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
              </Link>
              <Link href="/leaderboard" className="relative group">
                <span className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium">
                  LEADERBOARD
                </span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
              </Link>
              <Link href="/game" className="relative group">
                <span className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 font-medium">
                  BATTLE
                </span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
              </Link>
            </nav>

            {/* User info */}
            <div className="flex items-center space-x-4">
              {username ? (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-cyan-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-cyan-300 font-medium font-mono">{username}</span>
                </div>
              ) : (
                <Link href="/login">
                  <button className="cyber-btn text-sm">
                    LOGIN
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden mt-4 flex justify-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium">
              HOME
            </Link>
            <Link href="/leaderboard" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium">
              LEADERBOARD
            </Link>
            <Link href="/game" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium">
              BATTLE
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}