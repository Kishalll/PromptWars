// src/routes/leaderboard.js
const express = require("express");
const router = express.Router();
const { leaderboard } = require("../services/dbService");

router.get("/", async (req, res) => {
  try {
    const rows = await leaderboard(100);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("Leaderboard error:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
