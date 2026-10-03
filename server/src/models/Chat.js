const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citations: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const chatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New chat' },
    // Empty array means "search every document I own"
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
