const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const Product = require("./models/Product");
const Category = require("./models/Category");
const userrouter = require("./routes/Userroutes");
const categoryrouter = require("./routes/Categoryroutes");
const productrouter = require("./routes/Productroutes");
const Bagroutes = require("./routes/Bagroutes");
const Wishlistroutes = require("./routes/Wishlistroutes");
const OrderRoutes = require("./routes/OrderRoutes");
const ActivityRoutes = require("./routes/ActivityRoutes");
const NotificationRoutes = require("./routes/NotificationRoutes");
const RecommendationRoutes = require("./routes/RecommendationRoutes");
const { initScheduledNotificationRunner } = require("./services/notificationService");
const cors = require('cors');
dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  credentials: true,
}));
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState >= 1) {
    return cachedDb;
  }
  const mongoUri = process.env.MONGO_URI || "mongodb+srv://harshbait50_db_user:admin@cluster0.9wqjvun.mongodb.net/myntra?retryWrites=true&w=majority&tls=true&tlsInsecure=true";
  const db = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  cachedDb = db;
  return db;
}

app.use(async (req, res, next) => {
  if (process.env.VERCEL) {
    try {
      await connectToDatabase();
    } catch (err) {
      console.error("Vercel DB connection error:", err.message);
      return res.status(500).json({ error: "Database connection failed", details: err.message });
    }
  }
  next();
});

app.get("/", (req, res) => {
  res.send("Myntra backend in working");
});
app.use("/user", userrouter);
app.use("/category", categoryrouter);
app.use("/product", productrouter);
app.use("/bag", Bagroutes);
app.use("/wishlist", Wishlistroutes);
app.use("/Order", OrderRoutes);
app.use("/activity", ActivityRoutes);
app.use("/notification", NotificationRoutes);
app.use("/recommendations", RecommendationRoutes);

// Start scheduled notification background worker when not in Vercel serverless
if (!process.env.VERCEL) {
  initScheduledNotificationRunner();
}
async function seedDatabase() {
  const productCount = await Product.countDocuments();
  const emptyCategoryCount = await Category.countDocuments({ productId: { $size: 0 } });
  
  if (productCount < 12 || emptyCategoryCount > 0) {
    console.log("Seeding / updating initial products and categories...");

    // Clear old seeded products and categories to ensure clean state
    await Product.deleteMany({});
    await Category.deleteMany({});

    // 1. Seed Products
    const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'product.json'), 'utf8'));
    const seededProducts = [];

    for (const prod of productsData) {
      const { id, category, subcategory, ...prodFields } = prod;
      const newProduct = new Product(prodFields);
      const saved = await newProduct.save();
      seededProducts.push({
        jsonId: id,
        category: category,
        subcategory: subcategory,
        dbId: saved._id,
        name: saved.name,
        brand: saved.brand
      });
    }
    console.log(`Seeded ${seededProducts.length} products.`);

    // 2. Seed Categories
    const categoriesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'category.json'), 'utf8'));
    for (const cat of categoriesData) {
      let matchedProductIds = [];
      if (cat.name === "Men") {
        matchedProductIds = seededProducts
          .filter(p => p.category === "Men" || p.jsonId === 1 || p.jsonId === 2 || p.jsonId === 4)
          .map(p => p.dbId);
      } else if (cat.name === "Women") {
        matchedProductIds = seededProducts
          .filter(p => p.category === "Women" || p.jsonId === 2 || p.jsonId === 3 || p.jsonId === 4)
          .map(p => p.dbId);
      } else if (cat.name === "Kids") {
        matchedProductIds = seededProducts
          .filter(p => p.category === "Kids" || (p.jsonId >= 5 && p.jsonId <= 8))
          .map(p => p.dbId);
      } else if (cat.name === "Beauty") {
        matchedProductIds = seededProducts
          .filter(p => p.category === "Beauty" || (p.jsonId >= 9 && p.jsonId <= 12))
          .map(p => p.dbId);
      }

      const newCategory = new Category({
        name: cat.name,
        subcategory: cat.subcategory,
        image: cat.image,
        productId: matchedProductIds
      });
      await newCategory.save();
    }
    console.log(`Seeded ${categoriesData.length} categories with populated products.`);
  } else {
    console.log("Database already contains complete data, skipping seeding.");
  }
}

async function startServer() {
  let mongoUri = process.env.MONGO_URI;
  let connected = false;

  if (mongoUri) {
    try {
      console.log("Attempting to connect to configured MongoDB URI...");
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log("MongoDB connected successfully");
      connected = true;
    } catch (err) {
      console.warn("Could not connect to configured MongoDB:", err.message);
      console.log("Falling back to in-memory MongoDB server...");
    }
  }

  if (!connected) {
    console.log("Starting in-memory MongoDB server...");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    console.log(`In-memory MongoDB started at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected (in-memory)");
  }

  await seedDatabase();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Server is running on port ${PORT} (0.0.0.0)`)
  );
}

if (!process.env.VERCEL) {
  startServer().catch((err) => console.log(err));
}

module.exports = app;

