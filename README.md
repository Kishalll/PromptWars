# PromptWars

A real-time multiplayer game where players compete to write the most accurate prompts. It uses a local LLM to evaluate how semantically close a player's prompt is to a target description.

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: SQLite
- **AI**: Ollama (running `llama3.2` and `nomic-embed-text`)

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Ollama](https://ollama.ai/)

### 1. Prepare Ollama
Make sure Ollama is running and has the required models:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
ollama serve
```

### 2. Backend
Open a terminal in the `backend` directory:

```bash
cd backend
npm install
npm start
```
The server will run on port 4000.

### 3. Frontend
Open a new terminal in the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:3000`.

## How to Play

1. Enter a username to join the lobby.
2. Wait for an opponent or open a second tab to play against yourself.
3. During the round, you will be given a target subject (e.g., "A futuristic city").
4. Write a prompt that describes the subject. You have 30 seconds.
5. The local AI model evaluates your prompt against the target. The highest similarity score wins the round.

## LAN Play

To play with others on the same network:

1. Find your local IP address (`ipconfig` on Windows, `ifconfig` on Linux/Mac).
2. Start the frontend with the host flag:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
3. Have other players connect to `http://<YOUR_IP>:3000`.
