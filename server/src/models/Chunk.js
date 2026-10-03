const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  text: { type: String, required: true },
  page: Number, // null for formats without pages (DOCX, TXT)
  index: Number,
  // Excluded from normal queries because it is large; retrieval opts in with .select('+embedding')
  embedding: { type: [Number], select: false },
});

module.exports = mongoose.model('Chunk', chunkSchema);
