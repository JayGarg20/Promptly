const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Thread",
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  rawInput: {
    type: String,
    required: true,
  },
  refinedPrompt: {
    type: String,
    default: null, // Only applicable for role === 'assistant'
  },
  category: {
    type: String,
    enum: ["ui", "code", "image", "general"],
    default: "general",
  },
  imageUrl: {
    type: String,
    default: null, // Stores base64 image data for user messages
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", MessageSchema);
