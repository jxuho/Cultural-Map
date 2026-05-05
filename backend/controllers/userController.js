require('dotenv').config();
const User = require('../models/User');
const Review = require('../models/Review');
const Proposal = require('../models/Proposal');
const CulturalSite = require('../models/CulturalSite');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

// Get my information (GET /api/v1/users/me)
const getMe = asyncHandler(async (req, res, next) => {
  // req.user is the current login user object set by the authentication middleware (authController.protect).
  // This object is a user document retrieved from MongoDB.
  if (!req.user) {
    return next(new AppError('Cannot find the user.', 401));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

// Update my information (PATCH /api/v1/users/updateMe)
const updateMe = asyncHandler(async (req, res, next) => {
  // 1. Allowed fields
  const filteredBody = {};
  const allowedFields = ['username', 'profileImage', 'bio'];

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // 2. Update User Info.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // Returning updated doc.
    runValidators: true, // model schema validity check. Run validation of model schema
  });

  res.status(200).json({
    status: 'success',
    message: 'Profile is updated successfully.',
    data: {
      user: updatedUser,
    },
  });
});

// Delete my account Delete my information (DELETE /api/v1/users/deleteMe)
const deleteMe = asyncHandler(async (req, res, next) => {
  const userToDelete = await User.findById(req.user.id);

  if (!userToDelete) {
    return next(new AppError('Cannot find the user.', 404));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = userToDelete._id;
    const userFavoriteSites = userToDelete.favoriteSites;

    // 1. User hard delete
    await User.findByIdAndDelete(userId, { session });

    // 2. Change the value of the corresponding field in the CulturalSite document with this user as proposedBy to null
    await CulturalSite.updateMany(
      { proposedBy: userId },
      { $set: { proposedBy: null } },
      { session },
    );

    // 3. Hard delete all reviews written by this user
    //    (And reduce the reviewsCount of the CulturalSite to which the reviews belong and remove the ObjectId from the reviews array)
    const reviewsToDelete = await Review.find({ user: userId }).session(
      session,
    );

    if (reviewsToDelete.length > 0) {
      // First extract the ID list of reviews to be deleted
      const reviewIdsToDelete = reviewsToDelete.map((review) => review._id);

      // Delete the review document itself
      await Review.deleteMany({ user: userId }, { session });

      // Collect all CulturalSite IDs linked to the reviews without duplication
      const affectedCulturalSiteIds = [
        ...new Set(
          reviewsToDelete.map((review) => review.culturalSite.toString()),
        ),
      ];

      // For each CulturalSite, remove deleted review IDs from the reviews array and accurately decrease reviewsCount.
      for (const siteId of affectedCulturalSiteIds) {
        // Calculate how many reviews this user has written for this specific cultural property
        const reviewsCountForThisSiteByUser = reviewsToDelete.filter(
          (review) => review.culturalSite.toString() === siteId,
        ).length;

        await CulturalSite.findByIdAndUpdate(
          siteId,
          {
            $pullAll: { reviews: reviewIdsToDelete }, // Remove corresponding IDs from CulturalSite's reviews array
            $inc: { reviewsCount: -reviewsCountForThisSiteByUser }, // Decrease the reviewsCount of the cultural heritage
          },
          { session },
        );
      }
    }

    // 4. Hard delete all Proposals documents proposed by this user
    await Proposal.deleteMany({ proposedBy: userId }, { session });

    // 5. Set the favoritesCount of all CulturalSites added as favorites by this user to -1
    if (userFavoriteSites && userFavoriteSites.length > 0) {
      await CulturalSite.updateMany(
        { _id: { $in: userFavoriteSites } },
        { $inc: { favoritesCount: -1 } },
        { session },
      );
    }

    await session.commitTransaction();

    res.cookie('jwt', 'loggedout', {
      expires: new Date(0),
      httpOnly: true, // Prevent JavaScript access (recommended for security)
      sameSite: 'Lax', // CSRF protection (select 'None' or 'Strict' depending on situation)
      secure: process.env.NODE_ENV === 'production', // Transmit only in HTTPS environment (operating environment required)
      path: '/',
    });

    res.status(200).json({
      status: 'success',
      message: 'User deletion success',
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('User delete transaction fail: ', error);
    return next(
      new AppError(
        'An error occured during delete the user. Please try again.',
        500,
      ),
    );
  } finally {
    session.endSession();
  }
});

// Get the user by id (GET /api/v1/users/:userId)
const getUserById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Select only the fields you want
  const user = await User.findById(userId).select(
    '_id username email profileImage bio',
  );

  if (!user) {
    return next(new AppError('No user with that ID found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// Get all users list Get all users (GET /api/v1/users)
const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// Add to favorites
const addFavoriteSite = asyncHandler(async (req, res, next) => {
  const { siteId } = req.params;

  if (!siteId) {
    return next(
      new AppError('The cultural site ID to be added is essential.', 400),
    );
  }

  // Checking for CulturalSite and User existence is first performed outside of the transaction.
  // This increases efficiency by avoiding starting transactions on non-existent documents.
  const culturalSite = await CulturalSite.findById(siteId);
  if (!culturalSite) {
    return next(
      new AppError('Cannot find a cultural site with that ID..', 404),
    );
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('Cannot find the user.', 404));
  }

  if (user.favoriteSites.includes(siteId)) {
    return next(new AppError('Already added.', 400));
  }

  const session = await mongoose.startSession(); // Start session
  session.startTransaction(); // start transaction

  try {
    // 1. Add to the user's favoriteSites array (along with the session)
    // You can use Mongoose's $addToSet operator to avoid duplicate additions and make updates more efficient.
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favoriteSites: siteId } }, // Add siteId to array (do not add if duplicate)
      { new: true, runValidators: false, session }, // Session Delivery
    );

    if (!updatedUser) {
      // In exceptional cases, such as users being deleted at the same time
      await session.abortTransaction();
      session.endSession();
      return next(new AppError('Cannot find the user.', 404));
    }

    // 2. FavoritesCount of the cultural heritage increases by 1 (with session)
    const updatedCulturalSite = await CulturalSite.findByIdAndUpdate(
      siteId,
      { $inc: { favoritesCount: 1 } }, // Increment favoritesCount field by 1
      { new: true, runValidators: true, session }, // Session Delivery
    );

    if (!updatedCulturalSite) {
      // In exceptional cases, such as when cultural heritage is simultaneously deleted
      await session.abortTransaction();
      session.endSession();
      return next(new AppError('Cannot find the cultural site', 404));
    }

    await session.commitTransaction(); // Commit if all operations are successful
    session.endSession(); // Session ends

    res.status(200).json({
      status: 'success',
      message: 'Successfully added.',
      data: {
        user: updatedUser, // Returns updated user information
        culturalSite: updatedCulturalSite, // Updated cultural heritage information is also returned.
      },
    });
  } catch (error) {
    await session.abortTransaction(); // Rollback all changes in case of error
    session.endSession();
    console.error('Transaction error:', error);
    // Provide clearer error messages to clients
    if (error.name === 'ValidationError') {
      return next(new AppError(`Data validation error: ${error.message}`, 400));
    }
    return next(new AppError('An error occured. please try again.', 500));
  }
});

// Remove favorites
const removeFavoriteSite = asyncHandler(async (req, res, next) => {
  const { siteId } = req.params;

  if (!siteId) {
    return next(
      new AppError('The cultural site ID to be removed is essential.', 400),
    );
  }

  const culturalSite = await CulturalSite.findById(siteId);
  if (!culturalSite) {
    return next(new AppError('Cannot find the cultural site.', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('Cannot find the user.', 404));
  }

  const session = await mongoose.startSession(); // Start session
  session.startTransaction(); // start transaction

  try {
    const initialLength = user.favoriteSites.length;

    // 1. Remove from the user's favoriteSites array (along with the session)
    user.favoriteSites = user.favoriteSites.filter(
      (favSiteId) => favSiteId.toString() !== siteId.toString(),
    );

    if (user.favoriteSites.length === initialLength) {
      await session.abortTransaction(); // Rollback if no changes are made
      session.endSession();
      return next(
        new AppError('There is no cultural site in the favorites.', 404),
      );
    }

    await user.save({ validateBeforeSave: false, session }); // Session Delivery

    // 2. Decrease favoritesCount of the cultural heritage by 1 (with session)
    await CulturalSite.findByIdAndUpdate(
      siteId,
      { $inc: { favoritesCount: -1 } },
      { new: true, runValidators: true, session }, // Session Delivery
    );

    await session.commitTransaction(); // Commit if all operations are successful
    session.endSession(); // Session ends

    res.status(200).json({
      status: 'success',
      message: 'Successfully removed.',
      data: {
        user: user,
      },
    });
  } catch (error) {
    await session.abortTransaction(); // Rollback all changes in case of error
    session.endSession();
    console.error('Transaction error:', error);
    return next(new AppError('An error occured. please try again.', 500));
  }
});

// View favorites
const getFavoriteSites = asyncHandler(async (req, res, next) => {
  // 1. Get the ID of the currently logged in user. (assuming req.user.id is set via authentication middleware)
  const userId = req.user.id;

  // 2. Find the user document and get an array of heritage site IDs from the favoriteSites field.
  const user = await User.findById(userId).select('favoriteSites');

  if (!user) {
    return next(new AppError('cannot find the user.', 404));
  }

  // List of user's favorite IDs
  const favoriteSiteIds = user.favoriteSites;

  // 3. Find the cultural site corresponding to your favorite ID in the CulturalSite collection,
  //    Create an aggregation pipeline to calculate the averageRating and reviewCount of each cultural heritage site.
  const pipeline = [];

  // 3.1. $match: Select only cultural sites that match IDs in the user's favoriteSites array
  pipeline.push({
    $match: {
      _id: { $in: favoriteSiteIds },
    },
  });

  // 3.2. $lookup: Joins with the review collection to retrieve review data for each cultural heritage site.
  pipeline.push({
    $lookup: {
      from: 'reviews', // Collection name for the Review model (usually lowercase, plural in MongoDB)
      localField: 'reviews', // The reviews field in the CulturalSite model (array of reviews ObjectIds)
      foreignField: '_id', // _id field in Review model
      as: 'reviewsData', // Temporary field name where joined review data will be stored
    },
  });

  // 3.3. $addFields: Calculates averageRating and reviewCount and adds them as new fields.
  pipeline.push({
    $addFields: {
      averageRating: { $ifNull: [{ $avg: '$reviewsData.rating' }, 0] }, // Calculate the average of the rating field in reviewsData, otherwise 0
      reviewCount: { $size: '$reviewsData' }, // Calculate the size (number of reviews) of the reviewsData array
    },
  });

  // 3.4. $project: Select fields to be included in the final response.
  // Include all required fields, similar to those used in getAllCulturalSites.
  pipeline.push({
    $project: {
      name: 1,
      description: 1,
      category: 1,
      location: 1, // geographic information
      address: 1,
      website: 1,
      imageUrl: 1, // image url
      openingHours: 1,
      licenseInfo: 1,
      sourceId: 1,
      favoritesCount: 1, // Number of favorites included if present in CulturalSite model
      proposedBy: 1,
      registeredBy: 1,
      createdAt: 1,
      updatedAt: 1,
      averageRating: 1, // Newly calculated average rating
      reviewCount: 1, // Newly calculated number of reviews
    },
  });

  // 4. Run the aggregation pipeline
  const favoriteSitesWithRatings = await CulturalSite.aggregate(pipeline);

  res.status(200).json({
    status: 'success',
    results: favoriteSitesWithRatings.length,
    data: {
      favoriteSites: favoriteSitesWithRatings,
    },
  });
});

const getMyReviews = asyncHandler(async (req, res, next) => {
  // Find reviews based on the currently logged in user ID.
  // req.user is user information set in the protect middleware.
  if (!req.user || !req.user.id) {
    return next(new AppError('There is no user info.', 401));
  }

  const queryObj = { user: req.user.id };

  // Apply query parameters (sorting, etc.) using APIFeatures.
  let query = Review.find(queryObj);

  // We also populate culturalSite and user information linked to the review.
  query = query
    .populate({
      path: 'culturalSite',
      select: 'name imageUrl address', // Select only the fields you need
    })
    .populate({
      path: 'user',
      select: 'username profileImage', // Select only the fields you need
    });

  // Sorting logic (received from the client as a reviewSort query parameter)
  if (req.query.reviewSort === 'newest') {
    query = query.sort('-createdAt');
  } else if (req.query.reviewSort === 'highestRating') {
    query = query.sort('-rating');
  } else if (req.query.reviewSort === 'lowestRating') {
    query = query.sort('rating');
  } else {
    // Default sorting: Newest
    query = query.sort('-createdAt');
  }

  const reviews = await query;

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

module.exports = {
  getMe,
  updateMe,
  deleteMe,
  getUserById,
  getAllUsers,
  addFavoriteSite,
  removeFavoriteSite,
  getFavoriteSites,
  getMyReviews,
};
