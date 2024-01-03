const User = require('../models/User');

// Function to get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    
    const users = await User.find({ _id: { $ne: currentUserId } }).select('id email');
    
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
