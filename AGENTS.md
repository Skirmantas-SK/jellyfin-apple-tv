# Jellyfin CSS AI Guide

This repo is a Jellyfin Web theme. Treat this file as the project memory for future AI agents and maintainers.

Every AI agent that learns a new Jellyfin CSS fact while working in this repo must update this file before finishing. Add the new fact to the relevant section, or append it to **Learning Log** if it does not fit yet. Keep entries concrete: include selectors, affected files, Jellyfin versions if known, screenshots or symptoms, and the fix that worked.

## Maintenance Contract For AI Agents

1. Read this file before editing `abyss.css`, `scripts/spotlight/*`, or `scripts/docker/abyss-spotlight.sh`.
2. Prefer replacing or tightening the relevant rule over stacking new overrides at the end forever.
3. If a bug took more than one attempt to understand, document the actual root cause here.
4. After any CSS edit, check brace balance:

   ```powershell
   $s = Get-Content -Raw -Path abyss.css
   $opens = ([regex]::Matches($s, '\{')).Count
   $closes = ([regex]::Matches($s, '\}')).Count
   "opens=$opens closes=$closes delta=$($opens - $closes)"
   ```

5. If a Docker install relies on a marker, keep `scripts/docker/abyss-spotlight.sh` and the marker comment in `abyss.css` in sync.
6. Do not break playback while styling detail pages. Video playback depends on Jellyfin's player layers staying visible and interactive.

## Jellyfin CSS Basics

Jellyfin Web is a single-page app. CSS can be injected from Dashboard > Branding > Custom CSS, which is stored in `/config/config/branding.xml` as `<CustomCss>...</CustomCss>`.

In this Docker setup, the installer writes:

```xml
<CustomCss>@import url('/web/ui/abyss.css?v=TIMESTAMP');</CustomCss>
```

The `?v=TIMESTAMP` cache buster matters. Jellyfin Web and browsers cache aggressively, and a stale theme can make a correct fix look broken.

This repo also patches `index.html` with a direct stylesheet link:

```html
<link id="abyss-tvos-css" rel="stylesheet" href="/web/ui/abyss.css?v=TIMESTAMP">
```

That second path is intentional. It makes the theme load earlier and more reliably than Branding CSS alone.

Installed theme files live inside the container at:

```text
/usr/share/jellyfin/web/ui/abyss.css
/usr/share/jellyfin/web/ui/spotlight.html
/usr/share/jellyfin/web/ui/spotlight.css
```

The injected home chunk lives at:

```text
/usr/share/jellyfin/web/home-html.*.chunk.js
```

## Docker Install Flow

The Docker installer is `scripts/docker/abyss-spotlight.sh`. It is designed for LinuxServer-style Jellyfin containers that run scripts mounted in `/custom-cont-init.d` before services start.

The script:

- Downloads `abyss.css`, `spotlight.html`, `spotlight.css`, and `home-html.chunk.js` from `REPO` and `BRANCH`.
- Installs UI files into `/usr/share/jellyfin/web/ui`.
- Updates `/config/config/branding.xml` while preserving other branding fields.
- Adds a cache-busted direct stylesheet link to `/usr/share/jellyfin/web/index.html`.
- Patches `home-html.*.chunk.js` on every container start.
- Creates a `.bak` for the original home chunk once.
- Verifies that installed `abyss.css` contains the expected marker.

The current expected marker is:

```text
NeutralFin Item Detail Layout
```

If the user says the update "did not apply", first verify these:

```bash
docker logs jellyfin --tail=120 | grep -E "abyss-tvos|custom-init"
docker exec jellyfin grep -n "NeutralFin Item Detail Layout" /usr/share/jellyfin/web/ui/abyss.css
docker exec jellyfin grep -n "abyss.css?v=" /config/config/branding.xml
```

## CSS Strategy

Jellyfin has many unstable, generated, and version-sensitive classes. Use durable selectors where possible:

- Page IDs: `#indexPage`, `#itemDetailPage`, `#videoOsdPage`
- Layout classes: `.layout-desktop`, `.layout-mobile`
- Data attributes: `div[data-type="CollectionFolder"]`, `div[data-type="UserView"]`
- Known component classes: `.detailLogo`, `.itemBackdrop`, `.detailRibbon`, `.detailPageContent`, `.itemMiscInfo`, `.mainDetailButtons`, `.trackSelections`, `.itemDetailsGroup`

Use `body.layout-desktop:has(#itemDetailPage)` carefully. It is powerful for page-scoped rules, but broad selectors inside it can accidentally affect overlays, video playback, or hidden sections.

When fixing layout bugs:

- Prefer scoped selectors under `#itemDetailPage`.
- Avoid global `display: block !important` on broad Jellyfin classes.
- Never force every `.verticalSection` visible without excluding `.hide` and known hidden sections.
- Avoid transforms for layout alignment when multiple blocks need the same offset. Use a shared CSS variable instead.

Current detail-page layout uses:

```css
body.layout-desktop:has(#itemDetailPage) {
    --sidePadding: 3.3%;
    --detailContentOffset: max(56px, calc(var(--sidePadding) + 1.2rem));
}
```

Use `--detailContentOffset` for anything that should align with the hero action row.

## tvOS Design Rules Used In This Repo

Typography:

```css
-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

Motion:

```css
cubic-bezier(0.33, 1, 0.68, 1)
```

Poster focus:

```css
transform: scale(1.06);
box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 15px 20px rgba(0, 0, 0, 0.4);
border: 2px solid rgba(255, 255, 255, 0.85);
```

Home app/library focus:

```css
transform: scale(1.12);
```

Glass:

```css
background: rgba(30, 30, 30, 0.7);
backdrop-filter: blur(35px) saturate(200%);
```

Controls:

- Play/Resume is a white pill with black text.
- Secondary action buttons are circular glass controls.
- Browser focus rings are hidden; focus is shown with scale, border, and shadow.
- Avoid decorative cards inside cards.

## Home Page And Spotlight

The home page is not Jellyfin's normal home markup. `scripts/spotlight/home-html.chunk.js` replaces the home HTML and injects:

```html
<iframe class="featurediframe" src="/web/ui/spotlight.html"></iframe>
```

The iframe currently starts at:

```css
margin-top: 80px;
```

This was tuned because the Spotlight image must begin under the Jellyfin top navigation, not from the absolute top of the page. Raising it too far creates a visible gap; lowering it causes the top of the poster/backdrop to hide under the menu.

Spotlight uses `scripts/spotlight/spotlight.css` and `scripts/spotlight/spotlight.html`. It should use the local Apple/system stack, not remote Google fonts.

Important Spotlight visual behavior:

- Full-width cinematic backdrop.
- `object-fit: cover`, with top-aware positioning.
- Left metadata column.
- White Play/Resume pill.
- Glass info button.
- Metadata pills are rounded glass capsules.
- Background is dimmed, but not so blurred that the user cannot read the poster/backdrop.

## My Media / Library Cards

The My Media row is fragile because Jellyfin generates library cards differently from normal movie cards.

Known selectors:

```css
#indexPage div[data-type="CollectionFolder"]
#indexPage div[data-type="UserView"]
#indexPage div[data-type="CollectionFolder"] .cardImageContainer
#indexPage div[data-type="UserView"] .cardImageContainer
```

Lessons learned:

- For this fork, My Media should look closer to original Jellyfin than pure tvOS squircles.
- The image must remain visible. Do not accidentally hide `.cardImageContainer`.
- Double text can happen when both Jellyfin's card text and an overlay/pseudo-label are visible. Avoid adding pseudo-labels unless the original text is hidden.
- If the user reports "double title", inspect `.cardText`, `.cardText-first`, `.cardText-secondary`, and any `::before` or `::after` label rules.
- If the user reports blank gray My Media tiles, check whether a rule has hidden or covered the generated image layer.

## Detail Pages

Movie/TV detail pages are the hardest part of this theme.

Known useful selectors:

```css
#itemDetailPage
#itemDetailPage .itemBackdrop
#itemDetailPage .detailLogo
#itemDetailPage .detailPageWrapperContainer
#itemDetailPage .detailRibbon
#itemDetailPage .itemMiscInfo
#itemDetailPage .mainDetailButtons
#itemDetailPage .detailPageContent
#itemDetailPage .detailSection
#itemDetailPage .detailSectionContent
#itemDetailPage .trackSelections
#itemDetailPage .itemDetailsGroup
```

Current target:

- Full-width backdrop hero.
- Clear logo/title image positioned above the metadata and play row.
- Metadata chips and action buttons aligned to the same left rail.
- Overview and lower sections not glued to the left viewport edge.
- Info boxes should look like premium tvOS glass, not flat gray cards.
- Cast & Crew, Scenes, More Like This, and similar rails should keep content visible while making scroll controls faint.

Important lessons:

- Do not use `position: fixed` for `.detailLogo`; it follows the user while scrolling.
- Do not force `.detailImageContainer .card` visible for movie detail pages. It can create duplicate poster images over text.
- Do not globally restore `.verticalSection`; it can resurrect hidden schedule/program-guide sections.
- `Schedule` on detail pages came from Jellyfin's schedule/program guide blocks being forced visible. The fix was to exclude and hide:

  ```css
  #itemDetailPage #seriesTimerScheduleSection,
  #itemDetailPage #seriesTimerSchedule,
  #itemDetailPage .programGuideSection
  ```

- A working visible-section restore must be shaped like:

  ```css
  .layout-desktop #itemDetailPage .verticalSection:not(.hide):not(#seriesTimerScheduleSection):not(.programGuideSection)
  ```

- If detail content feels glued to the left edge, move it with a shared variable such as `--detailContentOffset`, not separate one-off transforms.

## Detail Info Boxes

The lower info panels are:

```css
#itemDetailPage .itemDetailsGroup
#itemDetailPage .trackSelections
```

Good panel styling should include:

- Rounded radius around 22-28px.
- Subtle translucent black background.
- Very light border.
- Top/radial highlight.
- Inset top highlight.
- Real blur/saturation if supported.
- Label/value alignment that is easy to scan.

Avoid:

- Flat `rgba(30, 30, 30, 0.58)` without highlight.
- Too much border contrast.
- Making `<select>` controls `display: grid`; wrapper rows can be grid, actual selects should stay normal controls.

## Detail Page Rails And Sliders

Rails include Cast & Crew, Scenes, More Like This, Next Up, and similar horizontal sections.

Common selectors:

```css
#itemDetailPage .emby-scroller-container
#itemDetailPage .emby-scroller
#itemDetailPage .scrollX
#itemDetailPage .emby-scrollbuttons
#itemDetailPage .emby-scrollbuttons-button
```

Desired behavior:

- Cards stay visible and scrollable.
- Scrollbars are hidden or extremely faint.
- Arrow buttons are very faint until hover/focus.
- End-of-rail controls should not visually collapse or disappear in a jarring way.

To prevent disappearing controls, account for possible states:

```css
.emby-scrollbuttons.hide
.emby-scrollbuttons.hidden
.emby-scrollbuttons-button.hide
.emby-scrollbuttons-button.hidden
.emby-scrollbuttons-button:disabled
.emby-scrollbuttons-button[disabled]
.emby-scrollbuttons-button[aria-disabled="true"]
```

Keep disabled controls present but faint, and disable pointer events on disabled buttons.

## Video Player / OSD

Playback must be protected.

Known player selector:

```css
#videoOsdPage
```

If the user reports "black screen but audio plays", suspect that CSS accidentally hid, covered, filtered, or changed opacity/positioning of Jellyfin's video layer or player page.

Rules for player safety:

- Do not apply item detail backdrop rules to `#videoOsdPage`.
- Do not give global `.backgroundContainer`, `.backdropImage`, or overlay rules that affect the video player.
- Keep OSD styling scoped to player controls only.
- If fixing detail pages, verify playback afterward.

## Cache And Verification

When a visual change does not appear:

1. Confirm the repo was pushed.
2. Restart the container.
3. Check logs:

   ```bash
   docker logs jellyfin --tail=120 | grep -E "abyss-tvos|custom-init"
   ```

4. Confirm installed CSS marker:

   ```bash
   docker exec jellyfin grep -n "NeutralFin Item Detail Layout" /usr/share/jellyfin/web/ui/abyss.css
   ```

5. Confirm cache-busted Branding CSS:

   ```bash
   docker exec jellyfin grep -n "abyss.css?v=" /config/config/branding.xml
   ```

6. Confirm specific new rule:

   ```bash
   docker exec jellyfin grep -n "YOUR_RULE_OR_MARKER" /usr/share/jellyfin/web/ui/abyss.css
   ```

7. Hard refresh the browser.

## Recommended Debugging Workflow

When the user posts a screenshot:

1. Identify whether it is home, detail page, or player.
2. Locate the existing rule in `abyss.css` before editing.
3. Tighten or replace the existing rule instead of adding a final override.
4. Avoid broad `body:has(...)` rules unless necessary.
5. Run brace balance.
6. Tell the user exactly which grep command proves the deployed CSS contains the fix.

## Learning Log

Add new entries here with date, symptom, root cause, and fix.

### 2026-06-02 - Docker updates appeared stale

Symptom: User pushed repo changes and restarted Jellyfin, but the page looked unchanged.

Root cause: Browser/Jellyfin caching plus uncertainty about whether the installed CSS was current.

Fix: `scripts/docker/abyss-spotlight.sh` now cache-busts the Branding CSS import and direct `index.html` stylesheet link, and verifies that installed `abyss.css` contains the expected marker.

### 2026-06-02 - Spotlight was clipped under the menu

Symptom: Home Spotlight image began at the top of the viewport and was hidden by the menu bar, or left a small gap below it.

Root cause: The injected iframe needed to start at the menu height rather than at `0`.

Fix: `scripts/spotlight/home-html.chunk.js` uses `.featurediframe { margin-top: 80px; }`.

### 2026-06-02 - My Media had blank tiles or double titles

Symptom: My Media folders became gray/blank, too large, or displayed duplicate text.

Root cause: tvOS squircle rules and label rules were too aggressive for Jellyfin's generated library cards.

Fix: Restore Jellyfin-style generated images, use one visible label source, and scope My Media card sizing to `#indexPage div[data-type="CollectionFolder"]` and `#indexPage div[data-type="UserView"]`.

### 2026-06-02 - Movie detail pages had duplicate posters and overlapping controls

Symptom: Poster art duplicated over the overview, controls overlapped selectors, and layout was unusable.

Root cause: Earlier broad detail-page overrides forced image containers and vertical sections visible without respecting Jellyfin's DOM.

Fix: Remove stacked experimental detail blocks and use one `NeutralFin Item Detail Layout` section with scoped detail-page selectors.

### 2026-06-02 - Schedule kept showing on movie pages

Symptom: The word `Schedule` remained visible under the hero buttons.

Root cause: A broad `.verticalSection` restore rule forced hidden Jellyfin schedule/program-guide blocks visible again.

Fix: Exclude `.hide`, `#seriesTimerScheduleSection`, and `.programGuideSection` from the visible-section restore, then directly hide schedule/program-guide selectors.

### 2026-06-02 - Playback showed black screen with audio

Symptom: Movie audio played but the video was black.

Root cause: Styling intended for detail backdrops/overlays affected player layers.

Fix: Keep detail-page visual rules scoped to `#itemDetailPage` and protect `#videoOsdPage` from backdrop/detail layout styling.

### 2026-06-02 - Detail logo followed during scroll

Symptom: Clear logo/title image stayed visible forever while scrolling down the detail page.

Root cause: Logo positioning behaved like fixed/sticky page chrome instead of normal hero content.

Fix: Use absolute positioning within the detail page hero, not fixed positioning.

### 2026-06-02 - Detail content was glued to the left edge

Symptom: Overview text, tags, external links, and lower rails began at `x=0` while action buttons were inset.

Root cause: Content and rails used different left offsets. Some were shifted with local transforms while others used full-width layout.

Fix: Introduce and reuse `--detailContentOffset` for logo, ribbon, metadata, action row, detail content, info boxes, and rails.

### 2026-06-02 - Detail parent padding did not move rendered children

Symptom: The clear logo was inset correctly, but metadata chips, Play/Resume, overview text, tags, and lower detail sections still looked glued to the left viewport edge.

Root cause: Some Jellyfin detail-page children are rendered outside the padded wrapper, or their own layout rules visually bypass the parent padding.

Fix: Keep wrapper padding neutral and apply `--detailContentOffset` directly to the visible children: `.itemMiscInfo`, `.mainDetailButtons`, `.detailSection`, overview/tag/link text blocks, and direct `.detailPageContent` rails.

Follow-up: If deployed CSS contains `margin-left: var(--detailContentOffset)` but the browser still shows `x=0`, the variable may not be resolving on the actual rendered node path or margin may not affect the positioned/flex row. Define the rail variables on `#itemDetailPage` itself, include a hard fallback such as `var(--detailContentOffset, 64px)`, and use `transform: translateX(...)` for `.itemMiscInfo` and `.mainDetailButtons`.

Follow-up 2: Do not combine detail-page CSS variable declarations with visual properties such as `background`, `overflow`, or `filter` on the same selector list. Variables should be safe to apply to `#itemDetailPage`; black backgrounds and scrolling rules should stay on `body:has(#itemDetailPage)` only, or the hero/backdrop image can appear to disappear.

Follow-up 3: Detail overview text can get an "extra bump" if both a direct `.detailPageContent > *` catch-all and nested `.detailSectionContent p` rules apply. Reset nested `.detailSectionContent` text back to `margin-left: 0` after any catch-all rail rule.
