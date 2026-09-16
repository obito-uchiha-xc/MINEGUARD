# MINEGUARD — Master Frontend Design Specification

**System Name:** MINEGUARD  
**Subtitle:** AI-Enabled Real-Time Mine Subsidence Monitoring & Early Warning System  
**Tagline:** *Sense. Predict. Protect.*

---

## 1. Design Philosophy & Tone

The interface serves mining engineers, geotechnical safety officers, and control-room operators. It must evoke uncompromising reliability, high data density, and clear operational hierarchy.

- **Atmosphere:** Dark industrial control-room interface.
- **Aesthetic Priorities:** Clean, precise, safety-focused, minimal, data-centric.
- **Strictly Prohibited:**
  - Gaming/cyberpunk UI aesthetics or neon glow effects
  - Excessive glassmorphism or distracting decorative gradients
  - Overly rounded pill buttons or cartoonish iconography
  - Unjustified predictive claims (e.g. "Collapse in 10 minutes")

---

## 2. Global Color System & Design Tokens

### Base Neutral Palette
| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-bg` | `#070D14` | Global root viewport background |
| `--color-bg-alt` | `#0B111A` | Secondary surface / page backdrop |
| `--color-surface` | `#101923` | Default card & panel background |
| `--color-surface-hover` | `#121D28` | Hover state for interactive cards |
| `--color-surface-elevated` | `#172330` | Modals, flyouts, tooltips, active rows |
| `--color-border` | `#263545` | Standard structural borders & dividers |
| `--color-border-subtle` | `#1B2735` | Subdued borders inside cards |

### Text Tokens
| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-text-primary` | `#F5F7FA` | Primary headings, titles, active telemetry numbers |
| `--color-text-secondary` | `#AAB6C4` | Field labels, secondary descriptions, units |
| `--color-text-muted` | `#718096` | Timestamps, metadata, disabled captions |

### Safety & Operational State Colors
| State | Primary Hex | Muted Background (12% alpha) | Border (30% alpha) | Semantic Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **NORMAL** | `#22C55E` | `rgba(34, 197, 94, 0.12)` | `rgba(34, 197, 94, 0.30)` | Safe operating baseline; normal rates |
| **WARNING** | `#FACC15` | `rgba(250, 204, 21, 0.12)` | `rgba(250, 204, 21, 0.30)` | Minor rate acceleration or threshold notice |
| **HIGH RISK** | `#F97316` | `rgba(249, 115, 22, 0.12)` | `rgba(249, 115, 22, 0.30)` | Multi-parameter correlation of instability |
| **CRITICAL** | `#EF4444` | `rgba(239, 68, 68, 0.12)` | `rgba(239, 68, 68, 0.30)` | Severe deformation / emergency threshold |
| **OFFLINE** | `#E5E7EB` | `rgba(229, 231, 235, 0.12)` | `rgba(229, 231, 235, 0.30)` | Disconnected / battery depletion / unpolled |
| **INFO / ACCENT**| `#3B82F6` | `rgba(59, 130, 246, 0.12)` | `rgba(59, 130, 246, 0.30)` | Primary actions, gateway telemetry, technical accent |

---

## 3. Typography Scale

- **Primary Typeface:** `Inter`, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
- **Monospace / Numerical Typeface:** `JetBrains Mono`, 'Roboto Mono', 'SF Mono', Consolas, monospace (used for sensor readings, coordinate data, and hardware IDs).

| Role | Font Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `26px` (1.625rem) | 600 (Semibold) | 1.25 | -0.02em |
| **Section Heading** | `18px` (1.125rem) | 600 (Semibold) | 1.35 | -0.01em |
| **Subheading / Card Title** | `15px` (0.9375rem) | 600 (Semibold) | 1.4 | 0 |
| **Metric Value** | `30px` (1.875rem) | 700 (Bold) | 1.1 | -0.02em (Tabular nums) |
| **Metric Label** | `13px` (0.8125rem) | 500 (Medium) | 1.4 | 0.02em (Upper/Caps) |
| **Body Text** | `14px` (0.875rem) | 400 (Regular) | 1.5 | 0 |
| **Metadata & Subtext** | `12px` (0.75rem) | 400 (Regular) | 1.4 | 0.01em |

---

## 4. Spacing Scale

Based on a 4px modular scale:
- `--space-1`: `4px`
- `--space-2`: `8px`
- `--space-3`: `12px`
- `--space-4`: `16px`
- `--space-5`: `20px`
- `--space-6`: `24px`
- `--space-8`: `32px`
- `--space-10`: `40px`
- `--space-12`: `48px`

---

## 5. Border Radius Standards

Restrained, industrial rounding:
- **Cards & Panels:** `12px`
- **Buttons:** `8px`
- **Inputs & Selects:** `8px`
- **Status Badges & Chips:** `6px`
- **Modals / Dialogs:** `14px`

---

## 6. Responsible Safety Language Guidelines

To maintain scientific integrity and prevent operator panic or liability:
- **DO USE:**
  - *"Ground Instability Risk"*
  - *"Progressive Subsidence Trend"*
  - *"Elevated Geotechnical Anomaly"*
  - *"Early Warning Level 2 Triggered"*
  - *"Multi-Parameter Correlation Score: 84/100"*
- **DO NOT USE:**
  - *"Mine collapse in 12 minutes"*
  - *"100% Certain Failure Predicted"*
  - *"Cave-in guaranteed"*

---

## 7. Component Foundation Specifications

- **UI Primitives:** `Card`, `Button`, `Badge`, `StatusIndicator`, `IconButton`, `Input`, `Select`, `Divider`, `Tooltip`, `Progress`.
- **Feedback Elements:** `LoadingSkeleton`, `EmptyState`, `ErrorState`, `AlertBanner`.
- **Layout System:** `PageContainer`, `Section`, `ResponsiveGrid`, `AppHeader`.
- **Hardware Telemetry Readiness:** Schema ready for ESP32, LoRa SX1278, MPU6500 (Tilt/Vibe), SW-1801P (Shock), VL53L0X (Displacement/Gap), Soil Moisture, MQ-2 (Gas), and RSSI/Battery.
