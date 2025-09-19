import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { registerUser, loginUser } from "../lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  async function handleRegister() {
    setMsg(null);
    if (!username) return setMsg({ type: "error", text: "Neural signature required" });
    setLoading(true);
    try {
      await registerUser(username);
      localStorage.setItem("pd_username", username);
      router.push("/game");
    } catch (e) {
      const code = e?.response?.status;
      if (code === 409) setMsg({ type: "error", text: "Neural signature already exists. Choose another identity." });
      else setMsg({ type: "error", text: "System malfunction detected. Try again." });
    } finally { setLoading(false); }
  }

  async function handleLogin() {
    setMsg(null);
    if (!username) return setMsg({ type: "error", text: "Neural signature required" });
    setLoading(true);
    try {
      await loginUser(username);
      localStorage.setItem("pd_username", username);
      router.push("/game");
    } catch (e) {
      const code = e?.response?.status;
      if (code === 404) setMsg({ type: "error", text: "Neural signature not found — please register first." });
      else setMsg({ type: "error", text: "System malfunction detected. Try again." });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={typeof window !== 'undefined' ? localStorage.getItem("pd_username") : null} />
      
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className={`w-full max-w-md transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="cyber-card p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-3xl font-bold font-mono mb-2">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                  NEURAL ACCESS
                </span>
              </h2>
              <p className="text-gray-400">Initialize your combat profile</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  NEURAL SIGNATURE
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your combat callsign..."
                  className="cyber-input w-full"
                  maxLength={20}
                />
                <div className="text-xs text-gray-500 mt-1 font-mono">
                  3-20 characters: letters, numbers, underscores only
                </div>
              </div>

              {msg && (
                <div className={`p-4 rounded-lg border ${
                  msg.type === 'error' 
                    ? 'bg-red-900/20 border-red-500/30 text-red-400' 
                    : 'bg-green-900/20 border-green-500/30 text-green-400'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {msg.type === 'error' ? '⚠️' : '✅'}
                    </span>
                    <span className="font-mono text-sm">{msg.text}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={handleRegister} 
                  className="cyber-btn w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="cyber-spinner w-4 h-4"></div>
                      <span>PROCESSING...</span>
                    </div>
                  ) : (
                    "🚀 REGISTER"
                  )}
                </button>
                
                <button 
                  onClick={handleLogin} 
                  className="cyber-btn-secondary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="cyber-spinner w-4 h-4"></div>
                      <span>ACCESSING...</span>
                    </div>
                  ) : (
                    "🔑 LOGIN"
                  )}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="mt-8 p-4 bg-black/30 rounded-lg border border-gray-700/50">
              <div className="text-xs text-gray-400 font-mono space-y-1">
                <div>• <span className="text-cyan-400">REGISTER</span>: Create new neural profile</div>
                <div>• <span className="text-purple-400">LOGIN</span>: Access existing profile</div>
                <div>• Neural signatures must be unique across the network</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}