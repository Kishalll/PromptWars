// src/components/Header.jsx
import Link from "next/link";

export default function Header({ username }) {
  return (
    <header className="...">
      <div>Prompt Duel</div>
      <div className="flex gap-4">
        <Link href="/" className="text-sm hover:underline">Home</Link>
        <Link href="/leaderboard" className="text-sm hover:underline">Leaderboard</Link>
        <div>{username ? `You: ${username}` : ""}</div>
      </div>
    </header>
  );
}
