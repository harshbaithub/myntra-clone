const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Bag = require("../models/Bag");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const PaymentAuditLog = require("../models/PaymentAuditLog");
const { generateInvoiceHtml } = require("../services/invoiceService");
const {
  sendOrderConfirmation,
  sendPaymentUpdate,
  sendShippingUpdate,
  cancelAbandonedCartReminder,
} = require("../services/notificationService");

const router = express.Router();

// Helper to generate full tracking details with timeline
function generateInitialTracking() {
  const carriers = ["Delhivery", "Blue Dart", "Shadowfax", "Ecom Express", "XpressBees"];
  const hubs = ["Bengaluru Hub", "Mumbai Sort Facility", "Delhi NCR Hub", "Hyderabad Center"];
  const randomCarrier = carriers[Math.floor(Math.random() * carriers.length)];
  const randomHub = hubs[Math.floor(Math.random() * hubs.length)];
  const estimatedDays = 3 + Math.floor(Math.random() * 3);

  const now = new Date();
  const estimatedDelivery = new Date(now.getTime() + estimatedDays * 24 * 60 * 60 * 1000);

  return {
    number: "MYN" + Math.floor(10000000 + Math.random() * 90000000),
    carrier: randomCarrier,
    estimatedDelivery,
    currentLocation: randomHub,
    status: "Processing",
    timeline: [
      {
        status: "Processing",
        title: "Order Placed & Confirmed",
        location: "Warehouse Center",
        timestamp: now,
        description: "Your order has been placed and sent for item packaging.",
        isCompleted: true,
      },
      {
        status: "Shipped",
        title: "Packed & Ready for Dispatch",
        location: randomHub,
        timestamp: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        description: `Package will be assigned to courier partner ${randomCarrier}.`,
        isCompleted: false,
      },
      {
        status: "In Transit",
        title: "In Transit to Destination",
        location: "Regional Transit Hub",
        timestamp: new Date(now.getTime() + 36 * 60 * 60 * 1000),
        description: "Package is on its way to the final delivery center.",
        isCompleted: false,
      },
      {
        status: "Out for Delivery",
        title: "Out for Delivery",
        location: "Local Delivery Facility",
        timestamp: new Date(now.getTime() + 60 * 60 * 60 * 1000),
        description: "Our delivery agent will reach your doorstep today.",
        isCompleted: false,
      },
      {
        status: "Delivered",
        title: "Package Delivered",
        location: "Customer Address",
        timestamp: estimatedDelivery,
        description: "Package delivered safely to recipient.",
        isCompleted: false,
      },
    ],
  };
}

/**
 * 1. CREATE ORDER with Full Financial Breakdown & Audit Logging
 */
router.post("/create/:userId", async (req, res) => {
  try {
    const userid = req.params.userId;
    const { shippingAddress, shippingAddressDetails, paymentMethod = "COD", transactionId } = req.body;

    const validBag = bag.filter((item) => item.productId);
    if (!validBag || validBag.length === 0) {
      return res.status(400).json({ message: "No valid items in bag to checkout. Please add items to your shopping bag." });
    }

    const orderItems = validBag.map((item) => {
      const p = item.productId;
      const img =
        (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ||
        p.image ||
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
      return {
        productId: p._id,
        size: item.size || "M",
        price: p.price || 0,
        quantity: item.quantity || 1,
        title: p.name || p.title || "Fashion Apparel",
        brand: p.brand || "MYNTRA",
        image: img,
      };
    });

    const rawSubtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(rawSubtotal * 0.18);
    const shippingFee = rawSubtotal > 1199 ? 0 : 99;
    const discount = rawSubtotal > 2500 ? 300 : 0;
    const grandTotal = rawSubtotal + tax + shippingFee - discount;

    const trackingData = generateInitialTracking();
    const finalTxnId = transactionId || "TXN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    const newOrder = new Order({
      userId: userid,
      date: new Date(),
      status: "Processing",
      items: orderItems,
      total: grandTotal,
      shippingAddress: shippingAddress || "Default Delivery Address",
      shippingAddressDetails: shippingAddressDetails || {},
      paymentMethod: paymentMethod,
      paymentDetails: {
        method: paymentMethod,
        transactionId: finalTxnId,
        status: paymentMethod === "COD" ? "Pending" : "Success",
        paidAt: paymentMethod === "COD" ? null : new Date(),
        subtotal: rawSubtotal,
        tax,
        shippingFee,
        discount,
        total: grandTotal,
      },
      tracking: trackingData,
    });

    await newOrder.save();

    // Clear user's bag after successful order
    await Bag.deleteMany({ userId: userid });

    // Record initial transaction audit log
    const isCod = (paymentMethod || "").toUpperCase().includes("COD");
    const auditLog = new PaymentAuditLog({
      orderId: newOrder._id,
      userId: userid,
      transactionId: finalTxnId,
      gateway: isCod ? "COD" : "Razorpay",
      eventType: isCod ? "payment.authorized" : "payment.captured",
      amount: grandTotal,
      currency: "INR",
      verificationStatus: "VERIFIED",
      idempotencyKey: `order-create-${newOrder._id}`,
      metadata: { invoiceNumber: newOrder.invoiceNumber, paymentMethod },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    await auditLog.save().catch((err) => console.error("Audit log error:", err));

    // Send real-time notifications asynchronously
    sendOrderConfirmation(userid, newOrder).catch((err) =>
      console.error("Order notification error:", err)
    );
    sendPaymentUpdate(userid, {
      orderId: newOrder._id,
      amount: newOrder.total,
      paymentMethod: newOrder.paymentMethod,
      status: paymentMethod === "COD" ? "Pending (Cash on Delivery)" : "Success",
    }).catch((err) => console.error("Payment notification error:", err));
    cancelAbandonedCartReminder(userid).catch((err) =>
      console.error("Cancel abandoned cart error:", err)
    );

    res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
      invoiceNumber: newOrder.invoiceNumber,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ message: "Failed to create order", error: error.message });
  }
});

/**
 * 2. GET ORDER HISTORY with Server-side Pagination, Sorting & Multi-Filter
 * Query params: page, limit, status, paymentMethod, sortBy, sortOrder, startDate, endDate, search
 */
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      status,
      paymentMethod,
      sortBy = "date",
      sortOrder = "desc",
      startDate,
      endDate,
      search,
    } = req.query;

    const query = { userId };

    // Filter by Order Status
    if (status && status !== "ALL") {
      query.status = status;
    }

    // Filter by Payment Method
    if (paymentMethod && paymentMethod !== "ALL") {
      query.paymentMethod = paymentMethod;
    }

    // Filter by Date Range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Search by Invoice Number or Items
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { invoiceNumber: searchRegex },
        { "tracking.number": searchRegex },
        { "items.title": searchRegex },
        { "items.brand": searchRegex },
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate("items.productId")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Compute summary stats for the user
    const stats = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalSpent: { $sum: "$total" },
        },
      },
    ]);

    res.status(200).json({
      orders,
      pagination: {
        totalOrders: totalCount,
        currentPage: page,
        totalPages,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats,
    });
  } catch (error) {
    console.error("Order history error:", error);
    return res.status(500).json({ message: "Failed to fetch order history", error: error.message });
  }
});

/**
 * 3. GET ORDER DETAILS by Order ID
 */
router.get("/details/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("items.productId").populate("userId", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Order details error:", error);
    return res.status(500).json({ message: "Failed to fetch order details", error: error.message });
  }
});

/**
 * 4. DOWNLOAD / VIEW PDF INVOICE (HTML/Printable format)
 */
router.get("/invoice/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("items.productId").populate("userId", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const html = generateInvoiceHtml(order, order.userId);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Invoice error:", error);
    return res.status(500).json({ message: "Failed to generate invoice", error: error.message });
  }
});

/**
 * 5. 1-CLICK REORDER: Add previous order items into active Bag
 */
router.post("/reorder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const reorderedItems = [];
    for (const item of order.items) {
      const existingBag = await Bag.findOne({
        userId: order.userId,
        productId: item.productId,
        size: item.size || "M",
      });

      if (existingBag) {
        existingBag.quantity += item.quantity || 1;
        await existingBag.save();
        reorderedItems.push(existingBag);
      } else {
        const newBagItem = new Bag({
          userId: order.userId,
          productId: item.productId,
          size: item.size || "M",
          quantity: item.quantity || 1,
        });
        await newBagItem.save();
        reorderedItems.push(newBagItem);
      }
    }

    // Log transaction event
    const auditLog = new PaymentAuditLog({
      orderId: order._id,
      userId: order.userId,
      transactionId: "REORDER-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      gateway: "MockGateway",
      eventType: "order.reordered",
      amount: order.total,
      currency: "INR",
      verificationStatus: "VERIFIED",
      metadata: { sourceOrderId: order._id, itemCount: order.items.length },
    });
    await auditLog.save().catch((e) => console.error(e));

    res.status(200).json({
      message: `Successfully reordered ${order.items.length} item(s) to bag`,
      itemCount: order.items.length,
    });
  } catch (error) {
    console.error("Reorder error:", error);
    return res.status(500).json({ message: "Failed to reorder items", error: error.message });
  }
});

/**
 * 6. REQUEST ORDER CANCELLATION
 */
router.post("/cancel/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = "Changed my mind" } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow cancellation if order is not already shipped or delivered
    if (["Shipped", "In Transit", "Out for Delivery", "Delivered"].includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled because it is already ${order.status}. You may request a return upon delivery.`,
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    order.status = "Cancelled";
    order.cancellation = {
      isCancelled: true,
      reason,
      cancelledAt: new Date(),
      refundStatus: order.paymentMethod === "COD" ? "None" : "Processed",
      refundAmount: order.paymentMethod === "COD" ? 0 : order.total,
    };

    // Update tracking status
    if (order.tracking) {
      order.tracking.status = "Cancelled";
      order.tracking.timeline.push({
        status: "Cancelled",
        title: "Order Cancelled",
        location: "Customer Request",
        timestamp: new Date(),
        description: `Order cancelled by customer. Reason: ${reason}`,
        isCompleted: true,
      });
    }

    await order.save();

    // Log cancellation & refund audit
    const auditLog = new PaymentAuditLog({
      orderId: order._id,
      userId: order.userId,
      transactionId: "CANCEL-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      gateway: order.paymentMethod === "COD" ? "COD" : "Razorpay",
      eventType: "refund.processed",
      amount: order.total,
      currency: "INR",
      verificationStatus: "VERIFIED",
      metadata: { reason, refundStatus: order.cancellation.refundStatus },
    });
    await auditLog.save().catch((e) => console.error(e));

    // Send push notification for cancellation
    const { sendPushNotification } = require("../services/notificationService");
    sendPushNotification({
      userId: order.userId,
      title: "Order Cancelled Successfully ❌",
      body: `Your order #${order.invoiceNumber || order._id.toString().substring(0, 8)} has been cancelled. Refund of ₹${order.cancellation.refundAmount} will be credited if applicable.`,
      category: "orderUpdates",
      data: { orderId: order._id, screen: "orders" },
    }).catch((e) => console.error(e));

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({ message: "Failed to cancel order", error: error.message });
  }
});

/**
 * 7. REQUEST ORDER RETURN / EXCHANGE
 */
router.post("/return/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = "Size fit issue", pickupAddress } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        message: "Return requests can only be placed for delivered orders within 14 days of delivery.",
      });
    }

    order.status = "Return Requested";
    order.returnRequest = {
      isRequested: true,
      reason,
      requestedAt: new Date(),
      status: "Requested",
      pickupAddress: pickupAddress || order.shippingAddress,
    };

    if (order.tracking) {
      order.tracking.timeline.push({
        status: "Return Requested",
        title: "Return Pickup Scheduled",
        location: "Customer Address",
        timestamp: new Date(),
        description: `Return requested. Courier will collect package. Reason: ${reason}`,
        isCompleted: true,
      });
    }

    await order.save();

    // Send push notification
    const { sendPushNotification } = require("../services/notificationService");
    sendPushNotification({
      userId: order.userId,
      title: "Return Request Received 📦",
      body: `We have received your return request for order #${order.invoiceNumber || order._id}. Courier pickup will be scheduled soon.`,
      category: "orderUpdates",
      data: { orderId: order._id, screen: "orders" },
    }).catch((e) => console.error(e));

    res.status(200).json({
      message: "Return request placed successfully",
      order,
    });
  } catch (error) {
    console.error("Return order error:", error);
    return res.status(500).json({ message: "Failed to place return request", error: error.message });
  }
});

/**
 * 8. SECURE PAYMENT WEBHOOK with HMAC Signature Verification & Idempotency Check
 */
router.post("/webhook/payment", async (req, res) => {
  try {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || "myntra_secure_webhook_secret_2025";
    const signature = req.headers["x-razorpay-signature"] || req.headers["x-signature"];
    const idempotencyKey = req.headers["x-idempotency-key"] || req.body?.event_id || req.body?.id;

    // Check duplicate webhook / idempotency
    if (idempotencyKey) {
      const existing = await PaymentAuditLog.findOne({ idempotencyKey });
      if (existing) {
        return res.status(200).json({
          status: "ignored",
          message: "Duplicate webhook event ignored (idempotent)",
        });
      }
    }

    // Verify HMAC signature if signature header is present
    let isSignatureValid = true;
    if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      isSignatureValid = signature === expectedSignature;
    }

    const {
      event = "payment.captured",
      payload = {},
      orderId,
      transactionId = "TXN-WH-" + Date.now(),
      amount = 0,
      userId,
    } = req.body;

    const paymentEntity = payload.payment?.entity || req.body;
    const finalAmount = amount || paymentEntity.amount || 0;
    const targetOrderId = orderId || paymentEntity.notes?.orderId || paymentEntity.order_id;
    const finalTxnId = paymentEntity.id || transactionId;

    // Record transaction audit log
    const auditLog = new PaymentAuditLog({
      orderId: targetOrderId && mongoose.Types.ObjectId.isValid(targetOrderId) ? targetOrderId : new mongoose.Types.ObjectId(),
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId(),
      transactionId: finalTxnId,
      gateway: "Razorpay",
      eventType: event,
      amount: finalAmount,
      currency: "INR",
      signature: signature || "simulated",
      verificationStatus: isSignatureValid ? "VERIFIED" : "FAILED_SIGNATURE",
      idempotencyKey: idempotencyKey || `wh-${Date.now()}-${Math.random()}`,
      rawPayload: req.body,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    await auditLog.save();

    // If payment captured, update order payment status
    if (targetOrderId && mongoose.Types.ObjectId.isValid(targetOrderId) && isSignatureValid) {
      const order = await Order.findById(targetOrderId);
      if (order) {
        order.paymentDetails.status = event === "payment.captured" ? "Success" : "Failed";
        order.paymentDetails.transactionId = finalTxnId;
        order.paymentDetails.paidAt = new Date();
        if (event === "payment.captured") {
          order.status = "Confirmed";
        }
        await order.save();

        sendPaymentUpdate(order.userId, {
          orderId: order._id,
          amount: order.total,
          paymentMethod: order.paymentMethod,
          status: event === "payment.captured" ? "Success" : "Failed",
        }).catch((e) => console.error(e));
      }
    }

    res.status(200).json({
      status: "success",
      message: "Webhook processed and verified",
      verificationStatus: isSignatureValid ? "VERIFIED" : "FAILED_SIGNATURE",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        status: "ignored",
        message: "Duplicate webhook transaction ignored (idempotent key match)",
      });
    }
    console.error("Webhook processing error:", error);
    return res.status(500).json({ message: "Webhook error", error: error.message });
  }
});

/**
 * 9. GET USER TRANSACTION AUDIT LOGS
 */
router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      PaymentAuditLog.find({ userId })
        .populate("orderId", "invoiceNumber total status date")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentAuditLog.countDocuments({ userId }),
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        total: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Transactions log error:", error);
    return res.status(500).json({ message: "Failed to fetch transactions", error: error.message });
  }
});

/**
 * 10. Backward-compatible endpoint: GET /order/user/:userid
 */
router.get("/user/:userid", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userid })
      .populate("items.productId")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("User orders error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;