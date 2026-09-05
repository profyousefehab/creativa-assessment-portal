# CREATIVA – Innovation Hubs

## Mission
Create implementation-ready, token-driven UI guidance for CREATIVA – Innovation Hubs that is optimized for consistency, accessibility, and fast delivery across content site.

## Brand
- Product/brand: CREATIVA – Innovation Hubs
- URL: https://creativa.gov.eg/
- Audience: readers and knowledge seekers
- Product surface: content site

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=Helvetica`, `font.family.stack=Helvetica, sans-serif`, `font.size.base=16px`, `font.weight.base=700`, `font.lineHeight.base=30px`
- Typography scale: `font.size.xs=0px`, `font.size.sm=12px`, `font.size.md=14px`, `font.size.lg=15px`, `font.size.xl=16px`, `font.size.2xl=17px`, `font.size.3xl=18px`, `font.size.4xl=19px`
- Color palette: `color.text.primary=#004e9e`, `color.text.secondary=#616161`, `color.text.tertiary=#ffffff`, `color.text.inverse=#222222`, `color.surface.base=#000000`, `color.surface.raised=#f8af43`
- Spacing scale: `space.1=4px`, `space.2=5px`, `space.3=6px`, `space.4=10px`, `space.5=11px`, `space.6=12px`, `space.7=14px`, `space.8=15px`
- Radius/shadow/motion tokens: `radius.xs=2px`, `radius.sm=3px`, `radius.md=5px`, `radius.lg=6px`, `radius.xl=9px`, `radius.2xl=10px` | `shadow.1=rgba(0, 0, 0, 0) 0px 0px 0px 0px`, `shadow.2=rgba(0, 0, 0, 0.05) 0px 5px 11px -3px`, `shadow.3=rgba(0, 0, 0, 0.12) -7px -6px 8px -4px` | `motion.duration.instant=200ms`, `motion.duration.fast=210ms`, `motion.duration.normal=240ms`, `motion.duration.slow=300ms`, `motion.duration.slower=400ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (214), buttons (66), lists (19), cards (6), navigation (5), inputs (4).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
