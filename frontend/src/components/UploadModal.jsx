import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from './Toast';

export default function UploadModal({ onClose }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();
  const toast = useToast();

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'md'].includes(ext)) {
      setError('Only .txt and .md files are supported');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { document, message } = await api.uploadFile(file);
      toast(message || 'File imported successfully');
      onClose();
      navigate(`/doc/${document.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Import file</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div className="modal-body">
          <div
            style={{
              ...s.dropzone,
              borderColor: dragging ? 'var(--gold)' : 'var(--border)',
              background: dragging ? 'var(--gold-pale)' : 'var(--paper-warm)',
            }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span className="spinner" style={{ width: 28, height: 28 }} />
                <span style={{ color: 'var(--ink-muted)', fontSize: 14 }}>Importing...</span>
              </div>
            ) : (
              <>
                <div style={s.uploadIcon}>↑</div>
                <div style={s.dropTitle}>Drop file here or click to browse</div>
                <div style={s.dropSub}>Supported formats: <strong>.txt</strong> and <strong>.md</strong></div>
                <div style={s.dropSub}>Max size: 5MB</div>
              </>
            )}
          </div>

          {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}

          <div style={s.note}>
            <strong>What happens when you import?</strong>
            <br />
            Your file becomes a new editable document. Markdown headings (<code>#</code>, <code>##</code>) and bullet lists (<code>-</code>) are parsed into rich text formatting.
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  dropzone: {
    border: '2px dashed',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, cursor: 'pointer',
    transition: 'all var(--transition)',
    minHeight: 180,
  },
  uploadIcon: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'var(--ink)', color: 'var(--paper)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, marginBottom: 4,
  },
  dropTitle: { fontSize: 15, fontWeight: 500, color: 'var(--ink)' },
  dropSub: { fontSize: 13, color: 'var(--ink-muted)' },
  note: {
    marginTop: 16, padding: '12px 14px',
    background: 'var(--paper-warm)', borderRadius: 'var(--radius)',
    fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.6,
  },
};
