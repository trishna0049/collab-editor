import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { OTClient, TextOperation } from '../ot/otClient';

export function useCollaboration(sessionId, user) {
  const [connected, setConnected]   = useState(false);
  const [users, setUsers]           = useState([]);
  const [cursors, setCursors]       = useState({});
  const [content, setContent]       = useState('');
  const [revision, setRevision]     = useState(0);
  const [language, setLanguage]     = useState('javascript');

  const editorRef  = useRef(null);
  const otClient   = useRef(null);
  const suppress   = useRef(false); // prevent echo when applying remote ops
  const socket     = getSocket();

  // Build a TextOperation from a Monaco content change event
  const buildOperation = useCallback((event, model) => {
    const docLen = model.getValue().length;
    const op = new TextOperation();
    // Monaco gives us changes sorted; we rebuild from scratch
    // Simple approach: compute full diff (works for most cases)
    let offset = 0;
    for (const change of event.changes.sort((a, b) => a.rangeOffset - b.rangeOffset)) {
      const retain = change.rangeOffset - offset;
      if (retain > 0) op.ops.push(retain);
      if (change.rangeLength > 0) op.ops.push(-change.rangeLength);
      if (change.text) op.ops.push(change.text);
      offset = change.rangeOffset + change.rangeLength;
    }
    // Retain rest
    const rest = docLen - offset + (event.changes.reduce((s, c) => s + c.rangeLength, 0)) - (event.changes.reduce((s, c) => s + c.text.length, 0));
    if (rest > 0) op.ops.push(rest);

    // Calculate baseLen and targetLen
    op.baseLen = docLen - event.changes.reduce((s, c) => s + c.text.length, 0) + event.changes.reduce((s, c) => s + c.rangeLength, 0);
    op.targetLen = docLen;
    return op;
  }, []);

  // Apply a TextOperation to the Monaco editor
  const applyOpToEditor = useCallback((op) => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    suppress.current = true;
    let idx = 0;
    const edits = [];
    for (const component of op.ops) {
      if (typeof component === 'string') {
        const pos = model.getPositionAt(idx);
        edits.push({ range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column }, text: component });
        idx += 0; // insert doesn't advance source index
      } else if (component > 0) {
        idx += component;
      } else {
        const startPos = model.getPositionAt(idx);
        const endPos   = model.getPositionAt(idx + Math.abs(component));
        edits.push({ range: { startLineNumber: startPos.lineNumber, startColumn: startPos.column, endLineNumber: endPos.lineNumber, endColumn: endPos.column }, text: '' });
        idx += Math.abs(component);
      }
    }
    if (edits.length > 0) {
      model.applyEdits(edits);
    }
    suppress.current = false;
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-session', { sessionId, user });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('init-document', ({ content: doc, revision: rev, users: u, language: lang }) => {
      otClient.current = new OTClient(rev);
      otClient.current.onSend = (r, op) => socket.emit('operation', { sessionId, revision: r, operation: op });
      otClient.current.onApply = applyOpToEditor;

      suppress.current = true;
      setContent(doc);
      suppress.current = false;
      setRevision(rev);
      setUsers(u || []);
      if (lang) setLanguage(lang);
    });

    socket.on('operation', ({ operation }) => {
      otClient.current?.applyServer(operation);
    });

    socket.on('ack', () => {
      otClient.current?.serverAck();
    });

    socket.on('cursor-update', ({ userId, cursor, color }) => {
      setCursors(prev => ({ ...prev, [userId]: { cursor, color } }));
    });

    socket.on('user-joined', (u) => {
      setUsers(prev => [...prev.filter(x => x.socketId !== u.socketId), u]);
    });

    socket.on('user-left', ({ userId }) => {
      setUsers(prev => prev.filter(u => u.socketId !== userId));
      setCursors(prev => { const next = { ...prev }; delete next[userId]; return next; });
    });

    socket.on('language-changed', ({ language: lang }) => setLanguage(lang));

    return () => {
      socket.off('connect'); socket.off('disconnect');
      socket.off('init-document'); socket.off('operation'); socket.off('ack');
      socket.off('cursor-update'); socket.off('user-joined'); socket.off('user-left');
      socket.off('language-changed');
      socket.disconnect();
    };
  }, [sessionId]);

  const handleEditorChange = useCallback((event, model) => {
    if (suppress.current || !otClient.current) return;
    const op = buildOperation(event, model);
    if (op.ops.length > 0) otClient.current.applyClient(op);
  }, [buildOperation]);

  const sendCursor = useCallback((cursor) => {
    socket.emit('cursor-change', { sessionId, cursor });
  }, [sessionId]);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    socket.emit('language-change', { sessionId, language: lang });
  }, [sessionId]);

  const saveVersion = useCallback((label) => {
    socket.emit('save-version', { sessionId, label });
  }, [sessionId]);

  return {
    connected, users, cursors, content, revision, language,
    editorRef, suppress,
    handleEditorChange, sendCursor, changeLanguage, saveVersion,
  };
}
