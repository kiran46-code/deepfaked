

# Add EXIF Metadata Scanning to Deepfake Detection

## Overview
Extract EXIF metadata from uploaded images on the frontend before sending to the edge function. If metadata is missing or stripped (a common sign of AI-generated images), cap the confidence score below 60% regardless of the AI visual analysis result.

## How It Works

```text
Upload Image
    │
    ├── Extract EXIF metadata (client-side)
    │     • Camera make/model
    │     • Date taken
    │     • GPS coordinates
    │     • Software used
    │
    ├── Send image + metadata summary to edge function
    │
    └── Edge function:
          1. AI visual analysis (existing)
          2. Check metadata flags
          3. If no meaningful metadata → cap confidence ≤ 0.59
          4. Return result + metadata report
```

## Steps

### 1. Add EXIF parsing library
Install `exifreader` (lightweight, browser-compatible EXIF parser) to extract metadata from the uploaded image file.

### 2. Update `DetectorPanel.tsx`
- Parse EXIF data from the raw `File` object before sending to the edge function
- Extract key fields: camera make/model, date, GPS, software, image dimensions from EXIF
- Send a `metadata` object alongside the `image` to the edge function

### 3. Update edge function `detect-deepfake/index.ts`
- Accept the new `metadata` field from the request body
- After getting the AI visual analysis result, apply metadata logic:
  - If metadata has camera info, date, or GPS → boost credibility (keep AI score as-is)
  - If metadata is empty/missing → cap confidence at max 0.59 and append a note to reasoning
- Include a `metadataReport` in the response with what was found/missing

### 4. Update `ResultDisplay.tsx`
- Add a new "Metadata Analysis" section showing:
  - Camera info (if found)
  - Date taken (if found)
  - Software used (if found)
  - A warning badge if no metadata was detected
- Display metadata status with a color-coded indicator (green = present, red = missing)

### 5. Update types
- Extend `DetectionResult` and history records to include `metadataReport`

## Technical Details
- `exifreader` reads EXIF, IPTC, and XMP data from JPEG/TIFF/PNG files directly in the browser via `ArrayBuffer`
- AI-generated images typically have no EXIF data or only software tags (e.g., "Adobe Firefly", "DALL-E")
- The confidence cap of 0.59 (< 60%) applies when the AI says "real" but metadata is absent — if the AI already says "fake", the low metadata just reinforces it

