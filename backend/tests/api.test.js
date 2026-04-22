const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use in-memory test database
process.env.DB_PATH = path.join(__dirname, '../data/test.db');

const app = require('../src/index');

let aliceSession, bobSession, docId;

beforeAll(async () => {
  // Login as alice
  const aliceRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@ajaia.com', password: 'demo123' });
  aliceSession = aliceRes.body.sessionId;

  // Login as bob
  const bobRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'bob@ajaia.com', password: 'demo123' });
  bobSession = bobRes.body.sessionId;
});

afterAll(() => {
  // Clean up test db
  const testDbPath = process.env.DB_PATH;
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Auth', () => {
  test('valid login returns sessionId and user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@ajaia.com', password: 'demo123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessionId');
    expect(res.body.user.email).toBe('alice@ajaia.com');
  });

  test('invalid password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@ajaia.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('missing auth header returns 401', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });
});

describe('Documents', () => {
  test('create a new document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('x-session-id', aliceSession)
      .send({ title: 'Test Document', content: { type: 'doc', content: [] } });

    expect(res.status).toBe(201);
    expect(res.body.document.title).toBe('Test Document');
    docId = res.body.document.id;
  });

  test('list documents returns owned docs', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('x-session-id', aliceSession);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.owned)).toBe(true);
    expect(res.body.owned.some(d => d.id === docId)).toBe(true);
  });

  test('update document title and content', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set('x-session-id', aliceSession)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe('Updated Title');
  });

  test('bob cannot access alice document without share', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('x-session-id', bobSession);
    expect(res.status).toBe(403);
  });
});

describe('Sharing', () => {
  test('alice can share document with bob', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('x-session-id', aliceSession)
      .send({ email: 'bob@ajaia.com', permission: 'edit' });

    expect(res.status).toBe(200);
    expect(res.body.sharedWith.email).toBe('bob@ajaia.com');
  });

  test('bob can access shared document', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('x-session-id', bobSession);
    expect(res.status).toBe(200);
    expect(res.body.document.role).toBe('edit');
  });

  test('bob sees shared doc in their list', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('x-session-id', bobSession);
    expect(res.body.shared.some(d => d.id === docId)).toBe(true);
  });

  test('alice can revoke bob access', async () => {
    const bobId = 'user-bob';
    const res = await request(app)
      .delete(`/api/documents/${docId}/share/${bobId}`)
      .set('x-session-id', aliceSession);
    expect(res.status).toBe(200);
  });

  test('bob cannot access after revoke', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('x-session-id', bobSession);
    expect(res.status).toBe(403);
  });
});

describe('File Upload', () => {
  test('upload .txt file creates document', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('x-session-id', aliceSession)
      .attach('file', Buffer.from('# Hello\nThis is a test file.'), 'test.txt');

    expect(res.status).toBe(201);
    expect(res.body.document).toBeDefined();
  });

  test('unsupported file type returns 400', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('x-session-id', aliceSession)
      .attach('file', Buffer.from('<html>test</html>'), 'test.html');

    expect(res.status).toBe(400);
  });
});
