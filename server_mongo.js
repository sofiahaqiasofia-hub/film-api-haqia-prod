require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const Movie = require('./models/Movie');
const Director = require('./models/Directors');





connectDB(); // Panggil fungsi koneksi di awal

const app = express();
const PORT = process.env.PORT || 3300; // Gunakan PORT dari .env 

app.use(cors());
app.use(express.json());

// === ROUTES ===
 app.get('/status', (_req, res) => {
 res.json({ ok: true, service: 'film-api' });
 });

 // GET /movies - Menggunakan Mongoose find()
 app.get('/movies', async (_req, res, next) => { 

 try {
 const movies = await Movie.find({});
 res.json(movies);
 } catch (err) {
 next(err); // Teruskan error ke error handler
 }
 });
// GET /movies/:id - Mendapatkan film by ID
app.get('/movies/:id', async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Film tidak ditemukan' });
    }
    res.json(movie);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Format ID tidak valid' });
    }
    next(err);
  }
});

// POST /movies - Membuat film baru menggunakan Mongoose save()
app.post('/movies', async (req, res, next) => {
  try {
    const newMovie = new Movie({
      title: req.body.title,
      director: req.body.director,
      year: req.body.year
    });
    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// PUT /movies/:id - Update film menggunakan Mongoose findByIdAndUpdate()
app.put('/movies/:id', async (req, res, next) => {
  try {
    // Hanya ambil field yang diizinkan untuk diupdate dari body
    const { title, director, year } = req.body;
    
    // Validasi input
    if (!title || !director || !year) {
      return res.status(400).json({ 
        error: 'Title, director, dan year wajib diisi' 
      });
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      { title, director, year }, // Hanya update field ini
      { new: true, runValidators: true }
    );
    
    if (!updatedMovie) {
      return res.status(404).json({ error: 'Film tidak ditemukan' });
    }
    
    res.json(updatedMovie);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Format ID tidak valid' });
    }
    next(err);
  }
});

// DELETE /movies/:id - Hapus film menggunakan Mongoose findByIdAndDelete()
app.delete('/movies/:id', async (req, res, next) => {
  try {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    
    if (!deletedMovie) {
      return res.status(404).json({ error: 'Film tidak ditemukan' });
    }
    
    res.status(204).send();
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Format ID tidak valid' });
    }
    next(err);
  }
});


//  GET /directors - Ambil semua sutradara
app.get('/directors', async (_req, res, next) => {
  try {
    const directors = await Director.find({});
    res.json(directors);
  } catch (err) {
    next(err);
  }
});

//  GET /directors/:id - Ambil satu sutradara berdasarkan ID
app.get('/directors/:id', async (req, res, next) => {
  try {
    const director = await Director.findById(req.params.id);
    if (!director) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
    res.json(director);
  } catch (err) {
    if (err.kind === 'ObjectId')
      return res.status(400).json({ error: 'Format ID tidak valid' });
    next(err);
  }
});

//  POST /directors - Tambah sutradara baru
app.post('/directors', async (req, res, next) => {
  try {
    const { name, birthYear } = req.body;
    if (!name || !birthYear)
      return res.status(400).json({ error: 'name dan birthYear wajib diisi' });

    const newDirector = new Director({ name, birthYear });
    const savedDirector = await newDirector.save();
    res.status(201).json(savedDirector);
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ error: err.message });
    next(err);
  }
});

//  PUT /directors/:id - Update data sutradara
app.put('/directors/:id', async (req, res, next) => {
  try {
    const { name, birthYear } = req.body;
    if (!name || !birthYear)
      return res.status(400).json({ error: 'name dan birthYear wajib diisi' });

    const updatedDirector = await Director.findByIdAndUpdate(
      req.params.id,
      { name, birthYear },
      { new: true, runValidators: true }
    );

    if (!updatedDirector)
      return res.status(404).json({ error: 'Sutradara tidak ditemukan' });

    res.json(updatedDirector);
  } catch (err) {
    if (err.kind === 'ObjectId')
      return res.status(400).json({ error: 'Format ID tidak valid' });
    next(err);
  }
});

//  DELETE /directors/:id - Hapus sutradara
app.delete('/directors/:id', async (req, res, next) => {
  try {
    const deletedDirector = await Director.findByIdAndDelete(req.params.id);
    if (!deletedDirector)
      return res.status(404).json({ error: 'Sutradara tidak ditemukan' });

    res.status(204).send();
  } catch (err) {
    if (err.kind === 'ObjectId')
      return res.status(400).json({ error: 'Format ID tidak valid' });
    next(err);
  }
});


// Fallback 404 
app.use((_req, res) => {
  res.status(404).json({ error: 'Rute tidak ditemukan' });
});

// Error handler (opsional tapi bagus ditambahkan)
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

app.listen(PORT, () => {
 console.log('Server aktif di http://localhost:${PORT}');
 });

// === ROUTES ===

//  Cek status server
app.get('/status', (_req, res) => {
  res.json({ message: 'Server berjalan dengan baik!' });
});

//  GET /movies - Ambil semua film
app.get('/movies', async (_req, res, next) => {
  try {
    const movies = await Movie.find({});
    res.json(movies);
  } catch (err) {
    next(err); // teruskan ke error handler
  }
});

//  GET /movies/:id - Ambil film berdasarkan ID
app.get('/movies/:id', async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Film tidak ditemukan' });
    }
    res.json(movie);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Format ID tidak valid' });
    }
    next(err);
  }
});

//  POST /movies - Tambahkan film baru
app.post('/movies', async (req, res, next) => {
  try {
    const newMovie = new Movie({
      title: req.body.title,
      director: req.body.director,
      year: req.body.year,
    });

    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

//  PUT /movies/:id - Update data film
app.put('/movies/:id', async (req, res, next) => {
  try {
    const { title, director, year } = req.body;
    if (!title || !director || !year) {
      return res.status(400).json({ error: 'title, director, dan year wajib diisi' });
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      { title, director, year },
      { new: true, runValidators: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({ error: 'Film tidak ditemukan' });
    }

    res.json(updatedMovie);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Format ID tidak valid' });
    }
    next(err);
  }
});

//  DELETE /movies/:id - Hapus film
app.delete('/movies/:id', async (req, res, next) => {
  try {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    if (!deletedMovie) {
      return res.status(404).json({ error: 'Film tidak ditemukan' });
    }
    res.status(204).send();
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Format ID tidak valid' });
    }
    next(err);
  }
});