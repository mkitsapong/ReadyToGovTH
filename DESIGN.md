---
name: Jobs Platform
description: A restrained, focused, and data-driven job aggregation board.
colors:
  primary: "#122754"
  accent: "#f97316"
  neutral-bg: "#f8fafc"
  text-primary: "#1e293b"
typography:
  body:
    fontFamily: "'Prompt', 'Plus Jakarta Sans', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  2xl: "28px"
spacing:
  sm: "12px"
  md: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
---

# Design System: Jobs Platform

## Overview

**Creative North Star: "The Calm Assessor"**

This visual system is restrained, focused, data-driven, and minimal. It prioritizes clarity and efficiency, ensuring that job seekers and employers can navigate complex data without being overwhelmed by unnecessary visual noise. The design recedes to let the content lead, using strategic pops of vibrant color only where action is required.

**Key Characteristics:**
- Content-first layout with high legibility.
- Subdued backgrounds contrasting with vibrant interactive elements.
- Clean and consistent spacing.

## Colors

The palette balances a Modern Tech Slate foundation with energetic Neon Orange accents for high contrast and focus.

### Primary
- **Tech Slate Blue** (#122754): Used for primary brand elements, prominent buttons, and structural navigation. It provides a trustworthy, grounding foundation.

### Secondary
- **Neon Orange** (#f97316): Used sparingly for primary calls to action, badges, and interactive highlights to draw the user's attention.

### Neutral
- **Slate Gray** (#1e293b): The primary text color, ensuring high legibility without the harshness of pure black.
- **Cool Background** (#f8fafc): Used for application backgrounds to reduce eye strain and provide contrast for lifted white cards.

### Named Rules
**The 90/10 Focus Rule.** 90% of the interface remains neutral and calm (white, slate, and gray). The remaining 10% uses the vibrant Neon Orange accent exclusively for interactive actions and important data visualization.

## Typography

**Display Font:** Prompt (with Plus Jakarta Sans fallback)
**Body Font:** Prompt (with Plus Jakarta Sans fallback)

**Character:** A modern, geometric sans-serif that feels approachable yet highly professional and easy to scan.

### Hierarchy
- **Headline** (800, 2.4rem, 1.2): Used for page titles and major marketing messages.
- **Title** (700, 1.1rem, 1.3): Used for card titles, modals, and section headers.
- **Body** (400, 1rem, 1.6): Used for all standard paragraphs and job descriptions.
- **Label** (600, 0.82rem, 0.05em): Uppercase labels for metadata and small UI hints.

### Named Rules
**The Data Legibility Rule.** Data points, metadata, and labels must use distinct font weights or colors (e.g., Gray 500) to separate them visually from primary reading text.

## Layout

The layout uses a constrained maximum width of 1280px with a responsive grid. It relies on a consistent rhythm of 24px gutters and generous internal padding (e.g., 20px inside cards) to maintain a calm, uncrowded feel. The density is moderate to support data scanning without feeling cramped.

## Elevation & Depth

The system uses a Layered & Lifted approach. Elements like job cards and modals clearly float above the background using distinct shadows.

### Shadow Vocabulary
- **Card Rest** (`0 2px 4px rgba(5,11,20,0.04), 0 1px 2px rgba(5,11,20,0.02)`): Provides a subtle lift from the background.
- **Card Hover** (`0 24px 48px rgba(5,11,20,0.12), 0 12px 24px rgba(5,11,20,0.08)`): Drastically increases depth to signal interactivity.
- **Modal Shadow** (`0 16px 32px rgba(5,11,20,0.08), 0 8px 16px rgba(5,11,20,0.06)`): Separates overlays clearly from the underlying content.

### Named Rules
**The Lifted Surface Rule.** Cards and containers sit on a slightly off-white background and use a pure white surface with a distinct shadow to create physical separation.

## Shapes

The form language is soft and approachable, using generous border radii. Major containers use large radii (20px to 28px), while interactive elements use tighter curves (10px).

## Components

### Buttons
- **Shape:** Softly rounded corners (10px).
- **Primary:** Tech Slate Blue background with 12px 24px padding. Text is white and semi-bold.
- **Accent:** Neon Orange background with a subtle glow shadow on hover.

### Cards / Containers
- **Corner Style:** Large rounded corners (20px).
- **Background:** Pure white to contrast with the application background.
- **Shadow Strategy:** Subtle lift at rest, significant lift on hover.
- **Border:** A very faint gray border (`1px solid rgba(226, 232, 240, 0.8)`).
- **Internal Padding:** 20px.

### Inputs / Fields
- **Style:** Gray background (Gray 50) with a 1.5px border (Gray 200) and 10px radius.
- **Focus:** Border shifts to Slate Blue with a subtle colored box-shadow to indicate active state.

### Navigation / Header
- **Style:** Sticky header with a dark, translucent navy background (`rgba(13, 31, 60, 0.95)`) and a strong backdrop blur (`12px`) to anchor the page while scrolling.
- **Links:** Subtle slate text that brightens to white on hover, and highlights with neon orange when active.
- **Shadow:** Casts a diffuse shadow (`0 4px 24px rgba(0, 0, 0, 0.15)`) to separate from the page content.

### Modal
- **Overlay:** Fixed backdrop with a dark translucent blue (`rgba(10,22,40,0.7)`) and subtle blur (`4px`).
- **Container:** Pure white card with the maximum border radius (28px) and a significant lift shadow.
- **Structure:** Clean separation of header, body, and footer with faint gray borders (`1px solid #f1f5f9`). The close button is a subtle gray square that darkens on hover.

## Do's and Don'ts

### Do:
- **Do** use the Neon Orange accent strictly for interactive or primary actions.
- **Do** maintain a minimum of 20px padding inside all lifted cards.

### Don't:
- **Don't** use pure black for text; rely on the slate gray shades.
- **Don't** mix shadows; use the predefined shadow tokens to maintain a consistent perceived light source.
