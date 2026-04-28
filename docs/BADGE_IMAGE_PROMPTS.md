# Superholic Lab — Badge Image Prompts

Generation prompts for the 33 badges in `badge_definitions`. Drop the resulting
files at `public/assets/badges/<id>.svg` (or .png; update `badge_definitions.icon_url` if you change extension).

## Output spec (apply to every prompt)

- **Shape:** circular medallion / badge silhouette, centred, occupying ~85% of the canvas with comfortable margin
- **Canvas:** 512×512 px, **transparent background** (or transparent at minimum around the medallion outline so it composites on any panel)
- **Style:** clean illustrated, semi-flat shading, slightly metallic embossed feel, like a collectible game medal. Not photographic. No 3D realism. No emoji.
- **No text inside the badge.** No name, no number. Reading happens in the UI label below the icon.
- **No outer drop shadow** — the UI applies its own glow ring. Keep the badge artwork self-contained.
- **Lighting:** subtle inner highlight upper-left, faint rim light. Avoid harsh specular hits.
- **Palette restraint:** at most 3 colors per badge — the rarity tier color (dominant), one supporting brand color, and a neutral. Brand palette below.

### Brand palette (use these CSS hex values)

| Token | Hex | Use |
|---|---|---|
| `--brand-sage` | `#51615E` | Neutrals, plates, military panels |
| `--sage-dark` | `#3A4E4A` | Deep shadows |
| `--cream` | `#E3D9CA` | Light highlights, parchment, scrolls |
| `--brand-rose` | `#B76E79` | Epic-tier accents |
| `--brand-mint` | `#39FFB3` | Rare-tier accents, tech glow |
| `--brand-amber` | `#FFB830` | Legendary-tier accents, warmth, fire |

### Rarity → dominant color

- **Common** → cream `#E3D9CA` with sage detail
- **Rare** → mint `#39FFB3` with sage detail
- **Epic** → rose `#B76E79` with cream detail
- **Legendary** → amber `#FFB830` with cream + sage detail

### Theme styles

- **`space_marine`** — sci-fi military: hex plates, chevrons, kite-shield silhouettes, vector-clean industrial, faint scanline texture, riveted edges
- **`magic`** — arcane scholarly: ringed runes, celestial swirls, parchment scrolls, faint stars, soft luminous core, mystic geometry
- **`hybrid`** — fusion: tech meets enchantment — runic circuitry, crystalline shields, astronaut-mage motifs, metal+glow combo

### Master prompt template

> Circular collectible medallion badge icon, **[THEME aesthetic]**, transparent background, 512×512, centred composition with ~85% medallion footprint, motif: **[MOTIF]**. Rarity-tier color: dominant **[RARITY HEX]** with secondary **[SECONDARY HEX]** and **[NEUTRAL HEX]** detail. Clean illustrated, semi-flat shading, slightly metallic embossed feel, subtle inner highlight upper-left, faint rim light. No text, no emoji, no photographic realism, no outer drop shadow. Style of premium edtech / classic role-playing-game collectible badges.

Append the master prompt suffix to each badge-specific prompt below if the tool you're using needs full context every time.

---

## Legendary (2)

### `level_50` — Commander
**Theme:** space_marine | **Motif:** five-pointed star inside a beveled hexagon plate, two crossed laurel branches behind the plate, small chevron rank pips ringing the inner border
**Prompt:** Circular collectible medallion badge, sci-fi military aesthetic. A beveled hexagon plate at centre bearing a five-pointed star, framed by two crossed laurel branches in cream metal. Ring of small chevron rank pips around the inner border. Dominant amber `#FFB830` with cream `#E3D9CA` highlights and `#3A4E4A` plate shadow. 512×512 transparent, semi-flat shading, no text.

### `secret_oracle` — Oracle
**Theme:** magic | **Motif:** an open eye inside a ringed orb, three concentric arcane rings around it with subtle constellation marks, a faint crystal lens at the pupil
**Prompt:** Circular collectible medallion badge, arcane scholarly aesthetic. An open eye at centre with a faceted crystal lens for the pupil, surrounded by three concentric arcane rings inscribed with tiny constellation marks. Dominant amber `#FFB830` with cream `#E3D9CA` rune detail and faint sage `#51615E` background veil. Subtle inner luminous glow at the lens. 512×512 transparent, semi-flat, no text.

---

## Epic (8)

### `streak_30` — Galactic Compass
**Theme:** magic | **Motif:** ornate compass rose with a north star, surrounded by an orbital ellipse and small star sparks
**Prompt:** Circular collectible medallion badge, arcane celestial aesthetic. Ornate eight-point compass rose at centre, north arm extended into a five-point star, encircled by a thin orbital ellipse with three sparkle accents. Dominant rose `#B76E79` with cream `#E3D9CA` compass face and sage `#51615E` ring. 512×512 transparent, semi-flat, no text.

### `al1_master` — Apex Operator
**Theme:** space_marine | **Motif:** kite-shaped tactical shield with a single chevron and "AL1" implied by a sharp vertical bar/notch design (no actual text), small pip dots flanking
**Prompt:** Circular collectible medallion badge, sci-fi military aesthetic. Kite-shaped tactical shield at centre with one bold rising chevron and a vertical accent bar. Two pip dots flanking the chevron. Dominant rose `#B76E79` with sage `#51615E` shield body and cream `#E3D9CA` chevron highlight. 512×512 transparent, semi-flat, no text.

### `perfect_exam` — Pristine Mind
**Theme:** hybrid | **Motif:** a faceted diamond crystal cradled by two upward laurel branches, with a faint circuit-like halo
**Prompt:** Circular collectible medallion badge, fusion of arcane crystal and tech aesthetic. A faceted diamond crystal at centre, cradled by two upward laurel branches, framed by a faint circuit-trace halo ring. Dominant rose `#B76E79` with cream `#E3D9CA` crystal facets and sage `#51615E` circuit lines. 512×512 transparent, semi-flat, no text.

### `quest_10` — Veteran Operator
**Theme:** hybrid | **Motif:** roman numeral "X" implied by two crossed swords or scrolls (don't render literal X letter), wreath of small chevron pips
**Prompt:** Circular collectible medallion badge, fusion military-arcane aesthetic. Two crossed long-tail banners at centre forming an X-cross, ringed by a wreath of ten chevron pips. Dominant rose `#B76E79` with cream `#E3D9CA` banners and sage `#51615E` wreath. 512×512 transparent, semi-flat, no text.

### `level_25` — Lieutenant
**Theme:** space_marine | **Motif:** double-bar lieutenant insignia (two parallel chevrons stacked), set inside a hexagon plate
**Prompt:** Circular collectible medallion badge, sci-fi military aesthetic. Double-bar lieutenant insignia (two stacked horizontal bars) inside a beveled hexagon plate. Subtle scanline texture on the plate. Dominant rose `#B76E79` with cream `#E3D9CA` bars and sage `#51615E` plate. 512×512 transparent, semi-flat, no text.

### `mastery_first_try` — One-Shot Mastery
**Theme:** hybrid | **Motif:** a single golden arrow pierced clean through a small target ring, no scattered debris
**Prompt:** Circular collectible medallion badge, fusion archery-tech aesthetic. A single sleek arrow piercing dead-centre through a target ring, the arrow rendered with a slight crystalline tip. No clutter, no other arrows. Dominant rose `#B76E79` with cream `#E3D9CA` arrow body and sage `#51615E` target ring. 512×512 transparent, semi-flat, no text.

### `redo_warrior` — Redo Warrior
**Theme:** hybrid | **Motif:** a circular arrow looping back on itself (refresh / cycle motif) with a small flame at the tail
**Prompt:** Circular collectible medallion badge, fusion warrior-cycle aesthetic. A bold circular refresh arrow looping back on itself with a small flame trailing the tail, rendered with a metallic feel. Dominant rose `#B76E79` with amber `#FFB830` flame and cream `#E3D9CA` arrow body. 512×512 transparent, semi-flat, no text.

### `secret_alchemist` — Alchemist *(secret)*
**Theme:** magic | **Motif:** a stylised alchemical flask with a single droplet rising as a star, three small orbiting symbols around it
**Prompt:** Circular collectible medallion badge, arcane alchemy aesthetic. A stylised alchemical flask at centre with a single luminous droplet rising into a star above the neck, three small orbiting alchemical symbols (triangle, circle, crescent) ringing around. Dominant rose `#B76E79` with cream `#E3D9CA` flask glass and sage `#51615E` symbols. 512×512 transparent, semi-flat, no text.

### `secret_phoenix` — Phoenix *(secret)*
**Theme:** hybrid | **Motif:** a phoenix silhouette in profile, wings spread, rising from a small ember, no fire trail
**Prompt:** Circular collectible medallion badge, fusion mythic-tech aesthetic. A phoenix silhouette in profile mid-rise, wings half-spread, lifting from a small glowing ember at the base. Stylised, not realistic. Dominant rose `#B76E79` with amber `#FFB830` ember and cream `#E3D9CA` wing highlights. 512×512 transparent, semi-flat, no text.

---

## Rare (10)

### `first_quest` — First Mission
**Theme:** hybrid | **Motif:** a planted flag on a small mound, with a single star above it
**Prompt:** Circular collectible medallion badge, fusion explorer-tech aesthetic. A planted pennant flag on a small triangular mound, single five-point star above the flag tip. Dominant mint `#39FFB3` with cream `#E3D9CA` flag and sage `#51615E` mound. 512×512 transparent, semi-flat, no text.

### `quest_3` — Mission Streak
**Theme:** hybrid | **Motif:** three vertical chevrons stacked rising upward, with motion streak lines behind them
**Prompt:** Circular collectible medallion badge, fusion warrior-tech aesthetic. Three vertical chevrons stacked rising in scale, faint motion streak lines behind suggesting forward momentum. Dominant mint `#39FFB3` with sage `#51615E` motion lines and cream `#E3D9CA` chevron highlights. 512×512 transparent, semi-flat, no text.

### `streak_7` — Constellation
**Theme:** magic | **Motif:** seven stars arranged in a small constellation pattern, connected by faint lines
**Prompt:** Circular collectible medallion badge, arcane celestial aesthetic. Seven five-point stars arranged in a balanced constellation pattern, connected by faint thin lines forming a graceful asterism. Dominant mint `#39FFB3` with cream `#E3D9CA` stars and sage `#51615E` connector lines on a faint dark sage backdrop circle. 512×512 transparent, semi-flat, no text.

### `perfect_quiz` — Flawless Run
**Theme:** hybrid | **Motif:** a checkmark inside a circular halo, with three radiating spark lines behind
**Prompt:** Circular collectible medallion badge, fusion clean-tech aesthetic. A bold checkmark inside a thin circular halo, three radiating spark lines extending diagonally behind the checkmark. Dominant mint `#39FFB3` with cream `#E3D9CA` checkmark and sage `#51615E` halo. 512×512 transparent, semi-flat, no text.

### `subject_explorer` — Tri-Star
**Theme:** space_marine | **Motif:** three five-point stars arranged in a triangular tri-pattern (one top, two below) joined at points
**Prompt:** Circular collectible medallion badge, sci-fi military aesthetic. Three five-point stars in a triangular formation (top centre, lower-left, lower-right), points nearly touching, rendered as faceted metallic stars. Dominant mint `#39FFB3` with cream `#E3D9CA` star highlights and sage `#51615E` shadow. 512×512 transparent, semi-flat, no text.

### `level_10` — Cadet Stripe
**Theme:** space_marine | **Motif:** single chevron stripe, beveled, on a small rectangular insignia plate
**Prompt:** Circular collectible medallion badge, sci-fi military aesthetic. A single bold beveled chevron stripe on a small rectangular insignia plate, riveted corners. Dominant mint `#39FFB3` with cream `#E3D9CA` chevron and sage `#51615E` plate. 512×512 transparent, semi-flat, no text.

### `helper_50` — Wisdom Keeper
**Theme:** magic | **Motif:** an open scroll with a small arcane sigil glowing at the top, faint runic script implied (not actual letters)
**Prompt:** Circular collectible medallion badge, arcane scholarly aesthetic. An open parchment scroll at centre with a small luminous arcane sigil hovering above it, faint runic-pattern impressions on the parchment surface (no real letters, just rhythmic strokes). Dominant mint `#39FFB3` with cream `#E3D9CA` parchment and sage `#51615E` sigil. 512×512 transparent, semi-flat, no text.

### `weakness_crusher` — Bug Hunter
**Theme:** hybrid | **Motif:** a target reticle with a single arrow striking the centre, faint scope grid lines
**Prompt:** Circular collectible medallion badge, fusion tactical-tech aesthetic. A precision targeting reticle (cross-hair with notched corners) at centre, single short arrow striking the bullseye, faint scope grid lines extending out. Dominant mint `#39FFB3` with cream `#E3D9CA` arrow and sage `#51615E` reticle frame. 512×512 transparent, semi-flat, no text.

### `socratic_scholar` — Socratic Scholar
**Theme:** magic | **Motif:** an open book with a question-mark glyph rising as light from its pages (the glyph stylised, not literal text)
**Prompt:** Circular collectible medallion badge, arcane scholarly aesthetic. An open book at centre with a stylised question-mark glyph rising as soft light from its pages, the glyph rendered as a glowing curve and dot rather than an actual character. Dominant mint `#39FFB3` with cream `#E3D9CA` book pages and sage `#51615E` cover. 512×512 transparent, semi-flat, no text.

### `honest_compass` — Honest Compass
**Theme:** magic | **Motif:** a four-point compass rose with the north arm sharper than the others, set inside a thin ring
**Prompt:** Circular collectible medallion badge, arcane navigator aesthetic. A four-point compass rose at centre, north arm rendered slightly longer and sharper for emphasis, framed by a thin clean ring. No fluff, no flourishes — restrained, deliberate. Dominant mint `#39FFB3` with cream `#E3D9CA` compass and sage `#51615E` ring. 512×512 transparent, semi-flat, no text.

### `secret_warden` — Vault Warden *(secret)*
**Theme:** magic | **Motif:** a closed grimoire / tome with a small keyhole on the spine, two crossed keys behind it
**Prompt:** Circular collectible medallion badge, arcane vault-keeper aesthetic. A closed grimoire tome at centre with a small ornate keyhole on its spine, two crossed slim keys behind the tome forming an X. Dominant mint `#39FFB3` with cream `#E3D9CA` book cover and sage `#51615E` keys. 512×512 transparent, semi-flat, no text.

---

## Common (11)

### `first_quiz` — First Contact
**Theme:** space_marine | **Motif:** a small triangular emblem (rocket nose / standard pennant) on a hex plate
**Prompt:** Circular collectible medallion badge, sci-fi military aesthetic. A small upward-pointing triangular emblem (clean rocket-nose silhouette) on a beveled hex plate, riveted edges. Dominant cream `#E3D9CA` with sage `#51615E` plate and faint amber `#FFB830` accent at the tip. 512×512 transparent, semi-flat, no text.

### `first_subject` — Subject Pioneer
**Theme:** space_marine | **Motif:** a planted standard / upright spear with a small banner triangle, beveled hex plate base
**Prompt:** Circular collectible medallion badge, sci-fi military aesthetic. An upright slim standard pole with a small triangular banner near the top, planted on a beveled hex plate base. Dominant cream `#E3D9CA` with sage `#51615E` plate and faint mint `#39FFB3` banner edge. 512×512 transparent, semi-flat, no text.

### `early_bird` — First Light
**Theme:** magic | **Motif:** a stylised sunrise — half-disc rising over a horizon line, three soft rays
**Prompt:** Circular collectible medallion badge, arcane celestial aesthetic. A stylised sunrise — half-disc rising over a horizon line with three soft tapered rays radiating upward. Dominant cream `#E3D9CA` with amber `#FFB830` sun core and sage `#51615E` horizon. 512×512 transparent, semi-flat, no text.

### `night_owl` — Stealth Mode
**Theme:** space_marine | **Motif:** a crescent moon overlaid with a thin chevron / visor accent
**Prompt:** Circular collectible medallion badge, sci-fi stealth aesthetic. A crescent moon at centre with a thin chevron / visor sweep across its open arc, suggesting a tactical helmet silhouette. Dominant cream `#E3D9CA` with sage `#51615E` shadow and faint mint `#39FFB3` visor edge. 512×512 transparent, semi-flat, no text.

### `streak_3` — Steady Hand
**Theme:** hybrid | **Motif:** three small flame-droplets stacked vertically, gently rising
**Prompt:** Circular collectible medallion badge, fusion warmth-tech aesthetic. Three small flame-droplet shapes stacked vertically, the lowest largest, the highest smallest, gently rising. Dominant cream `#E3D9CA` with amber `#FFB830` flame cores and sage `#51615E` outline. 512×512 transparent, semi-flat, no text.

### `note_taker` — Codex Architect
**Theme:** magic | **Motif:** a feather quill crossed over a small open scroll
**Prompt:** Circular collectible medallion badge, arcane scholarly aesthetic. A long feather quill crossed diagonally over a small open parchment scroll, the quill tip just touching the parchment. Dominant cream `#E3D9CA` with sage `#51615E` quill and rose `#B76E79` ink dot accent at the tip. 512×512 transparent, semi-flat, no text.

### `helper_10` — Apprentice Pact
**Theme:** magic | **Motif:** two small chat-bubble glyphs overlapping, framed by a thin ring
**Prompt:** Circular collectible medallion badge, arcane apprentice aesthetic. Two small rounded chat-bubble glyphs overlapping diagonally (one upper-left, one lower-right), framed by a thin clean ring. Dominant cream `#E3D9CA` with sage `#51615E` bubbles and faint mint `#39FFB3` ring. 512×512 transparent, semi-flat, no text.

### `quiz_5` — Five Strong
**Theme:** space_marine | **Motif:** a single five-point star at centre, crossed bars behind
**Prompt:** Circular collectible medallion badge, sci-fi military aesthetic. A bold five-point star at centre with two short crossed bars behind it forming an X. Dominant cream `#E3D9CA` star with sage `#51615E` bars and a thin sage rim. 512×512 transparent, semi-flat, no text.

### `tutor_session` — Mind Link
**Theme:** magic | **Motif:** two small interlocked rings with a tiny spark at the join, faint thought-wave arcs
**Prompt:** Circular collectible medallion badge, arcane mind-link aesthetic. Two small interlocked rings (vesica piscis style) with a tiny luminous spark at the join, faint thought-wave arcs radiating outward from the centre. Dominant cream `#E3D9CA` rings with mint `#39FFB3` spark and sage `#51615E` arcs. 512×512 transparent, semi-flat, no text.

### `weakness_spotter` — Recon Specialist
**Theme:** space_marine | **Motif:** a hexagonal scope reticle with cross-hairs and small range tick marks
**Prompt:** Circular collectible medallion badge, sci-fi recon aesthetic. A hexagonal scope reticle at centre with cross-hairs and four small range tick marks at the cardinal points. Dominant cream `#E3D9CA` reticle with sage `#51615E` body and a tiny rose `#B76E79` centre dot. 512×512 transparent, semi-flat, no text.

### `set_avatar` — Identity Forged
**Theme:** hybrid | **Motif:** a stylised helmet / mask silhouette in three-quarter view, framed by a thin halo ring
**Prompt:** Circular collectible medallion badge, fusion identity-tech aesthetic. A stylised helmet/mask silhouette in three-quarter view at centre, framed by a thin halo ring. The mask is geometric and abstract, not a specific character. Dominant cream `#E3D9CA` with sage `#51615E` mask and faint rose `#B76E79` halo edge. 512×512 transparent, semi-flat, no text.

---

## Generation tips

1. **Run them as a batch** in your image tool of choice (Midjourney, DALL-E 3, Recraft, Ideogram, Stable Diffusion). Recraft and Ideogram tend to give the cleanest icon-style results.
2. **Pin a style reference** — generate the legendary `level_50` Commander first, get it where you like it, then feed it as a style anchor to the rest. Consistency across the set matters more than any individual badge being perfect.
3. **Output format:** PNG with transparent background is easiest. If you want SVG, run the PNGs through `vectorizer.io` or `recraft.ai`'s SVG export.
4. **File naming:** save each as `<id>.svg` (or `.png`) inside `public/assets/badges/`. The `id` column in `badge_definitions` matches one-to-one — e.g. `first_quiz.svg`, `secret_oracle.svg`, `level_50.svg`.
5. **If you switch to PNG:** run this SQL to update icon_url:
   ```sql
   UPDATE badge_definitions SET icon_url = REPLACE(icon_url, '.svg', '.png');
   ```
6. **Test the modal** — once 5–10 are dropped in, open the badge hub. Earned badges show full art, locked ones grayscale automatically (CSS filter handles it). Anything missing falls back to the shield Icon.
7. **Secret badges** (`secret_alchemist`, `secret_phoenix`, `secret_oracle`, `secret_warden`) only render their image once earned. Locked + secret shows "?" placeholder. So generate art for them, but it'll only ever appear post-earn.
