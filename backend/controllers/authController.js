const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');

// 1. JWT Token Generation
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// 2. Common Cookie Options
const getCookieOptions = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    // Apply secure flag in production or when behind an HTTPS proxy
    secure: isProduction || res.req.headers['x-forwarded-proto'] === 'https',
    // Support cross-domain cookie transmission (Render <-> Local or different domains)
    sameSite: isProduction ? 'none' : 'Lax',
    path: '/',
  };
};

// 3. For Standard Login: Set Cookie and Send JSON Response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = getCookieOptions(res);

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output for security
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: { user },
  });
};

// 4. Google OAuth Callback: Set Cookie and Redirect
const googleAuthCallback = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Google authentication failed.', 401));
  }

  const token = signToken(req.user._id);
  const cookieOptions = getCookieOptions(res);

  // Set the JWT cookie
  res.cookie('jwt', token, cookieOptions);

  // Set frontend URL based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = isProduction
    ? 'https://cultural-heritage-map.vercel.app/'
    : 'http://localhost:3000';

  // Redirect directly to frontend instead of sending JSON
  res.redirect(frontendUrl);
});

// 5. Authentication Middleware: Prioritize reading token from cookies
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in cookies (Priority 1)
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // Check Authorization header (Priority 2 - useful for Postman/API testing)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  // Verify token
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401),
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

// 6. Logout: Clear Cookie
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
    httpOnly: true,
    // Options must match the set cookie options to be cleared correctly by the browser
    secure:
      process.env.NODE_ENV === 'production' ||
      res.req.headers['x-forwarded-proto'] === 'https',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
    path: '/',
  });
  res.status(200).json({ status: 'success' });
};

// Role-based Authorization Middleware
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if the current user's role is included in the permitted roles
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }
    next();
  };
};

// Admin Only: Change user roles
const updateUserRole = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { newRole } = req.body;

  // 1. Prevent self-role update
  if (req.user.id === userId) {
    return next(new AppError('You cannot change your own role.', 403));
  }

  // 2. Validate new role value
  if (!['user', 'admin'].includes(newRole)) {
    return next(
      new AppError(
        'Invalid role. Please choose either "user" or "admin".',
        400,
      ),
    );
  }

  // 3. Find user to update
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('No user found with that ID.', 404));
  }

  // 4. Update and save role
  user.role = newRole;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `User ${user.username}'s role has been changed to ${newRole}.`,
    data: { user },
  });
});

module.exports = {
  googleAuthCallback,
  protect,
  restrictTo,
  logout,
  updateUserRole,
};
