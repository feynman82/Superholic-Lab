# Superholic Lab Styleguide

This document outlines the visual language and technical design lock for the Superholic Lab platform, detailing the 8-Point Grid, Glassmorphism utility tokens, and the ECC Framework Alignment.

## 1. The 8-Point Grid System

To ensure mathematical precision and consistency across all layouts, we strictly adhere to an 8-point grid. Every dimension, margin, padding, and gap must be a direct multiple of the 8-point base unit (8px). 

### CSS Variables
- `--space-1` = 8px
- `--space-2` = 16px
- `--space-3` = 24px
- `--space-4` = 32px
- `--space-5` = 40px
- `--space-6` = 48px
- `--space-8` = 64px
- `--space-10` = 80px

## 2. ECC Framework Alignment

All interfaces must enhance Engagement, Clarity, and Consistency.

### Typography
- **Headings (Bebas Neue):** Used for impactful titles and key numbers.
- **Body Text (Plus Jakarta Sans):** Used for all readable content, descriptions, and UI controls.

## 3. Design Lock: Stitch Glassmorphism

The platform employs a glassmorphism aesthetic tailored to our Sage and Rose palette. The blur and opacity ratios create a layered, depth-aware interface.

### Core Brand Colors
- **Sage:** `#51615E`
- **Rose:** `#B76E79`
- **Cream:** `#FFFDE7`

### Component Elevations (Z-Axis)

**Level 0 (Background / Foundation):**
- Standard backgrounds, Solid Sage, or Off-White.
- Textures applied to give depth.

**Level 1 (`.glass-panel-1`):**
- **Purpose:** Primary content containers (Dashboards, Question cards).
- **Style:** `backdrop-filter: blur(16px)`
- **Border:** 1px solid white at 40% opacity.
- **Background:** Tinted with Sage `rgba(81, 97, 94, 0.05)` or a light surface color.

**Level 2 (`.glass-panel-2`):**
- **Purpose:** Secondary containers, modals, overlays, nested content.
- **Style:** `backdrop-filter: blur(32px)`
- **Background:** Inner glow effect using `rgba(244, 251, 249, 0.8)` or translucent white for elevated contrast.

**Emphasis (`.glass-panel-rose`):**
- **Purpose:** Accentuate critical actions or highlighted states.
- **Background:** `rgba(183, 110, 121, 0.08)` with a translucent Rose border.

## 4. Component Standards

### Buttons
All buttons (`.btn`) inherit uniform padding, transitions, and the 8-point grid metrics:
- `.btn-primary`
- `.btn-secondary`
- `.btn-outline`
- `.btn-glass`
