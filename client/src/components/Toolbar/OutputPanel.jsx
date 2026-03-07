import { X, Terminal, Clock, Cpu } from 'lucide-react';

export default function OutputPanel({ output, onClose, running }) {
  return (
    <div className="h-full flex flex-col bg-gray-900 border-t border-gray-700">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-green-400" />
          <span className="text-xs font-semibold text-gray-300">Output</span>
          {output?.time && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={11} /> {output.time}
            </span>
          )}
          {output?.memory && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Cpu size={11} /> {output.memory}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {output?.status && (
            <span className={`text-xs px-2 py-0.5 rounded ${output.status === 'Accepted' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {output.status}
            </span>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-sm">
        {running ? (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            Running...
          </div>
        ) : output ? (
          <>
            {output.error && (
              <pre className="text-red-400 whitespace-pre-wrap mb-2">{output.error}</pre>
            )}
            <pre className="text-green-300 whitespace-pre-wrap">{output.output || '(no output)'}</pre>
          </>
        ) : (
          <span className="text-gray-600">Press Run to execute code</span>
        )}
      </div>
    </div>
  );
}
