const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true, trim: true },
  service: { type: String, required: true },
  date: { type: String, required: true },
  message: { type: String, required: false },
  status: {
    type: String,
    enum: ["pending", "approved", "completed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);
