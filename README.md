# Erry Mobility

Erry Mobility is an educational assistive technology project inspired by the founder’s experience with cerebral palsy, one-sided motor difficulties, and everyday accessibility barriers. Its flagship activity asks how changing one part of a keyboard setup might affect typing a short message. The site also explores spoon handling, balance, keyguards, and 3D anatomy, and includes an optional browser-local journal.

- [Published Erry Mobility website](https://hteteaindraykyaw296.github.io/Erry-Mobility-/)
- [Engineering Lab source](engineering.html)
- [Portfolio project brief](project-brief.md)
- [Project history](PROJECT_HISTORY.md)

## Biomedical Engineering Design and Evaluation

### Problem and design

Typing a short message can take extra effort when reaching for keys, targeting them, or correcting unintended input is difficult. The design brief prioritises choice of input, rest, low cost, and privacy. It draws on one person’s lived experience. Priorities still need review with intended users.

The design workflow is to identify the barrier, understand a user’s needs, choose one change, test it, evaluate the measurements and feedback, and improve the design. The working web prototype lets visitors compare a usual setup with an adaptation, such as repositioning the same keyboard or enlarging the website’s on-screen keys. Other educational prototypes illustrate keyguard geometry, spoon handles, and balance concepts.

### Method

1. Use Setup A for the usual arrangement and Setup B for one chosen change. Keep the device, input method, and key placement consistent. Start with either setup.
2. Select **Start trial**, type the same sample (`meet me at noon`), then select **Finish trial**. Unfinished trials can be discarded.
3. Compare elapsed seconds, final text errors, and correction actions. Optionally rate the latest trial’s comfort and give a preference once both setups have a result.
4. Repeat if useful and try both setup orders. Download all finished trials as CSV, or save the latest trial per setup to My Journal.

The elapsed time uses the browser’s monotonic clock and excludes explicit pauses. Time spent reaching for controls is included. Final text errors are case-sensitive character edit distance, counting insertions, deletions, and substitutions at equal cost. An observed deletion or selected-text replacement is counted once as a correction action. The browser cannot determine whether the action corrected a mistake. Comfort is a self-report from 1 (very uncomfortable) to 5 (very comfortable).

Results start empty and are held in memory. Export and journal storage require an explicit action. Both exclude practice text. Journal entries use the existing browser-local storage format. Browser data can be cleared and is accessible to other people who use the same browser profile.

### Results and verification

The tests check the software’s responses to controlled input. Erry Mobility has no participant dataset, aggregate performance findings, or clinical results.

- `node --test tests/typing.cjs` passed both test cases for character error scoring and CSV formatting.
- The headless Chromium suite passed at 320, 768, and 1,440 CSS pixels on the homepage and both labs. It checked horizontal fit, focus, mobile navigation, reduced-motion settings, the `/typing/` alias, keyguard controls, keyboard and on-screen input, pause timing, repeated trials, comfort and preference, CSV download, journal persistence, reset, spoon and balance routes, and the static anatomy fallback.
- A static review of 34 HTML files found no missing relative files in literal `href`, `src`, or `poster` attributes. Some lesson fragments are selected by JavaScript.
- JavaScript syntax checks and `git diff --check` passed for the edited source.

To run the browser suite on Windows with Node.js 22 or newer, set `ERRY_CHROME` to your local Chromium executable:

```powershell
$env:ERRY_CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node tests/browser.cjs
```

The suite serves the files locally under the GitHub Pages project path. It uses a disposable browser profile and requires no npm dependencies.

### Limitations and future evaluation

Session results reflect one fixed English message. Learning, fatigue, familiarity, input tools, devices, and trial order can affect measurements. The sample uses no modifier shortcuts, so it cannot evaluate Sticky Keys for shortcut use. Erry Mobility is an educational prototype. It has no established clinical effectiveness and provides no diagnosis, personalised rehabilitation, or substitute for occupational therapy or professional assessment.

WCAG 2.2 AA is the accessibility target. Screen-reader and mobile touch checks, full contrast and reflow auditing, and testing with switch input remain open. The 3D anatomy models are schematic and have static alternatives. Keyguard geometry is demonstrated in 2D. The project has neither verified physical fit nor evaluated a physical keyguard with users.

A proposed next step is an intended-user usability study focused on whether visitors can select a setup, complete a trial, and interpret the results. A later comparison could counterbalance setup order, offer rest, and record device and input context. Participant work would require appropriate oversight and accessible consent.

## V3 visual-first design and verification

### Repository audit and implementation plan

The starting point was the published static HTML, CSS and JavaScript site, including the timed typing lab, browser-local journal, assistive-technology comparison, captioned lessons, and vendored Three.js studio. The site needed a consistent header, more instructional visual context, and a readable comparison of measured trials. The six images supplied in the brief informed the visual direction. The checkout had no design-references directory. The supplied images were used as reference material.

1. Capture the original layouts and preserve the GitHub Pages project path.
2. Keep the existing wordmark and palette. Unify site navigation using native disclosure for Explore.
3. Build the homepage, motor lesson, and assistive-device illustrations using original assets.
4. Add matched result scales while keeping measurement, export, and journal behavior.
5. Improve the engineering documentation, balance and spoon diagrams, and the anatomy tools.
6. Verify the resulting layouts and interactions before reviewing publication.

### Visuals and interaction

- The original AI-generated hero photograph is stored as `media/typing-hero-v3.jpg`. The built-in image tool received this direction: “Original photorealistic editorial hero photograph for Erry Mobility, a warm accessible biomedical engineering site. Landscape 3:2 crop, overhead at a slight angle, one anatomically natural adult right hand with five fingers and forearm reaching with index fingertip toward a key on a recognizable dark sage compact keyboard on a warm ivory desk. The hand and keyboard occupy the centre, fingertips clearly separated, restrained sage and wood accents, diffuse daylight, tactile material detail, clean composition. This is a casual example of one-handed typing, no medically recommended posture. The user's overhead keyboard photo is composition inspiration only. No logos, text overlay, arrows, or watermarks.”
- Original SVG illustrations cover arm and key targeting, keyboard positions A and B, motor pathways, Sticky Keys, palm-side hand structures, spoon grip, and base of support. The architecture and design process use ordered HTML diagrams.
- The motor pathway and reach/target/sequence lessons have Play, Pause, Replay, and step controls. Reduced-motion mode suppresses the marker transition. The keyboard position comparison and 2D hand labels can be explored one step at a time.
- The typing comparison displays the latest measured trial for each setup on a shared scale per metric. Exact values and the full session history remain visible. CSV export, journal snapshots, and pause-aware measurement use the existing data model.
- The 3D studio uses its existing schematic geometry. Pressable zoom controls complement pointer and touch interaction. The annotated hand illustration is usable without WebGL.

### V3 verification record

- Both Node tests passed for character edit distance and CSV formatting. The Chromium suite passed at 375, 768, and 1,440 CSS pixels on the homepage, Understand CP, both labs, the gallery, spoon lesson, balance lesson, and anatomy studio. Before-and-after viewports were captured and inspected for those eight views.
- Chromium checked shared navigation, keyboard focus and activation of Explore, keyboard-position selection, movement playback and reduced motion, gallery filtering and comparison, the keyguard switch, empty trial rejection, pause timing, two-input-method scoring, matched result scales, repeated trials, comfort, CSV download, journal persistence, and reset.
- The WebGL hand model rendered in Chromium and accepted zoom, rotate and reset button actions. The explicit static fallback and independent 2D structure selection also passed.
- A scan of 18 content pages found one shared navigation block per page and no missing static local file references. All eight new SVGs parsed as XML.
- The screenshot review caught an image sizing issue and a low-contrast active lesson state. Both were corrected. Screen readers, mobile touch hardware, cross-browser coverage, and a full WCAG audit are still open. Software checks do not establish ergonomic benefit, clinical effectiveness, or visitor comprehension.

### First-time visitor study script

Invite a first-time visitor to use their preferred device and input method. Record whether they can explain the site’s purpose, find the Typing Setup Lab, describe the difference between the setups, complete a trial, explain the measurements, and name one limitation. Note where they hesitate, which controls they use, and what they say in their own words. Provide rest or exit at any time. This study has not been conducted.

### Scientific and accessibility references

- [CDC overview of cerebral palsy](https://www.cdc.gov/cerebral-palsy/about/index.html)
- [Neuroscience, movement and its central control](https://www.ncbi.nlm.nih.gov/books/NBK11050/)
- [WHO assistive technology](https://www.who.int/news-room/fact-sheets/detail/assistive-technology)
- [AAOS flexor tendon anatomy](https://www.orthoinfo.org/bodypart/hand-wrist/flexor-tendon-injuries/)
- [NIDCD balance and sensory input](https://www.nidcd.nih.gov/health/balance-disorders)
- [Microsoft keyboard accessibility and Sticky Keys](https://support.microsoft.com/en-gb/accessibility/windows/make-your-mouse-keyboard-and-other-input-devices-easier-to-use)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

### Portfolio summary

I created Erry Mobility to explore practical technology for one-sided motor difficulties. Starting from my experience with cerebral palsy, I framed typing a short message as an engineering task and built an AI-assisted browser prototype that compares one setup change at a time. The lab measures elapsed time and final text errors, records optional comfort feedback, and lets visitors interpret their own results. I used software verification to check the measurement and export flow. Ergonomic benefit and clinical effectiveness remain unverified. Future work could include a low-cost physical prototype and an intended-user usability study.

## GitHub Pages deployment

1. Review the local changes, then commit and merge them into the publishing branch.
2. In the repository, open **Settings → Pages** and verify the current publishing source. For a branch-based setup that publishes `main`, use **Deploy from a branch → main → /(root)**. If the repository already publishes from another branch or workflow, follow that configuration.
3. After the Pages build succeeds, open the public project URL and check the homepage, Typing Setup Lab, Engineering Lab, and a CSV download under the project path.

This site uses plain HTML, CSS, and JavaScript with relative asset paths. The existing archive-unpack workflow is separate from routine Pages publishing. See the [GitHub Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
