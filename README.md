# ⚔️ PromptWars

**Welcome to the Neural Battlefield.**

PromptWars is a real-time multiplayer game where you duel against other players to see who's the better Prompt Engineer. It's not just about typing fast—it's about speaking the AI's language.

You get a target (like "A cyberpunk city in rain"), and you have to write a prompt that would generate that image. Our local AI judge rates how close you got.

---

## ⚡ Features
- **Live Multiplayer**: Battle real opponents in real-time.
- **AI Referee**: Uses a local LLM (Ollama) to semantic-match your prompts.
- **Cyberpunk UI**: Fully immersive, glitchy, neon interface.
- **Leaderboards**: Track your wins and neural supremacy.

---

## 🛠️ The Tech Stack
We built this monorepo using some cool tech:

- **Frontend**: Next.js 15 + Tailwind CSS (for that sweet unparalleled speed and style)
- **Backend**: Node.js + Express + Socket.IO (handling the real-time websocket magic)
- **Database**: SQLite (simple, fast, local)
- **AI Core**: Ollama running `llama3.2` & `nomic-embed-text` (privately running on your machine!)

---

## 🚀 How to Install

Prerequisites: You need [Node.js](https://nodejs.org/) and [Ollama](https://ollama.ai/) installed.

1. **Get the AI ready**  
   Fire up Ollama and pull the models we need:
   ```bash
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ollama serve
   ```

2. **Set up the Backend**  
   Open a terminal in the `backend` folder:
   ```bash
   cd backend
   npm install
   npm start
   ```
   *You should see "Server running on port 4000".*

3. **Set up the Frontend**  
   Open a **new** terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Join the War**  
   Open `http://localhost:3000` in your browser.

---

## 🎮 How to Play

1. **Enter your Codename**: Pick a username to start.
2. **Find an Opponent**: Click "Join the War" to enter the matchmaking queue.
3. **The Duel**: 
   - The system gives you a **Visual Target** (e.g., "Ancient tree glowing in moonlight").
   - You have **30 seconds** to write a descriptive prompt for it.
   - Do NOT use the exact words from the target title (that's cheating!).
4. **Scoring**: The AI compares your prompt to the target meaning. Closer meaning = higher score.
5. **Win**: Best of 3 rounds takes the glory!

### 👯 Play with a Friend (LAN)
Want to battle someone in the same room? You can host the game and let friends join via WiFi.

1. **Connect to same WiFi**: Ensure both you and your friend are on the same network.
2. **Find your Local IP**:
   - **Windows**: Open terminal, type `ipconfig`. Look for "IPv4 Address" (e.g., `192.168.1.5`).
   - **Mac/Linux**: Open terminal, type `ifconfig | grep "inet " | grep -v 127.0.0.1`.
3. **Expose the Frontend**:
   - Stop the frontend server.
   - Run: `npm run dev -- -H 0.0.0.0` (this lets others connect to your machine).
4. **Join the Battle**:
   - **You**: Go to `http://localhost:3000`.
   - **Friend**: Go to `http://YOUR_IP_ADDRESS:3000` (e.g., `http://192.168.1.5:3000`).

*Troubleshooting*: If they can't connect, disable your firewall temporarily or allow ports 3000 & 4000.

---

*Built with ❤️ by Kishal.*
