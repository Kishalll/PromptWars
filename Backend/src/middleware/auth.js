// src/middleware/auth.js
const { getUser } = require("../services/dbService");

async function authenticateToken(req, res, next) {
  try {
    // For this local multiplayer game, we'll use a simple username-based auth
    const username = req.headers.authorization?.replace('Bearer ', '') || 
                    req.body?.username || 
                    req.query?.username;
    
    if (!username) {
      return res.status(401).json({ ok: false, error: "Authentication required" });
    }
    
    const user = await getUser(username);
    if (!user) {
      return res.status(401).json({ ok: false, error: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (e) {
    console.error("Auth error:", e);
    res.status(500).json({ ok: false, error: "Authentication error" });
  }
}

module.exports = { authenticateToken };