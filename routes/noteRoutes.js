const express = require('express');
const noteController = require('../controllers/noteController');

const router = express.Router();

// Get all notes
router.get('/', noteController.getAllNotes);

// Get a note by ID
router.get('/:id', noteController.getNoteById);

// Create a new note
router.post('/', noteController.createNote);

// Update a note by ID
router.put('/:id', noteController.updateNote);

// Delete a note by ID
router.delete('/:id', noteController.deleteNote);

// Share a note with another user
router.post('/share/:id', noteController.shareNote);

// Search for notes based on keywords
router.get('/search', noteController.searchNotes);

module.exports = router;
