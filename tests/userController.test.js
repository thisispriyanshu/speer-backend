const User = require('../models/User');
const { getAllUsers } = require('../controllers/userController');

// Mocking User model
jest.mock('../models/User', () => ({
  find: jest.fn(),
}));

const req = { user: { id: 'currentUserId' } };
const res = {
  status: jest.fn(() => res),
  json: jest.fn(),
};
const next = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

describe('userController', () => {
  describe('getAllUsers', () => {
    it('should get all users except the current user', async () => {
      // Mock data
      const currentUserId = 'currentUserId';
      const otherUser1 = { _id: 'user1Id', email: 'user1@example.com' };
      const otherUser2 = { _id: 'user2Id', email: 'user2@example.com' };
      const users = [otherUser1, otherUser2];

      // Mock User model behavior
      User.find.mockResolvedValueOnce(users);

      // Call the function
      await getAllUsers(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(users);
    });
  });
});
