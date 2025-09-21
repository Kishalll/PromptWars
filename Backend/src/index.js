const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { spawn } = require("child_process");
const { stopOllama } = require("./services/ollamaService");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const modelRoutes = require("./routes/models");
const leaderboardRoutes = require("./routes/leaderboard");
const { authenticateToken } = require("./middleware/auth");
const gameService = require("./services/gameService");
const { init: initDb } = require("./services/dbService");

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

let ollamaProcess = null;

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: corsOptions,
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", authenticateToken, chatRoutes);
app.use("/api/models", authenticateToken, modelRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test Ollama endpoint
app.get("/api/test-ollama", async (req, res) => {
  try {
    const axios = require("axios");
    const response = await axios.get("http://localhost:11434/api/version", { timeout: 5000 });
    res.json({ ok: true, ollama_connected: true, version: response.data });
  } catch (e) {
    res.json({ ok: false, ollama_connected: false, error: e.message });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", ({ username }) => {
    socket.username = username;
    console.log(`${username} registered with socket ${socket.id}`);
  });

  socket.on("joinQueue", () => {
    if (socket.username) {
      gameService.addToQueue(socket.username, socket);
      socket.emit("queued");
    }
  });

  socket.on("leaveQueue", () => {
    if (socket.username) {
      gameService.removeFromQueue(socket.username);
    }
  });

  socket.on("submitPrompt", async ({ matchId, prompt }) => {
    if (socket.username) {
      try {
        await gameService.submitPrompt(matchId, socket.username, prompt);
      } catch (error) {
        socket.emit("errorMsg", { error: error.message });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    gameService.handleDisconnect(socket);
  });
});

// Make io available to routes
app.set("io", io);

server.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ CORS enabled for: ${FRONTEND_ORIGIN}`);
  
  // Initialize database
  initDb().then(() => {
    console.log("✓ Database initialized");
  }).catch(err => {
    console.error("Database initialization failed:", err);
  });
  
  // Check if Ollama is running, if not try to start it
  // checkAndStartOllama(); // Commented out for debugging leaderboard
});

async function checkAndStartOllama() {
  try {
    const axios = require("axios");
    await axios.get("http://localhost:11434/api/version", { timeout: 3000 });
    console.log("✓ Ollama is already running");
  } catch (err) {
    console.log("Starting Ollama...");
    try {
      ollamaProcess = spawn("ollama", ["serve"], {
        stdio: ["ignore", "pipe", "pipe"],
        detached: false
      });
      
      ollamaProcess.stdout.on("data", (data) => {
        console.log(`Ollama: ${data.toString().trim()}`);
      });
      
      ollamaProcess.stderr.on("data", (data) => {
        console.log(`Ollama: ${data.toString().trim()}`);
      });
      
      ollamaProcess.on("close", (code) => {
        console.log(`Ollama process exited with code ${code}`);
        ollamaProcess = null;
      });
      
      console.log("✓ Ollama started");
    } catch (startErr) {
      console.warn("Could not start Ollama automatically:", startErr.message);
    }
  }
}

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  try {
    // Stop Ollama models first
    await stopOllama();
    
    // Kill our spawned Ollama process if it exists
    if (ollamaProcess && !ollamaProcess.killed) {
      console.log("Stopping spawned Ollama process...");
      ollamaProcess.kill("SIGTERM");
      
      // Force kill after 3 seconds if still running
      setTimeout(() => {
        if (ollamaProcess && !ollamaProcess.killed) {
          console.log("Force killing Ollama process...");
          ollamaProcess.kill("SIGKILL");
        }
      }, 3000);
    }
    
    // Try to stop Ollama system-wide
    const { exec } = require("child_process");
    const commands = [
      "pkill -f ollama",
      "killall ollama",
      "taskkill /F /IM ollama.exe"
    ];
    
    for (const cmd of commands) {
      try {
        exec(cmd, (error) => {
          if (!error) console.log(`✓ Executed: ${cmd}`);
        });
      } catch (e) {
        // Continue with next command
      }
    }
    
    console.log("✓ Cleanup completed");
  } catch (err) {
    console.warn("Warning during cleanup:", err.message);
  }
  
  // Close server
  server.close(() => {
    console.log("✓ Server closed");
    process.exit(0);
  });
  
  // Force exit after 5 seconds
  setTimeout(() => {
    console.log("Force exiting...");
    process.exit(1);
  }, 5000);
}

// Handle various shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGQUIT", () => gracefulShutdown("SIGQUIT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});