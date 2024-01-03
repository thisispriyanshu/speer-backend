const mongoose = require('mongoose');

const sharedNoteSchema = new mongoose.Schema({
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const SharedNote = mongoose.model('SharedNote', sharedNoteSchema);

module.exports = SharedNote;
