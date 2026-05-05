const express = require('express');
const passport = require('passport'); // Passport.js middleware
const authController = require('../controllers/authController');

const router = express.Router();

// Initiate Google Sign-in (redirect user to Google authentication page)
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account', // Force the account selection screen to appear even if you're already signed in to Google
  }),
);

// Google login callback (receives and processes authentication response from Google)
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'https://cultural-heritage-map.vercel.app/', // Frontend URL to redirect to when authentication fails
    session: false, // Since it uses JWT, no session is used.
  }),
  authController.googleAuthCallback, // Issue JWT and handle response on success
);

// Logout route (delete JWT cookie)
router.post('/logout', authController.logout);

module.exports = router;
