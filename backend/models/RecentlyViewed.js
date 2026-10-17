const mongoose = require("mongoose");

const ViewedItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

const RecentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    products: [ViewedItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecentlyViewed", RecentlyViewedSchema);
