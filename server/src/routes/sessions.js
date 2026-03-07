const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const router = express.Router();

// POST /api/sessions  – create a new session
router.post('/', async (req, res) => {
  try {
    const { title, language, ownerId } = req.body;
    const sessionId = uuidv4();
    const doc = await Document.create({ sessionId, title: title || 'Untitled', language: language || 'javascript', ownerId: ownerId || 'anonymous' });
    res.status(201).json({ sessionId: doc.sessionId, title: doc.title, language: doc.language });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ sessionId: req.params.id }).select('-history');
    if (!doc) return res.status(404).json({ error: 'Session not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const doc = await Document.findOne({ sessionId: req.params.id }).select('history');
    if (!doc) return res.status(404).json({ error: 'Session not found' });
    res.json(doc.history.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id  – update title / language
router.patch('/:id', async (req, res) => {
  try {
    const { title, language } = req.body;
    const doc = await Document.findOneAndUpdate(
      { sessionId: req.params.id },
      { ...(title && { title }), ...(language && { language }), updatedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Session not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
