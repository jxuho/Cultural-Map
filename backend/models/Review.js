const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  culturalSite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CulturalSite',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Set up a unique index so that each user can leave only one review for a cultural site
reviewSchema.index({ user: 1, culturalSite: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
