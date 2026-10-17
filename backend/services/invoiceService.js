/**
 * Invoice Generation Service
 * Produces complete, beautiful, tax-compliant invoice documents (HTML/PDF format)
 */

function generateInvoiceHtml(order, user) {
  const invoiceNo = order.invoiceNumber || `INV-${new Date().getFullYear()}-${order._id.toString().substring(0, 6).toUpperCase()}`;
  const orderDate = order.date ? new Date(order.date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) : new Date().toLocaleDateString("en-IN");

  const subtotal = order.paymentDetails?.subtotal || (order.total ? Math.round(order.total * 0.82) : 0);
  const tax = order.paymentDetails?.tax || Math.round(subtotal * 0.18);
  const shipping = order.paymentDetails?.shippingFee || 0;
  const discount = order.paymentDetails?.discount || 0;
  const grandTotal = order.total || (subtotal + tax + shipping - discount);

  const itemsHtml = (order.items || [])
    .map((item, index) => {
      const product = item.productId || {};
      const title = item.title || product.title || "Fashion Apparel Item";
      const brand = item.brand || product.brand || "MYNTRA CLONE BRAND";
      const qty = item.quantity || 1;
      const unitPrice = item.price || product.price || 0;
      const itemTotal = unitPrice * qty;
      const hsnCode = "6203";

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827;">${title}</div>
            <div style="font-size: 12px; color: #6b7280;">Brand: ${brand} | Size: ${item.size || "Free Size"}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${hsnCode}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 500;">${qty}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #4b5563;">₹${unitPrice.toLocaleString("en-IN")}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">₹${itemTotal.toLocaleString("en-IN")}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoiceNo}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1f2937;
      background-color: #ffffff;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #ff3f6c;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #ff3f6c;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #ecfdf5;
      color: #059669;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      font-size: 13px;
    }
    .info-title {
      font-weight: 700;
      color: #374151;
      margin-bottom: 8px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 13px;
    }
    th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-table {
      width: 320px;
      margin-left: auto;
      margin-top: 16px;
    }
    .totals-table tr td {
      padding: 6px 12px;
    }
    .grand-total {
      font-size: 16px;
      font-weight: 700;
      color: #ff3f6c;
      border-top: 2px solid #e5e7eb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="logo">MYNTRA</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Original Tax Invoice / Bill of Supply</div>
        <div style="font-size: 11px; color: #9ca3af;">GSTIN: 29AABCM1234F1Z9</div>
      </div>
      <div style="text-align: right;">
        <div class="badge">${order.status || "CONFIRMED"}</div>
        <div style="font-size: 14px; font-weight: 700; margin-top: 8px; color: #111827;">${invoiceNo}</div>
        <div style="font-size: 12px; color: #6b7280;">Date: ${orderDate}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="info-box">
        <div class="info-title">Sold By & Return Center</div>
        <strong>Myntra Fashion E-Commerce Pvt Ltd</strong><br>
        Buildings Alyssa, Begonia & Clover, Embassy Tech Village,<br>
        Outer Ring Road, Devarabeesanahalli Village, Bengaluru, KA 560103<br>
        Support: care@myntra.com | 1800-419-8989
      </div>
      <div class="info-box">
        <div class="info-title">Shipping & Billing Address</div>
        <strong>${user?.name || "Customer"}</strong><br>
        ${order.shippingAddress || "Registered Delivery Address"}<br>
        Email: ${user?.email || "customer@example.com"}<br>
        Payment Mode: <strong>${order.paymentMethod || "COD"}</strong> (${order.paymentDetails?.status || "Paid"})
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th>Item Description</th>
          <th style="width: 80px; text-align: center;">HSN</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Gross Price</th>
          <th style="width: 110px; text-align: right;">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td style="color: #6b7280;">Subtotal (excl. GST):</td>
        <td style="text-align: right; font-weight: 500;">₹${subtotal.toLocaleString("en-IN")}</td>
      </tr>
      <tr>
        <td style="color: #6b7280;">CGST + SGST (18%):</td>
        <td style="text-align: right; font-weight: 500;">₹${tax.toLocaleString("en-IN")}</td>
      </tr>
      <tr>
        <td style="color: #6b7280;">Shipping & Handling:</td>
        <td style="text-align: right; font-weight: 500; color: ${shipping === 0 ? "#059669" : "#111827"}">
          ${shipping === 0 ? "FREE" : `₹${shipping}`}
        </td>
      </tr>
      ${
        discount > 0
          ? `<tr>
              <td style="color: #059669;">Special Discount:</td>
              <td style="text-align: right; font-weight: 600; color: #059669;">- ₹${discount.toLocaleString("en-IN")}</td>
            </tr>`
          : ""
      }
      <tr class="grand-total">
        <td>Total Amount Paid:</td>
        <td style="text-align: right;">₹${grandTotal.toLocaleString("en-IN")}</td>
      </tr>
    </table>

    <div style="margin-top: 24px; padding: 12px 16px; background: #fdf2f8; border-radius: 8px; font-size: 12px; color: #9d174d;">
      <strong>Tracking Carrier:</strong> ${order.tracking?.carrier || "Delhivery"} | 
      <strong>AWB / Tracking Number:</strong> ${order.tracking?.number || "TRK" + order._id.toString().substring(0, 8).toUpperCase()}
    </div>

    <div class="footer">
      This is a computer-generated tax invoice and requires no physical signature.<br>
      Returns and exchanges are accepted within 14 days of delivery. For support, visit myntra.com/contact-us.
    </div>

    <div class="no-print" style="margin-top: 24px; text-align: center;">
      <button onclick="window.print()" style="background: #ff3f6c; color: white; border: none; padding: 10px 24px; font-weight: 600; border-radius: 6px; cursor: pointer;">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = {
  generateInvoiceHtml,
};
