const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  content:   { type: String, required: true },
  savedBy:   { type: String },
  savedAt:   { type: Date, default: Date.now },
  revision:  { type: Number },
  label:     { type: String, default: 'Auto-save' },
});

const DocumentSchema = new mongoose.Schema({
  sessionId:     { type: String, required: true, unique: true, index: true },
  title:         { type: String, default: 'Untitled' },
  content:       { type: String, default: '' },
  language:      { type: String, default: 'javascript' },
  ownerId:       { type: String, default: 'anonymous' },
  collaborators: [{ type: String }],
  revision:      { type: Number, default: 0 },
  history:       { type: [VersionSchema], default: [] },
  isPublic:      { type: Boolean, default: true },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
});

// Keep only last 50 versions
DocumentSchema.methods.addVersion = function (content, savedBy) {
  this.history.push({ content, savedBy, revision: this.revision, label: 'Auto-save' });
  if (this.history.length > 50) this.history.shift();
};

module.exports = mongoose.model('Document', DocumentSchema);
