---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build or beautify web UI (landing pages, dashboards, components, HTML/CSS layouts).
---

# Frontend Design

This skill guides creation of distinctive, production-grade frontend interfaces with high design quality. Use it when asked to create web components, pages, or applications, especially when the user says “美化一下/更现代/更高级/更好看”.

## When to Use

- Build a landing page, dashboard, or full web UI
- Refactor an existing UI for better visual hierarchy and polish
- Create a coherent visual style system (tokens + components)
- Implement production-ready HTML/CSS (or React/Vue) with strong aesthetics

## Workflow

1. Ask up to 2–3 clarifying questions (target user, brand vibe, constraints/stack).
2. Define a 1-sentence visual thesis (mood, material, energy).
3. Establish tokens first (type scale, spacing, color, radius, shadow) using CSS variables.
4. Design layout and hierarchy before adding decorative elements.
5. Implement with accessibility and responsiveness built in.

## Design Thinking

- Start from content and tasks; remove anything that doesn’t help comprehension or action.
- One dominant idea per section; avoid “card soup” and excessive chrome.
- Use whitespace, alignment, and typography before adding gradients or effects.

## Visual Design Essentials

- **Typography:** 1–2 typefaces max; consistent scale; readable line-height; avoid tiny text.
- **Color:** neutral base + one accent by default; consistent semantic colors; strong contrast.
- **Spacing:** consistent rhythm (4/8px system); avoid arbitrary margins.
- **Surfaces:** subtle depth; don’t border every region; use dividers sparingly.

## Layout

- Use a clear grid and responsive gutters; avoid cramped, center-column-only layouts unless the brief calls for it.
- Mobile-first: comfortable spacing, large tap targets, no hover-only affordances.
- Keep the first viewport focused: headline, context, and a clear primary action.

## Components

- Buttons: primary/secondary/ghost; distinct hover/focus/disabled states.
- Forms: labels, helper text, error states; consistent sizing and spacing.
- Lists/tables: dense but readable; aligned numbers; good empty/loading states.

## Motion and Interaction

- Motion should improve hierarchy and affordance, not serve as decoration.
- Keep transitions fast and restrained; support `prefers-reduced-motion`.

## Accessibility

- Semantic HTML first.
- Visible focus states and keyboard navigation.
- Contrast and readable text sizing by default.

## Output Format (How to Respond)

When producing a UI/design answer, provide:

- The visual thesis (1 sentence)
- A small token set (CSS variables)
- Key layout decisions (grid, spacing, breakpoints)
- Production-ready code (minimal, clean, and consistent)
- Notes for responsiveness and accessibility

## Guardrails

- Avoid generic “AI gradient” aesthetics and random icon noise.
- Avoid too many colors and shadows; keep the system tight.
- Don’t introduce a heavy design system/library unless the user asks.
