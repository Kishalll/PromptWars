import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { registerUser, loginUser } from "../lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mode, setMode] = useState("login"); // "login" or "register"
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
    
    // Check if user is already logged in
    if (typeof window !== 'undefined') {
      const existingUser = localStorage.getItem("pd_username");
      if (existingUser) {
        router.push("/game");
      }
    }
  }, [router]);

  async function handleRegister() {
    setMsg(null);
    if (!username.trim()) return setMsg({ type: "error", text: "Neural signature required for registration" });
    
    if (username.length < 3 || username.length > 20) {
      return setMsg({ type: "error", text: "Neural signature must be 3-20 characters" });
    }
    
    if (!/^[A-Za-z0-9_]+$/.test(username)) {
      return setMsg({ type: "error", text: "Invalid characters detected. Use only letters, numbers, and underscores" });
    }
    
    setLoading(true);
    try {
      await registerUser(username);
      localStorage.setItem("pd_username", username);
      setMsg({ type: "success", text: "Neural link established successfully! Redirecting to battlefield..." });
      setTimeout(() => router.push("/game"), 1500);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 409) {
        setMsg({ type: "error", text: "Neural signature already exists in the network. Choose another identity." });
      } else {
        setMsg({ type: "error", text: "System malfunction detected. Neural link failed. Try again." });
      }
    } finally { 
      setLoading(false); 
    }
  }

  async function handleLogin() {
    setMsg(null);
    if (!username.trim()) return setMsg({ type: "error", text: "Neural signature required for access" });
    
    setLoading(true);
    try {
      await loginUser(username);
      localStorage.setItem("pd_username", username);
      setMsg({ type: "success", text: "Neural link verified! Accessing battlefield..." });
      setTimeout(() => router.push("/game"), 1500);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 404) {
        setMsg({ type: "error", text: "Neural signature not found in database. Please register first." });
      } else {
        setMsg({ type: "error", text: "System malfunction detected. Access denied. Try again." });
      }
    } finally { 
      setLoading(false); 
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "register") {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-pink-900/20"></div>
        
        <div className={`w-full max-w-lg transform transition-all duration-1000 relative z-10 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="cyber-card p-10 battle-arena">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/40 relative">
                <span className="text-4xl">🔐</span>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full blur-xl opacity-50 -z-10 scale-150"></div>
              </div>
              
              <h2 className="text-4xl font-bold font-mono mb-4">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent neon-text">
                  NEURAL ACCESS
                </span>
              </h2>
              
              <p className="text-gray-400 text-lg font-mono">
                {mode === "login" ? "Verify your neural signature" : "Initialize combat profile"}
              </p>
              
              {/* Mode Toggle */}
              <div className="flex justify-center mt-6">
                <div className="bg-black/30 p-1 rounded-lg border border-gray-700/50">
                  <button
                    onClick={() => {setMode("login"); setMsg(null); setUsername("");}}
                    className={`px-6 py-2 rounded font-mono text-sm transition-all duration-300 ${
                      mode === "login" 
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={() => {setMode("register"); setMsg(null); setUsername("");}}
                    className={`px-6 py-2 rounded font-mono text-sm transition-all duration-300 ${
                      mode === "register" 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    REGISTER
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-3 tracking-wider">
                  NEURAL SIGNATURE
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === "login" ? "Enter your combat callsign..." : "Choose your warrior identity..."}
                  className="cyber-input w-full text-lg"
                  maxLength={20}
                  disabled={loading}
                  autoFocus
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500 font-mono">
                    3-20 characters: letters, numbers, underscores
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {username.length}/20
                  </div>
                </div>
              </div>

              {msg && (
                <div className={`p-6 rounded-lg border-2 backdrop-blur-sm ${
                  msg.type === 'error' 
                    ? 'bg-red-900/30 border-red-500/40 text-red-400' 
                    : 'bg-green-900/30 border-green-500/40 text-green-400'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {msg.type === 'error' ? '⚠️' : '✅'}
                    </span>
                    <div>
                      <div className="font-mono font-bold text-sm mb-1">
                        {msg.type === 'error' ? 'SYSTEM ERROR' : 'SUCCESS'}
                      </div>
                      <div className="font-mono text-sm">{msg.text}</div>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className={`w-full py-4 text-lg font-bold transition-all duration-300 ${
                  mode === "register" 
                    ? "cyber-btn" 
                    : "cyber-btn-secondary"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={loading || !username.trim()}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="cyber-spinner w-5 h-5"></div>
                    <span>{mode === "register" ? "INITIALIZING..." : "VERIFYING..."}</span>
                  </div>
                ) : (
                  <>
                    {mode === "register" ? "🚀 INITIALIZE NEURAL LINK" : "🔑 ACCESS BATTLEFIELD"}
                  </>
                )}
              </button>
            </form>

            {/* Info Panel */}
            <div className="mt-10 p-6 bg-black/40 rounded-lg border border-gray-700/50 backdrop-blur-sm">
              <div className="text-xs text-gray-400 font-mono space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400">•</span>
                  <span><span className="text-cyan-400 font-bold">REGISTER</span>: Create new neural profile for first-time warriors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400">•</span>
                  <span><span className="text-purple-400 font-bold">LOGIN</span>: Access existing profile and battle history</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-pink-400">•</span>
                  <span>Neural signatures must be unique across the global network</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">•</span>
                  <span>All data is encrypted and stored securely in the neural vault</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                <div className="text-lg font-bold text-cyan-400 font-mono">∞</div>
                <div className="text-xs text-gray-500 font-mono">BATTLES</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <div className="text-lg font-bold text-purple-400 font-mono">24/7</div>
                <div className="text-xs text-gray-500 font-mono">ONLINE</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-lg border border-green-500/20">
                <div className="text-lg font-bold text-green-400 font-mono">AI</div>
                <div className="text-xs text-gray-500 font-mono">POWERED</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}