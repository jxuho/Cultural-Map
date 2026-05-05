const mongoose = require('mongoose');
const excludeSourceIdSchema = new mongoose.Schema(
  {
    sourceId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);
const ExcludeSourceId = mongoose.model(
  'ExcludeSourceId',
  excludeSourceIdSchema,
);
module.exports = ExcludeSourceId;
