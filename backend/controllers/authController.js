const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');

// 1. Token generation utility
const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

// 2. Setting common cookie options (enhanced security)
const setRefreshTokenCookie = (res, token) => {
  // Convert to number, otherwise use 7 days (default)
  const days = Number(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN) || 7;

  const cookieOptions = {
    // Check if it is a number when calculating milliseconds
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || res.req.headers['x-forwarded-proto'] === 'https',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
    path: '/',
  };

  res.cookie('refreshToken', token, cookieOptions);
};

/**
 * 3. Google OAuth Callback
 * Strategy: Store only the refresh token in a cookie and redirect to the front.
 */
const googleAuthCallback = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Google authentication failed.', 401));
  }

  // Generate refresh token and set cookies
  const refreshToken = signRefreshToken(req.user._id);
  setRefreshTokenCookie(res, refreshToken);

  // Frontend URL settings
  const frontendUrl = process.env.NODE_ENV === 'production'
    ? 'https://cultural-heritage-map.vercel.app/'
    : 'http://localhost:3000';

  // Redirect (does not include access token -secure)
  res.redirect(frontendUrl);
});

/**
 * 4. Token Refresh
 * Called when the frontend is loaded or when a 401 error occurs, a new Access Token is issued.
 */
const refresh = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  // Check if there is no token or the 'loggedout' string set when logging out.
  if (!refreshToken || refreshToken === 'loggedout') {
    return next(new AppError('No refresh token found. Please log in.', 401));
  }

  try {
    const decoded = await jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user no longer exists.', 401));
    }

    const accessToken = signAccessToken(currentUser._id);

    res.status(200).json({
      status: 'success',
      accessToken,
      data: { user: currentUser }
    });
  } catch (err) {
    return next(new AppError('Invalid refresh token. Please log in again.', 401));
  }
});

/**
 * 5. Protect Middleware (Access Token 검증)
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Please log in to access this resource.', 401));
  }

  // Access Token Verification
  const decoded = await jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User not found.', 401));
  }

  req.user = currentUser;
  next();
});

/**
 * 6. Logout
 */
const logout = (req, res) => {
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || res.req.headers['x-forwarded-proto'] === 'https',
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
  refresh,
};
