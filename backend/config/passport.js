require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Get User model

// Google OAuth 2.0 Strategy Settings
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // '/api/v1/auth/google/callback'
      passReqToCallback: true, // To access the req object
    },
    async (request, accessToken, refreshToken, profile, done) => {
      // This callback function is called when authentication with Google is successful.
      try {
        // Find existing users using Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Handle login if user already exists
          return done(null, user);
        } else {
          // Create a new user if the user does not exist
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName, // Get name from Google profile
            email: profile.emails[0].value, // Get emails from Google profile
            profileImage: profile.photos[0].value, // Import photos from your Google profile
            // role is set to the default value of 'user'.
          });
          return done(null, user);
        }
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);
