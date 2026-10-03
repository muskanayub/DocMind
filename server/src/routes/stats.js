const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { asyncHandler } = require('../utils/http');

const router = express.Router();
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [documents, chunks, daily, totals] = await Promise.all([
    Document.countDocuments({ user: userId, status: 'ready' }),
    Chunk.countDocuments({ user: userId }),
    Chat.aggregate([
      { $match: { user: userId } },
      { $unwind: '$messages' },
      { $match: { 'messages.role': 'user', 'messages.createdAt': { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$messages.createdAt' } }, count: { $sum: 1 } } },
    ]),
    Chat.aggregate([
      { $match: { user: userId } },
      { $project: { asked: { $size: { $filter: { input: '$messages', cond: { $eq: ['$$this.role', 'user'] } } } } } },
      { $group: { _id: null, questions: { $sum: '$asked' } } },
    ]),
  ]);

  const byDay = Object.fromEntries(daily.map((d) => [d._id, d.count]));
  const perDay = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    perDay.push({ date: key, count: byDay[key] || 0 });
  }

  res.json({ documents, chunks, questions: totals[0]?.questions || 0, perDay });
}));

module.exports = router;
