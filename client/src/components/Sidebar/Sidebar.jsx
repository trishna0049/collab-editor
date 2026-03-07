import { useState } from 'react';
import { Users, History, ChevronRight, ChevronDown } from 'lucide-react';

export default function Sidebar({ users, history, onRestoreVersion }) {
  const [tab, setTab] = useState('users');
  const [openVer, setOpenVer] = useState(null);

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-700 flex flex-col text-xs">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { id: 'users', icon: Users, label: 'People' },
          { id: 'history', icon: History, label: 'History' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium ${tab === id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {tab === 'users' && (
          <div className="space-y-1">
            <p className="text-gray-500 uppercase tracking-wider text-[10px] px-1 mb-2">
              {users.length} online
            </p>
            {users.map(u => (
              <div key={u.socketId} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ background: u.color }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-gray-300 truncate">{u.name}</p>
                  {u.isGuest && <p className="text-gray-600 text-[10px]">Guest</p>}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-1">
            <p className="text-gray-500 uppercase tracking-wider text-[10px] px-1 mb-2">
              {history.length} versions
            </p>
            {history.length === 0 && (
              <p className="text-gray-600 px-1">No saved versions yet. Use Save in the toolbar.</p>
            )}
            {history.map((v, i) => (
              <div key={i} className="border border-gray-700 rounded overflow-hidden">
                <button onClick={() => setOpenVer(openVer === i ? null : i)}
                  className="flex items-center gap-1 w-full px-2 py-1.5 hover:bg-gray-800 text-gray-400">
                  {openVer === i ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  <span className="truncate flex-1 text-left">{v.label || `v${v.revision}`}</span>
                </button>
                {openVer === i && (
                  <div className="px-3 pb-2 bg-gray-800">
                    <p className="text-gray-500 mb-1">{new Date(v.savedAt).toLocaleString()}</p>
                    <button onClick={() => onRestoreVersion && onRestoreVersion(v.content)}
                      className="text-blue-400 hover:text-blue-300">Restore</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
