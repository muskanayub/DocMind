import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import Insights from '../components/Insights.jsx';

export default function Workspace() {
  const { user, logout } = useAuth();
  const [docs, setDocs] = useState([]);
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState([]); // empty = search every document
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('chat');
  const [libraryOpen, setLibraryOpen] = useState(false); // mobile only
  const [uploadError, setUploadError] = useState('');
  const [askedCount, setAskedCount] = useState(0); // refreshes Insights after each question

  const refreshDocs = useCallback(() => api.get('/documents').then((d) => setDocs(d.documents)).catch(() => {}), []);
  const refreshChats = useCallback(() => api.get('/chat').then((d) => setChats(d.chats)).catch(() => {}), []);

  useEffect(() => {
    refreshDocs();
    refreshChats();
  }, [refreshDocs, refreshChats]);

  // Poll while any document is still being embedded
  const processing = docs.some((d) => d.status === 'processing');
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(refreshDocs, 2500);
    return () => clearInterval(timer);
  }, [processing, refreshDocs]);

  const readyDocs = docs.filter((d) => d.status === 'ready');
  const scopeLabel =
    selected.length === 0
      ? 'all your documents'
      : selected.length === 1
        ? docs.find((d) => d._id === selected[0])?.name || '1 document'
        : `${selected.length} documents`;

  async function handleUpload(files) {
    setUploadError('');
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      try {
        const data = await api.post('/documents', form);
        setDocs((prev) => [data.document, ...prev]);
      } catch (err) {
        setUploadError(`${file.name}: ${err.message}`);
      }
    }
  }

  async function handleDeleteDoc(doc) {
    if (!window.confirm(`Delete "${doc.name}"? Its passages will be removed from search.`)) return;
    try {
      await api.del(`/documents/${doc._id}`);
      setDocs((prev) => prev.filter((d) => d._id !== doc._id));
      setSelected((prev) => prev.filter((id) => id !== doc._id));
    } catch (err) {
      setUploadError(err.message);
    }
  }

  function newChat() {
    setActiveChatId(null);
    setMessages([]);
    setSelected([]);
    setTab('chat');
    setLibraryOpen(false);
  }

  async function openChat(id) {
    try {
      const { chat } = await api.get(`/chat/${id}`);
      setActiveChatId(chat._id);
      setMessages(chat.messages);
      setSelected((chat.documentIds || []).map(String));
      setTab('chat');
      setLibraryOpen(false);
    } catch (err) {
      setUploadError(err.message);
    }
  }

  async function deleteChat(id) {
    try {
      await api.del(`/chat/${id}`);
      setChats((prev) => prev.filter((c) => c._id !== id));
      if (id === activeChatId) newChat();
    } catch (err) {
      setUploadError(err.message);
    }
  }

  async function send(question) {
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setSending(true);
    try {
      const data = await api.post('/chat', { question, chatId: activeChatId, documentIds: selected });
      setActiveChatId(data.chatId);
      setMessages((m) => [...m, data.message]);
      setAskedCount((n) => n + 1);
      refreshChats();
    } catch (err) {
      setMessages((m) => [...m, { role: 'error', content: err.message }]);
    } finally {
      setSending(false);
    }
  }

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const tabClass = (name) =>
    `border-b-2 px-1 pb-2 text-sm font-medium ${tab === name ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'}`;

  return (
    <div className="grid h-dvh md:grid-cols-[320px_1fr]">
      <div className={`${libraryOpen ? 'block' : 'hidden'} min-h-0 md:block`}>
        <Sidebar
          user={user}
          docs={docs}
          selected={selected}
          locked={Boolean(activeChatId)}
          onToggle={toggle}
          onUpload={handleUpload}
          onDeleteDoc={handleDeleteDoc}
          uploadError={uploadError}
          chats={chats}
          activeChatId={activeChatId}
          onOpenChat={openChat}
          onNewChat={newChat}
          onDeleteChat={deleteChat}
          onLogout={logout}
        />
      </div>

      <main className={`${libraryOpen ? 'hidden md:flex' : 'flex'} min-h-0 flex-col`}>
        <header className="flex items-end justify-between gap-4 border-b border-line bg-surface px-4 pt-4 sm:px-8">
          <div role="tablist" className="flex gap-6">
            <button role="tab" aria-selected={tab === 'chat'} className={tabClass('chat')} onClick={() => setTab('chat')}>Chat</button>
            <button role="tab" aria-selected={tab === 'insights'} className={tabClass('insights')} onClick={() => setTab('insights')}>Insights</button>
          </div>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="mb-2 rounded-md border border-line px-3 py-1 text-sm md:hidden"
          >
            Library
          </button>
        </header>

        {tab === 'chat' ? (
          <ChatPanel
            messages={messages}
            sending={sending}
            onSend={send}
            scopeLabel={scopeLabel}
            hasReadyDocs={readyDocs.length > 0}
          />
        ) : (
          <Insights refreshKey={askedCount + docs.length} />
        )}
      </main>
    </div>
  );
}
