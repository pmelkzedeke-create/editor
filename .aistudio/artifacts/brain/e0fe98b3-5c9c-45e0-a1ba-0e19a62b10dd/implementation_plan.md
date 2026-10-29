# OTTO Studio — Mobile Experience & Animated Motion Architecture

Transform OTTO into a production-grade, dual-mode video editor: maintaining the full multi-panel desktop workstation (1440px) while automatically activating a dedicated CapCut-style touch editing studio on mobile devices (<768px).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed in Phase 1 and govern the mobile and motion architecture:

- **Mobile Interface Style**: CapCut style with a bottom action bar and slide-up liquid glass bottom sheets (`MobileBottomSheet`).
- **Animation & Playback Focus**: Lightweight smooth playback optimized for mobile performance, with hardware-accelerated transforms and responsive rendering.
- **Mobile Screen Layout**: Top responsive program monitor + middle touch timeline with scrub rail + bottom action bar with contextual drawer sheets.

---

## 1. Overview & Core Concept

- **What It Does**: Provides mobile creators with an intuitive smartphone editing workflow: tap to split clips at the playhead, drag to scrub the timeline, trim handles with haptic touch response, and edit properties (effects, text, filters, audio, and transforms) via sleek slide-up sheets.
- **Target Audience**: Video creators, mobile social media editors (Reels, TikTok, Shorts), and desktop motion designers needing mobile review and on-the-go editing.
- **Key Value**: Desktop-grade precision (Bézier curves, multi-track timeline, Sapphire VFX) packaged into a friction-free mobile thumb-zone layout without clutter or cramped desktop panels.

---

## 2. User Experience & Visual Design

### Key User Flows (Mobile)
1. **Launch / First Touch**: The user opens the app on a smartphone. The interface detects mobile screen size (`useResponsiveLayout`), hiding desktop sidebars and rendering the compact top bar, responsive preview monitor, touch timeline, and bottom action bar.
2. **Scrubbing & Playback**: Tapping the central transport controls plays the project smoothly. Swiping across the timeline updates the playhead in real time with haptic responsiveness.
3. **Quick Split & Edit**: Positioning the playhead and tapping "Dividir" immediately splits the active layer. Tapping a clip selects it with a luminous bounding border and activates the "Editar" badge.
4. **Contextual Bottom Drawers**:
   - **Mídia**: Upload media, record video/audio, add sample assets with one tap.
   - **Texto**: Add kinetic text presets, edit typography, color, and animations.
   - **Efeitos**: Browse Sapphire VFX (Glow, Glitch, Edge Detect, Time Slice) and cinematic color LUTs.
   - **Formas**: Insert vector rectangles, circles, stars, adjustment layers, and solids.
   - **Editar / Ajustes**: Control scale, position, opacity, speed, flip, blend modes, and delete.

### Visual Identity & Theme
- **Aesthetic Direction**: Dark monochrome pro studio with liquid glass overlays, inspired by Apple Pro apps and CapCut Pro.
- **Color Palette**:
  - Dominant Neutral: `#09090b` (canvas background), `#121215` (surfaces).
  - Borders: `rgba(255, 255, 255, 0.085)` hairline glass borders.
  - Accent Budget: Pure white / subtle light slate buttons (`#f5f5f7`) with high-intent accents (Amber for keyframes, Emerald for audio/cache, Crimson for split/playhead).
- **Typography & Ergonomics**:
  - Display & UI: `Inter` with tabular figures (`tabular-nums`) for timecodes.
  - Touch Targets: All interactive buttons and drawer triggers strictly $\ge 44 \times 44\text{px}$.
  - Mobile Sticky Cap: Bottom navigation + header combined occupy $<15\%$ of screen height.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Responsive Layout Mode (`isMobile`)**:
  - *Chosen Approach*: Automatic switch between desktop 3-pane layout (Media sidebar + Monitor + Inspector + Full Timeline) and mobile CapCut layout (Compact Header + Monitor + Touch Timeline + Action Bar + Drawers).
  - *Why*: Prevents awkward desktop horizontal scrolling and illegible miniature panels on phones.
- **Decision 2: Lightweight Canvas Rendering Engine**:
  - *Chosen Approach*: Render active composition layers into a dynamic resolution canvas with integer scaling on mobile ($1/2$ or $1/4$ resolution dynamically adapted) and native `requestAnimationFrame`.
  - *Why*: Guarantees steady 60fps playback without throttling low-power mobile GPUs.
- **Decision 3: Slide-Up Bottom Sheets with Touch Dismiss**:
  - *Chosen Approach*: Floating rounded top drawers (`rounded-t-2xl`) with grab handles and downward drag-to-dismiss gesture.
  - *Why*: Natural thumb-reach ergonomic zone (bottom 40% of screen).

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────┐
│                      TopBar                            │
│  [OTTO Logo] · [Project Name] · [Undo/Redo] · [Export] │
└────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
  Desktop (≥ 768px)                   Mobile (< 768px)
┌───────────────────────┐           ┌───────────────────────┐
│ [Sidebar] [Monitor] [Insp]│           │    CanvasPreview      │
│ ───────────────────── │           │   (Fit Touch Stage)   │
│     TimelinePanel     │           │ ───────────────────── │
│  (Multi-track Ruler)  │           │   Touch Timeline Rail │
└───────────────────────┘           │  (Scrub, Trim, Split) │
                                    │ ───────────────────── │
                                    │   MobileActionBar     │
                                    │ [Media] [Split] [FX]  │
                                    └───────────────────────┘
                                                │
                                                ▼ (Tap Drawer Trigger)
                                    ┌───────────────────────┐
                                    │   MobileBottomSheet   │
                                    │ [Contextual Controls] │
                                    └───────────────────────┘
```

### Component & State Changes:
1. **`src/hooks/useResponsiveLayout.ts`**:
   - Provide active device detection and drawer state management (`activeDrawer`, `openDrawer`, `closeDrawer`).
2. **`src/App.tsx`**:
   - Integrate `useResponsiveLayout` to render mobile layout when `isMobile` is active.
   - Wire mobile split, layer selection, and bottom sheets for each drawer type (Mídia, Texto, Efeitos, Formas, Áudio, Editar).
3. **`src/components/CanvasPreview.tsx`**:
   - Optimize monitor sizing on mobile to maintain correct aspect ratio without horizontal overflow.
4. **`src/components/TimelinePanel.tsx`**:
   - Support mobile touch gestures, finger-friendly track heights, and responsive ruler pinch/zoom.
5. **`src/utils/compositor.ts`**:
   - Enhance real-time animation of text effects (fade-up, typewriter, pop), motion behaviors, and color adjustments during playback.

---

## 5. Verification Plan

1. **Compilation Check**: Run `compile_applet` to ensure zero TypeScript and build errors.
2. **Desktop Integrity**: Verify desktop 3-pane layout, shortcut triggers, and full-resolution rendering remain intact.
3. **Mobile Responsiveness**: Test viewport resizing to mobile dimensions ($375\text{px}$–$430\text{px}$):
   - Bottom action bar renders with touch hitboxes $\ge 44\text{px}$.
   - Tapping each button opens the corresponding `MobileBottomSheet`.
   - "Dividir" splits the active clip at the current playhead.
   - Play/pause runs smoothly with animated video/text transforms.
