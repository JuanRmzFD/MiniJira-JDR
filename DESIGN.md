---
name: Mini Jira Design System
colors:
  surface: '#faf8fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf8fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#414755'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#5d5e60'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe1'
  on-secondary-container: '#616365'
  tertiary: '#9e3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c64f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2e2e4'
  secondary-fixed-dim: '#c6c6c8'
  on-secondary-fixed: '#1a1c1d'
  on-secondary-fixed-variant: '#454749'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#faf8fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
typography:
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  container-padding: 24px
  element-gap: 12px
  section-margin: 32px
  grid-columns: '12'
  gutter: 16px
---

## Brand & Style

This design system is built upon the principles of **Apple-like Minimalism** and **Functional Clarity**. It prioritizes the user's focus on content—specifically tasks and workflows—by reducing visual noise. The aesthetic is clean, professional, and quiet, utilizing vast amounts of white space to create a sense of calm in a high-productivity environment.

The emotional response should be one of institutional reliability and effortless efficiency. By leveraging subtle gradients, soft shadows, and a restrained color palette, the UI feels high-end and tactile without being distracting. The focus is on precision and systematic order.

## Colors

The palette is anchored in Apple’s "San Francisco" approach: predominantly white (`#FFFFFF`) and light grey (`#F5F5F7`) backgrounds to differentiate content areas. 

- **Primary Canvas:** High-gloss white for main containers and cards.
- **Secondary Surfaces:** Off-white/light grey for sidebars and background grounding.
- **Functional Semantics:** Colors are used sparingly but purposefully. 
    - **High Priority:** A soft, yet urgent red.
    - **Medium Priority:** A warm amber.
    - **Low Priority/Primary Action:** A classic system blue.
- **Borders:** Extremely thin, low-contrast lines (`#D2D2D7`) are used to define boundaries without cluttering the view.

## Typography

The typography system uses **Inter** for its neutral, systematic, and highly legible qualities. 

- **Hierarchy:** We use optical sizing principles. Headlines are slightly tighter in letter-spacing and heavier in weight to provide strong anchoring.
- **Readability:** Body text uses a standard 14px size for internal tools, ensuring high information density without sacrificing clarity. 
- **Labels:** Small, uppercase labels with increased letter-spacing are used for metadata, such as "TICKET ID" or "CREATED DATE," to distinguish them from user-generated content.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model for desktop views (max-width 1440px) to maintain the Apple-like "controlled" aesthetic, shifting to a fluid model for tablet/mobile.

- **Rhythm:** A 4px baseline grid governs all spacing. Vertical rhythm is strictly maintained in increments of 4 (8px, 12px, 16px, 24px).
- **Whitespace:** Generous outer margins (24px-32px) are used to prevent the interface from feeling "cramped," a common issue in project management software.
- **Density:** While the outer layout is spacious, internal component spacing is refined and tight (12px gutters) to ensure related information feels grouped.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers** rather than heavy borders.

- **Base Layer:** The background surface (`#FBFBFD`).
- **Mid Layer:** Main content cards use a very subtle, diffused shadow: `0px 1px 3px rgba(0,0,0,0.05), 0px 10px 20px rgba(0,0,0,0.03)`.
- **Top Layer:** Modals and dropdowns feature a more pronounced elevation with a slight backdrop blur (10px) to simulate frosted glass, staying true to modern HIG (Human Interface Guidelines).
- **Interactions:** Hover states involve a slight lift (increased shadow spread) or a subtle shift in background tint.

## Shapes

The shape language is consistently **Rounded**. 

- **Main Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) corner radius.
- **Large Containers:** Main ticket view panels and modals use a more pronounced 1rem (16px) radius to soften the overall appearance of the workspace.
- **Chips/Badges:** Use a pill-shaped (full-round) radius to distinguish them from interactive buttons.

## Components

Components are inspired by **shadcn/ui**, emphasizing functional minimalism and accessibility.

- **Buttons:** Primary buttons use a solid blue background with white text. Secondary buttons use a subtle grey tint (`#F5F5F7`) with no border.
- **Inputs:** Fields use a 1px border (`#D2D2D7`) that transitions to a 2px blue ring on focus. Backgrounds are pure white.
- **Cards:** Ticket cards are "ghost" cards by default (thin border) but take on a subtle shadow on hover to indicate interactivity.
- **Priority Chips:** Small, pill-shaped indicators. They use a low-opacity background of their functional color (e.g., 10% red) with high-contrast text for maximum readability without visual fatigue.
- **Sidebar:** A clean, vertical navigation with iconic representation (SF Symbols style) and active states indicated by a subtle background "squircle."
- **Status Indicators:** Use a "dot + label" pattern to maintain a professional, dashboard-like feel.