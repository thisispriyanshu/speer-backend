const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Create a compound text index on title and description
noteSchema.index({ title: 'text', description: 'text' });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
