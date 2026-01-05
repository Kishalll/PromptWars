// src/utils/scoring.js
function similarityToPoints(sim) {
  // sim expected 0..1
  if (sim >= 1.0) return 50;
  if (sim >= 0.75) return 30;
  if (sim >= 0.50) return 20;
  if (sim >= 0.25) return 10;
  return 0;
}

module.exports = { similarityToPoints };
