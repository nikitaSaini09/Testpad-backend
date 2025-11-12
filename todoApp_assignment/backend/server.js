const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const USERS_FILE = path.join(__dirname, 'users.json');
const TASKS_FILE = path.join(__dirname, 'tasks.json');

app.use(bodyParser.json());
app.use(session({ secret: 'todo_secret', resave: false, saveUninitialized: true }));

async function readJson(file) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function writeJson(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

// Signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const users = await readJson(USERS_FILE);
    if (users.find(u => u.username === username)) return res.status(409).json({ error: 'user exists' });
    const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.push({ id, username, password });
    await writeJson(USERS_FILE, users);
    res.json({ ok: true, message: 'user created' });
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readJson(USERS_FILE);
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    req.session.userId = user.id;
    res.json({ ok: true, message: 'logged in', userId: user.id });
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ ok: true, message: 'logged out' });
});

// Add task
app.post('/tasks', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'login required' });
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const tasks = await readJson(TASKS_FILE);
    const id = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    tasks.push({ id, userId: req.session.userId, title, status: 'pending' });
    await writeJson(TASKS_FILE, tasks);
    res.json({ ok: true, task: { id, title, status: 'pending' } });
});

// Get tasks for logged in user
app.get('/tasks', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'login required' });
    const tasks = await readJson(TASKS_FILE);
    const userTasks = tasks.filter(t => t.userId === req.session.userId);
    res.json(userTasks);
});

// Update task status
app.put('/tasks/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'login required' });
    const tasks = await readJson(TASKS_FILE);
    const task = tasks.find(t => t.id == req.params.id && t.userId === req.session.userId);
    if (!task) return res.status(404).json({ error: 'task not found' });
    task.status = req.body.status || task.status;
    await writeJson(TASKS_FILE, tasks);
    res.json({ ok: true, task });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
