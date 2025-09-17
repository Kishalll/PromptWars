// src/pages/index.js
import Link from "next/link";
import Header from "../components/Header";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Prompt Duel</h1>
        <p className="mb-6 text-gray-600">Battle your friend in 3 rounds — AI gives a hidden target, both players write prompts. Closest prompts score points.</p>

        <div className="space-x-4">
          <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded shadow inline-block">Play</Link>
          <Link href="/leaderboard" className="px-6 py-3 border rounded inline-block">View Leaderboard</Link>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-2">How to play</h2>
          <ol className="list-decimal list-inside text-gray-700">
            <li>Enter a unique username (register) or login if you already have one.</li>
            <li>Get auto-matched with an opponent.</li>
            <li>Submit prompts for 3 AI-generated targets.</li>
            <li>Highest total points after 3 rounds wins.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
