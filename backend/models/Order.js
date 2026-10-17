const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  title: { type: String },
  location: { type: String, default: "Fulfillment Center" },
  timestamp: { type: Date, default: Date.now },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
});

const TrackingSchema = new mongoose.Schema({
  number: { type: String },
  carrier: { type: String, default: "Express Logistics" },
  estimatedDelivery: { type: Date },
  currentLocation: { type: String, default: "In Transit" },
  status: {
    type: String,
    enum: [
      "Processing",
      "Confirmed",
      "Shipped",
      "In Transit",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Return Requested",
      "Returned",
    ],
    default: "Processing",
  },
  timeline: [TimelineSchema],
});

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  size: { type: String, default: "M" },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  title: { type: String },
  brand: { type: String },
  image: { type: String },
});

const PaymentDetailsSchema = new mongoose.Schema({
  method: { type: String, default: "COD" },
  transactionId: { type: String },
  status: { type: String, enum: ["Pending", "Success", "Failed", "Refunded"], default: "Success" },
  paidAt: { type: Date, default: Date.now },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invoiceNumber: { type: String, unique: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: [
        "Processing",
        "Confirmed",
        "Shipped",
        "In Transit",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Return Requested",
        "Returned",
      ],
      default: "Processing",
      index: true,
    },
    items: [OrderItemSchema],
    total: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    shippingAddressDetails: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentMethod: { type: String, default: "COD", index: true },
    paymentDetails: PaymentDetailsSchema,
    tracking: TrackingSchema,
    cancellation: {
      isCancelled: { type: Boolean, default: false },
      reason: String,
      cancelledAt: Date,
      refundStatus: { type: String, enum: ["None", "Pending", "Processed", "Failed"], default: "None" },
      refundAmount: Number,
    },
    returnRequest: {
      isRequested: { type: Boolean, default: false },
      reason: String,
      requestedAt: Date,
      status: { type: String, enum: ["None", "Requested", "Approved", "Picked Up", "Refunded", "Rejected"], default: "None" },
      pickupAddress: String,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate invoice number if not set
OrderSchema.pre("save", function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.invoiceNumber = `INV-${year}-${randomHex}`;
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
