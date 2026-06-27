import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/players', label: 'Players', end: false },
  { to: '/admin/season', label: 'Season Settings', end: false }
];

function linkClasses(isActive: boolean) {
  return `rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
    isActive ? 'bg-white text-green-800' : 'text-green-100 hover:bg-green-700'
  }`;
}

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <aside className="hidden md:flex md:w-60 md:flex-col md:gap-2 bg-green-800 px-4 py-6">
        <Link to="/" className="mb-6 font-display text-lg font-bold text-white flex items-center gap-2">
          <span>⛳</span> CGT Admin
        </Link>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => linkClasses(isActive)}>
            {l.label}
          </NavLink>
        ))}
        <div className="flex-1" />
        <Link to="/" className="rounded-lg px-4 py-2 text-sm font-bold text-green-200 hover:bg-green-700">
          View Public Site
        </Link>
        <button onClick={handleLogout} className="rounded-lg px-4 py-2 text-left text-sm font-bold text-orange-300 hover:bg-green-700">
          Log Out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between bg-green-800 px-4 py-3">
          <Link to="/" className="font-display text-lg font-bold text-white flex items-center gap-2">
            <span>⛳</span> CGT Admin
          </Link>
          <button onClick={() => setMenuOpen((o) => !o)} className="text-white text-2xl" aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </header>
        {menuOpen && (
          <div className="md:hidden flex flex-col gap-1 bg-green-800 px-4 pb-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `${linkClasses(isActive)} block`}
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-green-200">
              View Public Site
            </Link>
            <button onClick={handleLogout} className="rounded-lg px-4 py-2 text-left text-sm font-bold text-orange-300">
              Log Out
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
