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
    const versionResponse = await axios.get(`${OLLAMA_BASE_URL}/api/version`, { timeout: 5000 });
    
    // Also check available models
    const modelsResponse = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    const models = modelsResponse.data?.models || [];
    
    res.json({ 
      ok: true, 
      ollama_connected: true, 
      version: versionResponse.data,
      models: models.map(m => ({ name: m.name, size: m.size }))
    });
  } catch (e) {
    console.error("Ollama test error:", e);
    res.json({ 
      ok: false, 
      ollama_connected: false, 
      error: e.message,
      suggestion: "Please start Ollama with 'ollama serve' and ensure required models are installed"
    });
  }
});

module.exports = router;