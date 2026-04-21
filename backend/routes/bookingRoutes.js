const express = require("express");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

const router = express.Router();

const requiredFields = ["name", "email", "phone", "service", "date"];
const allowedStatuses = ["pending", "approved", "completed"];

router.post("/", async (req, res) => {
  try {
    console.log("Incoming booking:", req.body);

    const missing = requiredFields.filter(
      (field) =>
        req.body[field] === undefined ||
        req.body[field] === null ||
        String(req.body[field]).trim() === ""
    );

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missing,
      });
    }

    const booking = new Booking({
      name: String(req.body.name).trim(),
      email: String(req.body.email).trim(),
      phone: String(req.body.phone).trim(),
      service: String(req.body.service).trim(),
      date: String(req.body.date).trim(),
      message:
        req.body.message !== undefined && req.body.message !== null
          ? String(req.body.message).trim()
          : undefined,
    });

    await booking.save();
    console.log("Saved booking:", booking);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: err.message,
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: err.message,
    });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        allowed: allowedStatuses,
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    return res.json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
