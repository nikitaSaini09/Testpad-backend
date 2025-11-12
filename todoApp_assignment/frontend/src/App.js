import React, { useState, useEffect } from 'react';

function App() {
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [msg, setMsg] = useState('');

    const handleAuth = async () => {
        const endpoint = mode === 'login' ? '/login' : '/signup';
        const res = await fetch(`http://localhost:4000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        const data = await res.json();
        setMsg(JSON.stringify(data));
        if (endpoint === '/login' && data.ok) fetchTasks();
    };

    const fetchTasks = async () => {
        const res = await fetch('http://localhost:4000/tasks', { credentials: 'include' });
        const data = await res.json();
        setTasks(data);
    };

    const addTask = async () => {
        const res = await fetch('http://localhost:4000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTask }),
            credentials: 'include'
        });
        const data = await res.json();
        if (data.ok) { setTasks([...tasks, data.task]); setNewTask(''); }
    };

    const updateStatus = async (id, status) => {
        const res = await fetch(`http://localhost:4000/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
            credentials: 'include'
        });
        const data = await res.json();
        if (data.ok) fetchTasks();
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Todo App</h1>
            {mode !== 'dashboard' ? (
                <div>
                    <button onClick={() => setMode('login')}>Login</button>
                    <button onClick={() => setMode('signup')} style={{ marginLeft: '10px' }}>Signup</button>
                    <div style={{ marginTop: '20px' }}>
                        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} /><br/><br/>
                        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} /><br/><br/>
                        <button onClick={handleAuth}>{mode}</button>
                    </div>
                    <p>{msg}</p>
                </div>
            ) : (
                <div>
                    <input placeholder="New task" value={newTask} onChange={e => setNewTask(e.target.value)} />
                    <button onClick={addTask}>Add Task</button>
                    <ul>
                        {tasks.map(t => (
                            <li key={t.id}>
                                {t.title} - {t.status}
                                <button onClick={() => updateStatus(t.id, t.status==='pending'?'done':'pending')} style={{ marginLeft: '10px' }}>Toggle</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;
