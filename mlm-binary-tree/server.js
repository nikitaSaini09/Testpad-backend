const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const DB_PATH = path.join(__dirname, 'data', 'mlm.db');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'mlm-secret-key',
  resave: false,
  saveUninitialized: false
}));

// --- Database setup ---
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error('DB open error', err);
  console.log('Opened SQLite DB at', DB_PATH);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_code TEXT UNIQUE,
    name TEXT,
    email TEXT,
    mobile TEXT,
    password TEXT,
    sponsor_code TEXT,
    position TEXT,
    left_member TEXT,
    right_member TEXT,
    left_count INTEGER DEFAULT 0,
    right_count INTEGER DEFAULT 0,
    created_at TEXT
  )`);
  // Create a root member if none exists (to allow join under)
  db.get("SELECT COUNT(*) AS c FROM members", (err, row) => {
    if (err) return console.error(err);
    if (row.c === 0) {
      const code = 'M1000';
      db.run(`INSERT INTO members (member_code, name, email, mobile, password, sponsor_code, position, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [code, 'Root Sponsor', 'root@mlm.local', '0000000000', 'rootpass', '', 'Left'], (e) => {
          if (e) console.error(e);
          else console.log('Root sponsor created: M1000 (password: rootpass)');
        });
    }
  });
});

// --- Helpers ---
function generateMemberCode(db, cb) {
  db.get("SELECT COUNT(*) AS c FROM members", (err, row) => {
    if (err) return cb(err);
    const code = 'M' + (1000 + row.c + 1);
    cb(null, code);
  });
}

function findMemberByCode(db, code, cb) {
  db.get("SELECT * FROM members WHERE member_code = ?", [code], cb);
}

function findAvailableSlot(db, startCode, position, cb) {
  // recursive search for first empty slot on given side
  findMemberByCode(db, startCode, (err, member) => {
    if (err) return cb(err);
    if (!member) return cb(new Error('Member not found during spill search'));
    if (position === 'Left') {
      if (!member.left_member) return cb(null, member);
      return findAvailableSlot(db, member.left_member, position, cb);
    } else {
      if (!member.right_member) return cb(null, member);
      return findAvailableSlot(db, member.right_member, position, cb);
    }
  });
}

function updateCountsUp(db, sponsorCode, position, cb) {
  if (!sponsorCode) return cb(null);
  findMemberByCode(db, sponsorCode, (err, sponsor) => {
    if (err) return cb(err);
    if (!sponsor) return cb(null);
    const field = position === 'Left' ? 'left_count' : 'right_count';
    const sql = `UPDATE members SET ${field} = ${field} + 1 WHERE member_code = ?`;
    db.run(sql, [sponsorCode], (e) => {
      if (e) return cb(e);
      updateCountsUp(db, sponsor.sponsor_code, position, cb);
    });
  });
}

// --- Routes ---
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/join', (req, res) => {
  res.render('join', { error: null, success: null });
});

app.post('/join', (req, res) => {
  const { name, email, mobile, sponsor_code, position, password } = req.body;
  if (!name || !email || !mobile || !sponsor_code || !position || !password) {
    return res.render('join', { error: 'All fields are required.', success: null });
  }

  findMemberByCode(db, sponsor_code, (err, sponsor) => {
    if (err) return res.render('join', { error: 'Server error', success: null });
    if (!sponsor) return res.render('join', { error: 'Invalid Sponsor Code.', success: null });

    // Determine actual sponsor slot (spill logic)
    findAvailableSlot(db, sponsor.member_code, position, (err2, targetSponsor) => {
      if (err2) return res.render('join', { error: 'Server error during spill logic', success: null });

      generateMemberCode(db, (err3, member_code) => {
        if (err3) return res.render('join', { error: 'Code generation failed', success: null });

        const stmt = db.prepare(`INSERT INTO members
          (member_code, name, email, mobile, password, sponsor_code, position, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
        stmt.run([member_code, name, email, mobile, password, targetSponsor.member_code, position], function (e) {
          if (e) {
            return res.render('join', { error: 'Failed to create member (maybe email/code exists).', success: null });
          }

          // update sponsor reference
          const refCol = position === 'Left' ? 'left_member' : 'right_member';
          db.run(`UPDATE members SET ${refCol} = ? WHERE member_code = ?`, [member_code, targetSponsor.member_code], (uerr) => {
            if (uerr) console.error('Failed to update sponsor ref', uerr);

            // update counts upward starting from targetSponsor
            updateCountsUp(db, targetSponsor.member_code, position, (uperr) => {
              if (uperr) console.error('Count update error', uperr);
              return res.render('join', { error: null, success: 'Member joined successfully! Member Code: ' + member_code });
            });
          });
        });
      });
    });
  });
});

// Auth routes
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM members WHERE email = ? AND password = ?", [email, password], (err, user) => {
    if (err) return res.render('login', { error: 'Server error' });
    if (!user) return res.render('login', { error: 'Invalid credentials' });
    req.session.user = { member_code: user.member_code, name: user.name, email: user.email };
    res.redirect('/dashboard');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Middleware
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

app.get('/dashboard', requireAuth, (req, res) => {
  const code = req.session.user.member_code;
  findMemberByCode(db, code, (err, member) => {
    if (err || !member) return res.send('User not found');
    res.render('dashboard', { member });
  });
});

app.get('/profile', requireAuth, (req, res) => {
  findMemberByCode(db, req.session.user.member_code, (err, member) => {
    res.render('profile', { member });
  });
});

function buildTree(db, member_code, cb) {
  findMemberByCode(db, member_code, (err, member) => {
    if (err || !member) return cb(null, null);
    const node = {
      member_code: member.member_code,
      name: member.name,
      left_count: member.left_count,
      right_count: member.right_count,
      left: null,
      right: null
    };
    if (member.left_member) {
      buildTree(db, member.left_member, (e, leftNode) => {
        node.left = leftNode;
        if (member.right_member) {
          buildTree(db, member.right_member, (e2, rightNode) => {
            node.right = rightNode;
            cb(null, node);
          });
        } else cb(null, node);
      });
    } else if (member.right_member) {
      buildTree(db, member.right_member, (e2, rightNode) => {
        node.right = rightNode;
        cb(null, node);
      });
    } else cb(null, node);
  });
}

app.get('/downline', requireAuth, (req, res) => {
  const code = req.session.user.member_code;
  buildTree(db, code, (err, tree) => {
    res.render('downline', { tree });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server started on port', PORT);
});
