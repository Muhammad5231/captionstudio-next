# CaptionStudio — Templates Management Guide

## Overview
Templates package complete caption configurations (font choice, font weights, colors, shadow offsets, animations, safe-zone positioning, and display modes) into reusable project blueprints.

## Template Schema
Templates adhere to the `StyleTemplate` schema:
```typescript
interface StyleTemplate {
  id: string;
  name: string;
  category: StyleCategory;
  description: string;
  renderSpec: CaptionRenderSpec;
  isBuiltIn: boolean;
  tags: string[];
}
```

## Favoriting System
- Users can favorite any template using the heart button.
- Saved favorites are persisted per-user in the local SQLite database (`favorites` table).
- The Favorites tab provides one-click access in `/templates` and `/dashboard/templates`.

