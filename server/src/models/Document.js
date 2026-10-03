const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    size: Number,
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    error: String,
    pageCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
