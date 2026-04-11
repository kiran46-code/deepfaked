

# Fix Deepfake Detection Accuracy

## Overview
Five changes: new forensic prompt, updated user message, refined EXIF confidence logic, JSON retry, and scored category badges in the UI.

## Changes

### 1. Edge Function (`supabase/functions/detect-deepfake/index.ts`)

- **Replace system prompt** with the detailed 10-area forensic scoring prompt
- **Replace user message** with the new directive about non-person images
- **Update JSON parsing** to also extract `scores` from the response
- **New confidence logic** replacing the hard 59% cap:
  - EXIF missing + real → `confidence -= 0.1` (min 0.3)
  - EXIF missing + fake → `confidence += 0.05` (max 0.95)
  - EXIF present with camera data + real → `confidence += 0.1` (max 0.95)
- **Retry logic**: wrap the AI fetch + parse in a loop (max 2 attempts). If JSON parse fails on first try, retry once with same payload
- Return `scores` object in the response alongside existing fields

### 2. ResultDisplay (`src/components/ResultDisplay.tsx`)

- Accept optional `scores` prop (`Record<string, number>`)
- Render a flex-wrap grid of small badges below the verdict card
- Color coding: green (0–3), amber (4–6), red (7–10), gray (-1/N/A)
- Each badge shows the area name and score

### 3. DetectorPanel (`src/components/DetectorPanel.tsx`)

- Pass `scores` from the API response through to `ResultDisplay`

### 4. Deploy
- Redeploy the `detect-deepfake` edge function

## Files Modified
- `supabase/functions/detect-deepfake/index.ts`
- `src/components/ResultDisplay.tsx`
- `src/components/DetectorPanel.tsx`

