import { useRef, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';

export default function CollabEditor({
  content, language, editorRef, suppress,
  onMount, onContentChange, onCursorChange,
}) {
  const monacoRef = useRef(null);

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen for content changes
    editor.onDidChangeModelContent((event) => {
      if (!suppress.current) {
        onContentChange && onContentChange(event, editor.getModel());
      }
    });

    // Track cursor position
    editor.onDidChangeCursorPosition(({ position }) => {
      onCursorChange && onCursorChange({
        line: position.lineNumber,
        col: position.column,
        offset: editor.getModel()?.getOffsetAt(position),
      });
    });

    onMount && onMount(editor, monaco);
  }, []);

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={content}
      theme="vs-dark"
      onMount={handleMount}
      onChange={() => {}} // controlled via onDidChangeModelContent
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'off',
        tabSize: 2,
        automaticLayout: true,
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        padding: { top: 16 },
      }}
    />
  );
}
