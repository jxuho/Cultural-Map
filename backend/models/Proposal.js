// Backend/models/proposal.js
const mongoose = require('mongoose');
const {
  CULTURAL_SITE_UPDATABLE_FIELDS,
} = require('../config/culturalSiteConfig'); // CULTURAL_SITE_UPDATABLE_FIELDS import

const proposalSchema = new mongoose.Schema(
  {
    culturalSite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CulturalSite',
      // culturalSite ID is required only when proposalType is not 'create'
      required: [
        function () {
          return this.proposalType !== 'create';
        },
        'The culturalSite ID is required when proposing a modification or deletion.',
      ],
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'The suggested user ID is required.'],
    },
    proposalType: {
      // Type of suggestion (add: 'delete')
      type: String,
      enum: ['create', 'update', 'delete'], // 'create': Proposal to register a new cultural heritage, 'update': Proposal to modify an existing cultural heritage, 'delete': Proposal to delete a cultural heritage
      required: [true, 'Proposal type is required.'],
    },
    // An object to store proposed changes in. May be empty for deletion proposals.
    proposedChanges: {
      type: mongoose.Schema.Types.Mixed,
      validate: {
        validator: function (v) {
          this.validatorMessage = 'The proposed change is invalid.';

          if (
            this.proposalType === 'update' ||
            this.proposalType === 'create'
          ) {
            if (!v || typeof v !== 'object' || Object.keys(v).length === 0) {
              this.validatorMessage =
                'For creation or modification proposals, the proposed change cannot be empty..';
              return false;
            }

            // ---Validation for 'create' type suggestions ---
            if (this.proposalType === 'create') {
              // Contains fields injected from the server (name, category must also be provided by the client)
              const requiredFieldsForCreate = [
                'name',
                'category',
                'location',
                'sourceId',
                'originalTags',
              ]; // Added 'originalTags'!
              for (const field of requiredFieldsForCreate) {
                if (
                  v[field] === undefined ||
                  v[field] === null ||
                  (typeof v[field] === 'string' && v[field].trim() === '')
                ) {
                  this.validatorMessage = `Required field (${field}) is missing when proposing a new cultural heritage.`;
                  return false;
                }
              }

              // location GeoJSON format validation (double-check that it was injected correctly by the server)
              if (
                v.location.type !== 'Point' ||
                !Array.isArray(v.location.coordinates) ||
                v.location.coordinates.length !== 2 ||
                v.location.coordinates[0] < -180 ||
                v.location.coordinates[0] > 180 ||
                v.location.coordinates[1] < -90 ||
                v.location.coordinates[1] > 90
              ) {
                this.validatorMessage =
                  'Valid location information is required when proposing a new cultural heritage site.';
                return false;
              }

              // Check whether only allowed fields are included (whitelist method)
              const allowedFieldsForCreate = new Set([
                ...CULTURAL_SITE_UPDATABLE_FIELDS,
                'sourceId',
                'location',
                'licenseInfo',
                'originalTags', // Added 'originalTags'! [cite: 95]
              ]);
              const proposedKeys = Object.keys(v);
              for (const key of proposedKeys) {
                if (!allowedFieldsForCreate.has(key)) {
                  this.validatorMessage = `The new cultural heritage proposal contains a field (${key}) that is not allowed.`;
                  return false;
                }
                // For 'create', proposedChanges should directly contain the new values.
                // We don't expect oldValue for 'create' type.
                if (
                  typeof v[key] === 'object' &&
                  v[key] !== null &&
                  ('oldValue' in v[key] || 'newValue' in v[key])
                ) {
                  this.validatorMessage = `For creation proposals, the proposedChanges field must directly contain the new value (not the oldValue, newValue structure) (${key})`;
                  return false;
                }
              }
            }

            // ---Field validation for 'update' type suggestions ---
            // ...keep the existing logic as is...
          } else if (this.proposalType === 'delete') {
            if (v && Object.keys(v).length > 0) {
              this.validatorMessage =
                'Proposals for cultural heritage deletion cannot include changes.';
              return false;
            }
          }
          return true;
        },
        message: function () {
          return this.validatorMessage || 'The proposed change is invalid.';
        },
      },
    },
    proposalMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Your proposal message cannot exceed 500 characters..'],
      default: '', // Default if no message
    },
    status: {
      // Status of offer (pending, accepted, rejected)
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [
        function () {
          return this.status === 'accepted' || this.status === 'rejected';
        },
        'If the proposal is reviewed, the reviewed administrator ID is required.',
      ],
    },
    adminComment: {
      type: String,
      required: [
        function () {
          return this.status === 'accepted' || this.status === 'rejected';
        },
        'Administrator comments are required if the proposal is reviewed.',
      ],
    },
    reviewedAt: Date, // Proposal Review Date
  },
  {
    timestamps: true, // automatically added createdAt, updatedAt
  },
);

proposalSchema.index(
  { culturalSite: 1, proposedBy: 1, status: 1 },
  {
    unique: true,
    // In this index, the proposalType is not 'create',
    // Applies only if the culturalSite field exists and is not null.
    // That is, proposals of type 'create' (where culturalSite is null) are not subject to this uniqueness constraint.
    partialFilterExpression: {
      proposalType: { $ne: 'create' },
      culturalSite: { $exists: true, $ne: null },
    },
    name: 'unique_pending_update_delete_proposal', // Name your index clearly
  },
);

module.exports = mongoose.model('Proposal', proposalSchema);
