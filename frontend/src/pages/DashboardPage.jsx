import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import UploadModal from '../components/UploadModal';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState('all'); // all | owned | shared
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const loadDocs = useCallback(() => {
    api.listDocuments()
      .then(({ owned, shared }) => { setOwned(owned); setShared(shared); })
      .catch(() => toast('Failed to load documents', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  async function createDoc() {
    try {
      const { document } = await api.createDocument({ title: 'Untitled Document' });
      navigate(`/doc/${document.id}`);
    } catch {
      toast('Failed to create document', 'error');
    }
  }

  async function deleteDoc(e, id, title) {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.deleteDocument(id);
      toast('Document deleted');
      loadDocs();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const docs = filter === 'owned' ? owned : filter === 'shared' ? shared : [...owned, ...shared];

  return (
    <div style={s.layout}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.brand}>
            <span style={s.logo}>A</span>
            <span style={s.brandName}>Ajaia Docs</span>
          </div>

          <button className="btn btn-gold" onClick={createDoc} style={s.newBtn}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New document
          </button>

          <button className="btn btn-ghost" onClick={() => setShowUpload(true)} style={{ width: '100%', justifyContent: 'center' }}>
            <span>↑</span> Import file
          </button>
        </div>

        <nav style={s.nav}>
          {[
            { key: 'all', label: 'All documents', count: owned.length + shared.length },
            { key: 'owned', label: 'My documents', count: owned.length },
            { key: 'shared', label: 'Shared with me', count: shared.length },
          ].map(item => (
            <button
              key={item.key}
              style={{
                ...s.navItem,
                background: filter === item.key ? 'var(--paper-warm)' : 'transparent',
                color: filter === item.key ? 'var(--ink)' : 'var(--ink-muted)',
                fontWeight: filter === item.key ? 500 : 400,
              }}
              onClick={() => setFilter(item.key)}
            >
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={s.navCount}>{item.count}</span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.userRow}>
            <div style={s.avatar}>{user?.name?.[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.userName}>{user?.name}</div>
              <div style={s.userEmail}>{user?.email}</div>
            </div>
            <button className="btn-icon btn-sm" onClick={handleLogout} title="Sign out" style={{ fontSize: 16 }}>
              ⏏
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.mainInner}>
          <div style={s.mainHeader}>
            <div>
              <h1 style={s.pageTitle}>
                {filter === 'all' ? 'All documents' : filter === 'owned' ? 'My documents' : 'Shared with me'}
              </h1>
              <p style={s.pageSub}>{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {loading ? (
            <div style={s.center}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
          ) : docs.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📄</div>
              <h3 style={s.emptyTitle}>No documents yet</h3>
              <p style={s.emptySub}>Create a new document or import a .txt or .md file to get started.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={createDoc}>New document</button>
                <button className="btn btn-ghost" onClick={() => setShowUpload(true)}>Import file</button>
              </div>
            </div>
          ) : (
            <div style={s.grid}>
              {docs.map(doc => (
                <div
                  key={doc.id}
                  style={s.card}
                  onClick={() => navigate(`/doc/${doc.id}`)}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                >
                  <div style={s.cardTop}>
                    <div style={s.docIcon}>
                      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                        <path d="M3 0h10l7 7v17H3V0z" fill="var(--paper-warm)" stroke="var(--border)" strokeWidth="1.5"/>
                        <path d="M13 0l7 7h-7V0z" fill="var(--border)" />
                        <line x1="6" y1="12" x2="14" y2="12" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="6" y1="15.5" x2="14" y2="15.5" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="6" y1="19" x2="11" y2="19" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className={`badge badge-${doc.role === 'owner' ? 'owner' : 'shared'}`}>
                        {doc.role === 'owner' ? 'Mine' : 'Shared'}
                      </span>
                      {doc.role !== 'owner' && (
                        <span className={`badge badge-${doc.role}`}>{doc.role}</span>
                      )}
                    </div>
                  </div>
                  <h3 style={s.cardTitle}>{doc.title}</h3>
                  <div style={s.cardMeta}>
                    <span>{doc.role !== 'owner' ? `By ${doc.owner_name}` : 'You'}</span>
                    <span>·</span>
                    <span>{timeAgo(doc.updated_at)}</span>
                  </div>
                  {doc.role === 'owner' && (
                    <button
                      style={s.deleteBtn}
                      onClick={e => deleteDoc(e, doc.id, doc.title)}
                      title="Delete document"
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}

const s = {
  layout: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar: {
    width: 240, flexShrink: 0,
    background: 'var(--paper-card)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarTop: { padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  logo: {
    width: 28, height: 28, borderRadius: 6,
    background: 'var(--ink)', color: 'var(--gold)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-serif)', fontSize: 16, paddingTop: 1,
  },
  brandName: { fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--ink)' },
  newBtn: { width: '100%', justifyContent: 'center', padding: '8px 12px' },
  nav: { padding: '16px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', borderRadius: 'var(--radius)',
    border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
    fontFamily: 'var(--font-sans)', fontSize: 13.5,
    transition: 'all var(--transition)',
  },
  navCount: {
    fontSize: 11.5, color: 'var(--ink-faint)',
    background: 'var(--paper-warm)', borderRadius: 10,
    padding: '1px 7px',
  },
  sidebarBottom: { padding: '12px 16px', borderTop: '1px solid var(--border-soft)' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'var(--gold)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: 13, flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 500, color: 'var(--ink)' },
  userEmail: { fontSize: 11.5, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { flex: 1, overflowY: 'auto', background: 'var(--paper)' },
  mainInner: { maxWidth: 900, margin: '0 auto', padding: '40px 32px' },
  mainHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 },
  pageTitle: { fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, marginBottom: 4 },
  pageSub: { color: 'var(--ink-muted)', fontSize: 13.5 },
  center: { display: 'flex', justifyContent: 'center', paddingTop: 80 },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    paddingTop: 80, textAlign: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, marginBottom: 8 },
  emptySub: { color: 'var(--ink-muted)', maxWidth: 340, fontSize: 14, lineHeight: 1.6 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'var(--paper-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 18px 16px',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    boxShadow: 'var(--shadow-sm)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  docIcon: { flexShrink: 0 },
  cardTitle: {
    fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 400,
    color: 'var(--ink)', marginBottom: 8,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMeta: { display: 'flex', gap: 6, fontSize: 12, color: 'var(--ink-muted)' },
  deleteBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 11, color: 'var(--ink-faint)',
    opacity: 0, transition: 'opacity var(--transition)',
  },
};

// Show delete btn on card hover via CSS injection
const styleEl = document.createElement('style');
styleEl.textContent = `.doc-card:hover .delete-btn { opacity: 1 !important; }`;
document.head.appendChild(styleEl);
