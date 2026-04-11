# DeepFake Detector

> AI-powered image authenticity analysis with EXIF metadata scanning

[![Live Demo](https://img.shields.io/badge/Live-deepfaked.lovable.app-00C9A7?style=for-the-badge)](https://deepfaked.lovable.app)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

---

## Overview

**DeepFake Detector** is a web application that analyzes uploaded images for signs of AI-generated manipulation. It combines **AI vision analysis** (Google Gemini 2.5 Flash) with **EXIF metadata inspection** to provide a confidence-scored verdict on whether an image is real or fake.

### Key Capabilities

* **Dual-layer analysis:** AI visual inspection combined with metadata forensics.
* **Confidence scoring:** 0-100% score with automatic capping when metadata is absent.
* **EXIF metadata extraction:** Client-side parsing of camera make/model, date, GPS, and software tags.
* **Session history:** Track past analyses with thumbnails and metadata badges.
* **Real-time scanning UI:** Animated overlay during analysis to enhance user experience.

---

## Core Features and Tech Stack

### Features

| Feature | Description |
|---------|-------------|
| AI Vision Model | Gemini 2.5 Flash multimodal analysis for artifact detection. |
| EXIF Metadata Scan | Extracts and evaluates image metadata; missing EXIF lowers confidence. |
| Artifact Detection | Identifies subtle manipulation artifacts and inconsistencies. |
| Real-Time Results | Instant analysis with an animated scanning overlay. |
| Analysis History | Session-based history with thumbnails and EXIF status badges. |
| Responsive Design | Fully optimized for desktop, tablet, and mobile. |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS 3, shadcn/ui, Lucide Icons |
| EXIF Parsing | ExifReader (client-side) |
| Backend | Lovable Cloud Edge Functions (Deno) |
| AI Model | Google Gemini 2.5 Flash (via Lovable AI Gateway) |
| State Management | React hooks, TanStack React Query |
| Routing | React Router v6 |

---

## How It Works

The application follows a strict 6-step pipeline to ensure accurate analysis and secure processing:

1. **Image Upload:** The user uploads an image via drag-and-drop or file picker. The image is converted to a base64 data URL for preview and transmission.
2. **EXIF Extraction:** Before sending to the server, the client uses `ExifReader` to parse the image's raw bytes for EXIF, IPTC, and XMP metadata.
3. **Edge Function Processing:** The base64 image and metadata summary are sent to the `detect-deepfake` edge function. This sends the image to Gemini 2.5 Flash with a specialized prompt and receives a structured JSON response.
4. **Metadata Logic:** The edge function applies post-processing based on the presence of EXIF data. A `metadataReport` is generated listing what was found or missing.
5. **Result Display:** The client renders a color-coded verdict badge, confidence progress bar, metadata analysis section, and AI reasoning text.
6. **History Tracking:** Results are saved to session storage with thumbnails and metadata badges for quick reference.

### Confidence Capping Logic

To prevent AI-generated images, which typically lack metadata, from receiving high authenticity scores, the following logic is applied:

```javascript
if (result === "real" && metadata.hasExif === false) {
  confidence = Math.min(confidence, 0.59);
  reasoning += "Note: No EXIF metadata found...";
}
```

---

## Architecture

### Detection Pipeline

```mermaid
flowchart TD
    A[User uploads image] --> B[Client previews image]
    B --> C[Client extracts EXIF metadata]
    C --> D{EXIF data found?}
    D -->|Yes| E[Attach metadata]
    D -->|No| E[Continue without metadata]
    E --> F[Send request to edge function]
    F --> G[Run AI vision analysis]
    G --> H{Real and no EXIF?}
    H -->|Yes| I[Cap confidence at 59%]
    H -->|No| J[Keep original score]
    I --> K[Return result and metadata report]
    J --> K
    K --> L[Display result]
    L --> M[Save to session history]
```

### Component Hierarchy

```mermaid
flowchart TD
    App[App.tsx] --> Router[React Router]
    Router --> Index[Index Page]
    Index --> DP[DetectorPanel]
    Index --> AH[AnalysisHistory]
    Index --> FC[Feature Cards]

    DP --> IU[ImageUploader]
    DP --> SO[ScanningOverlay]
    DP --> RD[ResultDisplay]

    AH --> HI[History Items]
    HI --> MB[Metadata Badges]

    style DP fill:#0ea5e9,color:#fff
    style RD fill:#10b981,color:#fff
    style AH fill:#8b5cf6,color:#fff
```

---

## Project Structure

```text
public/
  placeholder.svg
  robots.txt
src/
  components/
    DetectorPanel.tsx      # Main detection orchestrator
    ImageUploader.tsx      # Drag and drop / file picker
    ScanningOverlay.tsx    # Animated scan effect
    ResultDisplay.tsx      # Verdict + confidence + metadata report
    AnalysisHistory.tsx    # Session history list
    NavLink.tsx            # Navigation helper
    ui/                    # shadcn/ui components
  hooks/
    useAnalysisHistory.ts  # History state management
    use-mobile.tsx         # Responsive breakpoint hook
    use-toast.ts           # Toast notifications
  integrations/
    supabase/
      client.ts            # Supabase client (auto-generated)
      types.ts             # Database types (auto-generated)
  pages/
    Index.tsx              # Landing page
    NotFound.tsx           # 404 page
  lib/
    utils.ts               # Utility functions (cn)
  App.tsx                  # Root component + routing
  main.tsx                 # Entry point
  index.css                # Global styles + design tokens
supabase/
  config.toml              # Supabase configuration
  functions/
    detect-deepfake/
      index.ts             # Edge function for AI analysis
tailwind.config.ts
vite.config.ts
tsconfig.json
```

---

## Getting Started

### Prerequisites

* Node.js 18+ or Bun
* A Lovable account for backend edge functions

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd deepfaked
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   bun run dev
   ```

   The app will be available at `http://localhost:5173`.

### Environment Variables

The following variables are automatically configured by Lovable Cloud:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Backend API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public API key |

---

## Disclaimer

> This tool provides estimates only. Results are advisory and may not catch all AI-generated or manipulated images. Do not rely solely on this tool for critical decisions. AI detection technology has inherent limitations and both false positives and false negatives are possible.

---

<div align="center">
<p>Built by Kiran - Powered by AI vision models</p>
</div>
