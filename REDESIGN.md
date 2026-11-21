# Erry Mobility — redesign review

## Purpose
Erry Mobility is an educational project created from lived experience of cerebral palsy. It helps people explore everyday adaptations, notice small changes, and feel confident in their own ways of moving. Its primary audience is people with CP; caregivers, family and educators are secondary audiences.

## Design direction
The refreshed homepage uses an editorial serif/sans hierarchy, a restrained grid, concise introductions, thin rules, generous spacing and a warm ivory / forest green / sage palette with terracotta as a focused accent. These are general principles drawn from editorial publications and accessibility design references, not copied layouts or assets. The inline keyboard illustration explains the activity rather than acting as decoration. The primary action and task cards make navigation task-first.

## Routes and data
Existing task and educational routes remain linked: `typing.html`, `hands.html`, `balance.html`, `technology.html`, `understand.html`, and `journal.html`. The legacy local journal key `eri-mobility-journal-v1` remains unchanged. The typing comparison stores only the setup descriptions, correction counts, effort ratings, date, and visitor-selected preference; it does not persist the practice text.

The journal is browser-local and origin-specific. Export before moving to another browser or website address. Do not promote the site or change its origin until backup migration has been tested.

## Testing status
This change was prepared through the GitHub file API. Browser automation, actual responsive screenshots, journal backup round-trip, keyboard-only interaction, assistive-technology testing, and signed-out HTTPS preview checks were not available in this editing environment. Treat this branch as reviewable but not yet verified for publication. Test the trial start-to-finish, all correction input methods, data saving, journal import/export and 360/390/768px layouts before deployment.

## Deployment
Publication remains a separate decision after review and testing. Do not change the existing production hostname or configure `www.errymobility.com` without confirming domain control and DNS access. GitHub Pages support exists on the repository, but a preview URL has not been verified from this change.
