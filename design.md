# MINEGUARD — Master Frontend Design Specification

**System Name:** MINEGUARD  
**Subtitle:** AI-Enabled Real-Time Mine Subsidence Monitoring & Early Warning System  
**Tagline:** *Sense. Predict. Protect.*  
**Design Version:** 2.4 (Comfortable Obsidian & Glowing Gold Mission-Control Edition)

---

## 1. Design Philosophy & Tone

The interface serves mining engineers, geotechnical safety officers, and control-room operators. It evokes uncompromising reliability, high data density, and clear operational hierarchy while providing a state-of-the-art visual experience with comfortable optical luminescence.

- **Atmosphere:** Deep obsidian control-room with luminous golden and cyan data telemetry accents.
- **Aesthetic Priorities:** Clean, ergonomic, safety-focused, high information density, fluid micro-interactions.
- **Safety Standard:** Intuitive 5-state traffic-light hazard indicator system (Safe, Advisory, Warning, High Risk, Critical).
- **Interactive Feel:** Tactile physical feedback with spring dynamics and inertial momentum scrolling.

---

## 2. Global Color System & Design Tokens

### Base Neutral Palette (Deep Obsidian)
| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-bg` | `#0B0F14` | Global root viewport background (near-black with subtle atmospheric cyan radial washes) |
| `--color-bg-alt` | `#0E141B` | Secondary page backdrop & section bands |
| `--color-surface` | `#151A21` | Standard card, module, and dashboard panel background |
| `--color-surface-hover` | `#1A222C` | Hover state for interactive cards and list items |
| `--color-surface-elevated` | `#1E2733` | Modals, flyouts, popups, tooltips, and active drawer panels |
| `--color-surface-container-high` | `#18202A` | Filter bars, segmented tab tracks, and input containers |
| `--color-border` | `#222E3C` | Standard structural borders & dividers |
| `--color-border-subtle` | `#17212C` | Internal row dividers and card borders |
| `--color-border-strong` | `#33455A` | Interactive hover borders and focused containers |

### Luminous Golden & White Typography Tokens
| Token | Hex / Value | Visual Effect & Semantic Role |
| :--- | :--- | :--- |
| `--color-text-primary` | `#FFFDF8` | Crisp white-gold blend for main headlines, hero titles, active metric numbers |
| `--color-text-gold` | `#F3CA68` | Refined warm gold for brand marks, active selection pills, accent badges |
| `--color-text-secondary` | `#C5D1DE` | High-readability cool silver for labels, descriptions, and table rows |
| `--color-text-tertiary` | `#7D8D9F` | Timestamps, sensor units, metadata, and inactive tab labels |
| `--color-text-muted` | `#5A6777` | Captions, disabled labels, and secondary hardware specs |

### Telemetry & Action Accent Colors
| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-cyan` / `--color-primary` | `#00C2FF` | Primary action accent, LoRa link status, live telemetry pulse, data borders |
| `--color-cyan-glow` | `rgba(0, 194, 255, 0.4)` | Focus halos, active telemetry badges, map overlay borders |
| `--color-gold-glow` | `rgba(243, 202, 104, 0.45)` | Title luminescence, active navigation indicator glow |

### Safety & Operational State Colors (Traffic-Light System)
| State | Hex | Background (12% alpha) | Border (35% alpha) | Operational Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **SAFE / NORMAL** | `#30D158` | `rgba(48, 209, 88, 0.12)` | `rgba(48, 209, 88, 0.35)` | Baseline stability; normal deformation rate |
| **WARNING** | `#FFB020` | `rgba(255, 176, 32, 0.12)` | `rgba(255, 176, 32, 0.35)` | Advisory threshold variance or unconfirmed trend |
| **HIGH RISK** | `#FF9500` | `rgba(255, 149, 0, 0.12)` | `rgba(255, 149, 0, 0.35)` | Multi-sensor spatial-temporal anomaly correlation |
| **CRITICAL / DANGER**| `#FF3B30` | `rgba(255, 59, 48, 0.14)` | `rgba(255, 59, 48, 0.45)` | TARP Level 3 breach; immediate evacuation alert |
| **OFFLINE / DISCONNECT**| `#8E8E93` | `rgba(142, 142, 147, 0.12)` | `rgba(142, 142, 147, 0.30)` | Node heartbeat timeout / battery depletion |

---

## 3. Typography & Font Style Specifications

### Typeface Stack
- **Primary Interface Font:**  
  `Inter`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif.  
  *Features:* Clean geometric proportions, tall x-height, optimized for dense technical dashboards.
- **Monospace & Telemetry Font:**  
  `JetBrains Mono`, "SF Mono", "Roboto Mono", Consolas, monospace.  
  *Features:* Open counters, clear zero/O distinction, `font-variant-numeric: tabular-nums` for rock-solid tabular data alignment.

### Golden Blended Typography System

#### 1. White-to-Gold Gradient Text (`.gold-gradient-text`, `.text-gold-blend`)
Used for primary brand marks, high-level KPIs, and page titles to convey cutting-edge precision:
```css
.gold-gradient-text,
.text-gold-blend {
  background: linear-gradient(180deg, #FFFFFF 15%, #FDF3DA 50%, #F3CA68 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 10px rgba(243, 202, 104, 0.4));
}
```

#### 2. Glowing Golden Font (`.text-gold-glow`)
Used for highlighted warnings, operational highlights, and selected states:
```css
.text-gold-glow {
  color: #FFF4D9;
  text-shadow: 0 0 12px rgba(243, 202, 104, 0.55), 0 0 2px rgba(255, 255, 255, 0.85);
}
```

#### 3. High-Density Telemetry Numbers (`.mono-telemetry`)
Used for live sensor outputs (tilt degrees, displacement mm, battery %, pore pressure):
```css
.mono-telemetry {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```

### Type Scale & Hierarchy
| Role | Size | Weight | Line Height | Letter Spacing | Styling / Color |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `48px` (3.0rem) | 800 | 1.15 | -0.03em | Gold gradient + soft luminous drop shadow |
| **Page Title** | `26px` (1.625rem) | 700 | 1.25 | -0.02em | `#FFFDF8` with subtle gold shadow |
| **Section Heading** | `18px` (1.125rem) | 600 | 1.35 | -0.01em | `#FFFDF8` |
| **Card / Panel Title**| `15px` (0.9375rem) | 600 | 1.40 | 0 | `#E8EDF2` |
| **Telemetry KPI Value**| `28px` (1.75rem) | 700 | 1.10 | -0.02em | Tabular monospace; status color or gold |
| **Telemetry KPI Label**| `12px` (0.75rem) | 600 | 1.30 | +0.05em | Uppercase; `--color-text-secondary` |
| **Body Regular** | `14px` (0.875rem) | 400 | 1.50 | 0 | `--color-text-secondary` (`#C5D1DE`) |
| **Metadata & Subtext**| `11px` (0.6875rem) | 500 | 1.40 | +0.02em | Monospace / `--color-text-tertiary` |

---

## 4. Smooth Scrolling Architecture & Implementation

### Core Physics Engine: Lenis
MineGuard uses [Lenis](https://lenis.darkroom.engineering/) for normalized, buttery-smooth inertial momentum scrolling across all browsers and input devices (mouse wheel, precision trackpad, touch).

### Dual-Scope Architecture
1. **Landing Page Scope:** Operates on the root `window` viewport.
2. **Operational Console Scope:** Operates on `.mg-app-shell__main` wrapper container with `.mg-app-shell__content` content reference, ensuring the sidebar and top navigation remain perfectly fixed without layout thrashing.

### Momentum Configuration Parameters
```ts
const lenis = new Lenis({
  wrapper: mainRef.current,        // Viewport scroll element (in AppShell)
  content: contentRef.current,    // Content child element
  duration: 1.2,                  // Inertial decay duration (seconds)
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential deceleration curve
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,              // Smooth mouse wheel interpolation
  wheelMultiplier: 1.05,          // Natural 1:1 wheel distance feeling
  touchMultiplier: 1.6,           // Fluid touch response on mobile/tablet
  infinite: false,
});
```

### Critical CSS Interoperability Rule
To prevent jitter and double-interpolation conflicts between browser native smooth scrolling and Lenis's `requestAnimationFrame` loop, native CSS smooth scroll is overridden:
```css
/* Must be auto so Lenis controls interpolation */
html,
body,
.mg-app-shell__main {
  scroll-behavior: auto !important;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
```

### Anchor Navigation Gliding
When navigating between landing page sections (`#overview`, `#sectors`, `#capabilities`, `#tarp`, `#hardware`), clicks are intercepted and handled via Lenis's smooth scroll API with header offset compensation:
```ts
const handleScrollTo = (e: React.MouseEvent, targetId: string) => {
  e.preventDefault();
  const lenis = window.__lenis;
  const el = document.querySelector(targetId);
  if (lenis && el) {
    lenis.scrollTo(el, { offset: -70, duration: 1.2 });
  } else if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};
```

### Luminous Scroll Progress Indicator
A sticky 2.5px progress bar at `top: 0` tracks vertical reading progress via Framer Motion `useScroll` and `useSpring`, styled with a golden/cyan blend:
```tsx
<motion.div
  style={{
    scaleX,
    transformOrigin: '0%',
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: '2.5px',
    background: 'linear-gradient(90deg, #00C2FF 0%, #F3CA68 50%, #FFFDF8 100%)',
    boxShadow: '0 0 12px rgba(243, 202, 104, 0.6), 0 0 6px rgba(0, 194, 255, 0.4)',
    zIndex: 9999,
  }}
/>
```

---

## 5. Choosing & Selection Animation Specification

### Concept
The "choosing animation effect" provides instant, tactile visual feedback whenever the operator selects an option, navigates between tabs, switches time ranges, or chooses a sensor node. Rather than abrupt instant changes, an illuminated indicator glides fluidly to the newly chosen item using physical spring dynamics.

### 1. Sidebar Navigation Active Tab Glide
- **Component:** `NavItem.tsx` / `NavItem.css`
- **Mechanism:** Framer Motion `layoutId="sidebarActiveSelection"`
- **Spring Profile:** `type: "spring", stiffness: 450, damping: 34`
- **Visual Design:** An illuminated pill with a 3px golden edge border, subtle amber gradient fill (`rgba(243, 202, 104, 0.16)`), and dual inner/outer shadows:
```css
.mg-nav-item__active-pill {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, rgba(243, 202, 104, 0.16) 0%, rgba(243, 202, 104, 0.03) 100%);
  border-left: 3px solid #F3CA68;
  border-top: 1px solid rgba(243, 202, 104, 0.25);
  border-bottom: 1px solid rgba(243, 202, 104, 0.25);
  border-right: 1px solid rgba(243, 202, 104, 0.12);
  box-shadow: 0 0 16px rgba(243, 202, 104, 0.14), inset 0 0 12px rgba(243, 202, 104, 0.04);
  z-index: 0;
  pointer-events: none;
}
```

### 2. Page-to-Page Choosing Transitions
- **Component:** `AppShell.tsx`
- **Mechanism:** `<AnimatePresence mode="wait">` wrapping the active route keyed on `location.pathname`
- **Transition Parameters:**
  - `initial: { opacity: 0, y: 10, filter: "blur(3px)" }`
  - `animate: { opacity: 1, y: 0, filter: "blur(0px)" }`
  - `exit: { opacity: 0, y: -10, filter: "blur(3px)" }`
  - `transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }`
- **Result:** Choosing any page in the application produces a smooth blur-and-glide transition without layout stutter.

### 3. Quick Status Filter Tabs Glide
- **Component:** `AlertFilters.tsx` / `AlertFilters.css`
- **Mechanism:** `layoutId="alertQuickTabActive"` on the active button
- **Tabs:** *All Alerts*, *Unresolved*, *New*, *Investigating*, *Acknowledged*, *Resolved*
- **Visual Design:** A golden luminous capsule that glides across the segmented track:
```tsx
{isActive && (
  <motion.span
    layoutId="alertQuickTabActive"
    className="mg-quick-tab__active-bg"
    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
  />
)}
```

### 4. Telemetry Time Horizon Selector Glide
- **Component:** `TrendsFilterBar.tsx` / `TrendsFilterBar.css`
- **Mechanism:** `layoutId="trendsTimeTabActive"`
- **Options:** `1H`, `6H`, `24H`, `7D`, `30D`
- **Interaction:** Spring sliding indicator snapping to the selected horizon.

### 5. Summary Card Selection Rings
- **Components:** `AlertSummaryCards.tsx`, `NodeSummaryCards.tsx`
- **Mechanism:** `layoutId="alertSummaryCardSelected"`, `layoutId="nodeSummaryCardSelected"`
- **Micro-interactions:**
  - `whileHover={{ y: -2.5, transition: { duration: 0.15 } }}`
  - `whileTap={{ scale: 0.98 }}`
- **Active State:** A glowing golden border frame (`border: 1.5px solid #F3CA68`) with amber outer illumination that smoothly moves to whichever card is clicked.

### 6. Spatial Map Node Selection & Flyout Entrance
- **Component:** `LiveMineMap.tsx`
- **Interactions:**
  - Node Pin Tap: `whileHover={{ scale: 1.18 }}`, `whileTap={{ scale: 0.9 }}`
  - Node Telemetry Popup Flyout: `<AnimatePresence>` with `initial={{ opacity: 0, scale: 0.92, y: 8 }}`, `animate={{ opacity: 1, scale: 1, y: 0 }}`, `exit={{ opacity: 0, scale: 0.92, y: 8 }}`.

---

## 6. Motion & Interaction Standards

| Interaction Type | Timing / Duration | Easing / Physics | Purpose |
| :--- | :--- | :--- | :--- |
| **Page Transition** | `240ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Clean entering and exit between operational views |
| **Tab/Pill Selection**| Dynamic Spring | `stiffness: 450, damping: 34` | Physical, fluid glide when choosing filters/routes |
| **Card Tap Feedback** | `100ms` | `scale: 0.98` | Instant tactile confirmation of click |
| **Node Pin Hover** | `150ms` | `scale: 1.18, easeOut` | Highlighting target telemetry probe |
| **Flyout / Drawer** | `220ms` | `scale: 0.92 → 1, ease: [0.16, 1, 0.3, 1]` | Natural spatial expansion of detailed telemetry |
| **Scroll Inertia** | `1.2s` | `1.001 - 2^(-10t)` (Lenis exponential) | Natural momentum without wheel jitter |

---

## 7. Quality & Verification Checklist

- [x] **Zero Layout Shifting:** Smooth scrolling and layoutId shared animations do not cause container recalculation or scroll jump.
- [x] **Zero CSS Conflicts:** All `scroll-behavior: smooth` CSS rules removed in favor of Lenis engine control.
- [x] **Ergonomic Typography:** Monospace tabular numbers ensure sensor readings never jitter horizontally as values fluctuate.
- [x] **Optical Comfort:** Pure black (`#000000`) is avoided; deep obsidian (`#0B0F14`) prevents eye fatigue during 12-hour operator shifts.
- [x] **Accessibility:** All interactive selection elements maintain strict `aria-selected` / `aria-pressed` states and focus rings (`#00C2FF`).
