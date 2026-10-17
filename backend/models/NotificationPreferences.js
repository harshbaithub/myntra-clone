const mongoose = require("mongoose");

const NotificationPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    orderUpdates: {
      type: Boolean,
      default: true,
    },
    paymentUpdates: {
      type: Boolean,
      default: true,
    },
    shippingAndDelivery: {
      type: Boolean,
      default: true,
    },
    wishlistPriceDrops: {
      type: Boolean,
      default: true,
    },
    backInStock: {
      type: Boolean,
      default: true,
    },
    promotions: {
      type: Boolean,
      default: true,
    },
    abandonedCart: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "NotificationPreferences",
  NotificationPreferencesSchema
);
