# Erry Mobility — Forward, your way

A free, buildless, responsive CP awareness and mobility website. `dist/` is the published static directory. `.openai/hosting.json` retains the original Site identity.

## Features

- CP awareness, a licensed community photograph and an opt-in NHS educational video.
- Treatment and support information linked to NHS and NICE guidance, with no cure or guaranteed-outcome claims.
- Seven 36–42-second schematic 3D tutorial videos, English captions, burned-in steps, written alternatives and playback-speed controls.
- Personal profile and a browser-local journal for mood, pain, fatigue, sleep, activity, support, weight and optional adult BMI estimates.
- Editable records, search, chart/table review, JSON export and import (including original journal backups).

The original hostname and journal storage key are retained so existing browser-local journals remain accessible. No accounts or server-side health record storage are used. Browser storage is not encrypted and does not sync. The profile and all health fields are optional. BMI is a descriptive estimate for users who record age 20+; no weight category or treatment recommendation is generated.

## Sources and media

Clinical references are linked next to the relevant website sections. The 3D videos are schematic illustrations created for this site, not clinically validated exercise prescriptions. The room example illustrates power-wheelchair route planning. The heavier-object example illustrates an assessed equipment alternative; it is not a lifting drill or a loading technique.

Photo: Chona Kasinger / Disabled And Here, https://affecttheverb.com/gallery/disabledandhere/portraitwalking/ . CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ . Resized for web use; visible attribution is included.

External videos are loaded only after a visitor chooses to load them. External availability and captions depend on their providers.

## Validation

- JavaScript syntax checks and static local asset/ID checks.
- Desktop Chromium and responsive browser checks at 320, 390 and 768px, including larger text.
- Personal profile and journal save/reload/edit/search, BMI formula and under-20 gate, trend display, backup export/import, legacy import and duplicate detection.
- All seven local H.264 videos played with expected duration and English caption tracks; tutorial filtering, dialog keyboard close, speed selection and tutorial-to-journal focus checked.
- Physical iOS/Android devices and external-player playback have not been verified.

## Media generation

`render.py` and `hand-render.py` are the initial prototype renderers. `tutorials-render.py` builds the expanded 3D examples with Blender; `package-videos.py` packages longer chaptered examples with FFmpeg. Generated intermediate frames and Blender files are ignored. The published videos and caption tracks are under `dist/media/`.

## November 2026 expansion

The awareness section now covers causes, movement types, risk reduction, realistic rehabilitation goals and contextual statistics. An evidence explorer explains the differences between age-specific surveillance, birth prevalence and WHO assistive-technology estimates. Sources were checked on 10 November 2026; no WHO endorsement is implied.

The library contains twelve guides, including five new 42-second schematics for typing, pen strokes, drawing, aligning large pieces and a light tabletop lifting rehearsal. A clinician-agreed lifting pathway is explained without setting a universal load. `advanced-render.py`, `lifting-render.py` and `advanced-package.py` generate these additions.

The skills studio includes untimed physical/virtual keyboard input, an optional repeated-activation guard, text sizing, and a drawing pad with pointer, touch and button/keyboard controls. Drawings can be exported as PNG. Practice text and drawings are temporary; they are not clinical measurements.

`project.html` presents Erry’s biomedical engineering motivation, current features, limitations and a proposed co-design/evaluation roadmap. Implementation and draft content are identified as AI-assisted. The page offers print/save-PDF support and a text brief at `project-brief.md`. Future sensors and devices are proposals, not implemented capabilities.

Additional photograph: National Institutes of Health, 2013, via https://commons.wikimedia.org/wiki/File:Cerebral_palsy.jpg . US federal-government public-domain work, Public Domain Mark 1.0. It illustrates independent rehabilitation research, not Erry Mobility technology or a product endorsement. Visible attribution appears beside the photograph.

Additional checks: browser tests covered the evidence explorer, virtual/physical keyboard input, repeated-activation guard, text sizing, pointer/button/keyboard drawing, undo and PNG export, new tutorial-to-journal mapping and save/reload, 320px layout with larger text, the project page and print rendering. All five new local videos played at 42 seconds with English caption tracks. Local assets and duplicate IDs were checked. The research photograph uses lazy loading and was checked after scrolling into view. These are interface checks, not clinical or participant evaluation.

## Dashboard update — 11 November 2026

The same Site now serves a compact dashboard and directly linkable static pages: `understand.html`, `care.html`, `move.html`, `skills.html`, `journal.html`, and `project.html`. Shared navigation and keyboard-operated topic tabs keep one topic visible at a time. Old homepage section fragments redirect to their new page destinations.

The original journal key `eri-mobility-journal-v1`, profile key and import/export format are retained. Moving from the homepage to `journal.html` stays on the same origin. No migration, clearing or rewriting happens merely from visiting the dashboard. Typing Lab comparisons append a normal journal record only after an explicit save action. They do not overwrite earlier records or save practice text automatically.

Educational additions include a clickable causes timeline, a schematic brain/signals diagram, a selectable movement-path illustration, a joint-angle/toe-position model and a CSS 3D keyguard with manual view and finger-position controls. They are illustrations, not validated biomechanical or diagnostic models. All 12 videos are retained with captions, seven chapter controls, close-up crops, written alternatives and optional browser speech narration. Voice availability depends on the visitor’s browser; it starts only on request.

The Typing Lab compares a usual setup with a chosen key size and adjustable 0–1500 ms same-key repeat filtering. Visitors can keep observations for each setup and append a self-reported comparison to their journal. These are observations, not conducted participant tests or treatment results.

Engineering Story cites the official KMITL Expo 2026 Neuro Mirror Glove description and Whittington et al.’s SmartAbility smartphone-sensing paper (online 2020, journal 2022; DOI 10.1080/17483107.2020.1839135). These are external precedents, not Erry Mobility findings or affiliations. Future tests are labelled proposed.

Custom-domain setup was prepared without a purchase or DNS edits. See the included README for the GitHub Pages migration steps. The existing Site URL is retained. Journal backups must be exported/imported before adopting a different domain because browser storage is origin-specific.

The six section heading fonts are bundled locally (Lora, Poppins, Barlow Condensed, Nunito, Bitter and IBM Plex Mono); their SIL Open Font License files are included under `dist/fonts/`.

Validation for this update: all seven pages were checked at 320, 390, 768 and 1440px. Every topic panel was checked at narrow width after fonts loaded. Tests covered keyboard tab navigation and sliders, mobile menu, larger text, reduced motion, all 12 video playbacks with caption tracks, close-ups, chapters and Escape close, the causes timeline and keyguard, drawing export, usual/adapted typing with physical/button repeat filtering, journal backup/import/deduplication and preservation of a seeded older entry. Narration text dispatch and stop controls were checked with a mocked browser speech service; actual voice output remains device-dependent. No participant or clinical validation is claimed.

## Illustrated topic guides

All 22 topic tabs now begin with a prominent illustrated guide, with a separate illustrated journal introduction and six visual dashboard thumbnails. Twenty-one original, labelled SVG diagrams cover brain/body/task feedback, life stages, movement types, risk reduction, rehabilitation, data context, equipment, communication, writing, object handling, stairs, reflection and engineering. Visible label chips repeat key labels as readable HTML; every guide can be opened in a larger, horizontally pannable dialog.

Three additional interactive illustrations show object-placement/reach geometry, stages of light-object alignment, and a deterministic synthetic signal with adjustable noise. They are not biomechanical, diagnostic or validated sensor simulations; no patient data is generated or collected. A sample communication board demonstrates word selection only, without sending messages. Journal reflection prompts are read-only and do not access or mutate entries.

The Care page includes a credited NIH research photograph and community/access photographs. Additional photo: Chona Kasinger / Disabled And Here, “Strawberry chopping”, https://affecttheverb.com/gallery/disabledandhere/bakingcounter/ , CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ . The downloaded photo was resized for web use. Attribution and the limits of diagnosis/endorsement inference appear beside the images.

Checks covered all 22 topic illustrations loading, narrow layouts, image enlargement and keyboard close, interactive controls, photo loading, existing typing/video behaviour and a seeded older journal record. The existing journal scripts, storage keys and 12 video files were not changed.

## Animated 3D anatomy update — 12 November 2026

`anatomy.html` now provides four original, locally rendered WebGL learning models: a clothed animated character with bone overlay, a knee with selected ligaments and cartilage, an ankle with a schematic AFO, and a wrist/hand with articulated fingers. Models have numbered structure explanations, orbit/zoom, keyboard-operable turn/reset/play controls, layer selection, and an illustrative movement slider. `?model=knee`, `?model=ankle`, and `?model=hand` directly open a selected model. Human line diagrams in topic introductions have been replaced with relevant 3D studios; useful nonhuman process and data diagrams remain. The stair controls drive the character's hip, knee and ankle pose beside solid steps. The dashboard shows a recorded 3D character and rendered topic previews.

The authored anatomy is approximate and has not been clinically validated. Ligament geometry does not calculate forces, strain or stability; orthosis geometry does not represent individual fit or support forces. The explanatory references include MedlinePlus knee anatomy, NCBI foot/ankle anatomy and Guy's and St Thomas' NHS AFO guidance. All clinical limitations and fitting requirements appear with the relevant model.

Three.js 0.160.1 and OrbitControls are bundled in `dist/vendor/` under the included MIT license. Four 20-second, H.264 3D clips with English captions and posters provide a no-WebGL fallback. Written structure explanations remain available in that mode. Reduced-motion preference disables autoplay; offscreen studios pause and disposed studios release rendering resources. The 12 existing task tutorials, typing tools, journal code and browser-storage keys are preserved. No patient data is added to the models or sent to a server.

Validation: all four WebGL models, layer/structure selection, pause/play, rotation, reset and keyboard sliders passed. Narrow layouts were checked at 320, 390 and 768px; the seven existing pages were also checked at 1440px with larger text. WebGL-disabled playback, all four new captioned clips, reduced-motion startup, actual stair-pose changes and direct model links passed. Regression checks confirmed the 12 existing captioned tutorials, chapter/close-up controls, typing repeat filtering, keyboard navigation, causes timeline, keyguard, drawing export and journal export/import/deduplication with a seeded older entry. No page errors or missing local assets were found. Browser checks used Chromium; physical iOS/Android device testing and clinical validation were not performed.


## Purpose, scope and biomedical engineering — 12 November 2026

Engineering Story now opens with a directly linkable `#purpose` tab containing formal vision and mission statements, six goals, and supportive language about disability acceptance, dignity, belonging and personally defined progress. The dashboard includes a compact introduction with direct links to purpose and scope. The downloadable project brief carries the same mission and vision and summarises the goals.

The separate `#limitations` tab is titled “Scope, limitations & biomedical engineering.” It defines the current educational design/development scope and a proposed, unperformed usability study. It describes clinical, model, measurement, representation/accessibility, local-storage and evidence limitations, and links the next steps to a five-stage engineering framework and relevant educational skills. Existing story, design, research-precedent and roadmap anchors remain available. The change does not modify the journal, practice tools, 12 tutorials or 3D renderer.

Validation for this content update: structural checks covered all eight HTML pages, local asset and fragment targets, unique IDs, tab/panel order and accessible labels. CSS was checked for balanced rules and reviewed for narrow layouts and larger text; link widths are constrained to their containers. Browser/device rendering was not re-tested in this update because the supported managed browser-preview runtime was unavailable. Earlier browser results describe the preceding release, not this content change.

## Task-led inclusive dashboard — 12 November 2026

The homepage is now a compact six-area dashboard with a personal goal selector. New shareable `hands.html` and `balance.html` lesson pages reuse the existing locally bundled 3D studio, character and captioned tutorials. Twelve new lesson routes provide three-stage conceptual animations, replay, written alternatives and optional browser narration. Hand setup choices include left/right, one/two-handed and supported approaches; the hand anatomy can be mirrored for left-hand orientation. Spoon handling is distinct from swallowing. Heavier tasks, slippery surfaces, vehicle access and optional running are educational planning topics, without a prescribed lift weight or a balance/fall drill.

The support-geometry model changes a synthetic ground projection relative to selected contacts and support width. Two foot contacts and four-contact support examples are simplified; force, friction, acceleration and actual stability are not calculated. `technology.html` provides nine task-filtered hardware/software options, mechanism step controls and comparisons of up to three selections. `about.html`, `vision.html`, `mission.html`, `goals.html` and `scope.html` provide distinct purpose and scope pages, lived-experience origins, original KMITL and smartphone research citations, and explicit evidence/simulation/software-test distinctions. Navigation is consistent across old and new pages, and existing tool and journal URLs remain usable.

Verification: HTML asset/anchor/ID checks covered 16 pages; JavaScript syntax checks passed. An isolated jsdom harness tested lesson routing, step/replay controls, narration dispatch, left-hand and technique settings, support input changes, gallery filtering, mechanism stages, comparison limits/persistence and a seeded older journal entry. All 12 original tutorial definitions remain. No changes were made to journal storage or import/export code, practice-tool code or original media. These DOM tests stubbed 3D rendering and speech; they do not validate WebGL appearance, audio, video playback or responsive rendering. Desktop/mobile browser QA could not run because the supported managed preview/browser runtime was unavailable. Earlier browser results apply to their original releases. This release claims no participant or clinical validation.
