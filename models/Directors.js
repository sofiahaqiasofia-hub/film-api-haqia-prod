const mongoose = require('mongoose');

const directorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Nama sutradara wajib diisi'], 
    trim: true 
  },
  birthYear: { 
    type: Number, 
    required: [true, 'Tahun lahir wajib diisi'],
    min: [1900, 'Tahun lahir minimal 1900'],
    max: [new Date().getFullYear(), 'Tahun lahir tidak valid']
  }
}, { 
  timestamps: true 
});

const Director = mongoose.model('Director', directorSchema);

module.exports = Director;