import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Leaderboard' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/results', label: 'Past Results' }
];

function linkClasses(isActive: boolean) {
  return `rounded-full px-4 py-2 text-sm font-bold transition-colors ${
    isActive ? 'bg-white text-green-700' : 'text-white hover:bg-white/15'
  }`;
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-green-600 sticky top-0 z-20 shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="font-display text-xl font-bold text-white flex items-center gap-2">
          <span>⛳</span> Casual Golfers Tour
        </NavLink>

        <div className="hidden md:flex items-center gap-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => linkClasses(isActive)}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/admin" className="rounded-full px-4 py-2 text-sm font-bold text-green-100 hover:text-white">
            Admin
          </NavLink>
        </div>

        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden flex flex-col gap-1 px-4 pb-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) => `${linkClasses(isActive)} block`}
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink
            to="/admin"
            onClick={() => setOpen(false)}
            className="block rounded-full px-4 py-2 text-sm font-bold text-green-100"
          >
            Admin
          </NavLink>
        </div>
      )}
    </nav>
  );
}
