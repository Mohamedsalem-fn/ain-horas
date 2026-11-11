# Texture Brief – Abydos (Temple of Seti I & Osireion)

Generate 8 seamless, tileable, photorealistic PBR albedo textures of ancient Egyptian temple surfaces
as they looked originally (c. 1280 BC, freshly painted).

## Global requirements
- Size: square, at least 1024x1024 (2048x2048 preferred), PNG.
- Seamless / tileable on both axes.
- Flat, even lighting: no cast shadows, no highlights, no perspective (flat top-down texture look).
- No text, watermarks, borders, or frames.
- Save into `public/textures/` using the exact filenames below.

## Textures (priority order)

| # | File | Description |
|---|------|-------------|
| 1 | `relief_painted.png` | Raised-relief temple wall with columns of hieroglyphs and offering figures in original vivid pigments (Egyptian blue, red ochre, yellow, green, black outlines) on cream plaster, in the style of Seti I's Abydos reliefs. |
| 2 | `column_painted.png` | Papyrus-bundle column surface with horizontal painted bands of blue, red, green and yellow plus hieroglyph cartouches on a cream base. |
| 3 | `ceiling_stars.png` | Temple ceiling: deep Egyptian blue with rows of golden-yellow five-pointed stars and a yellow/red border band. |
| 4 | `sandstone.png` | Warm golden Nubian sandstone ashlar blocks with fine mortar joints and natural grain. |
| 5 | `limestone.png` | Fine pale-white Tura limestone blocks, subtle joints, smooth/polished. |
| 6 | `granite.png` | Polished red Aswan granite with black speckles (Osireion monoliths). |
| 7 | `mudbrick.png` | Sun-dried Nile mudbrick wall: brown, straw flecks, visible course lines. |
| 8 | `sand.png` | Fine pale desert sand of Abydos with subtle ripples. |

## Optional (if the agent supports it)
For each texture also export `<name>_normal.png` (tangent-space normal map) and `<name>_rough.png` (roughness, grayscale).

## Delivery
Place all files in `public/textures/` and tell me when done. I will map them onto the GLB materials
(`abydos_relief_vivid`, `abydos_column`, `abydos_vault`, `sandstone`, `abydos_limestone`, `granite`, `mudbrick`, `sand`)
and tune the look.

---
Author: Mohamed Salem (Expert AI Engineer & Automation Architect)

