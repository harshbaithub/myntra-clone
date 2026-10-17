const express = require("express");
const {
  getYouMayAlsoLikeRecommendations,
  getTrendingProducts,
} = require("../services/recommendationService");

const router = express.Router();

/**
 * GET /recommendations/you-may-also-like
 * Query params: userId, productId, limit
 */
router.get("/you-may-also-like", async (req, res) => {
  try {
    const { userId, productId, limit = 10 } = req.query;
    const recommendations = await getYouMayAlsoLikeRecommendations({
      userId,
      productId,
      limit: parseInt(limit, 10) || 10,
    });

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({ message: "Failed to generate recommendations", error: error.message });
  }
});

/**
 * GET /recommendations/trending
 */
router.get("/trending", async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const trending = await getTrendingProducts(parseInt(limit, 10) || 8);
    res.status(200).json({
      success: true,
      count: trending.length,
      data: trending,
    });
  } catch (error) {
    console.error("Trending error:", error);
    res.status(500).json({ message: "Failed to fetch trending items", error: error.message });
  }
});

module.exports = router;
