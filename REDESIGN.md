# Erry Mobility — purpose-first homepage

## Homepage change

The homepage has been reordered around three purpose questions:

1. Why Erry exists — opening lived-experience introduction and a person-centered participation illustration.
2. Why I built Erry — a compact first-person statement linking to the full About page.
3. How to use Erry — Understand, Explore, and Reflect pathways, followed by four direct destinations.
4. What visitors can do — CP education, everyday tasks, assistive technology, and My Journal.
5. Where the project is going — a grounded project/engineering link.

The homepage no longer includes typing-specific trial controls, keyguard switching, comparison tables, journal previews, or example records. Typing remains on `typing.html` through the existing Everyday Tasks route. The separate keyguard and journal experiences remain outside the opening page.

## Navigation

The header now uses the requested short labels: Home, Understand CP, Everyday tasks, assistive technology, My Journal, and About Erry. The current homepage route is marked with `aria-current="page"`. Mobile navigation remains wrapped and keyboard usable.

## Routes preserved

The homepage links use existing source files:

- `understand.html`
- `skills.html`
- `technology.html`
- `journal.html`
- `about.html`
- `project.html`
- `typing.html`

No storage key or journal implementation changed. `dashboard.js` is no longer loaded by the homepage and may remain unused on its own repository file. Existing typing, journal, and educational code was not modified.

## Verification status

Static source review confirms the purpose-first copy, route targets, in-page Explore Erry anchor, navigation labels, semantic headings, and SVG alternative descriptions. Existing route files were verified in the repository tree.

Executed browser verification, responsive screenshots, keyboard/touch testing, text resizing, contrast testing, reduced-motion testing, synthetic journal tests, and signed-out HTTPS preview verification remain to be completed by a browser-capable environment. Production/promotion remains a separate review step.
