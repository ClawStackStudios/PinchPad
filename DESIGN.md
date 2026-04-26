---
name: Sovereign Pearl
colors:
  surface: '#0f1419'
  surface-dim: '#0f1419'
  surface-bright: '#353a3f'
  surface-container-lowest: '#0a0f14'
  surface-container-low: '#171c21'
  surface-container: '#1b2025'
  surface-container-high: '#252a30'
  surface-container-highest: '#30353b'
  on-surface: '#dee3ea'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#dee3ea'
  inverse-on-surface: '#2c3136'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#ffb3ad'
  on-secondary: '#68000a'
  secondary-container: '#a40217'
  on-secondary-container: '#ffaea8'
  tertiary: '#54ddfc'
  on-tertiary: '#003640'
  tertiary-container: '#29c1df'
  on-tertiary-container: '#004b58'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ad'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#930013'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0f1419'
  on-background: '#dee3ea'
  surface-variant: '#30353b'
typography:
  h1:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  technical-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: '8'
  gutter: '24'
  margin: '32'
  container-max: '1440'
  stack-sm: '12'
  stack-md: '24'
  stack-lg: '48'
---

## Brand & Style

The design system is built on the philosophy of **Sovereign Clarity**, reimagined for a high-contrast **Dark Mode** environment. It evokes the feeling of a deep-sea sanctuary—secure, private, and nocturnal—illuminated by the bioluminescent glow of amber and cyan. The brand personality is "The Guardian of the Reef": hyper-secure, local-first, and technologically sophisticated, yet biologically inspired by the resilient lobster.

The visual style merges **Glassmorphism** with **Organic Interaction**. Surfaces appear as layered crystalline structures in deep, obsidian waters. Focused glows and subtle translucency create a sense of oceanic depth, while the "Pinch" and "Pad" colors act as vibrant signals against a dense, dark backdrop. The emotional response is one of absolute privacy, clarity, and tactile precision.

## Colors

The design system utilizes a "Deep Reef" dark mode as its primary state to emphasize transparency, sovereignty, and focus in low-light environments.

- **Primary (Pinch):** Amber tones represent the warmth of the hearth and the "pinch" of an interface. In dark mode, these tones glow to indicate primary actions and active states.
- **Secondary (Pad/AI):** Red tones are reserved for AI "Lobster" interactions and critical system alerts, suggesting biological intelligence and urgency.
- **Accent (Cyan):** Represents water clarity and connectivity. Use sparingly for bioluminescent progress indicators and highlights.
- **Neutral (Obsidian/Slate):** The base background is a deep, structural dark surface (#0f1419), providing a high-contrast canvas that allows amber and red to pierce through.

## Typography

The typographic hierarchy is unified through the use of **Inter**, providing a clean, neutral, and highly legible foundation that scales from high-level headlines to dense technical data.

**Inter** is utilized across all layers—headlines, body copy, and labels. Its tall x-height and excellent legibility make it ideal for the "Sovereign Pearl" dark environment, where light text against dark backgrounds requires careful weight management. For headlines, heavy weights and tight tracking create a sense of authority. For technical labels and security tokens, medium weights with slight letter spacing are used to maintain the high-precision feel of the system. High-contrast sizing is encouraged to maintain clarity against deep background layers.

## Layout & Spacing

This design system employs a **Fluid Grid** model with high-margin breathing room to reflect the expansive nature of a deep-sea environment. 

Layouts should be based on an 8px rhythmic unit. Main content containers use a 12-column grid for desktop with wide 24px gutters. For sovereign minimalism, utilize "dark space" (negative space) aggressively; do not fear large gaps between sections. Padding within cards and containers should be generous (24px to 32px) to ensure the interface feels spacious and premium rather than cramped.

## Elevation & Depth

Depth is established through **Tonal Layering** and **Bioluminescent Accents**. 

In dark mode, the system uses "Elevated Tiers." The base background is the deepest obsidian surface. Cards and modals are distinguished by being slightly lighter in tone rather than using heavy shadows. 

**Shadows & Glows:** Traditional shadows are replaced by subtle 1px "rim" borders and extremely diffused outer glows. When an element is active or "pinched," it should be highlighted with a soft Amber glow to simulate tactile, bioluminescent engagement. Glassmorphism is used for overlays, with high-density background blurs to keep text legible over complex dark backgrounds.

## Shapes

The shape language is organic and protective. Primary UI components (buttons, inputs) utilize **rounded-lg (1rem)** corners. Major containers and cards, which represent "safe zones" for local data, use **rounded-xl (1.5rem)** or **2xl (2.5rem)**. These generous radii soften the technical edge of the system, making the interface feel more like a physical object or a natural organism.

## Components

- **Buttons:** Primary buttons use a solid Amber-500 fill with dark, high-contrast text. Secondary buttons use a transparent fill with a 2px Amber border. AI-specific buttons use Red-500.
- **Cards:** Use the "Elevated Tier" style—slightly lighter than the background, 24px-40px padding, and 2xl rounded corners.
- **Chips:** Small, pill-shaped elements with low-opacity Amber or Cyan backgrounds used for metadata tagging.
- **Input Fields:** Clean, recessed appearance using a subtle 1px border. On focus, the border transitions to a 2px Amber glow.
- **Lobster HUD:** A unique component for AI status. A floating circular indicator in the top-right, pulsing with Red-500 when the AI is processing "local-first" data.
- **Checkboxes/Radios:** Highly tactile; when selected, they should feel "filled" with warm Amber light.