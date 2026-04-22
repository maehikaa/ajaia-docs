import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from './Toast';

export default function ShareModal({ document, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('edit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const toast = useToast();

  useEffect(() => {
    api.getUsers().then(({ users }) => setAllUsers(users)).catch(() => {});
  }, []);

  const suggestions = email.length > 0
    ? allUsers.filter(u =>
        (u.email.includes(email) || u.name.toLowerCase().includes(email.toLowerCase())) &&
        u.email !== document.owner?.email &&
        !document.shares?.some(s => s.email === u.email)
      )
    : [];

  async function handleShare(e) {
    e.preventDefault();
    if (!email) { setError('Enter an email address'); return; }
    setLoading(true);
    setError('');
    try {
      const { sharedWith } = await api.shareDocument(document.id, email, permission);
      toast(`Shared with ${sharedWith.name}`);
      setEmail('');
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(userId, name) {
    try {
      await api.revokeShare(document.id, userId);
      toast(`Removed ${name}`);
      onUpdate();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Share document</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div className="modal-body">

          <div style={s.ownerRow}>
            <div style={s.avatarSm}>{document.owner?.name?.[0]}</div>
            <div>
              <div style={s.ownerName}>{document.owner?.name} <span style={s.ownerYou}>(owner)</span></div>
              <div style={s.ownerEmail}>{document.owner?.email}</div>
            </div>
            <span className="badge badge-owner" style={{ marginLeft: 'auto' }}>Owner</span>
          </div>

          {document.shares?.length > 0 && (
            <div style={s.shareList}>
              {document.shares.map(share => (
                <div key={share.id} style={s.shareRow}>
                  <div style={{ ...s.avatarSm, background: 'var(--teal)' }}>{share.name?.[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.ownerName}>{share.name}</div>
                    <div style={s.ownerEmail}>{share.email}</div>
                  </div>
                  <span className={`badge badge-${share.permission}`}>{share.permission}</span>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRevoke(share.id, share.name)}
                  >Remove</button>
                </div>
              ))}
            </div>
          )}

          <div style={s.divider} />

          <form onSubmit={handleShare} style={s.form}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="Add people by email..."
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div style={s.suggestions}>
                  {suggestions.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      style={s.suggestion}
                      onClick={() => setEmail(u.email)}
                    >
                      <div style={{ ...s.avatarSm, width: 26, height: 26, fontSize: 11 }}>{u.name[0]}</div>
                      <span>{u.name}</span>
                      <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={s.permRow}>
              <select
                value={permission}
                onChange={e => setPermission(e.target.value)}
                style={s.select}
              >
                <option value="edit">Can edit</option>
                <option value="view">Can view</option>
              </select>
              <button type="submit" className="btn btn-gold" disabled={loading || !email}>
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Share'}
              </button>
            </div>

            {error && <p className="error-msg">{error}</p>}
          </form>

          <p style={s.hint}>
            Demo users: alice@ajaia.com, bob@ajaia.com, carol@ajaia.com
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  ownerRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0', borderBottom: '1px solid var(--border-soft)',
    marginBottom: 12,
  },
  shareList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  shareRow: { display: 'flex', alignItems: 'center', gap: 10 },
  avatarSm: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'var(--gold)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600, flexShrink: 0,
  },
  ownerName: { fontSize: 13.5, fontWeight: 500 },
  ownerYou: { fontSize: 12, color: 'var(--ink-muted)', fontWeight: 400 },
  ownerEmail: { fontSize: 12, color: 'var(--ink-muted)' },
  divider: { height: 1, background: 'var(--border-soft)', margin: '12px 0 16px' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  permRow: { display: 'flex', gap: 8 },
  select: {
    flex: 1, padding: '8px 10px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', fontFamily: 'var(--font-sans)',
    fontSize: 13.5, color: 'var(--ink)', background: 'var(--paper-card)',
    outline: 'none', cursor: 'pointer',
  },
  suggestions: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    background: 'var(--paper-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)',
    zIndex: 50, overflow: 'hidden', marginTop: 2,
  },
  suggestion: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '8px 12px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 13.5, textAlign: 'left',
    transition: 'background var(--transition)',
  },
  hint: { fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 },
};
