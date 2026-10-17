const mongoose = require("mongoose");
const Product = require("../models/Product");
const RecentlyViewed = require("../models/RecentlyViewed");
const Wishlist = require("../models/Wishlist");
const Order = require("../models/Order");

// In-memory lightweight cache with 60s TTL for trending/popular queries to reduce DB hits
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get personalized "You May Also Like" recommendations
 * @param {Object} options
 * @param {string} [options.userId] - Current user ID (optional)
 * @param {string} [options.productId] - Context product ID (optional, e.g. on PDP)
 * @param {number} [options.limit=10] - Number of recommendations to return
 */
async function getYouMayAlsoLikeRecommendations({ userId, productId, limit = 10 }) {
  const maxLimit = Math.min(30, parseInt(limit, 10) || 10);
  const cacheKey = `rec_${userId || "guest"}_${productId || "none"}_${maxLimit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const excludedProductIds = new Set();
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    excludedProductIds.add(productId.toString());
  }

  const brandAffinities = new Map();

  let contextProduct = null;
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    contextProduct = await Product.findById(productId).lean();
    if (contextProduct && contextProduct.brand) {
      brandAffinities.set(contextProduct.brand, 4);
    }
  }

  // If user is logged in, extract signals from 3 sources: Views, Wishlist, Orders
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const userObjId = new mongoose.Types.ObjectId(userId);

    const [recentDoc, wishlistItems, orders] = await Promise.all([
      RecentlyViewed.findOne({ userId: userObjId }).populate("products.productId").lean(),
      Wishlist.find({ userId: userObjId }).populate("productId").lean(),
      Order.find({ userId: userObjId }).lean(),
    ]);

    // 1. Process Past Orders (Highest Weight + 5, and exclude purchased items)
    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        (order.items || []).forEach((item) => {
          if (item.productId) {
            const pid = item.productId.toString();
            excludedProductIds.add(pid);
            if (item.brand) {
              brandAffinities.set(item.brand, (brandAffinities.get(item.brand) || 0) + 5);
            }
          }
        });
      });
    }

    // 2. Process Wishlist Items (Weight + 3)
    if (wishlistItems && wishlistItems.length > 0) {
      wishlistItems.forEach((w) => {
        if (w.productId) {
          const p = w.productId;
          if (p.brand) {
            brandAffinities.set(p.brand, (brandAffinities.get(p.brand) || 0) + 3);
          }
        }
      });
    }

    // 3. Process Browsing History (Weight + 2)
    if (recentDoc && recentDoc.products) {
      recentDoc.products.forEach((entry) => {
        if (entry.productId) {
          const p = entry.productId;
          if (p.brand) {
            brandAffinities.set(p.brand, (brandAffinities.get(p.brand) || 0) + 2);
          }
        }
      });
    }
  }

  // Find top preferred brands
  const sortedBrands = [...brandAffinities.entries()]
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])
    .slice(0, 3);

  // In-stock criteria (stock !== 0)
  const inStockCondition = { $or: [{ stock: { $gt: 0 } }, { stock: { $exists: false } }, { stock: null }] };

  // Exclude criteria
  const excludeQuery = {
    ...inStockCondition,
    _id: { $nin: [...excludedProductIds].map((id) => new mongoose.Types.ObjectId(id)) },
  };

  let recommendedProducts = [];

  // 1. Preferred Brands Match
  if (sortedBrands.length > 0) {
    const brandMatches = await Product.find({
      ...excludeQuery,
      brand: { $in: sortedBrands },
    })
      .limit(maxLimit)
      .lean();

    recommendedProducts.push(
      ...brandMatches.map((p) => ({
        ...p,
        recommendationReason: `Based on your love for ${p.brand}`,
      }))
    );
  }

  // 2. Backfill with Trending/Popular products
  if (recommendedProducts.length < maxLimit) {
    const needed = maxLimit - recommendedProducts.length;
    const existingRecIds = new Set(recommendedProducts.map((p) => p._id.toString()));
    const additionalExcludes = [...excludedProductIds, ...existingRecIds].map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const popularBackfill = await Product.find({
      ...inStockCondition,
      _id: { $nin: additionalExcludes },
    })
      .sort({ price: -1, createdAt: -1 })
      .limit(needed)
      .lean();

    recommendedProducts.push(
      ...popularBackfill.map((p) => ({
        ...p,
        recommendationReason: "Trending & Best Seller",
      }))
    );
  }

  // 3. Fallback if exclusions filter out all items
  if (recommendedProducts.length === 0) {
    const fallback = await Product.find({})
      .limit(maxLimit)
      .lean();
    recommendedProducts = fallback.map((p) => ({
      ...p,
      recommendationReason: "Popular Choice",
    }));
  }

  const result = recommendedProducts.slice(0, maxLimit);
  setCache(cacheKey, result);
  return result;
}

/**
 * Get Trending & Popular products
 */
async function getTrendingProducts(limit = 8) {
  const cacheKey = `trending_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const inStockCondition = { $or: [{ stock: { $gt: 0 } }, { stock: { $exists: false } }, { stock: null }] };

  const products = await Product.find(inStockCondition)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const result = products.map((p) => ({
    ...p,
    recommendationReason: "🔥 Trending Right Now",
  }));

  setCache(cacheKey, result);
  return result;
}

module.exports = {
  getYouMayAlsoLikeRecommendations,
  getTrendingProducts,
};
