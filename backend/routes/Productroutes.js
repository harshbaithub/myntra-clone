const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/:id", async (req, res) => {
  const productid = req.params.id;
  if (!productid || !mongoose.Types.ObjectId.isValid(productid)) {
    return res.status(404).json({ message: "Invalid product ID format" });
  }
  try {
    const product = await Product.findById(productid);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

module.exports = router;
