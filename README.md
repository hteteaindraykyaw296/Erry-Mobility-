# Erry Mobility redesign

The redesign is available in the `dist` directory. The GitHub Pages package places those files at the archive root. Serve them over HTTP to preview locally. For example, run `python3 -m http.server 8000` in the extracted folder and open `http://localhost:8000/`.

## Stage on GitHub Pages

1. Create or connect an empty GitHub repository you control, or identify the repository and branch you want to use. Verify Pages eligibility and review visibility before publication.
2. Extract this package. Commit its contents at the intended branch root, including the hidden `.nojekyll` file. In Settings → Pages, select Deploy from a branch and choose the staging branch and root directory.
3. At the Pages URL, test the homepage, typing flow, direct links, refreshes, media and synthetic journal import/export while signed out. The `hands/?still#spoon` link deliberately opens the still-image fallback. Ask a first-time tester to explain the homepage in their own words and finish the comparison without coaching. Record where they hesitate.
4. If you control the domain, verify it under your GitHub account or organization with GitHub’s generated TXT record. Keep the TXT record in place. In the repository’s Pages settings, add `www.errymobility.com` (or your chosen hostname). Then set the hostname’s CNAME to the exact GitHub Pages hostname shown by GitHub, without the repository path. Wait for the DNS check and enable HTTPS. See [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
5. Keep [the existing Erry Mobility site](https://eri-mobility-forward.zoloeraszon-ge.chatgpt.site/) live. Verify the new site over HTTPS while signed out before linking to it from the original site. Keep an earlier working build available for rollback.

## Move a journal

On the old site, open My Journal and choose Export backup. On the new site, open My Journal and choose Import backup. Check that the entries appear. Backups can contain personal health details and should be kept private.

## Checks completed on this branch

The managed preview was checked at its root and under a repository-style prefix. A desktop browser test used keyboard controls to complete both typing attempts, counted a deletion, saved the larger-key observation, and verified the journal displayed the observation without the practice message. The narrow preview showed no horizontal overflow at a 305px content viewport with larger text enabled. The old spoon route redirected while preserving its query and fragment. The forced 3D fallback displayed a still and caption track and hid orbit controls. A synthetic legacy backup imported successfully alongside the new entry, and a merged backup downloaded. These are interface checks. Independent first-time tester feedback, physical phone checks and signed-out testing on GitHub Pages and the custom domain are pending.
