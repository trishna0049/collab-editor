import { useState } from 'react';
import { Play, Share2, Save, Users, ChevronDown, Check, Copy } from 'lucide-react';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'php', label: 'PHP' },
];

export default function Toolbar({ language, onLanguageChange, onRun, onSave, connected, users, sessionId, title, onTitleChange }) {
  const [langOpen, setLangOpen] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);

  const shareLink = `${window.location.origin}/editor/${sessionId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-700 h-12">
      {/* Logo */}
      <div className="flex items-center gap-1 mr-2">
        <span className="text-blue-400 font-bold text-sm font-mono">{'{ }'}</span>
        <span className="text-gray-300 text-xs font-semibold hidden sm:block">CodeCollab</span>
      </div>

      {/* Title */}
      {editingTitle ? (
        <input
          className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-blue-500 outline-none w-40"
          value={titleInput}
          onChange={e => setTitleInput(e.target.value)}
          onBlur={() => { setEditingTitle(false); onTitleChange && onTitleChange(titleInput); }}
          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
          autoFocus
        />
      ) : (
        <button onClick={() => setEditingTitle(true)}
          className="text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-800 truncate max-w-[140px]" title="Click to rename">
          {title || 'Untitled'}
        </button>
      )}

      <div className="flex-1" />

      {/* Language Selector */}
      <div className="relative">
        <button onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded border border-gray-600">
          {selectedLang.label}
          <ChevronDown size={12} />
        </button>
        {langOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => { onLanguageChange(l.id); setLangOpen(false); }}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-gray-700 text-left ${l.id === language ? 'text-blue-400' : 'text-gray-300'}`}>
                {l.label}
                {l.id === language && <Check size={12} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Run Button */}
      <button onClick={onRun}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded">
        <Play size={12} fill="white" />
        Run
      </button>

      {/* Save Version */}
      <button onClick={onSave}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded" title="Save version">
        <Save size={13} />
      </button>

      {/* Share */}
      <button onClick={copyLink}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded" title="Copy share link">
        {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
        {copied ? 'Copied!' : 'Share'}
      </button>

      {/* Users indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 rounded">
        <Users size={13} className={connected ? 'text-green-400' : 'text-red-400'} />
        <span className="text-xs text-gray-400">{users.length}</span>
        <div className="flex -space-x-1">
          {users.slice(0, 4).map(u => (
            <div key={u.socketId} title={u.name}
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold border border-gray-900"
              style={{ background: u.color }}>
              {u.name?.[0]?.toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
