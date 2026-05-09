// backend/models/culturalSite.js
const mongoose = require('mongoose');
const { CULTURAL_CATEGORY } = require('../config/culturalSiteConfig');

const culturalSiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [100, 'Name cannot be over 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be over 1000 characters.'],
    },
    category: {
      type: String,
      enum: CULTURAL_CATEGORY,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'], // GeoJSON Point
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere', // Indexes for geospatial queries
        validate: {
          validator: function (v) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 &&
              v[1] >= -90 &&
              v[1] <= 90
            );
          },
          message:
            'Not valid coordinates. lon must be between -180~180, lat must be between -90~90.',
        },
      },
    },
    address: {
      fullAddress: String, 
      street: String,      
      houseNumber: String, 
      postcode: String,    
      district: String,    
      city: { type: String, default: 'Berlin' }
    },
    website: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    openingHours: {
      type: String,
      trim: true,
    },
    licenseInfo: {
      type: String,
      default: 'Data © OpenStreetMap contributors, ODbL.', // Basic licensing information
      trim: true,
    },
    sourceId: {
      // Overpass API's OSM ID (node/way/relation ID)
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    favoritesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Preserve data by saving the ‘properties’ object of the original GeoJSON data as is
    originalTags: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    active: {
      //Field for soft delete. Not implemented.
      type: Boolean,
      default: true,
      select: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be above 0'],
      max: [5, 'Rating must be below 5'],
      // 소수점 한 자리까지 반올림 (예: 4.666 -> 4.7)
      set: (val) => Math.round(val * 10) / 10,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt Automatically add timestamps
  },
);

culturalSiteSchema.index({ averageRating: -1 });
culturalSiteSchema.index({ reviewCount: -1 });

module.exports = mongoose.model('CulturalSite', culturalSiteSchema);
