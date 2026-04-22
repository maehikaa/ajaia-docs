const BASE = import.meta.env.VITE_API_URL || '/api';

function getSession() {
  return localStorage.getItem('session_id');
}

async function request(path, options = {}) {
  const sessionId = getSession();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId ? { 'x-session-id': sessionId } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  me: () => request('/auth/me'),

  getUsers: () => request('/auth/users'),

  // Documents
  listDocuments: () => request('/documents'),

  getDocument: (id) => request(`/documents/${id}`),

  createDocument: (data = {}) =>
    request('/documents', { method: 'POST', body: JSON.stringify(data) }),

  updateDocument: (id, data) =>
    request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteDocument: (id) =>
    request(`/documents/${id}`, { method: 'DELETE' }),

  // Sharing
  shareDocument: (id, email, permission = 'edit') =>
    request(`/documents/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    }),

  revokeShare: (docId, userId) =>
    request(`/documents/${docId}/share/${userId}`, { method: 'DELETE' }),

  // Upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const sessionId = getSession();
    return fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: { ...(sessionId ? { 'x-session-id': sessionId } : {}) },
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    });
  },
};
