import { useRef, useState } from 'react';

function formatDetail(doc) {
  if (doc.status === 'processing') return 'Processing…';
  if (doc.status === 'failed') return doc.error || 'Could not process this file';
  const pages = doc.pageCount ? `${doc.pageCount} pages, ` : '';
  return `${pages}${doc.chunkCount} passages`;
}

export default function Sidebar({
  user, docs, selected, locked, onToggle, onUpload, onDeleteDoc, uploadError,
  chats, activeChatId, onOpenChat, onNewChat, onDeleteChat, onLogout,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length) onUpload(files);
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-line bg-surface">
      <div className="px-5 pt-5">
        <p className="font-serif text-xl font-semibold">
          <span className="bg-mark/70 px-1">DocMind</span>
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`mt-5 rounded-lg border border-dashed px-4 py-5 text-center ${dragging ? 'border-brand bg-brand/5' : 'border-line'}`}
        >
          <p className="text-sm text-ink-soft">Drop files here, or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 rounded-md border border-ink px-3 py-1.5 text-sm font-medium hover:bg-ink hover:text-white"
          >
            Choose files
          </button>
          <p className="mt-2 text-xs text-ink-soft">PDF, DOCX, TXT or MD, up to 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            className="sr-only"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
        {uploadError && <p role="alert" className="mt-2 text-sm text-danger">{uploadError}</p>}

        <h2 className="mt-6 text-sm font-semibold">Documents</h2>
        {locked && <p className="mt-1 text-xs text-ink-soft">This chat searches the documents it started with. Start a new chat to change them.</p>}
        {!locked && docs.length > 0 && <p className="mt-1 text-xs text-ink-soft">Tick documents to limit the search. None ticked searches all.</p>}

        {docs.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Nothing uploaded yet.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {docs.map((d) => (
              <li key={d._id} className="group flex items-start gap-2 rounded-md px-1.5 py-1.5 hover:bg-paper">
                <input
                  type="checkbox"
                  id={`doc-${d._id}`}
                  checked={selected.includes(d._id)}
                  disabled={locked || d.status !== 'ready'}
                  onChange={() => onToggle(d._id)}
                  className="mt-1 size-4 accent-brand"
                />
                <label htmlFor={`doc-${d._id}`} className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium">{d.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs ${d.status === 'failed' ? 'text-danger' : 'text-ink-soft'}`}>
                    {d.status === 'processing' && <span className="size-3 animate-spin rounded-full border-2 border-line border-t-brand" />}
                    {formatDetail(d)}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => onDeleteDoc(d)}
                  aria-label={`Delete ${d.name}`}
                  className="rounded p-1 text-ink-soft hover:bg-line hover:text-danger"
                >
                  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M5 6h10M8 6V4h4v2m-6 0 .6 9.5a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Chats</h2>
          <button type="button" onClick={onNewChat} className="text-sm font-medium text-brand underline underline-offset-2">
            New chat
          </button>
        </div>
        {chats.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Your conversations will appear here.</p>
        ) : (
          <ul className="mt-3 space-y-0.5">
            {chats.map((c) => (
              <li key={c._id} className={`flex items-center rounded-md ${activeChatId === c._id ? 'bg-mark/40' : 'hover:bg-paper'}`}>
                <button type="button" onClick={() => onOpenChat(c._id)} className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm">
                  {c.title}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteChat(c._id)}
                  aria-label={`Delete chat ${c.title}`}
                  className="mr-1 rounded px-1.5 py-1 text-ink-soft hover:text-danger"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
        <span className="truncate text-ink-soft">{user.name}</span>
        <button type="button" onClick={onLogout} className="font-medium underline underline-offset-2">
          Sign out
        </button>
      </div>
    </aside>
  );
}
