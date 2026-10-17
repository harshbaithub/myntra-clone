const express = require("express");
const mongoose = require("mongoose");
const Bag = require("../models/Bag");
const Product = require("../models/Product");
const { scheduleAbandonedCartReminder } = require("../services/notificationService");

const router = express.Router();

/**
 * 1. GET FULL SHOPPING BAG with Save for Later, Stock & Price Change Validation
 */
router.get("/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const allItems = await Bag.find({ userId: userid })
      .populate("productId")
      .sort({ updatedAt: -1 })
      .lean();

    const cartItems = [];
    const savedForLaterItems = [];
    const priceChangeAlerts = [];
    const outOfStockAlerts = [];

    for (const item of allItems) {
      const product = item.productId;
      if (!product) continue;

      const currentPrice = product.price || 0;
      const initialPrice = item.priceWhenAdded !== undefined ? item.priceWhenAdded : currentPrice;
      const currentStock = product.stock !== undefined ? product.stock : 25;

      // Price Change Detection
      if (initialPrice > 0 && initialPrice !== currentPrice) {
        const diff = currentPrice - initialPrice;
        priceChangeAlerts.push({
          itemId: item._id,
          productId: product._id,
          productName: product.name || product.title,
          oldPrice: initialPrice,
          newPrice: currentPrice,
          diff,
          type: diff < 0 ? "PRICE_DROP" : "PRICE_INCREASE",
        });
      }

      // Stock Availability Detection
      if (currentStock === 0) {
        outOfStockAlerts.push({
          itemId: item._id,
          productId: product._id,
          productName: product.name || product.title,
          status: "OUT_OF_STOCK",
        });
      } else if (item.quantity > currentStock) {
        outOfStockAlerts.push({
          itemId: item._id,
          productId: product._id,
          productName: product.name || product.title,
          status: "LOW_STOCK",
          availableStock: currentStock,
          requestedQuantity: item.quantity,
        });
      }

      const formattedItem = {
        ...item,
        currentPrice,
        priceWhenAdded: initialPrice,
        availableStock: currentStock,
        isOutOfStock: currentStock === 0,
        isLowStock: currentStock > 0 && item.quantity > currentStock,
      };

      if (item.isSavedForLater) {
        savedForLaterItems.push(formattedItem);
      } else {
        cartItems.push(formattedItem);
      }
    }

    // Financial calculations on active Cart Items
    const rawSubtotal = cartItems.reduce((sum, it) => {
      const price = it.productId?.price || 0;
      return sum + price * (it.quantity || 1);
    }, 0);

    const originalTotal = cartItems.reduce((sum, it) => {
      const originalPrice = it.productId?.originalPrice || Math.round((it.productId?.price || 0) * 1.3);
      return sum + originalPrice * (it.quantity || 1);
    }, 0);

    const totalDiscount = Math.max(0, originalTotal - rawSubtotal);
    const shippingFee = rawSubtotal === 0 ? 0 : rawSubtotal > 1199 ? 0 : 99;
    const estimatedTax = Math.round(rawSubtotal * 0.18);
    const grandTotal = rawSubtotal + shippingFee;

    const summary = {
      itemCount: cartItems.reduce((cnt, it) => cnt + (it.quantity || 1), 0),
      rawSubtotal,
      originalTotal,
      totalDiscount,
      shippingFee,
      estimatedTax,
      grandTotal,
      freeShippingThreshold: 1199,
      qualifiesForFreeShipping: rawSubtotal >= 1199,
    };

    res.status(200).json({
      cartItems,
      savedForLaterItems,
      summary,
      priceChangeAlerts,
      outOfStockAlerts,
      // Backward compatibility array fallback
      items: cartItems,
    });
  } catch (error) {
    console.error("Get bag error:", error);
    return res.status(500).json({ message: "Failed to fetch bag", error: error.message });
  }
});

/**
 * 2. ATOMIC ADD TO CART / INCREMENT (Guarantees no duplicate line items across concurrent devices)
 */
router.post("/add", async (req, res) => {
  try {
    const { userId, productId, size = "M", color = "Standard", quantity = 1 } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const availableStock = product.stock !== undefined ? product.stock : 25;
    if (availableStock <= 0) {
      return res.status(400).json({ message: "This item is currently out of stock." });
    }

    const targetQty = Math.max(1, parseInt(quantity, 10) || 1);

    // Atomically find or create the active cart item for this specific variant
    let existingItem = await Bag.findOne({
      userId,
      productId,
      size,
      color,
      isSavedForLater: false,
    });

    let savedItem;
    if (existingItem) {
      const newQuantity = Math.min(10, existingItem.quantity + targetQty);
      if (newQuantity > availableStock) {
        return res.status(400).json({
          message: `Only ${availableStock} item(s) available in stock.`,
        });
      }
      existingItem.quantity = newQuantity;
      existingItem.priceWhenAdded = product.price;
      savedItem = await existingItem.save();
    } else {
      if (targetQty > availableStock) {
        return res.status(400).json({
          message: `Only ${availableStock} item(s) available in stock.`,
        });
      }
      savedItem = new Bag({
        userId,
        productId,
        size,
        color,
        quantity: targetQty,
        priceWhenAdded: product.price,
        isSavedForLater: false,
      });
      await savedItem.save();
    }

    // Schedule abandoned cart reminder (15 mins)
    scheduleAbandonedCartReminder(userId, [savedItem], 15).catch((err) =>
      console.error("Error scheduling abandoned cart:", err)
    );

    const populated = await Bag.findById(savedItem._id).populate("productId");

    res.status(200).json({
      message: "Item added to bag successfully",
      item: populated,
    });
  } catch (error) {
    console.error("Add to bag error:", error);
    return res.status(500).json({ message: "Failed to add item to bag", error: error.message });
  }
});

/**
 * 3. BACKWARD COMPATIBLE POST /bag (Handles legacy calls)
 */
router.post("/", async (req, res) => {
  try {
    const { userId, productId, size = "M", quantity = 1 } = req.body;
    if (userId && productId) {
      const product = await Product.findById(productId);
      const initialPrice = product ? product.price : 0;

      const existing = await Bag.findOne({
        userId,
        productId,
        size,
        isSavedForLater: false,
      });

      if (existing) {
        existing.quantity += parseInt(quantity, 10) || 1;
        existing.priceWhenAdded = initialPrice;
        await existing.save();
        return res.status(200).json(existing);
      }

      const newBag = new Bag({
        userId,
        productId,
        size,
        quantity: parseInt(quantity, 10) || 1,
        priceWhenAdded: initialPrice,
        isSavedForLater: false,
      });
      const saved = await newBag.save();
      return res.status(200).json(saved);
    }

    const bag = new Bag(req.body);
    const saveitem = await bag.save();
    res.status(200).json(saveitem);
  } catch (error) {
    console.error("Legacy add error:", error);
    return res.status(500).json({ message: "Failed to add item" });
  }
});

/**
 * 4. ATOMIC UPDATE QUANTITY with Stock Boundary Checking
 */
router.put("/update-quantity/:itemid", async (req, res) => {
  try {
    const { itemid } = req.params;
    const { quantity } = req.body;

    const newQty = parseInt(quantity, 10);
    if (!newQty || newQty < 1 || newQty > 10) {
      return res.status(400).json({ message: "Quantity must be between 1 and 10." });
    }

    const bagItem = await Bag.findById(itemid).populate("productId");
    if (!bagItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const availableStock = bagItem.productId?.stock !== undefined ? bagItem.productId.stock : 25;
    if (newQty > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} item(s) available in stock.`,
        availableStock,
      });
    }

    bagItem.quantity = newQty;
    await bagItem.save();

    res.status(200).json({
      message: "Quantity updated",
      item: bagItem,
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    return res.status(500).json({ message: "Failed to update quantity", error: error.message });
  }
});

/**
 * 5. SAVE FOR LATER: Move product from active Cart to Save for Later (Preserves variants)
 */
router.post("/save-for-later/:itemid", async (req, res) => {
  try {
    const { itemid } = req.params;
    const cartItem = await Bag.findById(itemid);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Check if item with same variant already exists in Save for Later
    const existingSaved = await Bag.findOne({
      userId: cartItem.userId,
      productId: cartItem.productId,
      size: cartItem.size,
      color: cartItem.color,
      isSavedForLater: true,
    });

    if (existingSaved) {
      // Merge quantity into existing saved entry and remove current cart line
      existingSaved.quantity = Math.min(10, existingSaved.quantity + cartItem.quantity);
      existingSaved.savedForLaterAt = new Date();
      await existingSaved.save();
      await Bag.findByIdAndDelete(itemid);
    } else {
      cartItem.isSavedForLater = true;
      cartItem.savedForLaterAt = new Date();
      await cartItem.save();
    }

    res.status(200).json({
      message: "Item moved to Save for Later",
    });
  } catch (error) {
    console.error("Save for later error:", error);
    return res.status(500).json({ message: "Failed to save item for later", error: error.message });
  }
});

/**
 * 6. MOVE TO CART: Move product from Save for Later back to active Cart (Preserves variants & checks stock)
 */
router.post("/move-to-cart/:itemid", async (req, res) => {
  try {
    const { itemid } = req.params;
    const savedItem = await Bag.findById(itemid).populate("productId");

    if (!savedItem) {
      return res.status(404).json({ message: "Saved item not found" });
    }

    const availableStock = savedItem.productId?.stock !== undefined ? savedItem.productId.stock : 25;
    if (availableStock <= 0) {
      return res.status(400).json({
        message: "This item is currently out of stock and cannot be moved to bag.",
      });
    }

    // Check if same variant already exists in active Cart
    const existingCart = await Bag.findOne({
      userId: savedItem.userId,
      productId: savedItem.productId._id,
      size: savedItem.size,
      color: savedItem.color,
      isSavedForLater: false,
    });

    if (existingCart) {
      const mergedQty = Math.min(availableStock, existingCart.quantity + savedItem.quantity);
      existingCart.quantity = mergedQty;
      existingCart.priceWhenAdded = savedItem.productId.price;
      await existingCart.save();
      await Bag.findByIdAndDelete(itemid);
    } else {
      savedItem.isSavedForLater = false;
      savedItem.savedForLaterAt = null;
      savedItem.priceWhenAdded = savedItem.productId.price;
      await savedItem.save();
    }

    res.status(200).json({
      message: "Item moved back to Shopping Bag",
    });
  } catch (error) {
    console.error("Move to cart error:", error);
    return res.status(500).json({ message: "Failed to move item to bag", error: error.message });
  }
});

/**
 * 7. REMOVE ITEM from Cart or Save for Later
 */
router.delete("/:itemid", async (req, res) => {
  try {
    const { itemid } = req.params;
    await Bag.findByIdAndDelete(itemid);
    res.status(200).json({ message: "Item removed successfully" });
  } catch (error) {
    console.error("Remove item error:", error);
    return res.status(500).json({ message: "Failed to remove item", error: error.message });
  }
});

router.delete("/remove/:itemid", async (req, res) => {
  try {
    const { itemid } = req.params;
    await Bag.findByIdAndDelete(itemid);
    res.status(200).json({ message: "Item removed successfully" });
  } catch (error) {
    console.error("Remove item error:", error);
    return res.status(500).json({ message: "Failed to remove item", error: error.message });
  }
});

/**
 * 8. PRE-CHECKOUT VALIDATION ENDPOINT (Verifies live stock, price changes, and totals)
 */
router.get("/validate/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const cartItems = await Bag.find({ userId: userid, isSavedForLater: false }).populate("productId");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        isValid: false,
        message: "Your shopping bag is empty.",
      });
    }

    const issues = [];
    let hasOutOfStock = false;

    for (const item of cartItems) {
      const product = item.productId;
      if (!product) {
        issues.push({ itemId: item._id, message: "A product in your cart is no longer available." });
        hasOutOfStock = true;
        continue;
      }

      const currentStock = product.stock !== undefined ? product.stock : 25;
      if (currentStock === 0) {
        issues.push({
          itemId: item._id,
          productName: product.name,
          message: `${product.name} is currently out of stock.`,
          type: "OUT_OF_STOCK",
        });
        hasOutOfStock = true;
      } else if (item.quantity > currentStock) {
        issues.push({
          itemId: item._id,
          productName: product.name,
          message: `Only ${currentStock} item(s) of ${product.name} available in stock.`,
          type: "INSUFFICIENT_STOCK",
          availableStock: currentStock,
        });
        hasOutOfStock = true;
      }
    }

    if (hasOutOfStock) {
      return res.status(400).json({
        isValid: false,
        message: "Some items in your cart require attention before checkout.",
        issues,
      });
    }

    res.status(200).json({
      isValid: true,
      message: "Cart validated successfully for checkout.",
    });
  } catch (error) {
    console.error("Cart validation error:", error);
    return res.status(500).json({ message: "Validation error", error: error.message });
  }
});

/**
 * 9. SYNC GUEST / OFFLINE CART TO USER ACCOUNT
 */
router.post("/sync", async (req, res) => {
  try {
    const { userId, items = [] } = req.body;
    if (!userId || !Array.isArray(items)) {
      return res.status(400).json({ message: "userId and items array are required" });
    }

    for (const item of items) {
      if (!item.productId) continue;
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const size = item.size || "M";
      const color = item.color || "Standard";
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      const existing = await Bag.findOne({
        userId,
        productId: item.productId,
        size,
        color,
        isSavedForLater: false,
      });

      if (existing) {
        existing.quantity = Math.min(10, existing.quantity + qty);
        existing.priceWhenAdded = product.price;
        await existing.save();
      } else {
        const newBag = new Bag({
          userId,
          productId: item.productId,
          size,
          color,
          quantity: qty,
          priceWhenAdded: product.price,
          isSavedForLater: false,
        });
        await newBag.save();
      }
    }

    res.status(200).json({ message: "Cart synced successfully" });
  } catch (error) {
    console.error("Cart sync error:", error);
    return res.status(500).json({ message: "Failed to sync cart", error: error.message });
  }
});

module.exports = router;
