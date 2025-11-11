const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const DATA_FILE = path.join(__dirname, 'users.json');

app.use(bodyParser.json());

async function readUsers() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeUsers(users) {
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Signup: { "name": "alice", "password": "pw" }
app.post('/signup', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'name and password required' });

  const users = await readUsers();
  if (users.find(u => u.name === name)) {
    return res.status(409).json({ error: 'user already exists' });
  }
  users.push({ name, password });
  await writeUsers(users);
  res.json({ ok: true, message: 'user created' });
});

// Login: { "name": "alice", "password": "pw" }
app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'name and password required' });

  const users = await readUsers();
  const user = users.find(u => u.name === name && u.password === password);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  res.json({ ok: true, message: 'welcome ' + name });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gatekeeper running on http://localhost:${PORT}`));
