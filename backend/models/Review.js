// backend/models/review.js
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

// 한 사용자가 한 장소에 하나의 리뷰만 남길 수 있도록 고유 인덱스 설정
reviewSchema.index({ user: 1, culturalSite: 1 }, { unique: true });

// 🌟 [비정규화 로직] 평점 및 리뷰 개수를 계산하여 CulturalSite 모델을 업데이트하는 함수
reviewSchema.statics.calcAverageRatings = async function (siteId) {
  const stats = await this.aggregate([
    {
      $match: { culturalSite: siteId },
    },
    {
      $group: {
        _id: '$culturalSite',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('CulturalSite').findByIdAndUpdate(siteId, {
      reviewCount: stats[0].nRating,
      averageRating: stats[0].avgRating,
    });
  } else {
    // 해당 장소에 리뷰가 하나도 없는 경우 초기화
    await mongoose.model('CulturalSite').findByIdAndUpdate(siteId, {
      reviewCount: 0,
      averageRating: 0,
    });
  }
};

// 🌟 [미들웨어] 새 리뷰가 저장(save)된 후 평점 업데이트
reviewSchema.post('save', function () {
  // this는 현재 저장된 리뷰 문서를 가리킵니다.
  // constructor는 모델(Review)을 가리킵니다.
  this.constructor.calcAverageRatings(this.culturalSite);
});

// 🌟 [미들웨어] 리뷰가 수정되거나 삭제된 후 평점 업데이트
// findOneAndUpdate나 findOneAndDelete가 실행될 때 작동합니다.
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.culturalSite);
  }
});

module.exports = mongoose.model('Review', reviewSchema);