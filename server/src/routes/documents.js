const path = require('path');
const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { ingestDocument } = require('../services/rag');
const { httpError, asyncHandler } = require('../utils/http');

const router = express.Router();
const ALLOWED = ['.pdf', '.docx', '.txt', '.md'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.includes(ext)) return cb(httpError(400, 'Only PDF, DOCX, TXT and MD files are supported'));
    cb(null, true);
  },
});

router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const docs = await Document.find({ user: req.userId }).sort('-createdAt');
  res.json({ documents: docs });
}));

router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Choose a file to upload');

  const limit = Number(process.env.MAX_DOCS_PER_USER || 15);
  if ((await Document.countDocuments({ user: req.userId })) >= limit) {
    throw httpError(400, `You can keep up to ${limit} documents. Delete one to add another.`);
  }

  const doc = await Document.create({
    user: req.userId,
    name: req.file.originalname,
    size: req.file.size,
  });

  // Respond right away; embedding can take a while. The client polls until status changes.
  res.status(202).json({ document: doc });
  ingestDocument(doc._id, req.file.buffer, path.extname(req.file.originalname).toLowerCase());
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!doc) throw httpError(404, 'Document not found');
  await Chunk.deleteMany({ document: doc._id });
  res.json({ ok: true });
}));

module.exports = router;
