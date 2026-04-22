import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) { setLoading(false); return; }

    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => { localStorage.removeItem('session_id'); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { sessionId, user } = await api.login(email, password);
    localStorage.setItem('session_id', sessionId);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await api.logout();
    localStorage.removeItem('session_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
