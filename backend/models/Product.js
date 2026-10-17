const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: String },
    description: { type: String },
    stock: { type: Number, default: 20 },
    color: { type: String, default: "Standard" },
    sizes: [String],
    images: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
