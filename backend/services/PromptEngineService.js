const { GoogleGenAI } = require("@google/genai");

// Define meta-prompts for each category
const META_PROMPTS = {
  ui: `You are an expert UI/UX Prompt Engineer. Your job is to expand the user's low-effort UI request into a highly descriptive, structural, and detailed prompt that can be used in design generation tools like v0, Stitch, or Figma AI.

Structure your response with:
1. **Goal**: Clear description of what the interface accomplishes.
2. **Visual Aesthetics**: Colors (hex palettes), themes (e.g. minimalist, glassmorphic, neobrutalist), typography, dark/light considerations.
3. **Layout & Grid**: Details on screen structure, responsiveness, and spacing.
4. **Key Components**: Component-by-component details (forms, buttons, navigation, charts, tables).
5. **Interactive states**: Descriptions of hovers, focus states, and transitions.

Do not write any code. Only write the expanded prompt.`,

  code: `You are an expert Software Architecture Prompt Engineer. Your job is to expand the user's raw software feature request into a comprehensive, detailed context prompt to feed into AI coding assistants like Cursor, Claude Code, or GitHub Copilot.

Structure your response with:
1. **Objective**: Specific explanation of what code/features are being built.
2. **Tech Stack**: Recommended languages, libraries, and frameworks.
3. **Key Architecture**: Directory/file structures, data flows, and state management.
4. **Implementation Details**: Line-by-line coding guidelines, specific functional requirements, API endpoints.
5. **Quality & Constraints**: Edge cases, error handling, input validation, and performance optimizations.

Do not write any actual code files. Only write the instructions.`,

  image: `You are an expert Generative Art Prompt Engineer. Your job is to expand the user's plain description into a rich, detailed, and evocative prompt for image generators like Midjourney, DALL-E, or Stable Diffusion.

Structure your response with:
1. **Core Subject**: Detailed description of the main focus (pose, expression, clothes, actions).
2. **Composition & Framing**: Angle, depth of field, rules-of-thirds, camera settings.
3. **Lighting & Contrast**: Cinematic lighting, volumetric fog, rim lights, high/low key.
4. **Style & Aesthetics**: Digital painting, photorealistic, cyberpunk, watercolor, etc.
5. **Technical Modifiers**: Render engines (octane render, Unreal Engine 5), camera lenses, resolution details, aspect ratio format recommendations.

Keep it descriptive and punchy. Only return the final prompt ready for copy-pasting.`,

  general: `You are an expert General Prompt Engineer. Your job is to expand the user's vague prompt into a highly structured, context-rich instruction set for any LLM (like ChatGPT, Claude, Gemini).

Structure your response with:
1. **Role**: The persona the AI should adopt.
2. **Context**: Relevant background information.
3. **Task & Scope**: Step-by-step instructions of what the AI needs to do.
4. **Constraints**: What to avoid, formatting restrictions, and limitations.
5. **Examples**: Guidance on output formatting and tone.

Only return the expanded prompt.`
};

class PromptEngineService {
  /**
   * Auto-classifies a raw prompt if no category is provided
   * @param {string} rawInput 
   * @returns {string} category
   */
  classifyCategory(rawInput) {
    const text = rawInput.toLowerCase();
    if (text.includes("ui") || text.includes("dashboard") || text.includes("screen") || text.includes("interface") || text.includes("web app") || text.includes("navbar") || text.includes("page")) {
      return "ui";
    }
    if (text.includes("code") || text.includes("function") || text.includes("backend") || text.includes("api") || text.includes("script") || text.includes("database") || text.includes("algorithm")) {
      return "code";
    }
    if (text.includes("image") || text.includes("photo") || text.includes("drawing") || text.includes("art") || text.includes("illustration") || text.includes("logo") || text.includes("character")) {
      return "image";
    }
    return "general";
  }

  /**
   * Helper to parse data URL into inlineData block for Gemini SDK
   */
  parseBase64Image(dataUrl) {
    if (!dataUrl) return null;
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }

  /**
   * Converts a raw prompt into a structured expanded prompt
   * @param {string} rawInput 
   * @param {string} [category] - Optional category override
   * @param {string} [imageUrl] - Optional base64 data URL of attached image
   * @returns {Promise<{ refinedPrompt: string, category: string }>}
   */
  async convertPrompt(rawInput, category, imageUrl) {
    const selectedCategory = category && META_PROMPTS[category] 
      ? category 
      : this.classifyCategory(rawInput);
    
    const systemInstruction = META_PROMPTS[selectedCategory];

    // Check for API key presence
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY not set. Using local template generation engine (Mock).");
      return {
        refinedPrompt: this.generateMockPrompt(rawInput, selectedCategory),
        category: selectedCategory
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
System Instruction:
${systemInstruction}

User's Raw Request:
"${rawInput}"

Expanded Prompt Output:
`;

      const contents = [prompt];
      const parsedImage = this.parseBase64Image(imageUrl);
      if (parsedImage) {
        contents.unshift({
          inlineData: {
            data: parsedImage.data,
            mimeType: parsedImage.mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });
      const text = response.text.trim();
      
      return {
        refinedPrompt: text,
        category: selectedCategory
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      // Fallback in case of network or API error
      return {
        refinedPrompt: this.generateMockPrompt(rawInput, selectedCategory) + "\n\n*(Engine note: Generated via backup offline template due to API connection error)*",
        category: selectedCategory
      };
    }
  }

  /**
   * Generates a realistic mock prompt if offline or API Key is missing
   * @param {string} rawInput 
   * @param {string} category 
   * @returns {string}
   */
  generateMockPrompt(rawInput, category) {
    if (category === "ui") {
      return `### Expanded UI Prompt for Design AI:
**Goal**: Build a professional user interface for "${rawInput}".

**Visual Aesthetics**:
- **Palette**: Sleek dark slate (#0B0F19), charcoal grey surface containers (#161E2D), clean white text highlights (#FFFFFF), and neon-blue accent elements (#007FFF).
- **Typography**: Inter (Body) for high readability, Sora (Headings) for a geometric premium structure.
- **Theme**: Premium Dark mode with subtle border opacities (10%) and rounded card corners (12px).

**Layout**:
- Responsive desktop-first setup. A left-collapsible nav panel (80px to 256px), a center workspace panel maximizing screen width, and right-collapsible panel for detail contexts.

**Key Components**:
- Sidebar: Workspace items, user node status, and session commands.
- Center Panel: Chat logs displaying system connection states and copyable cards.
- Bottom Input: Clean floating bar with rounded shapes and send action.

**Interactions**:
- Soft hover scaling (scale-98) on buttons and smooth color transitions.`;
    }

    if (category === "code") {
      return `### Expanded Coding Prompt for Cursor/Claude Code:
**Objective**: Implement a backend function or service handling "${rawInput}".

**Tech Stack**:
- Node.js, Express, Mongoose, and standard validation libraries.

**Architectural Outline**:
- Establish models mapping database entities, standard router routes validation, and service classes executing operations.

**Implementation Details**:
- Write validations ensuring input constraints are met.
- Encapsulate LLM integrations in a separate service layer.
- Structure error blocks catching network exceptions and returning appropriate HTTP statuses.

**Quality & Security**:
- Sanitize database queries to prevent injection.
- Handle password ciphers securely using bcrypt hashing.`;
    }

    if (category === "image") {
      return `### Expanded Generative Art Prompt (Midjourney Style):
"Cinematic photorealistic composition representing **${rawInput}**. Shot on 35mm lens, volumetric neon lighting casting soft pink and cyan highlights. Moody atmosphere with light fog drifting in the background. High detail, 8k resolution, photorealistic reflections, octane render style --ar 16:9 --v 6.0"`;
    }

    return `### Expanded Instruction Prompt:
**Role**: Expert System Architect

**Context**: Re-evaluating criteria for "${rawInput}" to generate standard templates.

**Task & Scope**:
1. Formulate structural specifications based on the user's intent.
2. Outline key components and requirements.
3. Deliver results in a clear, formatted markdown card.

**Constraints**:
- Avoid complex code snippets.
- Use bullet points for structural layouts.`;
  }
}

module.exports = new PromptEngineService();
