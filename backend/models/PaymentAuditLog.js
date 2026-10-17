const mongoose = require("mongoose");

const PaymentAuditLogSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    gateway: {
      type: String,
      default: "Razorpay",
    },
    eventType: {
      type: String,
      enum: [
        "payment.authorized",
        "payment.captured",
        "payment.failed",
        "refund.created",
        "refund.processed",
        "order.reordered",
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    signature: { type: String },
    verificationStatus: {
      type: String,
      enum: ["VERIFIED", "FAILED_SIGNATURE", "DUPLICATE_IDEMPOTENT", "PENDING"],
      default: "VERIFIED",
    },
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    rawPayload: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentAuditLog", PaymentAuditLogSchema);
