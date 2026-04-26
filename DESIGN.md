---
name: PinchPad Design System
description: Design tokens and visual identity for the sovereign note-taking platform
type: design-tokens
version: 1.0.0

colors:
  brand:
    primary:
      - value: "#f59e0b"
        name: amber-500
      - value: "#d97706"
        name: amber-600
      - value: "#b45309"
        name: amber-700
    secondary:
      - value: "#ef4444"
        name: red-500
      - value: "#dc2626"
        name: red-600
      - value: "#b91c1c"
        name: red-700
    accent:
      - value: "#22d3ee"
        name: cyan-400
      - value: "#06b6d4"
        name: cyan-500
      - value: "#0891b2"
        name: cyan-600
      - value: "#0e7490"
        name: cyan-700
    gradient:
      - value: "linear-gradient(to right, #d97706, #b45309)"
        name: amber-primary
      - value: "linear-gradient(to right, #dc2626, #b91c1c)"
        name: red-secondary
      - value: "linear-gradient(to right, #0891b2, #0e7490)"
        name: cyan-accent
      - value: "linear-gradient(to bottom right, #f59e0b, #d97706)"
        name: brand-icon

  neutral:
    light:
      - value: "#f8fafc"
        name: slate-50
      - value: "#f1f5f9"
        name: slate-100
      - value: "#e2e8f0"
        name: slate-200
      - value: "#cbd5e1"
        name: slate-300
      - value: "#94a3b8"
        name: slate-400
      - value: "#64748b"
        name: slate-500
      - value: "#475569"
        name: slate-600
      - value: "#334155"
        name: slate-700
      - value: "#1e293b"
        name: slate-800
      - value: "#0f172a"
        name: slate-900
    dark:
      - value: "#0f1419"
        name: deep-ocean
      - value: "#faf8f6"
        name: pearl-white
      - value: "#1e293b"
        name: slate-800-dark
      - value: "#020617"
        name: slate-950

  semantic:
    success:
      - value: "#22c55e"
        name: green-500
      - value: "#16a34a"
        name: green-600
      - value: "#15803d"
        name: green-700
    warning:
      - value: "#eab308"
        name: yellow-500
      - value: "#ca8a04"
        name: yellow-600
    error:
      - value: "#ef4444"
        name: red-500
      - value: "#dc2626"
        name: red-600
      - value: "#b91c1c"
        name: red-700
    info:
      - value: "#3b82f6"
        name: blue-500
      - value: "#2563eb"
        name: blue-600
      - value: "#1d4ed8"
        name: blue-700

typography:
  font:
    family:
      - value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        name: sans
      - value: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
        name: mono
  size:
    - value: "0.625rem"
      name: xs
    - value: "0.75rem"
      name: sm
    - value: "0.875rem"
      name: base
    - value: "1rem"
      name: lg
    - value: "1.125rem"
      name: xl
    - value: "1.25rem"
      name: 2xl
    - value: "1.5rem"
      name: 3xl
    - value: "1.875rem"
      name: 4xl
    - value: "2.25rem"
      name: 5xl
    - value: "3rem"
      name: 6xl
    - value: "3.75rem"
      name: 7xl
    - value: "4.5rem"
      name: 8xl
  weight:
    - value: 400
      name: normal
    - value: 500
      name: medium
    - value: 600
      name: semibold
    - value: 700
      name: bold
    - value: 800
      name: extrabold
    - value: 900
      name: black
  line-height:
    - value: 1.25
      name: tight
    - value: 1.5
      name: normal
    - value: 1.75
      name: relaxed
  letter-spacing:
    - value: "-0.025em"
      name: tight
    - value: "normal"
      name: normal
    - value: "0.025em"
      name: wide
    - value: "0.1em"
      name: wider
    - value: "0.25em"
      name: widest
  tracking:
    - value: "tighter"
      name: tighter
    - value: "tight"
      name: tight
    - value: "normal"
      name: normal
    - value: "wide"
      name: wide
    - value: "wider"
      name: wider
    - value: "widest"
      name: widest

spacing:
  - value: "0.125rem"
    name: 0.5
  - value: "0.25rem"
    name: 1
  - value: "0.375rem"
    name: 1.5
  - value: "0.5rem"
    name: 2
  - value: "0.75rem"
    name: 3
  - value: "1rem"
    name: 4
  - value: "1.25rem"
    name: 5
  - value: "1.5rem"
    name: 6
  - value: "2rem"
    name: 8
  - value: "2.5rem"
    name: 10
  - value: "3rem"
    name: 12
  - value: "4rem"
    name: 16
  - value: "5rem"
    name: 20
  - value: "6rem"
    name: 24

border:
  radius:
    - value: "0.25rem"
      name: sm
    - value: "0.375rem"
      name: md
    - value: "0.5rem"
      name: lg
    - value: "0.75rem"
      name: xl
    - value: "1rem"
      name: 2xl
    - value: "1.5rem"
      name: 3xl
    - value: "9999px"
      name: full
  width:
    - value: "1px"
      name: thin
    - value: "2px"
      name: default
    - value: "4px"
      name: thick
    - value: "8px"
      name: heavy

shadow:
  - value: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    name: sm
  - value: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
    name: md
  - value: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
    name: lg
  - value: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
    name: xl
  - value: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
    name: 2xl
  - value: "0 0 20px rgb(245 158 11 / 0.1)"
    name: amber-sm
  - value: "0 0 25px rgb(245 158 11 / 0.2)"
    name: amber-lg
  - value: "0 0 30px rgb(239 68 68 / 0.1)"
    name: red-sm
  - value: "0 0 35px rgb(239 68 68 / 0.2)"
    name: red-lg
  - value: "0 0 20px rgb(15 20 25 / 0.5)"
    name: dark-lg
  - value: "0 0 10px rgb(6 182 212 / 0.2)"
    name: cyan-lg
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"

elevation:
  - value: 0
    name: none
    shadow: none
  - value: 1
    name: base
    shadow: sm
  - value: 2
    name: raised
    shadow: md
  - value: 3
    name: floating
    shadow: lg
  - value: 4
    name: overlay
    shadow: xl
  - value: 5
    name: modal
    shadow: 2xl

opacity:
  - value: 0
    name: transparent
  - value: 10
    name: 10
  - value: 20
    name: 20
  - value: 30
    name: 30
  - value: 40
    name: 40
  - value: 50
    name: 50
  - value: 60
    name: 60
  - value: 70
    name: 70
  - value: 80
    name: 80
  - value: 90
    name: 90
  - value: 95
    name: 95
  - value: 100
    name: opaque

transition:
  duration:
    - value: 100
      name: fast
    - value: 150
      name: faster
    - value: 200
      name: normal
    - value: 300
      name: slow
    - value: 500
      name: slower
    - value: 700
      name: slowest
  easing:
    - value: "linear"
      name: linear
    - value: "ease-in"
      name: in
    - value: "ease-out"
      name: out
    - value: "ease-in-out"
      name: in-out
    - value: "cubic-bezier(0.4, 0, 0.2, 1)"
      name: default
    - value: "cubic-bezier(0.25, 0.1, 0.25, 1)"
      name: ease

motion:
  spring:
    stiffness:
      - value: 400
        name: subtle
      - value: 500
        name: default
      - value: 600
        name: snappy
    damping:
      - value: 12
        name: subtle
      - value: 20
        name: default
      - value: 30
        name: snappy
  animation:
    - value: "spin 1s linear infinite"
      name: spin
    - value: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite"
      name: ping
    - value: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      name: pulse
    - value: "bounce 1s infinite"
      name: bounce
    - value: "fade-in 0.3s ease-in-out"
      name: fadeIn
    - value: "slide-up 0.3s ease-out"
      name: slideUp
    - value: "slide-down 0.3s ease-out"
      name: slideDown
    - value: "scale-in 0.2s ease-out"
      name: scaleIn

z-index:
  - value: 0
    name: base
  - value: 10
    name: dropdown
  - value: 20
    name: sticky
  - value: 30
    name: fixed
  - value: 40
    name: modal-backdrop
  - value: 50
    name: modal
  - value: 60
    name: popover
  - value: 70
    name: tooltip

breakpoint:
  - value: "640px"
    name: sm
  - value: "768px"
    name: md
  - value: "1024px"
    name: lg
  - value: "1280px"
    name: xl
  - value: "1536px"
    name: 2xl

---

# PinchPad Design System

## Design Philosophy

PinchPad embodies a sovereign, oceanic aesthetic that merges the warmth of amber sunsets with the depth of ocean depths. The design language reflects its core identity: a secure, local-first note-taking platform where humans and AI "Lobsters" collaborate in a shared digital reef.

The visual system balances **approachability** with **security**, using warm amber tones for primary actions while maintaining crisp slate neutrals for content. The dark mode employs a custom "deep ocean" palette (#0f1419) that feels immersive rather than oppressive.

### Brand Character

- **Warmth & Trust**: Amber as the primary brand color conveys warmth, energy, and the organic nature of the lobster metaphor
- **Security Depth**: The deep ocean dark mode provides visual depth and communicates security through layered, protected spaces
- **Human-Agency Harmony**: Red coral accents represent the AI "Lobsters" that collaborate with users, creating a visual dialogue between creator and agent
- **Sovereign Simplicity**: Clean interfaces with deliberate use of space and hierarchy reflect the local-first, self-hosted philosophy

### Visual Language

**Sovereign Minimalism**: The interface prioritizes clarity and function while maintaining distinctive brand personality. Every element serves a purpose, with decoration used sparingly to reinforce brand identity rather than distract.

**Oceanic Depth**: Dark mode isn't just inverted light mode—it's a deliberate "deep ocean" environment. Backgrounds have subtle warmth (#0f1419), text uses a warm off-white (#faf8f6), and shadows carry oceanic depth.

**Organic Interaction**: Hover states, transitions, and animations feel natural and responsive, mimicking underwater movement. The theme transition uses a circular "molt" effect that spreads from the interaction point like ripples.

## Color System

### Primary Palette (Amber)

The amber palette serves as PinchPad's primary identity, representing the warmth of sunset over the ocean and the organic nature of the lobster.

- **amber-500 (#f59e0b)**: Default primary color for buttons, icons, and interactive elements
- **amber-600 (#d97706)**: Hover states and emphasized actions
- **amber-700 (#b45309)**: Active states and high-emphasis interactions

Use amber for:
- Primary action buttons
- Navigation highlights
- Interactive icons
- Brand elements (logo, wordmark)
- Success states and positive feedback

### Secondary Palette (Red Coral)

The red palette represents the AI "Lobsters" that collaborate with users—distinct from but harmonious with the primary amber.

- **red-500 (#ef4444)**: Agent-related accents and secondary brand elements
- **red-600 (#dc2626)**: Agent action highlights
- **red-700 (#b91c1c)**: Deep agent states

Use red for:
- Agent/Lobster references in text
- Secondary action buttons
- Agent status indicators
- "Pad" portion of the brand wordmark

### Accent Palette (Cyan)

Cyan provides cool contrast to warm amber and red, used for technical elements and informational states.

- **cyan-400 (#22d3ee)**: Light accents and highlights
- **cyan-500 (#06b6d4)**: Default accent color
- **cyan-600 (#0891b2)**: Hover states for accent elements
- **cyan-700 (#0e7490)**: Active accent states

Use cyan for:
- Settings and configuration elements
- Technical code blocks
- Informational badges
- Links and external references

### Neutral Palette (Slate)

The slate palette provides the foundation for all content, with deliberate pairing between light and dark modes.

**Light Mode**:
- Backgrounds: slate-50 (#f8fafc) to slate-200 (#e2e8f0)
- Borders: slate-200 (#e2e8f0) to slate-300 (#cbd5e1)
- Text: slate-500 (#64748b) to slate-900 (#0f172a)

**Dark Mode**:
- Background: Custom deep-ocean (#0f1419) and slate-900 (#0f172a)
- Borders: slate-700 (#334155) and slate-800 (#1e293b)
- Text: slate-400 (#94a3b8) to pearl-white (#faf8f6)

The dark mode specifically uses:
- **#0f1419** for the main background—a warm, deep ocean color
- **#faf8f6** for primary text—a warm off-white that's less harsh than pure white
- **#020617** (slate-950) for the deepest backgrounds and nested containers

### Semantic Colors

**Success (Green)**:
- green-500 (#22c55e): Success messages, active status
- green-600 (#16a34a): Hover states
- green-700 (#15803d): Active states

**Warning (Yellow)**:
- yellow-500 (#eab308): Warning banners
- yellow-600 (#ca8a04): Warning hover states

**Error (Red)**:
- Reuses the red palette for error states
- red-500 (#ef4444): Error messages
- red-600 (#dc2626): Destructive actions
- red-700 (#b91c1c): Critical errors

**Info (Blue)**:
- blue-500 (#3b82f6): Informational messages
- blue-600 (#2563eb): Info hover states
- blue-700 (#1d4ed8): Info active states

### Gradients

Gradients add depth and dimension while reinforcing brand colors:

- **amber-primary**: `linear-gradient(to right, #d97706, #b45309)` — Primary buttons and CTAs
- **red-secondary**: `linear-gradient(to right, #dc2626, #b91c1c)` — Secondary brand elements
- **cyan-accent**: `linear-gradient(to right, #0891b2, #0e7490)` — Technical accents
- **brand-icon**: `linear-gradient(to bottom right, #f59e0b, #d97706)` — Icon backgrounds and brand elements

### Color Usage Guidelines

**Never**:
- Use red for errors in the same context where it represents Lobsters/agents
- Mix semantic colors arbitrarily without semantic meaning
- Use amber and red together at similar intensities without hierarchy
- Apply full saturation amber or red to large background areas

**Always**:
- Maintain sufficient contrast ratios for accessibility (WCAG AA minimum)
- Use color semantics consistently across the application
- Pair warm brand colors with appropriate neutral backgrounds
- Consider color blindness when using color to convey meaning

## Typography

### Font Families

**Sans-serif (Primary)**: System font stack for maximum performance and native feel
- Includes: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Used for: All body text, headings, UI elements

**Monospace (Code)**: System monospace for technical content
- Includes: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace
- Used for: Code snippets, key hashes, API tokens, technical metadata

### Type Scale

The type scale follows a modular scale optimized for readability at oceanic depths:

- **xs (0.625rem / 10px)**: Metadata, timestamps, very small labels
- **sm (0.75rem / 12px)**: Small labels, helper text, button text
- **base (0.875rem / 14px)**: Default body text, standard content
- **lg (1rem / 16px)**: Emphasized body text, important labels
- **xl (1.125rem / 18px)**: Subheadings, card titles
- **2xl (1.25rem / 20px)**: Section headings
- **3xl (1.5rem / 24px)**: Page headings
- **4xl (1.875rem / 30px)**: Large headings
- **5xl (2.25rem / 36px)**: Hero headings
- **6xl (3rem / 48px)**: Marketing headings
- **7xl (3.75rem / 60px)**: Large marketing headings
- **8xl (4.5rem / 72px)**: Extra large headings

### Font Weights

- **normal (400)**: Default body text
- **medium (500)**: Emphasized body text, button labels
- **semibold (600)**: Subheadings, important labels
- **bold (700)**: Headings, navigation items
- **extrabold (800)**: Emphasized headings
- **black (900)**: Display headings, brand elements

### Line Heights

- **tight (1.25)**: Headings, compact text
- **normal (1.5)**: Body text, paragraphs
- **relaxed (1.75)**: Long-form content, expanded spacing

### Letter Spacing

- **tighter (-0.025em)**: Large headings, tight display
- **tight**: Small headings, condensed labels
- **normal**: Default body text
- **wide (0.025em)**: Small caps, special emphasis
- **wider (0.1em)**: Expanded text, decorative
- **widest (0.25em)**: Maximum expansion, special cases

### Tracking

Special tracking values for specific typography needs:

- **tighter**: Ultra-condensed text
- **tight**: Slightly condensed
- **normal**: Default
- **wide**: Expanded
- **wider**: More expanded
- **widest**: Maximum expansion

### Typography Hierarchy

**Level 1 (Display)**: 8xl, black, tight line-height, tighter tracking
- Usage: Hero section on landing page

**Level 2 (Page Title)**: 4xl-5xl, bold/extrabold, tight line-height
- Usage: Page headings (Dashboard, Settings, etc.)

**Level 3 (Section)**: 2xl-3xl, semibold/bold, tight line-height
- Usage: Section headers within pages

**Level 4 (Component)**: xl-lg, medium/semibold, normal line-height
- Usage: Card titles, modal headers, navigation items

**Level 5 (Body)**: base-lg, normal/medium, normal line-height
- Usage: Paragraph text, descriptions

**Level 6 (Meta)**: xs-sm, normal/medium, normal line-height
- Usage: Timestamps, labels, helper text

## Spacing System

The spacing system uses an 8px base unit, scaled consistently across all components.

### Scale

- **0.5 (0.125rem / 2px)**: Micro spacing, icon padding
- **1 (0.25rem / 4px)**: Very tight spacing, icon gaps
- **1.5 (0.375rem / 6px)**: Tight spacing, compact elements
- **2 (0.5rem / 8px)**: Small spacing, button padding
- **3 (0.75rem / 12px)**: Base spacing, standard padding
- **4 (1rem / 16px)**: Default spacing, element gaps
- **5 (1.25rem / 20px)**: Medium spacing, section padding
- **6 (1.5rem / 24px)**: Large spacing, card padding
- **8 (2rem / 32px)**: Extra large spacing, section gaps
- **10 (2.5rem / 40px)**: XL spacing, page sections
- **12 (3rem / 48px)**: XXL spacing, major sections
- **16 (4rem / 64px)**: XXXL spacing, hero sections
- **20 (5rem / 80px)**: Maximum spacing, full sections
- **24 (6rem / 96px)**: Ultra spacing, large breaks

### Spacing Patterns

**Component Padding**:
- Buttons: 2-3 (vertical), 4-5 (horizontal)
- Cards: 4-6 (all sides)
- Modals: 5-6 (all sides)
- Inputs: 2-3 (vertical), 3-4 (horizontal)

**Gap Patterns**:
- Tightly grouped elements: 1-2
- Standard grouping: 3-4
- Section separation: 6-8
- Page sections: 10-12
- Major breaks: 16+

**Layout Margins**:
- Page container: 4-6
- Section container: 6-8
- Hero section: 12-16

## Border Radius

The border radius system creates visual hierarchy through corner softness.

### Scale

- **sm (0.25rem / 4px)**: Very subtle rounding, small elements
- **md (0.375rem / 6px)**: Subtle rounding, inputs, small buttons
- **lg (0.5rem / 8px)**: Standard rounding, buttons, cards
- **xl (0.75rem / 12px)**: Large rounding, prominent cards
- **2xl (1rem / 16px)**: Extra large rounding, modals
- **3xl (1.5rem / 24px)**: Very large rounding, hero cards
- **full (9999px)**: Pill shapes, circular elements

### Radius Usage

**sm**: Small badges, tags, tiny buttons
- Usage: Status indicators, miniature UI elements

**md**: Input fields, small buttons
- Usage: Form inputs, compact controls

**lg**: Standard buttons, cards
- Usage: Primary buttons, note cards, list items

**xl**: Large cards, prominent elements
- Usage: Feature cards, modal bodies

**2xl**: Modals, large containers
- Usage: Modal containers, large panels

**3xl**: Hero elements, promotional cards
- Usage: Landing page cards, gateway panels

**full**: Pills, circles
- Usage: Theme toggles, badges, avatars

## Border Width

### Scale

- **thin (1px)**: Subtle borders, separators
- **default (2px)**: Standard borders, emphasis
- **thick (4px)**: Heavy borders, strong emphasis
- **heavy (8px)**: Extra heavy, special cases

### Width Usage

**thin (1px)**:
- Input field borders
- Card borders (inactive)
- Separator lines

**default (2px)**:
- Active card borders
- Modal borders
- Emphasized elements

**thick (4px)**:
- Accent borders (brand-colored)
- Special callouts

**heavy (8px)**:
- Special decorative elements
- Rare emphasis cases

## Shadows

Shadows create depth and hierarchy, with both neutral and colored variants.

### Neutral Shadows

- **sm**: Subtle elevation, small elements
- **md**: Standard elevation, cards, buttons
- **lg**: Raised elevation, floating elements
- **xl**: High elevation, dropdowns, popovers
- **2xl**: Maximum elevation, modals

### Colored Shadows

Colored shadows reinforce brand identity while providing depth:

- **amber-sm**: `0 0 20px rgb(245 158 11 / 0.1)` — Subtle amber glow
- **amber-lg**: `0 0 25px rgb(245 158 11 / 0.2)` — Prominent amber glow
- **red-sm**: `0 0 20px rgb(239 68 68 / 0.1)` — Subtle red glow
- **red-lg**: `0 0 35px rgb(239 68 68 / 0.2)` — Prominent red glow
- **dark-lg**: `0 0 20px rgb(15 20 25 / 0.5)` — Dark mode shadows
- **cyan-lg**: `0 0 10px rgb(6 182 212 / 0.2)` — Cyan accent glow

### Inner Shadow

- **inner**: `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` — Inset depth, pressed states

### Shadow Usage

**sm**: Small buttons, input focus states
**md**: Default cards, raised buttons
**lg**: Hover cards, dropdown menus
**xl**: Popovers, tooltips
**2xl**: Modals, full-screen overlays

Colored shadows should be used sparingly for:
- Brand element emphasis (logo, icons)
- Active state indicators
- Special call-to-action elements
- Hover states on brand-colored elements

## Elevation

Elevation combines z-index and shadows to create visual hierarchy and manage stacking context.

### Levels

- **none (z: 0)**: Base elements, no shadow
- **base (z: 10)**: Standard elements, shadow-sm
- **raised (z: 20)**: Cards, buttons, shadow-md
- **floating (z: 30)**: Dropdowns, shadow-lg
- **overlay (z: 40)**: Modals, shadow-xl
- **modal (z: 50)**: Full-screen modals, shadow-2xl

### Elevation Hierarchy

**Ground Level (0)**:
- Page background
- Static content
- Base layout elements

**Base Level (10)**:
- Sticky navigation
- Sidebar
- Standard cards

**Raised Level (20)**:
- Hover states
- Active cards
- Floating buttons

**Floating Level (30)**:
- Dropdowns
- Popovers
- Tooltips

**Overlay Level (40)**:
- Modal backdrops
- Slide-over panels
- Full-screen overlays

**Modal Level (50)**:
- Modal content
- Full-screen dialogs
- Critical alerts

## Opacity

The opacity system provides transparency control for overlays, disabled states, and visual layering.

### Scale

- **transparent (0)**: Fully invisible
- **10-30**: Subtle overlays, ghost elements
- **40-60**: Moderate overlays, disabled states
- **70-90**: Strong overlays, tinted backgrounds
- **95**: Nearly opaque, subtle transparency
- **opaque (100)**: Fully visible, no transparency

### Opacity Usage

**10-20%**: Very subtle overlays, ghost effects
- Background tints
- Placeholder states

**30-50%**: Moderate overlays
- Disabled elements
- Loading overlays
- Backdrop hints

**60-70%**: Strong overlays
- Modal backdrops
- Overlay gradients
- Tinted sections

**80-95%**: Near-opaque
- Glassmorphism effects
- Subtle transparency
- Filtered backgrounds

## Transitions

Transitions create smooth, natural interactions throughout the interface.

### Durations

- **fast (100ms)**: Instant feedback, micro-interactions
- **faster (150ms)**: Quick state changes
- **normal (200ms)**: Standard transitions
- **slow (300ms)**: Deliberate changes
- **slower (500ms)**: Major transitions (theme switch)
- **slowest (700ms)**: Very major transitions

### Easing Functions

- **linear**: Constant speed, rare use
- **ease-in**: Accelerating start
- **ease-out**: Decelerating end
- **ease-in-out**: Accelerate then decelerate (most common)
- **default**: Custom cubic-bezier for natural motion
- **ease**: Gentle, natural motion

### Transition Patterns

**Micro-interactions (100-150ms, ease-out)**:
- Button hover states
- Input focus states
- Icon color changes

**Standard transitions (200-300ms, ease-in-out)**:
- Card hover effects
- Panel slide transitions
- Color mode changes
- Navigation state changes

**Major transitions (500-700ms, ease-in-out)**:
- Theme switches (with view transition)
- Page route transitions
- Modal open/close
- Full-screen overlays

### Common Transitions

- `transition-colors duration-300`: Color changes
- `transition-all duration-300`: All property changes
- `transition-transform duration-200`: Transform only
- `transition-opacity duration-200`: Opacity only
- `transition-colors duration-500`: Theme-related color changes

## Motion

Motion adds life and personality to the interface while maintaining performance and accessibility.

### Spring Physics

Springs create natural, bouncy motion for interactions:

**Subtle (stiffness: 400, damping: 12)**:
- Gentle bounces
- Subtle hover effects
- Brand letter animations (subtle variant)

**Default (stiffness: 500, damping: 20)**:
- Standard bounces
- Card hover effects
- Icon hover states

**Snappy (stiffness: 600, damping: 30)**:
- Quick, responsive motion
- Button interactions
- Quick hover effects

### Animations

**Standard Animations**:
- `spin`: Rotating loader, 1s linear infinite
- `ping`: Expanding ring, 1s ease-in-out infinite
- `pulse`: Pulsing opacity, 2s ease-in-out infinite
- `bounce`: Bouncing motion, 1s infinite

**Custom Animations**:
- `fade-in`: Opacity fade-in, 0.3s ease-in-out
- `slide-up`: Slide from bottom, 0.3s ease-out
- `slide-down`: Slide from top, 0.3s ease-out
- `scale-in`: Scale from center, 0.2s ease-out

### View Transitions

The theme transition uses a circular "molt" effect that spreads from the interaction point:

- **Duration**: 500ms
- **Easing**: ease-in-out
- **Effect**: Circular clip-path expansion from click coordinates
- **Pseudo-element**: `::view-transition-new(root)`

This creates a ripple effect like a stone dropped in water, reinforcing the oceanic theme.

### Motion Guidelines

**Use Motion For**:
- State changes (active, hover, focus)
- Element entry/exit (modals, panels)
- Loading states
- Feedback and confirmation
- Delightful micro-interactions

**Avoid Motion For**:
- Static content displays
- Critical error messages
- Accessibility-reduced mode
- User preference: reduced motion

**Motion Principles**:
1. **Purposeful**: Every animation should communicate something
2. **Performant**: Prefer transforms and opacity over layout properties
3. **Natural**: Use easing that feels organic
4. **Respectful**: Honor user's motion preferences
5. **Brief**: Keep durations short unless intentional

## Z-Index

The z-index system manages stacking order for layered elements.

### Scale

- **base (0)**: Default stacking context
- **dropdown (10)**: Dropdown menus
- **sticky (20)**: Sticky headers and footers
- **fixed (30)**: Fixed position elements
- **modal-backdrop (40)**: Modal overlay/backdrop
- **modal (50)**: Modal content
- **popover (60)**: Popovers and tooltips
- **tooltip (70)**: Highest priority overlays

### Z-Index Hierarchy

**Layer 0 (base)**:
- Page content
- Standard elements
- Default stacking context

**Layer 10 (dropdown)**:
- Dropdown menus
- Select options
- Nested panels

**Layer 20 (sticky)**:
- Sticky navigation
- Sticky headers
- Fixed sidebar on scroll

**Layer 30 (fixed)**:
- Fixed navigation
- Floating action buttons
- Fixed sidebars

**Layer 40 (modal-backdrop)**:
- Modal backdrops
- Overlay tints
- Full-screen overlays

**Layer 50 (modal)**:
- Modal content
- Dialog content
- Overlay panels

**Layer 60 (popover)**:
- Popovers
- Context menus
- Dropdown-style tooltips

**Layer 70 (tooltip)**:
- Tooltips
- Hover information
- Highest priority overlays

## Breakpoints

The breakpoint system defines responsive layout boundaries.

### Scale

- **sm (640px)**: Small screens, large phones
- **md (768px)**: Medium screens, tablets
- **lg (1024px)**: Large screens, laptops
- **xl (1280px)**: Extra large screens, desktops
- **2xl (1536px)**: Extra extra large screens, large displays

### Responsive Patterns

**Mobile First (< sm)**:
- Single column layouts
- Compact navigation (hamburger menu)
- Stacked components
- Full-width modals

**Small Screens (sm)**:
- Limited two-column layouts
- Compact sidebar
- Responsive grids (1-2 columns)

**Medium Screens (md)**:
- Standard two-column layouts
- Expandable sidebar
- Responsive grids (2-3 columns)

**Large Screens (lg)**:
- Multi-column layouts
- Full sidebar
- Responsive grids (3-4 columns)

**Extra Large (xl)**:
- Complex multi-column layouts
- Spacious layouts
- Responsive grids (4+ columns)

**Extra Extra Large (2xl)**:
- Maximum layout complexity
- Very spacious layouts
- Maximum grid columns

## Component Patterns

### Buttons

**Primary Buttons**:
- Background: Amber gradient or solid amber-600
- Text: White
- Shadow: shadow-lg with amber tint
- Hover: Amber-700, slight lift
- Active: Amber-700, pressed state
- Radius: md-lg
- Padding: 2-3 vertical, 4-5 horizontal

**Secondary Buttons**:
- Background: White or slate-100 (dark: slate-800)
- Text: Slate-700 (dark: slate-300)
- Border: 1-2px slate-300 (dark: slate-700)
- Hover: Slate-50 (dark: slate-700)
- Active: Slate-100 (dark: slate-600)
- Radius: md-lg
- Padding: 2-3 vertical, 4-5 horizontal

**Destructive Buttons**:
- Background: Red-600
- Text: White
- Shadow: shadow-lg with red tint
- Hover: Red-700
- Active: Red-700, pressed state
- Radius: md-lg
- Padding: 2-3 vertical, 4-5 horizontal

**Ghost Buttons**:
- Background: Transparent
- Text: Slate-600 (dark: slate-400)
- Hover: Slate-100 (dark: slate-800)
- Active: Slate-200 (dark: slate-700)
- Radius: md-lg
- Padding: 2-3 vertical, 3-4 horizontal

### Cards

**Standard Card**:
- Background: White (dark: slate-900)
- Border: 1-2px slate-200 (dark: slate-800)
- Radius: xl-2xl
- Shadow: md-lg
- Hover: Border becomes amber-500/50, shadow-lg
- Padding: 4-6

**Interactive Card**:
- Adds hover effects: scale, shadow increase, border color change
- Cursor: pointer
- Transition: All properties, 300ms ease-in-out

**Stat Card**:
- Background: Amber-50 (dark: amber-900/20)
- Border: 1-2px amber-200 (dark: amber-700/50)
- Radius: xl
- Label: Text-xs, uppercase, tracking-wider, amber-600 (dark: amber-400)
- Value: Text-2xl, bold, amber-900 (dark: amber-100)

### Inputs

**Text Input**:
- Background: Transparent or slate-50 (dark: slate-800/50)
- Border: 1px slate-300 (dark: slate-700)
- Radius: md
- Padding: 2-3 vertical, 3-4 horizontal
- Text: Slate-900 (dark: slate-50)
- Placeholder: Slate-400
- Focus: 1-2px amber-500, ring-1 amber-500/30
- Transition: All, 200ms

**Textarea**:
- Same as text input
- Min-height: 10-12 lines
- Resize: None (fixed) or vertical
- Font-family: Monospace for code/markdown

**Checkbox/Radio**:
- Size: 4 (16px)
- Border: 1-2px slate-300 (dark: slate-700)
- Radius: sm (checkbox) or full (radio)
- Checked: Amber-500 background, white checkmark
- Focus: Ring-2 amber-500

### Modals

**Modal Container**:
- Background: White (dark: slate-900)
- Border: 2px amber-500/50 (dark: amber-500/70)
- Radius: 2xl
- Shadow: 2xl with amber tint
- Max-width: md-xl (responsive)
- Max-height: 90vh
- Overflow: Hidden
- Z-index: 50

**Modal Backdrop**:
- Background: Black/60 with backdrop-blur-sm
- Z-index: 40
- Click to close

**Modal Header**:
- Padding: 5
- Border-bottom: 1px amber-500/20
- Flex: Space-between, items-center
- Title: Text-xl, bold, dark:text-white

**Modal Body**:
- Padding: 6
- Overflow-y: auto
- Flex-1

**Modal Footer**:
- Padding: 4-6
- Border-top: 1px amber-500/20
- Background: Slate-50 (dark: slate-800/50)
- Flex: End, gap-3

### Navigation

**Navbar**:
- Position: Sticky, top-0
- Z-index: 50
- Background: White/80 (dark: slate-900/80)
- Backdrop-blur: sm
- Border-bottom: 2px amber-500 (dark: red-500)
- Height: 16 (64px)
- Transition: Colors, 300ms

**Sidebar**:
- Position: Fixed (mobile) or static (desktop)
- Z-index: 40
- Width: 64 (256px)
- Background: White (dark: slate-900)
- Border-right: 1px slate-200 (dark: slate-800)
- Transition: Transform, 300ms ease-in-out

**Sidebar Nav Item**:
- Padding: 2-3 vertical, 3-4 horizontal
- Radius: lg
- Text: Sm, slate-700 (dark: slate-300)
- Hover: Background slate-100 (dark: slate-800), text slate-900 (dark: slate-50)
- Active: Background amber-100 (dark: amber-900/20), text amber-600 (dark: amber-400)

### Badges

**Status Badge**:
- Padding: 0.5 (2px) vertical, 2 (8px) horizontal
- Radius: Full
- Text: Xs, font-medium
- Background: Semantic color light (dark: dark variant with opacity)
- Text: Semantic color dark (dark: light variant)

**Permission Badge**:
- Same as status badge
- Color-coded by permission type:
  - Read: Blue
  - Write: Green
  - Edit: Orange
  - Move: Purple
  - Delete: Red

### Toolbars

**Toolbar Container**:
- Padding: 1.5 (6px)
- Background: Slate-50 (dark: slate-800/50)
- Border: 1px slate-200 (dark: slate-700)
- Radius: Top-lg (matches textarea)
- Flex: Wrap, gap-1
- Border-bottom: None (connects to textarea)

**Toolbar Button**:
- Padding: 1.5 (6px)
- Radius: md
- Text: Slate-600 (dark: slate-400)
- Hover: Text amber-600 (dark: amber-400), background amber-100 (dark: amber-900/30)
- Transition: All
- Disabled: Opacity-50

### Loading States

**Spinner**:
- Icon: Loader2 from lucide-react
- Size: 4-5 (16-20px) for inline, 12 (48px) for full-page
- Color: Amber-600 (dark: amber-400)
- Animation: Spin, 1s linear infinite

**Loading Container**:
- Background: White (dark: slate-900)
- Min-height: Screen
- Flex: Column, center, items-center
- Gap: 4
- Text: Slate-500 (dark: slate-400)

## Dark Mode

### Dark Mode Philosophy

PinchPad's dark mode isn't simply inverted light mode—it's a deliberate "deep ocean" environment designed for extended use with reduced eye strain.

### Dark Mode Colors

**Backgrounds**:
- Primary: #0f1419 (deep ocean)
- Secondary: #0f172a (slate-900)
- Tertiary: #1e293b (slate-800)
- Elevated: #1e293b (slate-800) with slight lighter tint
- Surface: #020617 (slate-950) for deepest backgrounds

**Text**:
- Primary: #faf8f6 (pearl white)
- Secondary: #e2e8f0 (slate-200)
- Tertiary: #cbd5e1 (slate-300)
- Muted: #94a3b8 (slate-400)
- Disabled: #64748b (slate-500)

**Borders**:
- Default: #334155 (slate-700)
- Subtle: #1e293b (slate-800)
- Emphasis: #0f172a (slate-900)

### Dark Mode Shadows

Shadows in dark mode carry more opacity and use oceanic tones:

- Default: Dark variant with higher opacity
- Colored shadows: Slightly higher opacity for visibility
- Inner shadows: Deeper, more pronounced

### Dark Mode Transitions

Theme transitions use view transitions API for smooth, circular "molt" effect:
- Duration: 500ms (slower than standard for perception)
- Easing: ease-in-out
- Effect: Circular clip-path expansion from interaction point

### Dark Mode Guidelines

**Do**:
- Use warm off-white (#faf8f6) for primary text
- Maintain sufficient contrast ratios
- Use colored shadows with higher opacity
- Leverage the deep ocean background (#0f1419)
- Smooth transitions between themes

**Don't**:
- Use pure white (#ffffff) for large text areas
- Use black (#000000) as background
- Make shadows too subtle
- Skip transitions (jarring)
- Invert colors directly without adjustment

## Accessibility

### Color Contrast

All interactive elements must meet WCAG AA standards:
- Normal text: 4.5:1 minimum contrast ratio
- Large text (18px+): 3:1 minimum contrast ratio
- Interactive elements: 3:1 minimum contrast ratio

### Focus States

All interactive elements must have visible focus states:
- Outline: 2px solid amber-500
- Offset: 2px ring with amber-500/30
- Never remove focus outlines
- Ensure focus indicators are visible in both light and dark modes

### Motion Preferences

Respect user's motion preferences:
- Check `prefers-reduced-motion` media query
- Disable or simplify animations when reduced motion is preferred
- Maintain functionality without animation
- Provide alternative visual feedback

### Keyboard Navigation

Ensure full keyboard accessibility:
- Tab order follows visual layout
- All interactive elements are keyboard-accessible
- Skip links for navigation
- Visible focus indicators
- Escape key closes modals/dropdowns

### Screen Reader Support

Provide proper screen reader support:
- Semantic HTML elements
- ARIA labels for interactive elements
- Alt text for images
- Descriptive link text
- Live regions for dynamic content

## Brand Elements

### Logo/Wordmark

The PinchPad brand uses:
- **"Pinch"**: Amber-500 color
- **"Pad"**: Red-500 (dark: red-500) color
- **"©™"**: Small, muted, trailing superscript
- **Icon**: Lobster emoji (🦞) in gradient amber background

**Interactive Brand Animation**:
- Letters animate on hover: lift (-3 to -12px), scale (1.05 to 1.15)
- Spring physics: stiffness 400, damping 12-30
- Origin: bottom for natural lift effect
- Variants: "subtle" (smaller animation) and "prominent" (larger animation)

### Brand Usage

**Do**:
- Use correct colors for "Pinch" (amber) and "Pad" (red)
- Include ©™ symbol in full brand usage
- Use lobster emoji or gradient icon consistently
- Maintain proper letter spacing in wordmark
- Use appropriate animation variant for context

**Don't**:
- Invert brand colors
- Remove ©™ in formal usage
- Use placeholder icons without lobster theme
- Stretch or distort brand elements
- Over-animate brand in serious contexts

### Voice and Tone

**PinchPad Voice**:
- Sovereign and confident
- Warm and approachable
- Playful with ocean/lobster metaphors
- Clear and direct
- Respectful of user autonomy

**Tone Guidelines**:
- Use "your" to emphasize ownership (your pearls, your reef)
- Lobster metaphors: molt, shell, reef, scuttle, pinch, clutch
- Sovereign language: your identity, your keys, your data
- Avoid corporate jargon
- Be concise but not terse

**Common Phrases**:
- "Shell your pearls" (create notes)
- "Molt your thoughts" (revise/edit)
- "Scuttle the noise" (filter/sort)
- "Clutch your pearls" (save/protect)
- "Hatch your pad" (create account)

## Design Principles

### 1. Sovereign First

Every design decision reinforces user sovereignty:
- Your data, your rules
- Local-first by default
- No unnecessary dependencies
- Clear ownership indicators

### 2. Oceanic Harmony

The visual system creates a cohesive oceanic environment:
- Warm amber sunsets over deep ocean
- Natural, organic motion
- Depth through layering
- Cohesive color palette

### 3. Delightful Utility

Functionality doesn't preclude delight:
- Purposeful animations
- Meaningful micro-interactions
- Playful brand elements
- Surprising but not distracting

### 4. Accessible Depth

Complexity should be accessible:
- Clear visual hierarchy
- Intuitive navigation
- Consistent patterns
- Progressive disclosure

### 5. Performant Presence

Delight shouldn't compromise performance:
- Optimized animations
- Efficient rendering
- Lazy loading where appropriate
- Smooth 60fps interactions

---

*Maintained by CrustAgent©™*
*PinchPad Design System v1.0.0*
*Last Updated: 2026-04-25*
