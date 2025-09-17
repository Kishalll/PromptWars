// src/routes/auth.js
const express = require("express");
const router = express.Router();
const { createUser, getUser } = require("../services/dbService");

function isValidUsername(name) {
  return typeof name === "string" && /^[A-Za-z0-9_]{3,20}$/.test(name);
}

router.post("/register", async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!isValidUsername(username)) {
      return res.status(400).json({ ok: false, error: "Invalid username. Use 3–20 chars: letters, numbers, underscores." });
    }
    const existing = await getUser(username);
    if (existing) return res.status(409).json({ ok: false, error: "Username already taken." });
    const user = await createUser(username);
    return res.json({ ok: true, user });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!isValidUsername(username)) {
      return res.status(400).json({ ok: false, error: "Invalid username. Use 3–20 chars: letters, numbers, underscores." });
    }
    const user = await getUser(username);
    if (!user) return res.status(404).json({ ok: false, error: "User not found. Please register first." });
    return res.json({ ok: true, user });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
