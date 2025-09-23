const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { spawn, exec } = require("child_process");
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
app.use("/api/chat", chatRoutes);
app.use("/api/models", modelRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    server: "Backend Core Online",
    port: PORT
  });
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

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Prompt Wars Backend Server", 
    status: "online",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      chat: "/api/chat", 
      models: "/api/models",
      leaderboard: "/api/leaderboard",
      testOllama: "/api/test-ollama"
    }
  });
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Server accessible at http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for: ${FRONTEND_ORIGIN}`);
  
  // Initialize database
  initDb().then(() => {
    console.log("✓ Database initialized");
  }).catch(err => {
    console.error("Database initialization failed:", err);
  });
  
  // Check if Ollama is running, if not try to start it
  checkAndStartOllama();
});

async function checkAndStartOllama() {
  try {
    const axios = require("axios");
    const response = await axios.get("http://localhost:11434/api/version", { timeout: 5000 });
    console.log("✓ Ollama is already running");
    console.log("✓ Ollama version:", response.data?.version || "unknown");
    
    // Try to pull required models
    await ensureModelsAvailable();
  } catch (err) {
    console.log("⚠ Ollama not running. Attempting to start...");
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
      
      // Wait a bit for Ollama to start
      setTimeout(async () => {
        try {
          await axios.get("http://localhost:11434/api/version", { timeout: 5000 });
          console.log("✓ Ollama started successfully");
          await ensureModelsAvailable();
        } catch (e) {
          console.warn("⚠ Ollama may not have started properly");
        }
      }, 3000);
      
      console.log("✓ Ollama started");
    } catch (startErr) {
      console.warn("Could not start Ollama automatically:", startErr.message);
      console.warn("Please start Ollama manually: ollama serve");
    }
  }
}

async function ensureModelsAvailable() {
  const axios = require("axios");
  const requiredModels = ["llama3.2", "nomic-embed-text"];
  
  try {
    const response = await axios.get("http://localhost:11434/api/tags", { timeout: 10000 });
    const installedModels = response.data?.models?.map(m => m.name) || [];
    
    for (const model of requiredModels) {
      const isInstalled = installedModels.some(installed => installed.includes(model));
      if (!isInstalled) {
        console.log(`⚠ Model ${model} not found. Please install it manually:`);
        console.log(`   ollama pull ${model}`);
      } else {
        console.log(`✓ Model ${model} is available`);
      }
    }
  } catch (err) {
    console.warn("Could not check installed models:", err.message);
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