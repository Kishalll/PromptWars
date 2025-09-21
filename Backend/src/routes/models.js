// src/routes/models.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    res.json({ ok: true, models: response.data.models || [] });
  } catch (e) {
    console.error("Models error:", e);
    res.status(500).json({ ok: false, error: "Could not fetch models" });
  }
});

router.get("/test-ollama", async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/version`, { timeout: 5000 });
    res.json({ ok: true, ollama_connected: true, version: response.data });
  } catch (e) {
    console.error("Ollama test error:", e);
    res.json({ ok: false, ollama_connected: false, error: e.message });
  }
});

module.exports = router;