import { useEffect, useRef } from 'react';

export default function CursorOverlay({ editorRef, cursors, users }) {
  const overlayRef = useRef({});

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Remove old decorations
    Object.values(overlayRef.current).forEach(d => {
      if (d.dispose) d.dispose();
    });

    // Add decorations for each remote cursor
    Object.entries(cursors).forEach(([userId, { cursor, color }]) => {
      if (!cursor) return;
      const user = users.find(u => u.socketId === userId);
      const name = user?.name || 'User';

      const pos = { lineNumber: cursor.line, column: cursor.col };
      const decorations = editor.deltaDecorations([], [{
        range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
        options: {
          className: 'remote-cursor-placeholder',
          beforeContentClassName: `remote-cursor-line`,
          stickiness: 1,
          zIndex: 100,
          before: {
            content: '\u200B',
            inlineClassName: `remote-cursor-caret`,
          },
          after: {
            content: ` ${name} `,
            inlineClassName: `remote-cursor-name`,
          },
        },
      }]);

      // Inject styles dynamically
      let styleEl = document.getElementById(`cursor-style-${userId}`);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = `cursor-style-${userId}`;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        .remote-cursor-caret { border-left: 2px solid ${color}; margin-left: -1px; animation: cursorBlink 1.2s infinite; }
        .remote-cursor-name { background: ${color}; color: white; font-size: 11px; padding: 0 4px; border-radius: 3px; font-family: sans-serif; }
      `;

      overlayRef.current[userId] = {
        decorations,
        dispose: () => {
          editor.deltaDecorations(decorations, []);
          styleEl?.remove();
        }
      };
    });

    return () => {
      Object.values(overlayRef.current).forEach(d => { if (d.dispose) d.dispose(); });
    };
  }, [cursors, users, editorRef.current]);

  return null; // Decorations are injected into Monaco directly
}
