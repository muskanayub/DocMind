import { useEffect, useRef, useState } from 'react';
import Answer from './Answer.jsx';

const STARTERS = ['Summarize the main points', 'What are the key dates or deadlines?', 'List any action items'];

function Sources({ citations, open, onOpen }) {
  const [showAll, setShowAll] = useState(false);
  const cited = citations.filter((c) => c.cited);
  const visible = showAll || open ? citations : cited;
  const hiddenCount = citations.length - cited.length;
  const active = citations.find((c) => c.n === open);

  if (!citations.length) return null;

  return (
    <div className="mt-4 border-t border-line pt-3">
      <ul className="flex flex-wrap gap-2">
        {(showAll ? citations : visible.length ? visible : []).map((c) => (
          <li key={c.n}>
            <button
              type="button"
              onClick={() => onOpen(open === c.n ? null : c.n)}
              aria-expanded={open === c.n}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm ${
                open === c.n ? 'border-ink bg-ink text-white' : 'border-line bg-surface hover:border-ink-soft'
              } ${c.cited ? '' : 'opacity-70'}`}
            >
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-mark px-1 text-[11px] font-semibold text-ink">
                {c.n}
              </span>
              <span className="max-w-48 truncate">
                {c.documentName}
                {c.page ? `, page ${c.page}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 text-sm text-ink-soft underline underline-offset-2">
          {showAll ? 'Show only cited passages' : `Show all ${citations.length} passages searched`}
        </button>
      )}

      {active && (
        <blockquote className="mt-3 border-l-4 border-mark bg-mark/25 px-4 py-3 font-serif text-[15px] leading-relaxed">
          {active.text}
        </blockquote>
      )}
    </div>
  );
}

function Message({ message }) {
  const [open, setOpen] = useState(null);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-lg bg-ink px-4 py-2.5 whitespace-pre-wrap text-white">{message.content}</p>
      </div>
    );
  }
  if (message.role === 'error') {
    return (
      <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
        {message.content}
      </p>
    );
  }
  return (
    <div className="max-w-[46rem] rounded-lg border border-line bg-surface px-5 py-4">
      <Answer text={message.content} onCite={setOpen} />
      <Sources citations={message.citations || []} open={open} onOpen={setOpen} />
    </div>
  );
}

export default function ChatPanel({ messages, sending, onSend, scopeLabel, hasReadyDocs }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  function submit(e) {
    e?.preventDefault();
    const q = text.trim();
    if (!q || sending) return;
    setText('');
    onSend(q);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md">
            <h2 className="font-serif text-2xl font-semibold">
              {hasReadyDocs ? `Ask about ${scopeLabel}` : 'Add a document to begin'}
            </h2>
            <p className="mt-2 text-ink-soft">
              {hasReadyDocs
                ? 'Every answer points back to the passages it came from, so you can check it.'
                : 'Upload a PDF, Word file, or text file in the library. You can ask questions once it shows as ready.'}
            </p>
            {hasReadyDocs && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => onSend(s)}
                      className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm hover:border-ink-soft"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((m, i) => (
              <Message key={i} message={m} />
            ))}
            {sending && (
              <p className="flex items-center gap-2 text-sm text-ink-soft" role="status">
                <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand" />
                Searching {scopeLabel}…
              </p>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-line bg-surface px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <label className="sr-only" htmlFor="question">
            Your question
          </label>
          <textarea
            id="question"
            rows={1}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e);
            }}
            placeholder={hasReadyDocs ? 'Ask a question' : 'Upload a document first'}
            disabled={!hasReadyDocs}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-md border border-line bg-paper px-3 py-2.5 text-[15px] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending || !hasReadyDocs}
            className="h-11 rounded-md bg-ink px-5 font-medium text-white hover:bg-ink/90 disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
