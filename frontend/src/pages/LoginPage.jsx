import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      toast('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(demoEmail) {
    setEmail(demoEmail);
    setPassword('demo123');
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <span style={styles.logo}>A</span>
          <span style={styles.brandName}>Ajaia Docs</span>
        </div>
        <div style={styles.tagline}>
          <h1 style={styles.headline}>Documents<br /><em>that think</em><br />with you.</h1>
          <p style={styles.sub}>A lightweight collaborative editor built for teams that move fast.</p>
        </div>
        <div style={styles.features}>
          {['Rich text editing', 'File import', 'Team sharing', 'Instant persistence'].map(f => (
            <div key={f} style={styles.feature}>
              <span style={styles.featureDot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Sign in</h2>
          <p style={styles.cardSub}>Use a demo account to explore</p>

          <div style={styles.demoAccounts}>
            {[
              { email: 'alice@ajaia.com', name: 'Alice Chen', color: '#c9973a' },
              { email: 'bob@ajaia.com', name: 'Bob Patel', color: '#2a6e6a' },
              { email: 'carol@ajaia.com', name: 'Carol Kim', color: '#5a4a8a' },
            ].map(u => (
              <button
                key={u.email}
                onClick={() => quickLogin(u.email)}
                style={{
                  ...styles.demoBtn,
                  borderColor: email === u.email ? u.color : 'var(--border)',
                  background: email === u.email ? `${u.color}10` : 'transparent',
                }}
              >
                <span style={{ ...styles.avatar, background: u.color }}>{u.name[0]}</span>
                <div>
                  <div style={styles.demoName}>{u.name}</div>
                  <div style={styles.demoEmail}>{u.email}</div>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@ajaia.com"
                autoComplete="email"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="demo123"
                autoComplete="current-password"
              />
              <p className="info-msg">All demo accounts use password: <strong>demo123</strong></p>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
  },
  left: {
    flex: 1,
    background: 'var(--ink)',
    color: 'var(--paper)',
    padding: '48px 56px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: {
    width: 36, height: 36,
    background: 'var(--gold)',
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-serif)',
    fontSize: 20,
    color: '#fff',
    lineHeight: 1,
    textAlign: 'center',
    paddingTop: 2,
  },
  brandName: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--paper)' },
  tagline: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  headline: {
    fontFamily: 'var(--font-serif)',
    fontSize: 52,
    fontWeight: 400,
    lineHeight: 1.15,
    color: 'var(--paper)',
    marginBottom: 20,
  },
  sub: { fontSize: 16, color: 'rgba(250,248,244,0.6)', maxWidth: 360, lineHeight: 1.7 },
  features: { display: 'flex', flexDirection: 'column', gap: 10 },
  feature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(250,248,244,0.7)' },
  featureDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 },
  right: {
    width: 440,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    background: 'var(--paper)',
  },
  card: { width: '100%', maxWidth: 360 },
  cardTitle: { fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, marginBottom: 4 },
  cardSub: { color: 'var(--ink-muted)', fontSize: 13.5, marginBottom: 24 },
  demoAccounts: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  demoBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 150ms',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 600, fontSize: 13, flexShrink: 0,
  },
  demoName: { fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' },
  demoEmail: { fontSize: 12, color: 'var(--ink-muted)' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)' },
};
