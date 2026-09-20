# CaptionStudio — Font & Typography Engine

## Overview
CaptionStudio features an integrated font manager that registers typefaces for both the web canvas preview and FFmpeg libass subtitle rasterization.

## Bundled Fonts
The following professional headline typefaces are pre-installed in `assets/fonts`:
1. **Montserrat** (Black, Bold)
2. **The Bold Font** (Heavy Display)
3. **Impact** (Grotesque Heavy)
4. **Bebas Neue** (Condensed Display)
5. **Komika Axis** (Comic / Cartoon Accent)
6. **Anton** (Headline Condensed)
7. **Poppins** (Geometric ExtraBold)
8. **Inter** (Modern Clean UI)
9. **Roboto** (Black Sans)

## Custom Font Uploads
- Creators can upload `.ttf` or `.otf` typefaces via `/dashboard/fonts`.
- Uploaded fonts are stored locally in `storage/fonts/`.
- FFmpeg's fontconfig cache is automatically synchronized, ensuring custom fonts render identically in web preview and finalized exported MP4s.

