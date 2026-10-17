const express = require("express");
const mongoose = require("mongoose");
const RecentlyViewed = require("../models/RecentlyViewed");
const Order = require("../models/Order");
const Product = require("../models/Product");

const router = express.Router();
const MAX_RECENT_ITEMS = 50;

// 1. Record product view
router.post("/view", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid userId or productId" });
    }

    // Verify product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    let record = await RecentlyViewed.findOne({ userId });

    if (!record) {
      record = new RecentlyViewed({
        userId,
        products: [{ productId, viewedAt: new Date() }],
      });
    } else {
      // Remove existing occurrence if already in list to avoid duplicates
      const filtered = record.products.filter(
        (p) => p.productId && p.productId.toString() !== productId.toString()
      );

      // Prepend newest view at the start
      filtered.unshift({
        productId,
        viewedAt: new Date(),
      });

      // Maintain max 20 entries
      record.products = filtered.slice(0, MAX_RECENT_ITEMS);
    }

    await record.save();

    // Populate and return updated list
    const populated = await RecentlyViewed.findById(record._id).populate("products.productId");
    const validProducts = (populated.products || [])
      .filter((item) => item.productId !== null)
      .map((item) => ({
        ...item.productId.toObject(),
        viewedAt: item.viewedAt,
      }));

    res.status(200).json({
      success: true,
      data: validProducts,
    });
  } catch (error) {
    console.error("Error recording product view:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. Get recently viewed products
router.get("/recently-viewed/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const record = await RecentlyViewed.findOne({ userId }).populate("products.productId");

    if (!record) {
      return res.status(200).json({ success: true, data: [] });
    }

    const validProducts = (record.products || [])
      .filter((item) => item.productId !== null)
      .map((item) => ({
        ...item.productId.toObject(),
        viewedAt: item.viewedAt,
      }));

    res.status(200).json({
      success: true,
      data: validProducts,
    });
  } catch (error) {
    console.error("Error fetching recently viewed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. Sync anonymous history with user account on login
router.post("/sync", async (req, res) => {
  try {
    const { userId, localProductIds } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid userId is required" });
    }

    const validLocalIds = Array.isArray(localProductIds)
      ? localProductIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    let record = await RecentlyViewed.findOne({ userId });

    const mergedProductMap = new Map();

    // Prepend local (anonymous) products first (ordered newest first)
    const now = Date.now();
    validLocalIds.forEach((idStr, idx) => {
      mergedProductMap.set(idStr.toString(), new Date(now - idx * 1000));
    });

    // Add existing user products from server if not already added
    if (record && record.products) {
      record.products.forEach((p) => {
        if (p.productId) {
          const idStr = p.productId.toString();
          if (!mergedProductMap.has(idStr)) {
            mergedProductMap.set(idStr, p.viewedAt || new Date());
          }
        }
      });
    }

    // Convert map to array capped at MAX_RECENT_ITEMS
    const mergedList = [];
    for (const [prodId, viewedTime] of mergedProductMap.entries()) {
      mergedList.push({
        productId: prodId,
        viewedAt: viewedTime,
      });
      if (mergedList.length >= MAX_RECENT_ITEMS) break;
    }

    if (!record) {
      record = new RecentlyViewed({
        userId,
        products: mergedList,
      });
    } else {
      record.products = mergedList;
    }

    await record.save();

    const populated = await RecentlyViewed.findById(record._id).populate("products.productId");
    const validProducts = (populated.products || [])
      .filter((item) => item.productId !== null)
      .map((item) => ({
        ...item.productId.toObject(),
        viewedAt: item.viewedAt,
      }));

    res.status(200).json({
      success: true,
      data: validProducts,
    });
  } catch (error) {
    console.error("Error syncing recently viewed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 4. Continue Shopping: Viewed but NOT purchased products
router.get("/continue-shopping/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Fetch recently viewed
    const record = await RecentlyViewed.findOne({ userId }).populate("products.productId");
    if (!record || !record.products || record.products.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Fetch user orders to identify purchased items
    const orders = await Order.find({ userId });
    const purchasedProductIds = new Set();

    orders.forEach((order) => {
      const items = order.items || order.item || [];
      items.forEach((item) => {
        if (item.productId) {
          purchasedProductIds.add(item.productId.toString());
        }
      });
    });

    // Filter out purchased products
    const continueShoppingItems = record.products
      .filter(
        (item) =>
          item.productId !== null &&
          !purchasedProductIds.has(item.productId._id.toString())
      )
      .map((item) => ({
        ...item.productId.toObject(),
        viewedAt: item.viewedAt,
      }));

    res.status(200).json({
      success: true,
      data: continueShoppingItems,
    });
  } catch (error) {
    console.error("Error fetching continue shopping items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 5. Delete specific item or clear entire history
router.delete("/recently-viewed/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (productId) {
      await RecentlyViewed.updateOne(
        { userId },
        { $pull: { products: { productId } } }
      );
    } else {
      await RecentlyViewed.updateOne(
        { userId },
        { $set: { products: [] } }
      );
    }

    res.status(200).json({ success: true, message: "History updated successfully" });
  } catch (error) {
    console.error("Error clearing recently viewed history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
