// src/services/dbService.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "..", "database.sqlite");
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function init() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      total_points INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      matches_played INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS matches (
      match_id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1 TEXT NOT NULL,
      player2 TEXT NOT NULL,
      winner TEXT,
      round1 TEXT,
      round2 TEXT,
      round3 TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(player1) REFERENCES users(username),
      FOREIGN KEY(player2) REFERENCES users(username)
    )
  `);
}

async function createUser(username) {
  await run(`INSERT INTO users (username) VALUES (?)`, [username]);
  return getUser(username);
}
async function getUser(username) {
  return await get(`SELECT * FROM users WHERE username = ?`, [username]);
}
async function getOrCreateUser(username) {
  const existing = await getUser(username);
  if (existing) return existing;
  return await createUser(username);
}

async function addMatchAndUpdateStats({ player1, player2, winner, rounds, totals }) {
  const [r1 = {}, r2 = {}, r3 = {}] = rounds || [];
  await run(
    `INSERT INTO matches (player1, player2, winner, round1, round2, round3)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [player1, player2, winner || null, JSON.stringify(r1), JSON.stringify(r2), JSON.stringify(r3)]
  );

  const p1Win = winner === player1 ? 1 : 0;
  const p2Win = winner === player2 ? 1 : 0;
  const p1Loss = winner === player2 ? 1 : 0;
  const p2Loss = winner === player1 ? 1 : 0;

  await run(
    `UPDATE users
     SET total_points = total_points + ?,
         wins = wins + ?,
         losses = losses + ?,
         matches_played = matches_played + 1
     WHERE username = ?`,
    [totals.p1 || 0, p1Win, p1Loss, player1]
  );

  await run(
    `UPDATE users
     SET total_points = total_points + ?,
         wins = wins + ?,
         losses = losses + ?,
         matches_played = matches_played + 1
     WHERE username = ?`,
    [totals.p2 || 0, p2Win, p2Loss, player2]
  );
}

async function leaderboard(limit = 100) {
  return await all(
    `SELECT username, total_points, wins, losses, matches_played
     FROM users
     ORDER BY total_points DESC, wins DESC
     LIMIT ?`,
    [limit]
  );
}

module.exports = {
  init,
  createUser,
  getUser,
  getOrCreateUser,
  addMatchAndUpdateStats,
  leaderboard
};
