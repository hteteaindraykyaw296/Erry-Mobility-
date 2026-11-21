# Erry Mobility editorial redesign

The home page introduces Erry’s purpose and links to cerebral palsy education, activities, assistive technology, and the local journal. The activity library leads to a single maintained typing comparison and separate drawing and object practice. Older `skills.html#typing`, `#drawing`, and `#objects` links route to the corresponding activities.

The typing comparison keeps practice text in memory and saves only setup details and observations. The journal still uses `eri-mobility-journal-v1` for entries and `erry-mobility-profile-v2` for preferences. It exports version 2 backups and accepts the original array format.

## Run the typing and journal regression check

With Playwright and Chromium installed, serve the checkout over HTTP. From the repository root, run:

```sh
python3 -m http.server 8000
```

From a second terminal:

```sh
node tests/typing-journal.cjs
```

Set `ERRY_TEST_URL` if the site is served from a different URL or project path. Set `CHROMIUM_PATH` to use an installed Chromium executable instead of the Playwright browser. The check uses isolated synthetic records to exercise pause/restart, stale results, skipped attempts, single-save protection, unavailable storage, legacy edits, backup recovery, and duplicate imports.

Functional browser checks are interface evidence. Qualified clinical review, participant evaluation, and fitted hardware testing remain proposed work.
