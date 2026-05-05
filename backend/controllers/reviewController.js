// Backend/controllers/review controller.js
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const CulturalSite = require('../models/CulturalSite'); // Import the CulturalSite model
const User = require('../models/User');
const mongoose = require('mongoose');

// View all reviews (filterable and sortable)
const getAllReviews = asyncHandler(async (req, res, next) => {
  let filter = {};
  const CulturalSite = require('../models/CulturalSite'); // We need to import the CulturalSite model.
  const mongoose = require('mongoose'); // Import mongoose and use isObjectIdOrHexString.

  // 1. Check whether cultural heritage exists if req.params.culturalSiteId exists
  if (req.params.culturalSiteId) {
    // Identity validation
    if (!mongoose.isObjectIdOrHexString(req.params.culturalSiteId)) {
      return next(new AppError('id is not valid.', 400));
    }

    const culturalSite = await CulturalSite.findById(req.params.culturalSiteId);

    if (!culturalSite) {
      // If the cultural heritage does not exist, a 404 error is returned.
      return next(new AppError('Cannot find the cultural site.', 404));
    }
    filter = { culturalSite: req.params.culturalSiteId };
  }

  // 2. Filter reviews for specific users (new addition)
  // /api/reviews?user=userId
  if (req.query.user) {
    // User ID validation (optional but recommended)
    if (!mongoose.isObjectIdOrHexString(req.query.user)) {
      return next(new AppError('invalid user.', 400));
    }
    filter.user = req.query.user;
  }

  const reviews = await Review.find(filter)
    .populate({
      path: 'culturalSite',
      select: 'name', // Only cultural heritage names are imported.
    })
    .populate({
      path: 'user',
      select: 'username profileImage', // Get only username and profile picture
    })
    .sort('-createdAt'); // Sort by newest;

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

// View specific reviews
const getReviewById = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId)
    .populate({
      path: 'culturalSite',
      select: 'name',
    })
    .populate({
      path: 'user',
      select: 'username',
    });

  if (!review) {
    return next(new AppError('There are no reviews with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

// Create a new review (logged in users only)
const createReview = asyncHandler(async (req, res, next) => {
  if (!req.body.culturalSite) req.body.culturalSite = req.params.culturalSiteId; // Get culturalSiteId from URL parameter
  if (!req.body.user) req.body.user = req.user.id; // Current logged in user ID

  const existingCulturalSite = await CulturalSite.findById(
    req.body.culturalSite,
  );
  if (!existingCulturalSite) {
    return next(
      new AppError('No cultural heritages found to leave a review for.', 404),
    );
  }

  // See if you've already left a review
  const existingReview = await Review.findOne({
    user: req.body.user,
    culturalSite: req.body.culturalSite,
  });
  if (existingReview) {
    return next(
      new AppError(
        'You have already left a review for this cultural heritage.',
        409,
      ),
    ); // 409 Conflict
  }

  const { culturalSite, user, rating, comment } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newReview = new Review({
      culturalSite,
      user,
      rating,
      comment,
    });

    // 1. Save review document (including session)
    const savedReview = await newReview.save({ session });

    // 2. Update CulturalSite’s reviews array (including sessions)
    // Avoid adding duplicates using $addToSet
    await CulturalSite.findByIdAndUpdate(
      culturalSite,
      { $addToSet: { reviews: savedReview._id } },
      { session, new: true }, // new: true returns the document after update (not needed here, but good practice)
    );

    await session.commitTransaction(); // Commit when all operations are successful

    res.status(201).json({
      status: 'success',
      data: {
        review: savedReview,
      },
    });
  } catch (error) {
    await session.abortTransaction(); // Rollback in case of error
    console.error('Review creation transaction failed:', error);
    return next(
      new AppError('An error occurred while creating your review.', 500),
    );
  } finally {
    session.endSession(); // Session ends
  }
});

// Review updates (review authors only)
const updateReviewById = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    return next(new AppError('There are no reviews with that ID.', 404));
  }

  // Verify that the reviewer matches the currently logged in user
  if (review.user.toString() !== req.user.id) {
    return next(
      new AppError('You do not have permission to edit this review.', 403),
    );
  }

  const updatedReview = await Review.findByIdAndUpdate(
    req.params.reviewId,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: 'success',
    data: {
      review: updatedReview,
    },
  });
});

// Delete a review (reviewer or administrator)
const deleteReviewById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const review = await Review.findById(req.params.reviewId).session(session);
    if (!review) {
      await session.abortTransaction(); // Rollback if no reviews
      return next(new AppError('There are no reviews with that ID.', 404));
    }

    // Check if you are a reviewer or administrator
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      await session.abortTransaction(); // Rollback without permission
      return next(
        new AppError('You do not have permission to delete this review.', 403),
      );
    }

    // 1. Delete review document (including session)
    await Review.findByIdAndDelete(req.params.reviewId, { session });

    // 2. Remove from CulturalSite's reviews array (including sessions)
    await CulturalSite.findByIdAndUpdate(
      review.culturalSite,
      { $pull: { reviews: review._id } },
      { session },
    );

    // Remove removal logic from User.reviews array (remove field from User schema)

    await session.commitTransaction(); // Commit when all operations are successful

    res.status(204).json({
      // 204 No Content means the deletion was successful, but there is no data in the response body. [cite: 242]
      status: 'success',
      data: null,
    });
  } catch (error) {
    await session.abortTransaction(); // Rollback in case of error
    console.error('Review delete transaction failed:', error);
    return next(
      new AppError('An error occurred while deleting the review.', 500),
    );
  } finally {
    session.endSession(); // Session ends
  }
});

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReviewById,
  deleteReviewById,
};
