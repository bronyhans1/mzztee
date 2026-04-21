const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    const u =
      username !== undefined && username !== null
        ? String(username).trim()
        : "";
    const p =
      password !== undefined && password !== null ? String(password) : "";

    const adminUser =
      process.env.ADMIN_USERNAME !== undefined
        ? String(process.env.ADMIN_USERNAME).trim()
        : "";
    const adminPass =
      process.env.ADMIN_PASSWORD !== undefined
        ? String(process.env.ADMIN_PASSWORD)
        : "";

    if (u === adminUser && p === adminPass) {
      const token = jwt.sign({ username: u }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      return res.json({ success: true, token });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
});

module.exports = router;
