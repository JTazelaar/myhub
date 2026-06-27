import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/Card';

export default function AdminLogin() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
      navigate('/admin');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-700 px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-4xl">⛳</p>
          <h1 className="font-display text-2xl font-bold text-green-900">Admin Login</h1>
          <p className="text-sm text-green-600">Casual Golfers Tour</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
            Password
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
            />
          </label>
          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </Card>
    </div>
  );
}
