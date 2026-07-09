# Product Requirements Document: Promptly

**Version:** 1.0 (Personal Use Edition)
**Stack:** MERN (MongoDB, Express.js, React, Node.js)
**Author:** [Your Name]
**Status:** Draft

---

## 1. Overview

Promptly is a personal prompt-engineering tool. You type a rough, low-effort command describing what you want ("make a cyberpunk dashboard UI"), and Promptly converts it into a **high-quality, structured, high-level prompt** that any AI tool (ChatGPT, Claude, Midjourney, Cursor, v0, etc.) can understand and execute well. Promptly does not generate the final UI/code/image itself — it generates the *optimal prompt* to feed into other AI tools.

It also supports **image-prompt generation** — converting a plain description into a detailed prompt for image-generation models (Midjourney, DALL·E, Stable Diffusion style syntax).

Primary use case: **hackathons**, for quickly turning a vague idea into a precise prompt for UI design tools, AI coding assistants, and image generators.

This version is scoped for **personal use / single-user simplicity** — no subscription tiers, no OAuth, no usage limits.

## 2. Problem Statement

Writing effective prompts is a skill. Under hackathon time pressure, vague, underspecified prompts produce poor AI results, costing time on trial-and-error re-prompting. Promptly removes that skill barrier by auto-expanding a rough idea into a clear, structured, context-rich prompt in seconds.

## 3. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Fast prompt conversion | < 3 sec to generate a refined prompt |
| Prompt quality | Refined prompt requires no manual edits > 70% of the time |
| Hackathon utility | Used across 3+ prompt categories per session (design/code/image) |

## 4. Target Users

- You, personally — during hackathons or solo projects
- Anyone who wants well-structured prompts for AI coding assistants, AI UI-generation tools, or image generators

## 5. Core Product Concept

**Input:** A short, rough command (natural language, low effort)
**Processing:** Promptly analyzes intent and category, then expands it into a structured, detailed, high-level prompt following prompt-engineering best practices (context, constraints, format, tone, examples where relevant)
**Output:** A polished prompt, ready to copy/paste into any AI tool — categorized by type:
- **UI/Design prompts** — for AI design tools (Stitch, v0, Figma AI, etc.)
- **Coding prompts** — for AI coding assistants (Claude Code, Cursor, Copilot)
- **Image prompts** — for image-generation models (Midjourney, DALL·E, SDXL-style syntax, including style/lighting/composition modifiers)

**No usage limits** — prompt generation is unlimited for any signed-in user. No credits, tokens, or quota system.

## 6. Scope (Simplified)

### 6.1 Authentication — Simple Email/Password Only
- Single-step signup: Name, Email, Password
- Single-step login: Email, Password
- No OAuth (no Google/GitHub sign-in)
- No invite gating / "request access" — anyone can sign up directly
- No multi-step onboarding, no team/workspace step
- Basic "Forgot password" flow (optional — can be skipped for v1 if you want it even simpler)

### 6.2 Core App — Prompt Workspace
- Left sidebar: your name, New Thread, History, Saved Prompts, Logout (no tier badge, no version tag needed)
- Center panel: conversational thread
  - Your raw command (message bubble)
  - System response showing brief conversion status, then the final refined prompt
  - Timestamped messages
- Bottom input bar: raw command text input, attachment icon (optional), send button
- Right sidebar ("Assist" panel, optional):
  - Quick Actions: UI Design, Code Gen, Image Prompt, Rewrite
  - Templates: a few starter prompt templates

## 7. Functional Requirements

### 7.1 Authentication
- FR1: User can sign up with name, email, password (single step)
- FR2: User can log in with email/password
- FR3: Passwords hashed (bcrypt) before storage
- FR4: (Optional) Basic forgot-password flow

### 7.2 Prompt Conversion Engine
- FR5: User can enter a raw/rough command describing intent
- FR6: System classifies the command into a category (UI/design, code, image, general) automatically, or user selects via Quick Actions
- FR7: System generates a structured, high-level prompt from the raw input, using an LLM with a category-specific template
- FR8: Refined prompt is displayed in a copyable format (code block or card)
- FR9: User can regenerate/refine a prompt output without starting a new thread
- FR10: For image-prompt generation, output includes style/composition/lighting modifiers
- FR11: **No rate limiting or quota on number of prompts generated per user**

### 7.3 Organization & Reuse
- FR12: User can view prior conversion threads via History
- FR13: User can save generated prompts via Saved Prompts for reuse
- FR14: User can select from pre-built Templates as a starting point
- FR15: User can start a New Thread
- FR16: User can log out

## 8. Non-Functional Requirements

- NFR1: Prompt conversion should feel fast (result within a few seconds)
- NFR2: Auth uses simple JWT session (no token-expiry complexity needed — long-lived session token is fine for personal use)
- NFR3: Passwords hashed (bcrypt) before storage
- NFR4: Responsive layout, desktop-first
- NFR5: All raw commands and refined prompts persisted for History/Saved Prompts retrieval

## 9. Proposed Tech Architecture (MERN)

**Frontend (React)**
- React Router: Login, Signup, Workspace (just 3 routes)
- Simple auth context (logged in / not logged in — no roles/tiers)
- Component library: form inputs, chat bubbles, "refined prompt" card with copy button, sidebar nav, quick-action cards

**Backend (Node.js + Express)**
- Auth API: `/api/auth/signup`, `/api/auth/login` (email/password only)
- Thread/prompt API: `/api/threads`, `/api/threads/:id/messages`
- Prompt conversion endpoint: `/api/prompts/convert` — takes raw command + category, returns refined prompt
- Templates API: `/api/templates`
- Middleware: simple JWT auth guard (no rate limiting needed since usage is unlimited)

**Prompt Conversion Service**
- `PromptEngineService`:
  - Classifies input category (design / code / image / general)
  - Selects a category-specific meta-prompt/template
  - Calls an LLM (e.g., Claude/GPT API) with the meta-prompt + user's raw command
  - Returns the final structured prompt

**Database (MongoDB)**
- `Users`: name, email, hashed password, createdAt
- `Threads`: threadId, userId, title, category, createdAt, updatedAt
- `Messages`: messageId, threadId, role (user/assistant), rawInput, refinedPrompt, category, timestamp
- `SavedPrompts`: userId, refinedPrompt, category, tags, createdAt
- `Templates`: title, description, category, promptSkeleton

**Third-party integrations**
- LLM provider (Claude/OpenAI API) for the prompt-conversion engine — this is the only external dependency needed

## 10. User Flows

1. **New user:** Landing → Sign Up (Name, Email, Password) → Workspace (empty state / New Thread)
2. **Returning user:** Landing → Sign In (Email, Password) → Workspace (History restored)
3. **Prompt conversion:**
   - Workspace → type raw command → optionally pick category (UI Design / Code / Image) via Quick Actions → Send
   - Brief processing indicator → final refined, structured prompt returned in a copyable card
   - Copy the refined prompt into your AI tool of choice
   - Optionally save the prompt for reuse

## 11. Explicitly Removed From Scope

- OAuth (Google/GitHub sign-in)
- Multi-step signup / team details step
- Subscription tiers, "Pro" badges, plan/version display
- Any usage limits, credits, tokens, or quotas — prompt generation is unlimited
- "Request access" / invite gating

## 12. Out of Scope (v1)

- Actually generating the UI/code/image output — Promptly only produces the prompt, not the final artifact
- Team/multi-user collaboration
- Payment/billing

## 13. Open Questions

- Do you want a "Forgot password" flow, or skip it entirely for v1 since it's personal use?
- Should categories (UI/Code/Image) be auto-detected from the raw command, or always manually selected via Quick Actions?
- Which LLM API will power the conversion engine (Claude, OpenAI, etc.)?
