const mongoose = require("mongoose");

const SavedPromptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  refinedPrompt: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["ui", "code", "image", "general"],
    default: "general",
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SavedPrompt", SavedPromptSchema);
