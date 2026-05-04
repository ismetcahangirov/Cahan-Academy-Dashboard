import apiResponse from '../utils/apiResponse.js';

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return apiResponse.error(
        res,
        `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`,
        403
      );
    }
    next();
  };
};

export { authorize };
