import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Code2, Users, Zap, Globe, ArrowRight, LogIn } from 'lucide-react';

export default function HomePage() {
  const { user, loginAsGuest, logout } = useAuth();
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState('');
  const [joinId, setJoinId]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [lang, setLang]           = useState('javascript');

  const createSession = async () => {
    setLoading(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        const name = guestName.trim() || undefined;
        await loginAsGuest(name);
        currentUser = { name: guestName };
      }
      const { data } = await api.post('/sessions', { title: 'Untitled', language: lang, ownerId: currentUser?.id });
      navigate(`/editor/${data.sessionId}`);
    } catch (e) {
      alert('Failed to create session: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = () => {
    const id = joinId.trim();
    if (!id) return;
    navigate(`/editor/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-mono font-bold text-xl">{'{ }'}</span>
          <span className="text-white font-semibold text-lg">CodeCollab</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-gray-400 text-sm">Hi, {user.name}</span>
              <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300">Logout</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded">
              <LogIn size={14} /> Login
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-4">
            Code Together,<br />
            <span className="text-blue-400">In Real Time</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            A collaborative code editor with live cursors, syntax highlighting, and instant execution. Like Google Docs, but for code.
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl">
          {!user && (
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-1 block">Your name (optional)</label>
              <input
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 outline-none focus:border-blue-500 text-sm"
                placeholder="Enter your name..."
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-1 block">Language</label>
            <select
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 outline-none focus:border-blue-500 text-sm"
              value={lang} onChange={e => setLang(e.target.value)}>
              {['javascript','typescript','python','java','cpp','c','go','rust','ruby','php'].map(l => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>

          <button onClick={createSession} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded text-sm mb-3">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap size={15} />}
            {loading ? 'Creating...' : 'Create New Session'}
          </button>

          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 outline-none focus:border-blue-500 text-sm"
              placeholder="Paste session ID or link..."
              value={joinId}
              onChange={e => setJoinId(e.target.value.split('/').pop())}
              onKeyDown={e => e.key === 'Enter' && joinSession()}
            />
            <button onClick={joinSession}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded">
              Join <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-2xl w-full">
          {[
            { icon: Users, label: 'Multi-user', desc: 'Live collaboration' },
            { icon: Code2, label: 'Monaco Editor', desc: 'VS Code engine' },
            { icon: Zap, label: 'OT Algorithm', desc: 'Conflict-free edits' },
            { icon: Globe, label: 'Shareable', desc: 'Link-based sessions' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <Icon size={20} className="text-blue-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">{label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
