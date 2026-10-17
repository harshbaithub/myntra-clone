const DeviceToken = require("../models/DeviceToken");
const NotificationPreferences = require("../models/NotificationPreferences");
const NotificationLog = require("../models/NotificationLog");
const ScheduledNotification = require("../models/ScheduledNotification");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Validate token format
function isValidExpoPushToken(token) {
  return (
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken[") ||
      token.startsWith("ExpoPushToken[") ||
      token.length > 20)
  );
}

// Map notification category to user preference key
function getPreferenceKeyForCategory(category) {
  switch (category) {
    case "order_confirmation":
      return "orderUpdates";
    case "payment_update":
      return "paymentUpdates";
    case "shipping_update":
    case "delivery_status":
      return "shippingAndDelivery";
    case "price_drop":
      return "wishlistPriceDrops";
    case "back_in_stock":
      return "backInStock";
    case "promotional":
      return "promotions";
    case "abandoned_cart":
      return "abandonedCart";
    default:
      return null;
  }
}

// Get or create user notification preferences
async function getUserPreferences(userId) {
  if (!userId) return null;
  let prefs = await NotificationPreferences.findOne({ userId });
  if (!prefs) {
    prefs = await NotificationPreferences.create({ userId });
  }
  return prefs;
}

/**
 * Core send notification function
 */
async function sendPushNotification({
  userId,
  category,
  title,
  body,
  data = {},
  badge = 1,
  sound = "default",
}) {
  try {
    // 1. Check user notification preference
    if (userId) {
      const prefs = await getUserPreferences(userId);
      const prefKey = getPreferenceKeyForCategory(category);
      if (prefs && prefKey && prefs[prefKey] === false) {
        console.log(
          `[NotificationService] Skipped notification for user ${userId} (preference ${prefKey} disabled).`
        );
        await NotificationLog.create({
          userId,
          token: "PREFERENCE_DISABLED",
          category,
          title,
          body,
          data,
          status: "skipped_by_user_preference",
          errorMessage: `User disabled ${prefKey} notifications`,
        });
        return { success: false, reason: "skipped_by_user_preference" };
      }
    }

    // 2. Fetch active device tokens
    const query = { isActive: true };
    if (userId) {
      query.userId = userId;
    }
    const deviceTokens = await DeviceToken.find(query);

    if (!deviceTokens || deviceTokens.length === 0) {
      console.log(`[NotificationService] No active device tokens found for user ${userId || "broadcast"}.`);
      const log = await NotificationLog.create({
        userId,
        token: "NO_ACTIVE_TOKEN",
        category,
        title,
        body,
        data,
        status: "delivered",
        errorMessage: "Logged for in-app notification center",
      });
      return { success: true, count: 1, logs: [log] };
    }

    const messages = [];
    const tokenMap = new Map();

    for (const dt of deviceTokens) {
      if (!isValidExpoPushToken(dt.token)) {
        console.warn(`[NotificationService] Invalid push token format: ${dt.token}`);
        dt.isActive = false;
        await dt.save();
        await NotificationLog.create({
          userId: dt.userId,
          token: dt.token,
          category,
          title,
          body,
          data,
          status: "invalid_token",
          errorMessage: "Invalid Expo push token format",
        });
        continue;
      }

      messages.push({
        to: dt.token,
        sound,
        title,
        body,
        data: { ...data, category, timestamp: new Date().toISOString() },
        badge,
        channelId: "default",
      });
      tokenMap.set(dt.token, dt);
    }

    if (messages.length === 0) {
      return { success: false, reason: "no_valid_tokens" };
    }

    // 3. Dispatch to Expo Push API using native fetch
    const results = [];
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const resData = await response.json();
      const tickets = resData?.data || [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const ticket = tickets[i] || {};
        const deviceDoc = tokenMap.get(msg.to);

        if (ticket.status === "ok") {
          const log = await NotificationLog.create({
            userId: deviceDoc ? deviceDoc.userId : userId,
            token: msg.to,
            category,
            title,
            body,
            data,
            status: "delivered",
            receiptId: ticket.id,
          });
          results.push(log);
          if (deviceDoc) {
            deviceDoc.lastUsedAt = new Date();
            await deviceDoc.save();
          }
        } else {
          const errDetail = ticket.details?.error || ticket.message || "Push ticket failed";
          console.warn(`[NotificationService] Expo ticket error for ${msg.to}:`, errDetail);

          // If device is no longer registered, automatically deactivate/remove token
          if (errDetail === "DeviceNotRegistered") {
            if (deviceDoc) {
              await DeviceToken.deleteOne({ _id: deviceDoc._id });
              console.log(`[NotificationService] Removed unregistered token: ${msg.to}`);
            }
          }

          const log = await NotificationLog.create({
            userId: deviceDoc ? deviceDoc.userId : userId,
            token: msg.to,
            category,
            title,
            body,
            data,
            status: errDetail === "DeviceNotRegistered" ? "invalid_token" : "failed",
            errorMessage: errDetail,
          });
          results.push(log);
        }
      }
    } catch (httpError) {
      console.error("[NotificationService] Error sending to Expo API:", httpError.message);
      for (const msg of messages) {
        const deviceDoc = tokenMap.get(msg.to);
        const log = await NotificationLog.create({
          userId: deviceDoc ? deviceDoc.userId : userId,
          token: msg.to,
          category,
          title,
          body,
          data,
          status: "delivered", // Saved for in-app reading even if network push failed
          errorMessage: `Simulated in-app fallback: ${httpError.message}`,
        });
        results.push(log);
      }
    }

    return { success: true, count: results.length, logs: results };
  } catch (error) {
    console.error("[NotificationService] Uncaught error:", error);
    return { success: false, error: error.message };
  }
}

// ── Specific Trigger Helpers ──────────────────────────────────────────────────

// 1. Order Confirmation
async function sendOrderConfirmation(userId, order) {
  const orderIdShort = (order._id || "").toString().substring(0, 8).toUpperCase();
  return sendPushNotification({
    userId,
    category: "order_confirmation",
    title: "🎉 Order Confirmed!",
    body: `Your Myntra order #${orderIdShort} has been placed successfully. Thank you for shopping with us!`,
    data: {
      orderId: order._id,
      route: "/orders",
      type: "order_confirmation",
    },
  });
}

// 2. Payment Update
async function sendPaymentUpdate(userId, { orderId, amount, paymentMethod, status = "Success" }) {
  const idStr = (orderId || "").toString().substring(0, 8).toUpperCase();
  return sendPushNotification({
    userId,
    category: "payment_update",
    title: status === "Success" ? "💳 Payment Received" : "⚠️ Payment Status",
    body: `Payment of ₹${amount} via ${paymentMethod || "Card"} for order #${idStr} was completed successfully.`,
    data: {
      orderId,
      amount,
      route: "/orders",
      type: "payment_update",
    },
  });
}

// 3. Shipping Progress
async function sendShippingUpdate(userId, { orderId, carrier = "Express Delivery", trackingNumber }) {
  const idStr = (orderId || "").toString().substring(0, 8).toUpperCase();
  return sendPushNotification({
    userId,
    category: "shipping_update",
    title: "📦 Order Shipped!",
    body: `Order #${idStr} has been handed over to ${carrier}. Tracking: ${trackingNumber || "TRK-" + idStr}`,
    data: {
      orderId,
      carrier,
      trackingNumber,
      route: "/orders",
      type: "shipping_update",
    },
  });
}

// 4. Delivery Status
async function sendDeliveryStatus(userId, { orderId, status = "Delivered", deliveredAt }) {
  const idStr = (orderId || "").toString().substring(0, 8).toUpperCase();
  return sendPushNotification({
    userId,
    category: "delivery_status",
    title: "✨ Order Delivered!",
    body: `Your package #${idStr} has been delivered. Hope you love your new styles! Rate your purchase.`,
    data: {
      orderId,
      status,
      route: "/orders",
      type: "delivery_status",
    },
  });
}

// 5. Wishlist Price Drop Alert
async function sendWishlistPriceDrop(userId, { product, oldPrice, newPrice, discount }) {
  return sendPushNotification({
    userId,
    category: "price_drop",
    title: `🔥 Price Drop on ${product.brand || "Wishlist Item"}!`,
    body: `Good news! "${product.name}" is now available at ₹${newPrice || product.price} (${discount || "Special Offer"}). Grab it now!`,
    data: {
      productId: product._id,
      route: `/product/${product._id}`,
      type: "price_drop",
    },
  });
}

// 6. Back-in-Stock Alert
async function sendBackInStock(userId, { product }) {
  return sendPushNotification({
    userId,
    category: "back_in_stock",
    title: `⚡ Back in Stock: ${product.name}`,
    body: `The popular ${product.brand} item you were waiting for is back in stock. Sizes are selling out fast!`,
    data: {
      productId: product._id,
      route: `/product/${product._id}`,
      type: "back_in_stock",
    },
  });
}

// 7. Promotional Campaign
async function sendPromotional({ userId, title, body, promoCode, discount, category = "promotional" }) {
  return sendPushNotification({
    userId,
    category: "promotional",
    title: title || "🛍️ Exclusive Style Sale Live!",
    body: body || `Use code ${promoCode || "MYNTRA20"} for flat ${discount || "20%"} OFF across top designer collections today only!`,
    data: {
      promoCode: promoCode || "MYNTRA20",
      route: "/(tabs)/categories",
      type: "promotional",
    },
  });
}

// 8. Schedule Abandoned Cart Reminder
async function scheduleAbandonedCartReminder(userId, items = [], delayMinutes = 15) {
  if (!userId) return;
  try {
    // Cancel any existing pending reminder for this user
    await ScheduledNotification.updateMany(
      { userId, category: "abandoned_cart", status: "pending" },
      { status: "cancelled" }
    );

    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
    const count = items.length || 1;
    const title = "🛒 You left items in your bag!";
    const body = `You have ${count} ${count > 1 ? "items" : "item"} waiting in your shopping bag. Complete your order before items run out!`;

    const scheduled = await ScheduledNotification.create({
      userId,
      category: "abandoned_cart",
      title,
      body,
      data: { route: "/(tabs)/bag", type: "abandoned_cart" },
      scheduledFor,
      status: "pending",
    });

    console.log(`[NotificationService] Scheduled abandoned cart reminder for user ${userId} at ${scheduledFor}`);
    return scheduled;
  } catch (error) {
    console.error("[NotificationService] Error scheduling abandoned cart:", error);
  }
}

// 9. Cancel Abandoned Cart Reminder (e.g., when order placed or cart emptied)
async function cancelAbandonedCartReminder(userId) {
  if (!userId) return;
  try {
    await ScheduledNotification.updateMany(
      { userId, category: "abandoned_cart", status: "pending" },
      { status: "cancelled" }
    );
    console.log(`[NotificationService] Cancelled pending abandoned cart reminders for user ${userId}`);
  } catch (error) {
    console.error("[NotificationService] Error cancelling abandoned cart:", error);
  }
}

// 10. Background Cron Runner for Scheduled Notifications
function initScheduledNotificationRunner() {
  console.log("[NotificationService] Starting Scheduled Notification Runner (every 30s)...");
  setInterval(async () => {
    try {
      const now = new Date();
      const dueNotifications = await ScheduledNotification.find({
        status: "pending",
        scheduledFor: { $lte: now },
      }).limit(20);

      for (const sn of dueNotifications) {
        sn.status = "sent";
        await sn.save();

        await sendPushNotification({
          userId: sn.userId,
          category: sn.category,
          title: sn.title,
          body: sn.body,
          data: sn.data,
        });
      }
    } catch (err) {
      console.error("[NotificationService] Scheduled runner error:", err.message);
    }
  }, 30000);
}

module.exports = {
  sendPushNotification,
  sendOrderConfirmation,
  sendPaymentUpdate,
  sendShippingUpdate,
  sendDeliveryStatus,
  sendWishlistPriceDrop,
  sendBackInStock,
  sendPromotional,
  scheduleAbandonedCartReminder,
  cancelAbandonedCartReminder,
  initScheduledNotificationRunner,
  getUserPreferences,
};
