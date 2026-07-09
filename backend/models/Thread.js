const mongoose = require("mongoose");

const ThreadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    default: "New Thread",
    trim: true,
  },
  category: {
    type: String,
    enum: ["ui", "code", "image", "general"],
    default: "general",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt field on save
ThreadSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Thread", ThreadSchema);
