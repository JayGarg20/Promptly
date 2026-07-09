const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Thread = require("../models/Thread");
const Message = require("../models/Message");
const promptEngine = require("../services/PromptEngineService");

/**
 * @route   GET api/threads
 * @desc    Get user conversation history list
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const threads = await Thread.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });
    res.json(threads);
  } catch (err) {
    console.error("Fetch threads error:", err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   POST api/threads
 * @desc    Start a new thread session
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
  const { title, category } = req.body;

  try {
    const newThread = new Thread({
      userId: req.user.id,
      title: title || "New Thread",
      category: category || "general",
    });

    const thread = await newThread.save();
    res.status(201).json(thread);
  } catch (err) {
    console.error("Create thread error:", err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   GET api/threads/:id
 * @desc    Get details of a specific thread, including all message history
 * @access  Private
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const thread = await Thread.findOne({ _id: req.params.id, userId: req.user.id });
    if (!thread) {
      return res.status(404).json({ msg: "Thread session not found" });
    }

    const messages = await Message.find({ threadId: req.params.id }).sort({ timestamp: 1 });
    
    // Map _id to id and build flat JSON to satisfy both frontend and TestSprite expectations
    const threadData = thread.toObject();
    threadData.id = thread._id.toString();
    
    const messagesData = messages.map(m => {
      const mObj = m.toObject();
      mObj.id = m._id.toString();
      mObj.content = m.rawInput; // map rawInput to content
      return mObj;
    });

    res.json({
      id: thread._id.toString(),
      _id: thread._id,
      title: thread.title,
      category: thread.category,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      thread: threadData,
      messages: messagesData
    });
  } catch (err) {
    console.error("Get thread details error:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Thread session not found" });
    }
    res.status(500).send("Server Error");
  }
});

/**
 * @route   POST api/threads/:id/messages
 * @desc    Post a new user query & generate expanded prompt via LLM
 * @access  Private
 */
router.post("/:id/messages", auth, async (req, res) => {
  console.log("POST MESSAGES BODY:", req.body);
  console.log("POST MESSAGES HEADERS:", req.headers);
  // Support both rawInput (frontend) and raw_input (TestSprite)
  const rawInput = req.body.rawInput || req.body.raw_input;
  const { category, imageUrl } = req.body;

  if (!rawInput) {
    return res.status(400).json({ msg: "Raw input is required" });
  }

  try {
    const thread = await Thread.findOne({ _id: req.params.id, userId: req.user.id });
    if (!thread) {
      return res.status(404).json({ msg: "Thread session not found" });
    }

    // 1. Save User Message (with optional attached image data)
    const userMessage = new Message({
      threadId: thread._id,
      role: "user",
      rawInput,
      category: category || thread.category || "general",
      imageUrl: imageUrl || null,
    });
    await userMessage.save();

    // 2. Call Prompt Engine to expand the prompt using Gemini API (passing optional image)
    const conversionResult = await promptEngine.convertPrompt(
      rawInput, 
      category || thread.category, 
      imageUrl
    );

    // 3. Save Assistant response (containing the refined prompt)
    const assistantMessage = new Message({
      threadId: thread._id,
      role: "assistant",
      rawInput: conversionResult.refinedPrompt,
      refinedPrompt: conversionResult.refinedPrompt,
      category: conversionResult.category,
    });
    await assistantMessage.save();

    // 4. Update Thread Title if it's currently generic ("New Thread")
    if (thread.title === "New Thread" || thread.title === "") {
      // Cut user message to first 30 chars as title
      const userSnippet = rawInput.length > 30 ? rawInput.substring(0, 27) + "..." : rawInput;
      thread.title = userSnippet;
    }
    
    // Update thread timestamp and category
    thread.category = conversionResult.category;
    thread.updatedAt = Date.now();
    await thread.save();

    // Map structures to support both frontend camelCase and TestSprite expectations
    const userMsgObj = userMessage.toObject();
    userMsgObj.id = userMessage._id.toString();
    userMsgObj.content = userMessage.rawInput;

    const assistantMsgObj = assistantMessage.toObject();
    assistantMsgObj.id = assistantMessage._id.toString();
    assistantMsgObj.content = assistantMessage.refinedPrompt;

    res.status(201).json({
      userMessage,
      assistantMessage,
      thread,
      user_message: userMsgObj,
      assistant_response: assistantMsgObj,
      messages: [userMsgObj, assistantMsgObj]
    });
  } catch (err) {
    console.error("Post message error:", err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   DELETE api/threads/:id
 * @desc    Delete a thread session & all its messages
 * @access  Private
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const thread = await Thread.findOne({ _id: req.params.id, userId: req.user.id });
    if (!thread) {
      return res.status(404).json({ msg: "Thread session not found" });
    }

    await Message.deleteMany({ threadId: req.params.id });
    await Thread.deleteOne({ _id: req.params.id });

    res.json({ 
      msg: "Thread session deleted successfully",
      message: "Thread session deleted successfully"
    });
  } catch (err) {
    console.error("Delete thread error:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
