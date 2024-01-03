const Note = require('../models/Note');
const User = require('../models/User');
const SharedNote = require('../models/SharedNote');


// Get all notes
exports.getAllNotes = async (req, res, next) => {
  try {
    // Get notes created by the user
    const createdNotes = await Note.find({ creator: req.user.id }).lean();

    // Get notes shared with the user
    const sharedNotes = await SharedNote.find({ user: req.user.id }).populate('note').lean();

    // Combine and format the results
    const allNotes = createdNotes.map(note => ({ ...note, source: 'created' }));
    sharedNotes.forEach(sharedNote => {
      allNotes.push({ ...sharedNote.note, source: 'shared' });
    });

    res.status(200).json(allNotes);
  } catch (error) {
    next(error);
  }
};

// Get a note by ID
exports.getNoteById = async (req, res, next) => {
  try {
    const noteId = req.params.id;

    // Check if the note exists
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    let source;

    // Check if the note is created by the user
    if (note.creator.toString() === req.user.id) {
      source = 'created';
    } else {
      // Check if the note is shared with the user
      const sharedNote = await SharedNote.findOne({ note: noteId, user: req.user.id });
      if (sharedNote) {
        source = 'shared';
      } else {
        source = 'unknown'; // or any other value to indicate the note is not created or shared with the user
      }
    }

    res.status(200).json({ ...note.toObject(), source });
  } catch (error) {
    next(error);
  }
};

// Create a new note
exports.createNote = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const creatorId = req.user.id;

    const note = await Note.create({ title, description, creator: creatorId });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

// Update a note by ID
exports.updateNote = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Check if the note exists
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if the user is the creator of the note
    if (note.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    // Update the note
    note.title = title;
    note.description = description;
    await note.save();

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

// Delete a note by ID
exports.deleteNote = async (req, res, next) => {
  try {
    // Check if the note exists
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if the user is the creator of the note
    if (note.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    // Use deleteOne or findByIdAndRemove to delete the note
    await Note.deleteOne({ _id: req.params.id });
    // Alternatively, you can use await Note.findByIdAndRemove(req.params.id);

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Share a note with another user
exports.shareNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Check if the note exists
    console.log(id)
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the note is already shared with the user
    const existingSharedNote = await SharedNote.findOne({ note: id, user: userId });
    if (existingSharedNote) {
      return res.status(400).json({ message: 'Note already shared with the user' });
    }

    // Share the note with the user
    const sharedNote = await SharedNote.create({ note: id, user: userId });

    res.status(200).json(sharedNote);
  } catch (error) {
    next(error);
  }
};

// Search for notes based on keywords
exports.searchNotes = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    // Retrieve the IDs of shared notes
    const sharedNoteIds = (await SharedNote.find({ user: userId })).map(sharedNote => sharedNote.note);

    // Use $in to search in both created and shared notes
    const results = await Note.find({
      $and: [
        {
          $or: [
            { creator: userId }, // Search in user's created notes
            { _id: { $in: sharedNoteIds.map(id => id.toString()) } }, // Convert sharedNoteIds to strings
          ],
        },
        { $text: { $search: q } },
      ],
    });

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};