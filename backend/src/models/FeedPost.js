const mongoose = require('mongoose');

const FEED_STATUS = {
  PUBLISHED: 'PUBLISHED',
  DRAFT: 'DRAFT'
};

const feedPostSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 160 },
    content: { type: String, trim: true, required: true, maxlength: 4000 },
    image: {
      originalUrl: { type: String, trim: true },
      mobileUrl: { type: String, trim: true, required: true },
      webUrl: { type: String, trim: true, required: true }
    },
    status: { type: String, enum: Object.values(FEED_STATUS), default: FEED_STATUS.PUBLISHED, index: true },
    publishedAt: { type: Date, default: Date.now, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true,
    collection: 'feed_posts'
  }
);

feedPostSchema.index({ status: 1, publishedAt: -1 });

const FeedPost = mongoose.model('FeedPost', feedPostSchema);

module.exports = { FeedPost, FEED_STATUS };
