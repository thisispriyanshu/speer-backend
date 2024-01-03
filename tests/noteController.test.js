const mongoose = require('mongoose');
const {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  searchNotes,
} = require('../controllers/noteController');
const Note = require('../models/Note');
const User = require('../models/User');
const SharedNote = require('../models/SharedNote');

// Mocking Note model
jest.mock('../models/Note', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
}));

// Mocking SharedNote model
jest.mock('../models/SharedNote', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
}));

// Mocking User model
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const req = { user: { id: 'userId' } };
const res = {
  status: jest.fn(() => res),
  json: jest.fn(),
};

const next = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

describe('noteController', () => {
  describe('getAllNotes', () => {
    it('should get all notes created by the user and shared with the user', async () => {
      // Mock data
      const createdNotes = [{ _id: '1', title: 'Note 1', description: 'Description 1', creator: 'userId' }];
      const sharedNotes = [{ _id: '2', title: 'Note 2', description: 'Description 2', creator: 'otherUserId' }];

      // Mock Note model behavior
      Note.find.mockReturnValueOnce(createdNotes);
      SharedNote.find.mockReturnValueOnce(sharedNotes);

      // Call the function
      await getAllNotes(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([...createdNotes, { ...sharedNotes[0], source: 'shared' }]);
    });
  });

  describe('getNoteById', () => {
    it('should get a note by ID if it exists and is either created or shared with the user', async () => {
      // Mock data
      const noteId = '1';
      const note = { _id: noteId, title: 'Note 1', description: 'Description 1', creator: 'userId' };

      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(note);

      // Call the function
      await getNoteById({ params: { id: noteId } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ...note, source: 'created' });
    });

    it('should handle note not found', async () => {
      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(null);

      // Call the function
      await getNoteById({ params: { id: 'nonexistentId' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Note not found' });
    });

    it('should handle errors', async () => {
      // Mock Note model behavior to throw an error
      Note.findById.mockRejectedValueOnce(new Error('Database error'));

      // Call the function
      await getNoteById({ params: { id: '1' } }, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createNote', () => {
    it('should create a new note and return it', async () => {
      // Mock data
      const newNote = { _id: '1', title: 'New Note', description: 'New Description', creator: 'userId' };

      // Mock Note model behavior
      Note.create.mockReturnValueOnce(newNote);

      // Call the function
      await createNote({ body: { title: 'New Note', description: 'New Description' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newNote);
    });

    it('should handle errors', async () => {
      // Mock Note model behavior to throw an error
      Note.create.mockRejectedValueOnce(new Error('Database error'));

      // Call the function
      await createNote({ body: { title: 'New Note', description: 'New Description' } }, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateNote', () => {
    it('should update a note by ID if the user is the creator and return the updated note', async () => {
      // Mock data
      const updatedNote = { _id: '1', title: 'Updated Note', description: 'Updated Description', creator: 'userId' };

      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(updatedNote);
      Note.prototype.save.mockResolvedValueOnce(updatedNote);

      // Call the function
      await updateNote({ params: { id: '1' }, body: { title: 'Updated Note', description: 'Updated Description' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedNote);
    });

    it('should handle note not found', async () => {
      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(null);

      // Call the function
      await updateNote({ params: { id: 'nonexistentId' }, body: { title: 'Updated Note', description: 'Updated Description' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Note not found' });
    });

    it('should handle not authorized to update the note', async () => {
      // Mock data
      const noteCreatedByOtherUser = { _id: '1', title: 'Note 1', description: 'Description 1', creator: 'otherUserId' };

      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(noteCreatedByOtherUser);

      // Call the function
      await updateNote({ params: { id: '1' }, body: { title: 'Updated Note', description: 'Updated Description' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized to update this note' });
    });

    it('should handle errors', async () => {
      // Mock Note model behavior to throw an error
      Note.findById.mockRejectedValueOnce(new Error('Database error'));

      // Call the function
      await updateNote({ params: { id: '1' }, body: { title: 'Updated Note', description: 'Updated Description' } }, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteNote', () => {
    it('should delete a note by ID if the user is the creator', async () => {
      // Mock data
      const noteToDelete = { _id: '1', title: 'Note 1', description: 'Description 1', creator: 'userId' };

      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(noteToDelete);
      Note.deleteOne.mockResolvedValueOnce({});

      // Call the function
      await deleteNote({ params: { id: '1' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Note deleted successfully' });
    });

    it('should handle note not found', async () => {
      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(null);

      // Call the function
      await deleteNote({ params: { id: 'nonexistentId' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Note not found' });
    });

    it('should handle not authorized to delete the note', async () => {
      // Mock data
      const noteCreatedByOtherUser = { _id: '1', title: 'Note 1', description: 'Description 1', creator: 'otherUserId' };

      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(noteCreatedByOtherUser);

      // Call the function
      await deleteNote({ params: { id: '1' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized to delete this note' });
    });

    it('should handle errors', async () => {
      // Mock Note model behavior to throw an error
      Note.findById.mockRejectedValueOnce(new Error('Database error'));

      // Call the function
      await deleteNote({ params: { id: '1' } }, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('shareNote', () => {
    it('should share a note with another user', async () => {
      // Mock data
      const noteId = '1';
      const userId = 'otherUserId';
      const sharedNote = { _id: 'sharedNoteId', note: noteId, user: userId };

      // Mock Note and User model behavior
      Note.findById.mockReturnValueOnce({ _id: noteId });
      User.findById.mockReturnValueOnce({ _id: userId });
      SharedNote.create.mockReturnValueOnce(sharedNote);

      // Call the function
      await shareNote({ params: { id: noteId }, body: { userId } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sharedNote);
    });

    it('should handle note not found', async () => {
      // Mock Note model behavior
      Note.findById.mockReturnValueOnce(null);

      // Call the function
      await shareNote({ params: { id: 'nonexistentId' }, body: { userId: 'otherUserId' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Note not found' });
    });

    it('should handle user not found', async () => {
      // Mock Note and User model behavior
      Note.findById.mockReturnValueOnce({ _id: '1' });
      User.findById.mockReturnValueOnce(null);

      // Call the function
      await shareNote({ params: { id: '1' }, body: { userId: 'nonexistentUserId' } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle note already shared with the user', async () => {
      // Mock data
      const noteId = '1';
      const userId = 'otherUserId';

      // Mock Note and SharedNote model behavior
      Note.findById.mockReturnValueOnce({ _id: noteId });
      SharedNote.findOne.mockReturnValueOnce({ _id: 'existingSharedNoteId', note: noteId, user: userId });

      // Call the function
      await shareNote({ params: { id: noteId }, body: { userId } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Note already shared with the user' });
    });

    it('should handle errors', async () => {
      // Mock Note model behavior to throw an error
      Note.findById.mockRejectedValueOnce(new Error('Database error'));

      // Call the function
      await shareNote({ params: { id: '1' }, body: { userId: 'otherUserId' } }, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('searchNotes', () => {
    it('should search for notes based on keywords', async () => {
      // Mock data
      const q = 'keyword';
      const userId = 'userId';
      const sharedNoteIds = ['sharedNoteId1', 'sharedNoteId2'];
      const results = [{ _id: '1', title: 'Note 1', description: 'Description 1', creator: userId }];

      // Mock SharedNote and Note model behavior
      SharedNote.find.mockReturnValueOnce(sharedNoteIds.map(noteId => ({ note: noteId })));
      Note.find.mockReturnValueOnce(results);

      // Call the function
      await searchNotes({ query: { q }, user: { id: userId } }, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(results);
    });

    it('should handle errors', async () => {
      // Mock SharedNote model behavior to throw an error
      SharedNote.find.mockRejectedValueOnce(new Error('Database error'));

      // Call the function
      await searchNotes({ query: { q: 'keyword' }, user: { id: 'userId' } }, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
