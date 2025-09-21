// src/routes/chat.js
const express = require("express");
const router = express.Router();
const { similarity } = require("../services/ollamaService");
const { similarityToPoints } = require("../utils/scoring");

router.post("/similarity", async (req, res) => {
  try {
    const { prompt, target } = req.body;
    if (!prompt || !target) {
      return res.status(400).json({ ok: false, error: "Prompt and target required" });
    }
    
    const sim = await similarity(prompt, target);
    const points = similarityToPoints(sim);
    
    res.json({ 
      ok: true, 
      similarity: sim, 
      points,
      prompt,
      target 
    });
  } catch (e) {
    console.error("Similarity error:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;