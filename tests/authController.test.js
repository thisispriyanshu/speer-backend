const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signup, login } = require('../controllers/authController'); // Assuming your authController.js is in the same directory

// Mocking User model
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

// Mocking dependencies
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Mocking dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('authController', () => {
  const req = { body: {} };
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };
  const next = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return a JWT token', async () => {
      const newUser = { _id: '123', email: 'test@example.com', password: 'hashedPassword' };

      const createMock = jest.spyOn(User, 'create').mockResolvedValue(newUser);
      const signMock = jest.spyOn(jwt, 'sign').mockReturnValue('fakeToken');

      await signup(req, res, next);

      expect(createMock).toHaveBeenCalledWith({ email: req.body.email, password: undefined });
      expect(signMock).toHaveBeenCalledWith({ user: { id: newUser._id, email: newUser.email } }, process.env.JWT_SECRET);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ token: 'fakeToken' });
    });

    it('should handle existing user', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'existingUserId', email: 'test@example.com' });

      await signup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });

    it('should handle errors', async () => {
      jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database error'));

      await signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('login', () => {
    it('should return a JWT token for a valid user', async () => {
      const user = { _id: 'validUserId', email: 'test@example.com', password: 'hashedPassword' };

      jest.spyOn(User, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwt, 'sign').mockReturnValue('fakeToken');

      await login(req, res, next);

      expect(jwt.sign).toHaveBeenCalledWith({ user: { id: user._id, email: user.email } }, process.env.JWT_SECRET);
      expect(res.json).toHaveBeenCalledWith({ token: 'fakeToken' });
    });

    it('should handle invalid credentials', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'invalidUserId', email: 'test@example.com' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should handle errors', async () => {
      jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database error'));

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
