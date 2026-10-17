const express = require("express");
const router = express.Router();
const DeviceToken = require("../models/DeviceToken");
const NotificationPreferences = require("../models/NotificationPreferences");
const NotificationLog = require("../models/NotificationLog");
const Product = require("../models/Product");
const Order = require("../models/Order");
const {
  sendPushNotification,
  sendOrderConfirmation,
  sendPaymentUpdate,
  sendShippingUpdate,
  sendDeliveryStatus,
  sendWishlistPriceDrop,
  sendBackInStock,
  sendPromotional,
  scheduleAbandonedCartReminder,
  getUserPreferences,
} = require("../services/notificationService");

// 1. Register or update device push token
router.post("/register-token", async (req, res) => {
  const { userId, token, platform = "unknown", deviceModel = "Mobile Device" } = req.body;
  try {
    if (!token) {
      return res.status(400).json({ message: "Device token is required" });
    }

    let deviceDoc = await DeviceToken.findOne({ token });
    if (deviceDoc) {
      deviceDoc.userId = userId || deviceDoc.userId;
      deviceDoc.platform = platform;
      deviceDoc.deviceModel = deviceModel;
      deviceDoc.isActive = true;
      deviceDoc.lastUsedAt = new Date();
      await deviceDoc.save();
    } else {
      deviceDoc = new DeviceToken({
        userId: userId || null,
        token,
        platform,
        deviceModel,
        isActive: true,
        lastUsedAt: new Date(),
      });
      await deviceDoc.save();
    }

    res.status(200).json({
      message: "Device token registered successfully",
      deviceToken: deviceDoc,
    });
  } catch (error) {
    console.error("Error registering device token:", error);
    res.status(500).json({ message: "Failed to register device token" });
  }
});

// 2. Remove or deactivate device push token
router.delete("/remove-token", async (req, res) => {
  const { token, userId } = req.body;
  try {
    const query = {};
    if (token) query.token = token;
    if (userId) query.userId = userId;

    await DeviceToken.deleteMany(query);
    res.status(200).json({ message: "Device token removed successfully" });
  } catch (error) {
    console.error("Error removing device token:", error);
    res.status(500).json({ message: "Failed to remove device token" });
  }
});

// 3. Get notification preferences
router.get("/preferences/:userId", async (req, res) => {
  try {
    const prefs = await getUserPreferences(req.params.userId);
    res.status(200).json({ preferences: prefs });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ message: "Failed to fetch preferences" });
  }
});

// 4. Update notification preferences
router.put("/preferences/:userId", async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;
  try {
    const prefs = await NotificationPreferences.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );
    res.status(200).json({
      message: "Notification preferences updated successfully",
      preferences: prefs,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

// 5. Get notification history for a user
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await NotificationLog.find({
      $or: [{ userId }, { userId: null }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ history: logs });
  } catch (error) {
    console.error("Error fetching notification history:", error);
    res.status(500).json({ message: "Failed to fetch notification history" });
  }
});

// 6. Send test custom push notification
router.post("/send-test", async (req, res) => {
  const { userId, category = "promotional", title, body, data = {} } = req.body;
  try {
    const result = await sendPushNotification({
      userId: userId || undefined,
      category,
      title: title || "🔔 Test Notification from Myntra",
      body: body || "This is a real-time push notification test to confirm your device is connected.",
      data,
    });

    res.status(200).json({
      message: "Test push notification dispatched",
      result,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ message: "Failed to send test notification" });
  }
});

// 7. Trigger specific simulated real-time events (Order, Shipping, Price Drop, etc.)
router.post("/trigger-event", async (req, res) => {
  const { userId, eventType, orderId, productId, promoCode } = req.body;
  try {
    let result;

    switch (eventType) {
      case "order_confirmation": {
        const order = orderId
          ? await Order.findById(orderId).populate("items.productId")
          : { _id: "ORD" + Math.floor(100000 + Math.random() * 900000) };
        result = await sendOrderConfirmation(userId, order);
        break;
      }

      case "payment_update": {
        result = await sendPaymentUpdate(userId, {
          orderId: orderId || "ORD" + Math.floor(100000 + Math.random() * 900000),
          amount: 1499,
          paymentMethod: "Credit Card",
          status: "Success",
        });
        break;
      }

      case "shipping_update": {
        result = await sendShippingUpdate(userId, {
          orderId: orderId || "ORD" + Math.floor(100000 + Math.random() * 900000),
          carrier: "Blue Dart Express",
          trackingNumber: "BD" + Math.floor(10000000 + Math.random() * 90000000),
        });
        break;
      }

      case "delivery_status": {
        result = await sendDeliveryStatus(userId, {
          orderId: orderId || "ORD" + Math.floor(100000 + Math.random() * 900000),
          status: "Delivered",
        });
        break;
      }

      case "price_drop": {
        let prod = productId ? await Product.findById(productId) : await Product.findOne();
        if (!prod) {
          prod = { _id: "p1", name: "Premium Slim Fit Shirt", brand: "Roadster", price: 699 };
        }
        result = await sendWishlistPriceDrop(userId, {
          product: prod,
          oldPrice: prod.price + 300,
          newPrice: prod.price,
          discount: "30% OFF",
        });
        break;
      }

      case "back_in_stock": {
        let prod = productId ? await Product.findById(productId) : await Product.findOne();
        if (!prod) {
          prod = { _id: "p2", name: "Classic Denim Jacket", brand: "Levis" };
        }
        result = await sendBackInStock(userId, { product: prod });
        break;
      }

      case "promotional": {
        result = await sendPromotional({
          userId,
          title: "🎉 Flash Sale: Flat 50% OFF!",
          body: `Use promo code ${promoCode || "FASHION50"} on all trending apparel today only!`,
          promoCode: promoCode || "FASHION50",
          discount: "50%",
        });
        break;
      }

      case "abandoned_cart": {
        result = await scheduleAbandonedCartReminder(userId, [1, 2], 0.1); // Immediate 6 seconds
        break;
      }

      default:
        return res.status(400).json({ message: `Unknown eventType: ${eventType}` });
    }

    res.status(200).json({
      message: `Event '${eventType}' triggered successfully`,
      result,
    });
  } catch (error) {
    console.error("Error triggering event:", error);
    res.status(500).json({ message: "Failed to trigger event", error: error.message });
  }
});

// 8. Admin / Diagnostic: Get all notification delivery logs
router.get("/logs", async (req, res) => {
  try {
    const logs = await NotificationLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

module.exports = router;
