const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const existinguser = await User.findOne({ email });
    if (existinguser)
      return res.status(404).json({ message: "User already exisits" });
    const hashedpassword = await bcrypt.hash(password, 10);
    const user = new User({
      fullName,
      email,
      password: hashedpassword,
    });
    await user.save();
    const { password: _, ...userData } = user.toObject();
    res.status(201).json({ user: userData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) return res.status(404).json({ message: "Invalid password" });

    const { password: _, ...userData } = user.toObject();
    res.status(200).json({ user: userData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

// Update user theme preference
router.put("/theme", async (req, res) => {
  const { userId, themePreference } = req.body;
  try {
    if (!userId || !themePreference) {
      return res.status(400).json({ message: "userId and themePreference are required" });
    }
    const validThemes = ["system", "light", "dark", "midnight", "sunset", "emerald"];
    if (!validThemes.includes(themePreference)) {
      return res.status(400).json({ message: "Invalid theme preference" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { themePreference },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Theme preference updated successfully",
      themePreference: user.themePreference,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to update theme" });
  }
});

// Get user profile including theme preference
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

module.exports = router;