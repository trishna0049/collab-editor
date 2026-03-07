import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCollaboration } from '../hooks/useCollaboration';
import CollabEditor from '../components/Editor/CollabEditor';
import CursorOverlay from '../components/Editor/CursorOverlay';
import Toolbar from '../components/Toolbar/Toolbar';
import OutputPanel from '../components/Toolbar/OutputPanel';
import Sidebar from '../components/Sidebar/Sidebar';
import api from '../services/api';

export default function EditorPage() {
  const { sessionId }  = useParams();
  const { user, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle]         = useState('Untitled');
  const [output, setOutput]       = useState(null);
  const [running, setRunning]     = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [history, setHistory]     = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentUser = user || { id: 'anon', name: 'Guest', isGuest: true };

  const {
    connected, users, cursors, content, language,
    editorRef, suppress,
    handleEditorChange, sendCursor, changeLanguage, saveVersion,
  } = useCollaboration(sessionId, currentUser);

  // Auto login as guest if no user
  useEffect(() => {
    if (!user) loginAsGuest().catch(() => {});
  }, []);

  // Load session metadata
  useEffect(() => {
    api.get(`/sessions/${sessionId}`)
      .then(({ data }) => { setTitle(data.title); })
      .catch(() => {});
  }, [sessionId]);

  // Load history when sidebar is opened
  useEffect(() => {
    api.get(`/sessions/${sessionId}/history`)
      .then(({ data }) => setHistory(data))
      .catch(() => {});
  }, [sessionId]);

  const runCode = useCallback(async () => {
    const code = editorRef.current?.getValue();
    if (!code) return;
    setRunning(true);
    setShowOutput(true);
    setOutput(null);
    try {
      const { data } = await api.post('/execute', { code, language });
      setOutput(data);
    } catch (e) {
      setOutput({ output: '', error: e.response?.data?.error || e.message, status: 'Error' });
    } finally {
      setRunning(false);
    }
  }, [language]);

  const handleSaveVersion = () => {
    const label = prompt('Version label (optional):') || 'Manual save';
    saveVersion(label);
    // Refresh history
    setTimeout(() => {
      api.get(`/sessions/${sessionId}/history`).then(({ data }) => setHistory(data)).catch(() => {});
    }, 500);
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    api.patch(`/sessions/${sessionId}`, { title: newTitle }).catch(() => {});
  };

  const restoreVersion = (versionContent) => {
    if (!confirm('Restore this version? This will replace current content for all users.')) return;
    editorRef.current?.setValue(versionContent);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-950">
      <Toolbar
        language={language}
        onLanguageChange={changeLanguage}
        onRun={runCode}
        onSave={handleSaveVersion}
        connected={connected}
        users={users}
        sessionId={sessionId}
        title={title}
        onTitleChange={handleTitleChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <Sidebar users={users} history={history} onRestoreVersion={restoreVersion} />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Connection banner */}
          {!connected && (
            <div className="bg-yellow-900/50 border-b border-yellow-700 px-3 py-1.5 text-yellow-300 text-xs text-center">
              Reconnecting... Your changes will sync when connection is restored.
            </div>
          )}

          {/* Editor area */}
          <div className={`flex-1 overflow-hidden ${showOutput ? 'h-[60%]' : 'h-full'}`}>
            <CollabEditor
              content={content}
              language={language}
              editorRef={editorRef}
              suppress={suppress}
              onContentChange={handleEditorChange}
              onCursorChange={sendCursor}
            />
            <CursorOverlay editorRef={editorRef} cursors={cursors} users={users} />
          </div>

          {/* Output panel */}
          {showOutput && (
            <div className="h-[40%] min-h-[120px] border-t border-gray-700">
              <OutputPanel
                output={output}
                running={running}
                onClose={() => setShowOutput(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-1 bg-blue-600 text-white text-xs">
        <span className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-300' : 'bg-red-300'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <span>{users.length} collaborator{users.length !== 1 ? 's' : ''}</span>
        <span className="ml-auto font-mono opacity-75">{language}</span>
        <button onClick={() => setSidebarOpen(s => !s)} className="opacity-75 hover:opacity-100">
          {sidebarOpen ? '◀ Hide panel' : '▶ Show panel'}
        </button>
      </div>
    </div>
  );
}
