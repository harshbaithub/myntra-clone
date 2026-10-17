const mongoose = require("mongoose");

const BagItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    size: { type: String, default: "M" },
    color: { type: String, default: "Standard" },
    quantity: { type: Number, required: true, default: 1, min: 1, max: 10 },
    priceWhenAdded: { type: Number },
    isSavedForLater: { type: Boolean, default: false, index: true },
    savedForLaterAt: { type: Date },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to guarantee that concurrent requests from multiple devices merge instead of duplicating
BagItemSchema.index(
  { userId: 1, productId: 1, size: 1, color: 1, isSavedForLater: 1 },
  { unique: true }
);

module.exports = mongoose.model("Bag", BagItemSchema);
