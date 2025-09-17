// src/pages/leaderboard.js
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { fetchLeaderboard } from "../lib/api";

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then(res => {
      setData(res.data.data || []);
    }).catch(e => {
      console.error(e);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={typeof window !== 'undefined' ? localStorage.getItem('pd_username') : null} />
      <main className="flex-1 container mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>

        {loading ? <div>Loading...</div> :
          <div className="bg-white p-4 rounded shadow">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Total Points</th>
                  <th className="px-3 py-2">Wins</th>
                  <th className="px-3 py-2">Losses</th>
                  <th className="px-3 py-2">Matches</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r.username} className="border-t">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{r.username}</td>
                    <td className="px-3 py-2">{r.total_points}</td>
                    <td className="px-3 py-2">{r.wins}</td>
                    <td className="px-3 py-2">{r.losses}</td>
                    <td className="px-3 py-2">{r.matches_played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </main>
    </div>
  );
}

