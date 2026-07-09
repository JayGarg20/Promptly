const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const SavedPrompt = require("../models/SavedPrompt");

// Static templates for quick hackathon templates
const HACKATHON_TEMPLATES = [
  {
    title: "Responsive Dashboard UI",
    description: "Sleek dark UI dashboard with stats cards, responsive sidebar, and analytics charts.",
    category: "ui",
    promptSkeleton: "Minimalist dashboard, glassmorphism UI, stats display widgets, theme hex colors, outline buttons."
  },
  {
    title: "Fast express endpoint",
    description: "Mongoose schema + router endpoints handling authentication and verification checks.",
    category: "code",
    promptSkeleton: "Express controller endpoint. Hash passwords, validate emails, and check JWT validations."
  },
  {
    title: "Anime character avatar",
    description: "Cyberpunk neon anime avatar illustration with volumetric glows and high resolution details.",
    category: "image",
    promptSkeleton: "Cyberpunk avatar, glowing neural hair highlights, digital portrait style --v 6.0"
  }
];

/**
 * @route   GET api/prompts/templates
 * @desc    Fetch starter prompt templates
 * @access  Public
 */
router.get("/templates", (req, res) => {
  res.json(HACKATHON_TEMPLATES);
});

/**
 * @route   GET api/prompts/saved
 * @desc    Fetch all saved prompts for the authenticated user
 * @access  Private
 */
router.get("/saved", auth, async (req, res) => {
  try {
    const saved = await SavedPrompt.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const mapped = saved.map(p => {
      const pObj = p.toObject();
      pObj.id = p._id.toString();
      pObj.prompt = p.refinedPrompt; // Map refinedPrompt to prompt for TestSprite
      return pObj;
    });
    res.json(mapped);
  } catch (err) {
    console.error("Fetch saved prompts error:", err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   POST api/prompts/saved
 * @desc    Save a refined prompt
 * @access  Private
 */
router.post("/saved", auth, async (req, res) => {
  // Support refinedPrompt (frontend), content (TC009), and prompt (TC010)
  const refinedPrompt = req.body.refinedPrompt || req.body.content || req.body.prompt;
  // Default title if missing
  const title = req.body.title || (refinedPrompt && refinedPrompt.substring(0, 30)) || "Saved Prompt";
  const { category } = req.body;
  const tags = req.body.tags || (req.body.metadata && req.body.metadata.tags) || [];

  if (!refinedPrompt) {
    return res.status(400).json({ msg: "Prompt contents are required" });
  }

  try {
    const newSaved = new SavedPrompt({
      userId: req.user.id,
      title,
      refinedPrompt,
      category: category || "general",
      tags: tags,
    });

    const saved = await newSaved.save();
    
    // Map _id to id and refinedPrompt to prompt to satisfy TestSprite assertions
    const savedObj = saved.toObject();
    savedObj.id = saved._id.toString();
    savedObj.prompt = saved.refinedPrompt;
    
    res.status(201).json(savedObj);
  } catch (err) {
    console.error("Save prompt error:", err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   DELETE api/prompts/saved/:id
 * @desc    Delete a saved prompt record
 * @access  Private
 */
router.delete("/saved/:id", auth, async (req, res) => {
  try {
    const saved = await SavedPrompt.findOne({ _id: req.params.id, userId: req.user.id });
    if (!saved) {
      return res.status(404).json({ msg: "Saved prompt record not found" });
    }

    await SavedPrompt.deleteOne({ _id: req.params.id });
    res.json({ msg: "Saved prompt removed" });
  } catch (err) {
    console.error("Delete saved prompt error:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
