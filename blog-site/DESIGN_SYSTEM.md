# ModernBlog Design System

## 1. Design Principles
- Clarity first: reduce visual noise (neutral surfaces, purposeful color).
- Progressive density: spacious by default, offer compact mode later.
- Accessible motion: tasteful easing, honor reduced-motion settings.
- Semantic theming: map tokens to meaning ("surface", "border", "elevated") over raw colors.
- Consistent affordances: interactive elements share radius, focus ring, and elevation language.

## 2. Token Inventory (globals.css)
Color (brand & base):
- --color-brand-indigo / --color-brand-purple / --color-brand-pink
- --color-bg-light / --color-bg-dark
- --color-surface-light / --color-surface-dark
- --color-border-light / --color-border-dark
- --color-text-primary-* / --color-text-secondary-*
Radius:
- --radius-xs (4px) / --radius-sm (6px) / --radius-md (10px) / --radius-lg (14px) / --radius-full
Shadows:
- --shadow-sm / --shadow-md / --shadow-lg / --shadow-focus
Motion:
- --ease-standard (cubic-bezier(.25,.46,.45,.94))
- --dur-fast 120ms / --dur-medium 260ms / --dur-slow 440ms

## 3. Typography Scale
Base font: Inter.
Responsive clamps (globals.css):
- H1: clamp(1.75rem, 2vw + 1rem, 2.25rem)
- H2: clamp(1.5rem, 1.6vw + 0.9rem, 1.875rem)
- H3: clamp(1.25rem, 1.2vw + 0.8rem, 1.5rem)
Body sizing tiers:
- XS: .75rem (aux info, timestamps)
- S: .875rem (metadata, pagination)
- Base: 1rem (paragraphs)
- Lead: 1.125rem (intro lines / hero sub copy)
Weights:
- 400 paragraph, 500 interactive labels, 600 section headings, 700 brand.

## 4. Spacing & Layout
Use Tailwind spacing scale, but apply a rhythm:
- Section vertical: 40–48px (py-10 / py-12)
- Component block gap: 24–28px (gap-6 / gap-7)
- Element internal padding: 12–16px (p-3 / p-4)
- Tight inline gap: 4–8px (gap-1 / gap-2)
Max text measure: `.measure` (65ch) for long-form readability.
Container padding: clamp(1rem, 2vw, 2rem) (future improvement).

## 5. Surfaces & Elevation
Tiers:
- Base background: body (light/dark)
- Surface: cards, inputs (use white / #0f1329 dark)
- Elevated: popovers, dropdowns, notifications (add --shadow-md)
- Highest: modal/drawer/backdrop (use --shadow-lg + subtle backdrop blur)
Avoid mixing multiple heavy gradients; prefer subtle accent gradients only for active/selected states.

## 6. Interactive Elements
Buttons (variant examples):
- Primary: gradient indigo→purple, white text, focus: outline + shadow-focus.
- Neutral: surface bg, border light/dark, hover: subtle tinted background.
- Destructive: pink/red gradient or tinted surface with red text.
Chips (filters): use pill shape (radius-full), minimal shadow-sm.
States check:
- Hover: background tint or elevation +1.
- Active/Pressed: slightly darker tint, remove extra shadow.
- Focus: consistent ring + outline-offset.
Disabled: 50% opacity, cursor-not-allowed, no shadow change.

## 7. Forms & Inputs
Inputs share 6–10px radius, inset shadow optional. Use consistent left icon positioning (`pl-10`) for search bars. Validation (future): inline message using XS size + color brand-pink for errors.

## 8. Navigation
Navbar fixed height: h-14. Brand uses gradient text, tracking-tight. Consider sticky subnav for tag filters on scroll (phase 2). Mobile drawer: maintain consistent vertical rhythm (header h-14, sections spaced by 24px).

## 9. Accessibility Checklist
- Landmarks: nav (role=navigation), main (id=main), add footer (role=contentinfo optional).
- Skip link present.
- Focus-visible enhanced and high contrast.
- Color contrast baseline: 4.5:1 for body text, 3:1 for larger headings; verify gradient overlay does not drop contrast.
- Motion reduced: media query already limits durations.
- Pending: aria-live region for async notifications; descriptive alt text for avatars (currently using username).

## 10. Motion Guidelines
Entry transitions: 200–400ms ease-standard, use translateY ≤ 30px + opacity.
Stagger lists: 60–90ms incremental delay.
Avoid scaling >1.03 for modals; prefer subtle fade + slight upward shift.
Reduced motion: fallback to opacity only.

## 11. Theming Strategy (Future)
Add semantic layer mapping:
- --bg-base / --bg-surface / --bg-elevated
- --border-subtle / --border-strong
- --text-primary / --text-secondary / --text-muted
Then reference semantic tokens in components instead of raw brand tokens to enable theme expansion (e.g. seasonal, high-contrast mode).

## 12. Component Primitive Roadmap
Phase 1:
- Button (variants: primary, neutral, subtle, destructive, link)
- Chip / Tag pill
- Input field + with icon wrapper
- Card wrapper (padding, elevation tiers)
Phase 2:
- Toast / Inline alert
- Modal & Drawer unification (shared surface + focus trap)
- Skeleton loader component (reuse pulse pattern)
Phase 3:
- Tabs system (for notifications categories later)
- Tooltip (accessible, focusable)
- Avatar (image + fallback initial + status badge)

## 13. Performance & Loading UX
- Defer non-critical sidebar data; show skeleton blocks.
- Preload hero fonts & critical CSS only.
- IntersectionObserver to lazy-reveal post cards beyond first viewport.
- Consolidate gradient usage to reduce paint complexity.

## 14. Next Milestones
1. Implement primitives (Button, Chip, Input, Card) and refactor existing usage.
2. Introduce semantic token layer & dark-mode tuning via those tokens.
3. Add accessibility enhancements: aria-live notifications, landmark footer role, tab order audit.
4. Optimize skeleton & lazy loading for non-critical sections.
5. Add compact density toggle (context provider + class override).

## 15. Contribution Guidelines
- Every new component: document variants & states.
- Use semantic tokens where available (avoid direct hex).
- Keep motion within guidelines and respect reduced-motion.
- Ensure focusable elements have visible focus ring.
- Run contrast test before merging (manual or automated in future).

---
This document will evolve as primitives and semantic tokens are introduced. Open to iteration after Phase 1 implementation.
