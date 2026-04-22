import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import EditorToolbar from '../components/EditorToolbar';
import ShareModal from '../components/ShareModal';
import './EditorPage.css';

const AUTOSAVE_DELAY = 1500;

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('saved'); // saved | saving | unsaved
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState('');
  const saveTimer = useRef(null);
  const titleRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: '',
    editable: false,
    onUpdate: ({ editor }) => {
      setSaveState('unsaved');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveContent(editor.getJSON());
      }, AUTOSAVE_DELAY);
    },
  });

  const loadDoc = useCallback(async () => {
    try {
      const { document } = await api.getDocument(id);
      setDoc(document);
      setTitleValue(document.title);
      editor?.commands.setContent(document.content || { type: 'doc', content: [{ type: 'paragraph' }] });
      editor?.setEditable(document.role === 'owner' || document.role === 'edit');
      setSaveState('saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, editor]);

  useEffect(() => { if (editor) loadDoc(); }, [editor, loadDoc]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  async function saveContent(content) {
    setSaveState('saving');
    try {
      await api.updateDocument(id, { content });
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  }

  async function saveTitle() {
    const trimmed = titleValue.trim() || 'Untitled Document';
    setTitleValue(trimmed);
    setEditingTitle(false);
    if (trimmed === doc.title) return;
    try {
      await api.updateDocument(id, { title: trimmed });
      setDoc(d => ({ ...d, title: trimmed }));
      toast('Title saved');
    } catch {
      toast('Failed to save title', 'error');
      setTitleValue(doc.title);
    }
  }

  const canEdit = doc?.role === 'owner' || doc?.role === 'edit';
  const isOwner = doc?.role === 'owner';

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>{error}</h2>
      <Link to="/" className="btn btn-ghost">Back to documents</Link>
    </div>
  );

  return (
    <div style={s.layout}>
      {/* Top bar */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <Link to="/" style={s.backBtn} title="Back to documents">
            <span style={s.backLogo}>A</span>
          </Link>
          <div style={s.titleArea}>
            {editingTitle && canEdit ? (
              <input
                ref={titleRef}
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') titleRef.current?.blur(); if (e.key === 'Escape') { setTitleValue(doc.title); setEditingTitle(false); } }}
                style={s.titleInput}
                autoFocus
              />
            ) : (
              <h1
                style={{ ...s.title, cursor: canEdit ? 'text' : 'default' }}
                onClick={() => canEdit && setEditingTitle(true)}
                title={canEdit ? 'Click to rename' : ''}
              >
                {doc?.title || 'Untitled Document'}
              </h1>
            )}
            <div style={s.docMeta}>
              <span className={`badge badge-${doc?.role === 'owner' ? 'owner' : doc?.role}`}>
                {doc?.role === 'owner' ? 'Owner' : doc?.role === 'edit' ? 'Can edit' : 'View only'}
              </span>
              <span style={s.saveStatus}>
                {saveState === 'saving' && <><span className="spinner" style={{ width: 10, height: 10 }} /> Saving...</>}
                {saveState === 'saved' && '✓ Saved'}
                {saveState === 'unsaved' && '● Unsaved'}
              </span>
              {doc?.role !== 'owner' && (
                <span style={s.ownerHint}>by {doc?.owner?.name}</span>
              )}
            </div>
          </div>
        </div>

        <div style={s.headerRight}>
          {isOwner && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowShare(true)}>
              Share
            </button>
          )}
          {doc?.shares?.length > 0 && (
            <div style={s.sharedWith}>
              {doc.shares.slice(0, 3).map(share => (
                <div key={share.id} style={{ ...s.sharedAvatar, background: 'var(--teal)' }} title={share.name}>
                  {share.name[0]}
                </div>
              ))}
              {doc.shares.length > 3 && (
                <div style={s.sharedMore}>+{doc.shares.length - 3}</div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Toolbar */}
      {canEdit && <EditorToolbar editor={editor} />}

      {/* Editor area */}
      <div style={s.editorArea}>
        <div style={s.page}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {showShare && (
        <ShareModal
          document={doc}
          onClose={() => setShowShare(false)}
          onUpdate={loadDoc}
        />
      )}
    </div>
  );
}

const s = {
  layout: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--paper)' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', height: 56, flexShrink: 0,
    background: 'var(--paper-card)', borderBottom: '1px solid var(--border)',
    gap: 16,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 },
  backBtn: { textDecoration: 'none', flexShrink: 0 },
  backLogo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 6,
    background: 'var(--ink)', color: 'var(--gold)',
    fontFamily: 'var(--font-serif)', fontSize: 16,
  },
  titleArea: { minWidth: 0, flex: 1 },
  title: {
    fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 400,
    color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    display: 'block',
  },
  titleInput: {
    fontFamily: 'var(--font-serif)', fontSize: 17,
    border: 'none', outline: 'none',
    borderBottom: '2px solid var(--gold)',
    background: 'transparent', width: '100%', padding: '0 0 2px',
    borderRadius: 0, boxShadow: 'none',
  },
  docMeta: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 },
  saveStatus: { fontSize: 11.5, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 4 },
  ownerHint: { fontSize: 11.5, color: 'var(--ink-faint)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  sharedWith: { display: 'flex', alignItems: 'center' },
  sharedAvatar: {
    width: 26, height: 26, borderRadius: '50%',
    color: '#fff', fontSize: 11, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginLeft: -6, border: '2px solid var(--paper-card)',
  },
  sharedMore: {
    width: 26, height: 26, borderRadius: '50%',
    background: 'var(--paper-warm)', color: 'var(--ink-muted)',
    fontSize: 10, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginLeft: -6, border: '2px solid var(--paper-card)',
  },
  editorArea: { flex: 1, overflowY: 'auto', padding: '48px 24px' },
  page: {
    maxWidth: 720, margin: '0 auto',
    background: 'var(--paper-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: '56px 72px',
    minHeight: 'calc(100vh - 200px)',
  },
};
