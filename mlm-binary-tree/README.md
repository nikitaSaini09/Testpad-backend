# MLM Binary Tree System

Simple MLM binary-tree demo app built with Node.js, Express, SQLite and EJS.
Each member can have one Left and one Right direct downline. The app
implements sponsor validation, spill logic (recursively finds first empty slot
on the chosen side), and recursive left/right count updates.

## Quick start

1. Extract the zip.
2. Run `npm install`
3. Run `npm start`
4. Open `http://localhost:3000` in your browser.

Default root sponsor (if DB empty):
- Member Code: M1000
- Email: root@mlm.local
- Password: rootpass

## Features
- Join form with sponsor validation and spill logic
- Login (email/password)
- Dashboard showing left/right counts
- Profile view
- Downline tree view (simple nested rendering)

This is a small assignment demo — passwords are stored in plain text for simplicity.
Do not use in production.
