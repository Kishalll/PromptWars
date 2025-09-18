// src/pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import { health, testOllama } from "../lib/api";

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState({
    backend: 'checking',
    ollama: 'checking'
  });

  useEffect(() => {
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
      case 'connected': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return '✓ Connected';
      case 'failed': return '✗ Failed';
      default: return '⏳ Checking...';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Prompt Duel</h1>
        <p className="mb-6 text-gray-600">Battle your friend in 3 rounds — AI gives a hidden target, both players write prompts. Closest prompts score points.</p>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <div className="space-y-1 text-sm">
            <div className={`${getStatusColor(connectionStatus.backend)}`}>
              Backend: {getStatusText(connectionStatus.backend)}
            </div>
            <div className={`${getStatusColor(connectionStatus.ollama)}`}>
              Ollama AI: {getStatusText(connectionStatus.ollama)}
            </div>
          </div>
          {(connectionStatus.backend === 'failed' || connectionStatus.ollama === 'failed') && (
            <div className="mt-2 text-sm text-red-600">
              ⚠️ Some services are not available. Please check your setup.
            </div>
          )}
        </div>

        <div className="space-x-4">
          <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded shadow inline-block">Play</Link>
          <Link href="/leaderboard" className="px-6 py-3 border rounded inline-block">View Leaderboard</Link>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-2">How to play</h2>
          <ol className="list-decimal list-inside text-gray-700">
            <li>Enter a unique username (register) or login if you already have one.</li>
            <li>Get auto-matched with an opponent.</li>
            <li>Submit prompts for 3 AI-generated targets.</li>
            <li>Highest total points after 3 rounds wins.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
