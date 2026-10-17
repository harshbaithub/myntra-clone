const mongoose = require("mongoose");

const NotificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "order_confirmation",
        "payment_update",
        "shipping_update",
        "delivery_status",
        "price_drop",
        "back_in_stock",
        "promotional",
        "abandoned_cart",
        "system_alert",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "delivered", "failed", "invalid_token", "skipped_by_user_preference"],
      default: "pending",
      index: true,
    },
    receiptId: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationLog", NotificationLogSchema);
