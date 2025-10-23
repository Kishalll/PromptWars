// src/services/gameService.js
const { generateTargets, similarity } = require("./ollamaService");
const { similarityToPoints } = require("../utils/scoring");
const { addMatchAndUpdateStats } = require("./dbService");

class GameService {
  constructor() {
    this.queue = [];
    this.matches = new Map();
    this.matchIdCounter = 1;
  }

  addToQueue(username, socket) {
    // Remove if already in queue
    this.removeFromQueue(username);
    
    this.queue.push({ username, socket, joinedAt: Date.now() });
    console.log(`${username} joined queue. Queue size: ${this.queue.length}`);
    
    // Try to match immediately
    this.tryMatch();
  }

  removeFromQueue(username) {
    const index = this.queue.findIndex(p => p.username === username);
    if (index >= 0) {
      this.queue.splice(index, 1);
      console.log(`${username} left queue. Queue size: ${this.queue.length}`);
    }
  }

  tryMatch() {
    if (this.queue.length >= 2) {
      const p1 = this.queue.shift();
      const p2 = this.queue.shift();
      
      this.createMatch(p1, p2);
    }
  }

  async createMatch(p1, p2) {
    const matchId = this.matchIdCounter++;
    const targets = await generateTargets(3);
    
    const match = {
      matchId,
      players: { p1: p1.username, p2: p2.username },
      sockets: { p1: p1.socket, p2: p2.socket },
      round: 1,
      targets,
      currentTarget: targets[0],
      submissions: {},
      scores: { p1: 0, p2: 0 },
      rounds: [],
      createdAt: Date.now(),
      roundTimer: null
    };
    
    this.matches.set(matchId, match);
    
    // Notify both players
    const matchData = {
      matchId,
      players: match.players,
      round: match.round,
      target: match.currentTarget
    };
    
    p1.socket.emit("matchStarted", matchData);
    p2.socket.emit("matchStarted", matchData);
    
    console.log(`Match ${matchId} created: ${p1.username} vs ${p2.username}`);
    
    // Start the first round timer
    this.startRoundTimer(match);
  }

  startRoundTimer(match) {
    // Clear any existing timer
    if (match.roundTimer) {
      clearTimeout(match.roundTimer);
    }
    
    // Set 30-second timer
    match.roundTimer = setTimeout(async () => {
      console.log(`Round timer expired for match ${match.matchId}, round ${match.round}`);
      
      // Auto-submit empty prompts for players who haven't submitted
      if (!match.submissions.p1) {
        match.submissions.p1 = {
          username: match.players.p1,
          prompt: "No response provided",
          submittedAt: Date.now(),
          autoSubmitted: true
        };
      }
      
      if (!match.submissions.p2) {
        match.submissions.p2 = {
          username: match.players.p2,
          prompt: "No response provided", 
          submittedAt: Date.now(),
          autoSubmitted: true
        };
      }
      
      // Evaluate the round
      await this.evaluateRound(match);
    }, 30000); // 30 seconds
  }

  async submitPrompt(matchId, username, prompt) {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error("Match not found");
    }
    
    const playerKey = match.players.p1 === username ? "p1" : "p2";
    if (!playerKey || match.players[playerKey] !== username) {
      throw new Error("Player not in this match");
    }
    
    // Server-side validation to prevent target words in prompts
    const validation = this.validatePrompt(prompt, match.currentTarget);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    match.submissions[playerKey] = {
      username,
      prompt: prompt.trim(),
      submittedAt: Date.now()
    };
    
    console.log(`${username} submitted prompt for match ${matchId}`);
    
    // Check if both players have submitted
    if (match.submissions.p1 && match.submissions.p2) {
      // Clear the timer since both players submitted
      if (match.roundTimer) {
        clearTimeout(match.roundTimer);
        match.roundTimer = null;
      }
      await this.evaluateRound(match);
    }
  }

  validatePrompt(prompt, target) {
    if (!prompt || !target) return { valid: true, error: "" };
    
    const promptLower = prompt.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();
    
    // Split target into individual words (2+ characters to avoid common words)
    const targetWords = targetLower.split(/\s+/).filter(word => word.length >= 2);
    
    // Check if any target words appear in the prompt
    const foundWords = targetWords.filter(word => {
      // Check for exact word matches (with word boundaries)
      const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return wordRegex.test(promptLower);
    });
    
    if (foundWords.length > 0) {
      return {
        valid: false,
        error: `Prompt contains target words: "${foundWords.join('", "')}" - Please describe without using these exact words!`
      };
    }
    
    return { valid: true, error: "" };
  }

  async evaluateRound(match) {
    const { p1, p2 } = match.submissions;
    const target = match.currentTarget;
    
    try {
      // Calculate similarities
      const [sim1, sim2] = await Promise.all([
        similarity(p1.prompt, target),
        similarity(p2.prompt, target)
      ]);
      
      const score1 = similarityToPoints(sim1);
      const score2 = similarityToPoints(sim2);
      
      match.scores.p1 += score1;
      match.scores.p2 += score2;
      
      const roundResult = {
        round: match.round,
        target,
        p1: {
          username: p1.username,
          prompt: p1.prompt,
          score: score1,
          total: match.scores.p1
        },
        p2: {
          username: p2.username,
          prompt: p2.prompt,
          score: score2,
          total: match.scores.p2
        }
      };
      
      match.rounds.push(roundResult);
      
      // Send results to both players
      match.sockets.p1.emit("roundResult", roundResult);
      match.sockets.p2.emit("roundResult", roundResult);
      
      console.log(`Round ${match.round} completed for match ${match.matchId}`);
      
      // Check if game is over
      if (match.round >= 3) {
        await this.endMatch(match);
      } else {
        // Start next round
        match.round++;
        match.currentTarget = match.targets[match.round - 1];
        match.submissions = {};
        
        const nextRoundData = {
          round: match.round,
          target: match.currentTarget
        };
        
        match.sockets.p1.emit("nextRound", nextRoundData);
        match.sockets.p2.emit("nextRound", nextRoundData);
        
        // Start timer for next round
        this.startRoundTimer(match);
      }
    } catch (error) {
      console.error("Error evaluating round:", error);
      match.sockets.p1.emit("errorMsg", { error: "Round evaluation failed" });
      match.sockets.p2.emit("errorMsg", { error: "Round evaluation failed" });
    }
  }

  async endMatch(match) {
    const winner = match.scores.p1 > match.scores.p2 ? match.players.p1 :
                   match.scores.p2 > match.scores.p1 ? match.players.p2 : null;
    
    const gameOverData = {
      matchId: match.matchId,
      winner,
      totals: match.scores,
      rounds: match.rounds
    };
    
    // Send game over to both players
    match.sockets.p1.emit("gameOver", gameOverData);
    match.sockets.p2.emit("gameOver", gameOverData);
    
    // Save to database
    try {
      await addMatchAndUpdateStats({
        player1: match.players.p1,
        player2: match.players.p2,
        winner,
        rounds: match.rounds,
        totals: match.scores
      });
    } catch (error) {
      console.error("Error saving match to database:", error);
    }
    
    // Clean up
    this.matches.delete(match.matchId);
    
    // Clear any remaining timer
    if (match.roundTimer) {
      clearTimeout(match.roundTimer);
    }
    
    console.log(`Match ${match.matchId} ended. Winner: ${winner || "Draw"}`);
  }

  handleDisconnect(socket) {
    // Remove from queue
    const queueIndex = this.queue.findIndex(p => p.socket === socket);
    if (queueIndex >= 0) {
      const player = this.queue[queueIndex];
      this.queue.splice(queueIndex, 1);
      console.log(`${player.username} disconnected from queue`);
    }
    
    // Handle match disconnections
    for (const [matchId, match] of this.matches.entries()) {
      if (match.sockets.p1 === socket || match.sockets.p2 === socket) {
        const disconnectedPlayer = match.sockets.p1 === socket ? match.players.p1 : match.players.p2;
        const remainingSocket = match.sockets.p1 === socket ? match.sockets.p2 : match.sockets.p1;
        
        remainingSocket.emit("errorMsg", { error: `${disconnectedPlayer} disconnected` });
        
        // Clear timer on disconnect
        if (match.roundTimer) {
          clearTimeout(match.roundTimer);
        }
        
        this.matches.delete(matchId);
        console.log(`Match ${matchId} ended due to ${disconnectedPlayer} disconnect`);
        break;
      }
    }
  }
}

module.exports = new GameService();