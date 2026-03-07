import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]     = useState('login'); // 'login' | 'register'
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-sm shadow-xl">
        <div className="text-center mb-6">
          <span className="text-blue-400 font-mono font-bold text-2xl">{'{ }'}</span>
          <h2 className="text-white font-bold text-xl mt-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
        </div>

        {mode === 'register' && (
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">Name</label>
            <input className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 outline-none focus:border-blue-500 text-sm"
              placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
        )}

        <div className="mb-3">
          <label className="text-gray-400 text-xs mb-1 block">Email</label>
          <input type="email" className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 outline-none focus:border-blue-500 text-sm"
            placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>

        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-1 block">Password</label>
          <input type="password" className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 outline-none focus:border-blue-500 text-sm"
            placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>

        {error && <p className="text-red-400 text-xs mb-3 bg-red-900/30 p-2 rounded">{error}</p>}

        <button onClick={handle} disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded text-sm flex items-center justify-center gap-2">
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-blue-400 hover:text-blue-300">
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>

        <div className="text-center mt-3">
          <Link to="/" className="text-gray-600 text-xs hover:text-gray-400">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
