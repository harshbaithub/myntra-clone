# Myntra Clone - Fullstack Mobile & Web Application

A full-featured **Myntra Clone** built with **React Native (Expo Router)** on the frontend and an **Express.js & MongoDB Atlas** backend, deployed on **Vercel**.

---

## 🚀 Live Production Deployment

- **Production Web Application:** [https://myntra-clone-main-theta.vercel.app](https://myntra-clone-main-theta.vercel.app)
- **Database:** MongoDB Atlas (Cloud Cluster with automated seeding)
- **API Base:** [https://myntra-clone-main-theta.vercel.app/category](https://myntra-clone-main-theta.vercel.app/category)

---

## 📱 Features

- **🛍️ Catalog & Categories:** Multi-category browsing (Men, Women, Kids, Beauty) with dynamic subcategories, filters, and prices.
- **🔍 Smart Search & Discovery:** Fast product search, deals of the day, and carousel recommendations.
- **🛒 Shopping Bag & Cart Management:** Add items with size & quantity selection, dynamic price change & stock alerts, real-time discount calculation, and shipping fee logic.
- **❤️ Wishlist:** Quick wishlist toggling with instant visual sync across all screens.
- **📦 Order Management & Tracking:** Complete multi-step order checkout, delivery timeline tracking, invoice generation, and audit logging.
- **🕒 Real-time Activity History:** Recently viewed product tracking synced seamlessly with user accounts.
- **🔔 Push Notifications & Preferences:** Push notification token registration, order confirmation alerts, and notification preferences.
- **🎨 Modern Dark/Light Themes:** System-aware styling with tailored color palettes.
- **🌐 Universal Multi-Platform:** Native mobile support via Expo Go and responsive desktop/mobile web preview.

---

## 🛠️ Tech Stack

- **Frontend:** React Native, Expo SDK 52, Expo Router, Lucide Icons, React Native Web
- **Backend:** Node.js, Express.js (Vercel Serverless Function)
- **Database:** MongoDB Atlas with Mongoose ORM
- **Deployment:** Vercel Fullstack Deployment (`vercel.json`)
- **Authentication:** JWT & Bcrypt password hashing

---

## 🏃 Local Development

### 1. Backend Server
```bash
cd backend
npm install
node server.js
```
Runs at `http://localhost:5000`.

### 2. Mobile & Web Frontend
```bash
cd myntra
npm install
npx expo start
```
- Press `w` to open in browser (`http://localhost:8081`).
- Scan the terminal QR code with the Expo Go app.

---

## 🚢 Deployment to Vercel

```bash
npx vercel deploy --prod
```
The project uses `vercel.json` to handle unified serverless routing for Express API endpoints alongside static Expo web files.
