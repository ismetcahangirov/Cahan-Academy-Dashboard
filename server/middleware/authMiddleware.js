import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import apiResponse from '../utils/apiResponse.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return apiResponse.error(res, 'User not found', 404);
      }

      if (req.user.status !== 'active') {
        return apiResponse.error(res, 'User account is not active', 403);
      }

      next();
    } catch (error) {
      console.error(error);
      return apiResponse.error(res, 'Not authorized, token failed', 401);
    }
  }

  if (!token) {
    return apiResponse.error(res, 'Not authorized, no token', 401);
  }
};


// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return apiResponse.error(
        res,
        `Bu əməliyyat üçün icazəniz yoxdur (tələb olunan: ${roles.join(', ')})`,
        403
      );
    }
    next();
  };
};

export { protect, authorize };
