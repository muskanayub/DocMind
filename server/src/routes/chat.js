const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Document = require('../models/Document');
const { answerQuestion } = require('../services/rag');
const { httpError, asyncHandler } = require('../utils/http');

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const chats = await Chat.find({ user: req.userId }).select('title updatedAt').sort('-updatedAt').limit(50);
  res.json({ chats });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.userId });
  if (!chat) throw httpError(404, 'Chat not found');
  res.json({ chat });
}));

router.post('/', limiter, asyncHandler(async (req, res) => {
  const question = String(req.body?.question || '').trim();
  if (!question || question.length > 2000) throw httpError(400, 'Question must be between 1 and 2000 characters');

  let chat;
  if (req.body.chatId) {
    chat = await Chat.findOne({ _id: req.body.chatId, user: req.userId });
    if (!chat) throw httpError(404, 'Chat not found');
  } else {
    const ids = Array.isArray(req.body.documentIds) ? req.body.documentIds : [];
    if (ids.length) {
      const owned = await Document.countDocuments({ _id: { $in: ids }, user: req.userId, status: 'ready' });
      if (owned !== ids.length) throw httpError(400, 'One or more selected documents are unavailable');
    }
    chat = new Chat({ user: req.userId, title: question.slice(0, 60), documentIds: ids });
  }

  const history = chat.messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
  const { answer, citations } = await answerQuestion({
    userId: req.userId,
    question,
    documentIds: chat.documentIds,
    history,
  });

  chat.messages.push({ role: 'user', content: question }, { role: 'assistant', content: answer, citations });
  await chat.save();

  res.json({ chatId: chat._id, message: chat.messages[chat.messages.length - 1] });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!chat) throw httpError(404, 'Chat not found');
  res.json({ ok: true });
}));

module.exports = router;
