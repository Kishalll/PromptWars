// src/pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { registerUser, loginUser } from "../lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const router = useRouter();

  async function handleRegister() {
    setMsg(null);
    if (!username) return setMsg({ type: "error", text: "Enter a username" });
    setLoading(true);
    try {
      await registerUser(username);
      // store username locally and go to home (or game)
      localStorage.setItem("pd_username", username);
      router.push("/game");
    } catch (e) {
      const code = e?.response?.status;
      if (code === 409) setMsg({ type: "error", text: "Username already taken. Choose another." });
      else setMsg({ type: "error", text: "Server error or network issue." });
    } finally { setLoading(false); }
  }

  async function handleLogin() {
    setMsg(null);
    if (!username) return setMsg({ type: "error", text: "Enter a username" });
    setLoading(true);
    try {
      await loginUser(username);
      localStorage.setItem("pd_username", username);
      router.push("/game");
    } catch (e) {
      const code = e?.response?.status;
      if (code === 404) setMsg({ type: "error", text: "User not found — please register first." });
      else setMsg({ type: "error", text: "Server error or network issue." });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={localStorage.getItem("pd_username")} />
      <main className="flex-1 container mx-auto p-6">
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Login / Register</h2>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (3-20 letters/numbers/_)"
            className="w-full px-3 py-2 border rounded mb-3"
          />

          {msg && <div className={`p-2 mb-3 text-sm ${msg.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{msg.text}</div>}

          <div className="flex gap-3">
            <button onClick={handleRegister} className="flex-1 bg-blue-600 text-white py-2 rounded" disabled={loading}>
              {loading ? "Working..." : "Register (unique)"}
            </button>
            <button onClick={handleLogin} className="flex-1 border py-2 rounded" disabled={loading}>
              {loading ? "Working..." : "Login (existing)"}
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            If you're returning, press Login. If new, press Register. Username must be unique.
          </div>
        </div>
      </main>
    </div>
  );
}
