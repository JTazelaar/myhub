import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="text-6xl">🏳️</span>
      <h1 className="font-display text-3xl font-bold text-green-800">Out of bounds</h1>
      <p className="text-green-700">That page doesn't exist. Let's get you back on the fairway.</p>
      <Link to="/" className="rounded-full bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700">
        Back to Leaderboard
      </Link>
    </div>
  );
}
