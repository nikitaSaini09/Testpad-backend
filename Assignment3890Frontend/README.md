# Code Academy — Gatekeeper (Node.js)

Simple Gatekeeper app that uses a `users.json` file to store users and offers two doors:
- **/signup** — register a new student
- **/login** — login existing student

## Run locally (Visual Studio / VS Code)
1. Install Node.js (>=14) and npm.
2. In the project folder, run:
   ```bash
   npm install
   npm start
   ```
3. Server runs at `http://localhost:3000`

## API
- `POST /signup` — body: `{ "name": "alice", "password": "pw" }`
  - 200: `{ ok: true, message: 'user created' }`
  - 409: user already exists
- `POST /login` — body: `{ "name": "alice", "password": "pw" }`
  - 200: `{ ok: true, message: 'welcome alice' }`
  - 401: invalid credentials

## How to upload to GitHub
```bash
git init
git add .
git commit -m "Initial commit — Gatekeeper app"
# create a repo on GitHub (via UI) named code-academy-gatekeeper
git remote add origin https://github.com/<your-username>/code-academy-gatekeeper.git
git branch -M main
git push -u origin main
```

## Quick tests (use curl or Postman)
```bash
# Signup
curl -X POST http://localhost:3000/signup -H "Content-Type: application/json" -d '{"name":"alice","password":"pw"}'

# Login
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"name":"alice","password":"pw"}'
```

## Notes
- This project intentionally uses a simple `users.json` file (as required by the assignment).
- For any real app, please use hashed passwords + a proper database.
