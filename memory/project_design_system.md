---
name: Design System — Nav, Footer, CSS Variables
description: Exact CSS variables, nav bar structure, mobile hamburger/drawer, and footer structure from the HTML mockups. Used for all public page implementations.
type: project
---

Source: `docs/design/newsletter-archive-v1.html` (shared across all public page mockups)

## CSS Variables (`:root`)
```css
--blue:     #1B6DC2
--blue-dk:  #0F4F8A
--blue-lt:  #EFF6FF
--blue-mid: #BFDBFE
--text:     #09090B
--muted:    #71717A
--border:   #E4E4E7
--white:    #FFFFFF
--bg:       #FAFAFA
```

## Font
Plus Jakarta Sans (Google Fonts) — weights 400, 500, 600, 700, 800

## Nav Structure
`.nav-wrap` → sticky, z-index 200

`nav` → white bg, border-bottom 1px `--border`, height 60px, padding 0 2rem, flex row, space-between

- `.nav-logo` — flex row, gap 0.6rem, font-weight 800, 0.95rem, 36×36px logo img
- `.nav-links` — flex, gap 2rem, no list-style
  - Links: color `--muted`, weight 500, 0.875rem, hover → `--text`
  - Active: color `--text`, weight 700
- `.nav-cta` — "Subscribe" button, bg `--text`, white text, padding 0.45rem 1.1rem, border-radius 6px, weight 700, 0.825rem
- `.nav-hamburger` — hidden desktop, shown mobile; no bg/border, padding 0.4rem, hover bg `--bg`

## Mobile Nav Drawer (`.nav-drawer`)
- Hidden by default (`display: none`); becomes `display: flex` when `.open`
- White bg, border-bottom 2px `--border`, padding 0.5rem 1.5rem 1.25rem, flex-direction column, z-index 199
- Drawer links: display block, padding 0.9rem 0, border-bottom 1px `--border`, color `--text`, weight 600, 0.95rem
- `.drawer-cta` (Subscribe): margin-top 1rem, text-align center, bg `--text`, white, padding 0.75rem, border-radius 7px, weight 700, 0.875rem, no border-bottom

## Mobile Breakpoint (`.is-mobile` class)
- `.nav-links` → hidden
- `.nav-cta` → hidden
- `.nav-hamburger` → shown
- `.admin-link` → hidden

## Nav Links (in order)
Desktop + mobile drawer: Events, Newsletter, Meeting Minutes, Sponsors, Donate
(active class on current page link)

## Page Header Pattern
```
.page-header → white bg, border-bottom, padding 3rem 2rem 2.5rem (mobile: 2rem 1.25rem 1.75rem)
  .page-header-inner → max-width 1100px, flex, space-between, gap 2rem
    .page-header-text
      .section-kicker → uppercase, 0.7rem, weight 700, letter-spacing 0.1em, color --blue
      h1 → clamp(1.6rem, 3vw, 2.2rem), weight 800, letter-spacing -0.025em
      p → color --muted, 0.9rem, line-height 1.7, max-width 540px
    .page-header-illustration → hidden on mobile
```

## Content Area
`.content-wrap` → padding 3rem 2rem 4rem (mobile: 2rem 1.25rem 3rem)
`.content-inner` → max-width 1100px, margin 0 auto

## Footer Structure
```
footer → bg --text (#09090B), color #71717A, padding 3rem 2rem 1.5rem

.footer-inner → max-width 1100px, grid 2fr 1fr 1fr 1fr, gap 3rem
  (mobile: grid 1fr, gap 1.5rem)
  border-bottom: 1px solid #27272A, pb 2rem, mb 1.5rem

  Col 1: .footer-logo-row (34×34px img + .footer-name: white, weight 800, 0.9rem)
          .footer-desc (0.8rem, line-height 1.7)
  Col 2 "Site": h4 + ul → Events, Newsletter, Meeting Minutes, Sponsors, Donate
  Col 3 "Connect": h4 + ul → Facebook, Instagram, Contact
  Col 4 "Legal": h4 + ul → Privacy Policy, Terms of Service

  h4 → color #52525B, 0.68rem, weight 700, letter-spacing 0.12em, uppercase, mb 1rem
  ul → flex-direction column, gap 0.6rem
  a → color #71717A, 0.825rem, weight 500, hover → white

.footer-bottom → max-width 1100px, flex, space-between, flex-wrap, 0.775rem
  Left: "© 2026 Westmont Elementary PTO · Built with AI-assisted tools · Admin" (admin link hidden on mobile)
  Right: "Go Wildcats! 🐾"
```

## Tailwind Mapping (approximate)
- `--blue` → `blue-600` or custom `#1B6DC2`
- `--text` → `zinc-950` or `#09090B`
- `--muted` → `zinc-500` or `#71717A`
- `--border` → `zinc-200` or `#E4E4E7`
- `--bg` → `zinc-50` or `#FAFAFA`
- Nav height: `h-[60px]`
- Content max-width: `max-w-[1100px]`
