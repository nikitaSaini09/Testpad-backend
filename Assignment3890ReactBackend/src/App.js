import React, { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState('signup');

  const handleSubmit = async () => {
    const endpoint = mode === 'signup' ? '/signup' : '/login';

    const res = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });

    const data = await res.json();
    setMsg(JSON.stringify(data));
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1>Code Academy Gatekeeper</h1>
      <button onClick={() => setMode('signup')}>Signup</button>
      <button onClick={() => setMode('login')} style={{ marginLeft: '10px' }}>Login</button>

      <div style={{ marginTop: '20px' }}>
        <input 
          type="text" 
          placeholder="Enter Name"
          value={name}
          onChange={e => setName(e.target.value)}
        /><br /><br />
        <input 
          type="password" 
          placeholder="Enter Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        /><br /><br />
        <button onClick={handleSubmit}>
          {mode === 'signup' ? "Signup" : "Login"}
        </button>
      </div>

      <p style={{ marginTop: "20px", fontWeight: "bold" }}>{msg}</p>
    </div>
  );
}

export default App;
