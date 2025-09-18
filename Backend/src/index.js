// src/index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const leaderboardRoutes = require("./routes/leaderboard");

const { init, addMatchAndUpdateStats } = require("./services/dbService");
const { similarity, generateTargets } = require("./services/ollamaService");
const { similarityToPoints } = require("./utils/scoring");

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// Cleanup function for graceful shutdown
async function cleanup() {
  console.log('\n🔄 Shutting down gracefully...');
  
  // Stop Ollama if it was started by this process
  try {
    const { exec } = require('child_process');
    exec('pkill -f ollama', (error) => {
      if (!error) {
        console.log('✅ Ollama stopped');
      }
    });
  } catch (e) {
    // Ignore errors when stopping Ollama
  }
  
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGQUIT', cleanup);

(async function bootstrap() {
  await init();

  const app = express();
  app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  
  // Test endpoint to check Ollama connection
  app.get("/api/test-ollama", async (req, res) => {
    try {
      const testSim = await similarity("cat", "feline");
      const testTargets = await generateTargets(1);
      res.json({ 
        ok: true, 
        similarity_test: testSim,
        target_test: testTargets[0],
        ollama_connected: true 
      });
    } catch (error) {
      res.json({ 
        ok: false, 
        error: error.message,
        ollama_connected: false 
      });
    }
  });
  
  app.use("/api/auth", authRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: FRONTEND_ORIGIN, methods: ["GET", "POST"] }
  });

  // Matchmaking state
  const queue = []; // { socketId, username }
  const matches = new Map(); // matchId -> state

  function newMatchId() {
    return "m_" + Math.random().toString(36).slice(2, 10);
  }

  async function createMatch(p1, p2) {
    const id = newMatchId();
    const room = id;

    // Generate 3 AI targets (request all at once and ensure uniqueness)
    let targets = [];
    try {
      // pass an empty exclude list for now — generateTargets will ensure uniqueness
      targets = await generateTargets(3, []);
      // ensure we have exactly 3 strings
      if (!Array.isArray(targets) || targets.length < 3) {
        // pad with fallbacks
        const fallbacks = [
          "mysterious sunset on the sea",
          "ancient stone temple",
          "neon city skyline"
        ];
        for (let i = 0; targets.length < 3 && i < fallbacks.length; i++) {
          if (!targets.includes(fallbacks[i])) targets.push(fallbacks[i]);
        }
        targets = targets.slice(0, 3);
      }
    } catch (e) {
      targets = [
        "mysterious sunset on the sea",
        "ancient stone temple",
        "neon city skyline"
      ];
    }

    const state = {
      id,
      room,
      players: {
        p1: { username: p1.username, socketId: p1.socketId },
        p2: { username: p2.username, socketId: p2.socketId }
      },
      round: 1,
      targets,
      submissions: {}, // roundNum -> { p1Prompt, p2Prompt }
      scores: { p1: 0, p2: 0 },
      roundsData: []
    };

    matches.set(id, state);

    const s1 = io.sockets.sockets.get(p1.socketId);
    const s2 = io.sockets.sockets.get(p2.socketId);
    if (s1) s1.join(room);
    if (s2) s2.join(room);

    // notify both players
    io.to(room).emit("matchStarted", {
      matchId: id,
      players: { p1: state.players.p1.username, p2: state.players.p2.username },
      round: state.round,
      target: targets[0]
    });

    return state;
  }

  function tryMatchmake() {
    while (queue.length >= 2) {
      const p1 = queue.shift();
      const p2 = queue.shift();
      // ensure sockets still connected
      if (!io.sockets.sockets.get(p1.socketId)) continue;
      if (!io.sockets.sockets.get(p2.socketId)) continue;
      // avoid matching the same username against themselves if duplicates
      if (p1.socketId === p2.socketId) continue;
      createMatch(p1, p2).catch(err => console.error("createMatch error:", err));
    }
  }

  io.on("connection", (socket) => {
    let username = null;

    socket.on("register", (data) => {
      username = (data && data.username) ? String(data.username) : null;
      socket.emit("registered", { ok: true });
    });

    socket.on("joinQueue", () => {
      if (!username) {
        socket.emit("errorMsg", { error: "Please register first." });
        return;
      }
      // avoid duplicates
      if (!queue.find(q => q.socketId === socket.id)) {
        queue.push({ socketId: socket.id, username });
        socket.emit("queued", { ok: true });
        tryMatchmake();
      }
    });

    socket.on("leaveQueue", () => {
      const idx = queue.findIndex(q => q.socketId === socket.id);
      if (idx >= 0) queue.splice(idx, 1);
      socket.emit("leftQueue", { ok: true });
    });

    socket.on("submitPrompt", async (payload) => {
      try {
        const { matchId, prompt } = payload || {};
        const state = matches.get(matchId);
        if (!state) {
          socket.emit("errorMsg", { error: "Match not found." });
          return;
        }

        const isP1 = socket.id === state.players.p1.socketId;
        const isP2 = socket.id === state.players.p2.socketId;
        if (!isP1 && !isP2) return;

        const r = state.round;
        if (!state.submissions[r]) state.submissions[r] = { p1Prompt: null, p2Prompt: null };
        if (isP1) state.submissions[r].p1Prompt = typeof prompt === "string" ? prompt : "";
        if (isP2) state.submissions[r].p2Prompt = typeof prompt === "string" ? prompt : "";

        const bothIn =
          state.submissions[r].p1Prompt !== null &&
          state.submissions[r].p2Prompt !== null;

        if (bothIn) {
          const target = state.targets[r - 1];

          // compute similarities
          const [sim1, sim2] = await Promise.all([
            similarity(state.submissions[r].p1Prompt, target),
            similarity(state.submissions[r].p2Prompt, target)
          ]);

          const p1Score = similarityToPoints(sim1);
          const p2Score = similarityToPoints(sim2);
          state.scores.p1 += p1Score;
          state.scores.p2 += p2Score;

          const roundData = {
            target,
            p1Prompt: state.submissions[r].p1Prompt,
            p2Prompt: state.submissions[r].p2Prompt,
            p1Score,
            p2Score
          };
          state.roundsData.push(roundData);

          io.to(state.room).emit("roundResult", {
            round: r,
            target,
            p1: { username: state.players.p1.username, prompt: roundData.p1Prompt, score: p1Score, total: state.scores.p1 },
            p2: { username: state.players.p2.username, prompt: roundData.p2Prompt, score: p2Score, total: state.scores.p2 }
          });

          if (state.round < 3) {
            state.round += 1;
            io.to(state.room).emit("nextRound", {
              round: state.round,
              target: state.targets[state.round - 1]
            });
          } else {
            let winner = null;
            if (state.scores.p1 > state.scores.p2) winner = state.players.p1.username;
            else if (state.scores.p2 > state.scores.p1) winner = state.players.p2.username;
            else winner = "draw";

            await addMatchAndUpdateStats({
              player1: state.players.p1.username,
              player2: state.players.p2.username,
              winner: winner === "draw" ? null : winner,
              rounds: state.roundsData,
              totals: { p1: state.scores.p1, p2: state.scores.p2 }
            });

            io.to(state.room).emit("gameOver", {
              winner,
              totals: { p1: state.scores.p1, p2: state.scores.p2 },
              rounds: state.roundsData
            });

            // cleanup
            matches.delete(state.id);
            const s1 = io.sockets.sockets.get(state.players.p1.socketId);
            const s2 = io.sockets.sockets.get(state.players.p2.socketId);
            if (s1) s1.leave(state.room);
            if (s2) s2.leave(state.room);
          }
        }
      } catch (err) {
        console.error("submitPrompt error:", err);
        socket.emit("errorMsg", { error: "Server error scoring prompt" });
      }
    });

    socket.on("disconnect", () => {
      const i = queue.findIndex(q => q.socketId === socket.id);
      if (i >= 0) queue.splice(i, 1);
      // optionally handle active-match disconnects; for MVP we keep it simple
    });
  });

  server.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
  });
})();
