require('dotenv').config();
 const bcrypt = require(`bcryptjs`);
 const jwt = require(`jsonwebtoken`);
 const JWT_SECRET = process.env.JWT_SECRET;
 const { authenticateToken, authorizeRole } = require(`./middleware/auth.js`);
const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const app = express();

app.use(express.json()); 
app.use(cors());


app.get('/status', (_req, res) => {
  res.json({ ok: true, service: 'film-api' });
});


app.get('/movies', (_req, res) => {
  const sql = 'SELECT * FROM movies ORDER BY id ASC';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


app.get('/movies/:id', (req, res) => {
  const sql = 'SELECT * FROM movies WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Film tidak ditemukan' });
    res.json(row);
  });
});


app.post('/movies', authenticateToken, (req, res) => {
  const { title, director, year } = req.body;
  if (!title || !director || !year) {
    return res.status(400).json({ message: 'Semua field (title, director, year) harus diisi' });
  }
  const sql = 'INSERT INTO movies (title, director, year) VALUES (?, ?, ?)';
  db.run(sql, [title, director, year], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, director, year });
  });
});


app.put('/movies/:id', [authenticateToken,authorizeRole('admin')], (req, res) => {
  const { title, director, year } = req.body;
  const sql = 'UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?';
  db.run(sql, [title, director, year, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.json({ id: Number(req.params.id), title, director, year });
  });
});


app.delete('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  const sql = 'DELETE FROM movies WHERE id = ?';
  db.run(sql, req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.status(204).send();
  });
});



// GET semua sutradara (PUBLIK)
app.get('/directors/id', (_req, res) => {
  const sql = 'SELECT * FROM directors ORDER BY id ASC';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET sutradara berdasarkan ID (PUBLIK)
app.get('/directors/:id', (req, res) => {
  const sql = 'SELECT * FROM directors WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Sutradara tidak ditemukan' });
    res.json(row);
  });
});

// POST sutradara baru (HARUS LOGIN)
app.post('/directors', authenticateToken, (req, res) => {
  const { name, birthYear } = req.body;
  if (!name || !birthYear) {
    return res.status(400).json({ message: 'Field (name, birthYear) harus diisi' });
  }
  db.run(
    'INSERT INTO directors (name, birthYear) VALUES (?, ?)',
    [name, birthYear],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, birthYear });
    }
  );
});

// PUT update sutradara (HARUS LOGIN)
app.put('/directors/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  const { name, birthYear } = req.body;
  db.run(
    'UPDATE directors SET name = ?, birthYear = ? WHERE id = ?',
    [name, birthYear, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
      res.json({ updatedID: req.params.id, name, birthYear });
    }
  );
});

// DELETE sutradara (HARUS LOGIN)
app.delete('/directors/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  db.run('DELETE FROM directors WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
    res.json({ deletedID: req.params.id });
  });
});

// === AUTH ROUTES ===

// REGISTER
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6) {
    return res.status(400).json({ message: 'Username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing:", err);
      return res.status(500).json({ error: 'Gagal memproses pendaftaran' });
    }

    // MODIFIKASI DI SINI: Tambahkan kolom role dan nilai 'user'
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const params = [username.toLowerCase(), hashedPassword, 'user']; // Tetapkan 'user'

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Username sudah digunakan' });
        }
        console.error("DB Insertion user:", err);
        return res.status(500).json({ error: 'Gagal menyimpan pengguna' });
      }
      res.status(201).json({ id: this.lastID, username });
    });
  });
});


// LOGIN
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password harus diisi' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.get(sql, [username.toLowerCase()], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).json({ error: 'Kredensial tidak valid' });
      }
       
      const payload = {
         user: { 
          id: user.id,
           username: user.username,
          role: user.role 
        }
         };
      jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) {
          console.error("JWT Signing token:", err);
          return res.status(500).json({ error: 'Gagal membuat token' });
        }
        res.json({ message: 'Login berhasil', token });
      });
    });
  });
});

// REGISTER ADMIN (HANYA UNTUK PENGEMBANGAN - HAPUS DI PRODUKSI)
app.post('/auth/register-admin', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6) {
    return res.status(400).json({ message: 'Username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing:", err);
      return res.status(500).json({ error: 'Gagal memproses pendaftaran admin' });
    }

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const params = [username.toLowerCase(), hashedPassword, 'admin']; // Tetapkan 'admin'

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Username admin sudah digunakan' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: 'Admin berhasil dibuat', 
        userId: this.lastID,
      });
    });
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Rute tidak ditemukan' });
});



const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
