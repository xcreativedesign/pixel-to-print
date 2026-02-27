# Pixel to Print — Print Quality Calculator

**A free, open-source tool that tells you whether your image will print sharply — before you send it to press.**

🔗 **Live tool:** [xcreativedesign.github.io/pixel-to-print](https://xcreativedesign.github.io/pixel-to-print/)  
🌐 **Made by:** [XCreativeDesign](https://xcreativedesign.com) · [@xcreativedesig](https://x.com/xcreativedesig)

---

## What it does

Most print quality tools just divide pixels by inches and compare to a fixed 300 DPI threshold. That gives you a number — not an answer.

Pixel to Print uses **PPQS (Perceptual Print Quality Score)** — an algorithm that accounts for the three factors that actually determine whether a print looks sharp to a human viewer:

| Factor | What it means |
|--------|---------------|
| **Pixel density** | Your image's effective DPI at the chosen print size |
| **Viewing distance** | Minimum perceivable DPI scales with how far viewers stand from the print |
| **Medium absorption** | Canvas, fabric, and coated paper hold ink differently — each has a real-world DPI threshold |

The result is a **0–100 score** calibrated per medium — so a 150 DPI canvas correctly scores Excellent (as the industry standard says it should), and a 150 DPI photo print correctly scores lower because it falls below the 300 DPI standard for close-range viewing.

---

## Features

- **Upload any image** — JPEG, PNG, WebP, TIFF, HEIC. EXIF dimensions auto-detected.
- **50+ presets** — photo prints, canvas, sublimation mugs/shirts/metal, large format, billboards
- **Sweet Spot Finder** — shows the largest print size your image supports at each quality level
- **AI upscaling presets** — Basic interpolation, AI 2×, AI 4× with realistic quality retention factors
- **Dark / light mode** — saved to localStorage
- **Privacy first** — everything runs locally in your browser. Nothing is ever uploaded.
- **No account, no signup, no tracking**

---

## Algorithm — PPQS v2.1

```
Minimum perceivable DPI  =  3438 ÷ viewing distance (inches)
                             [ISO 8596 visual acuity constant]

Effective DPI  =  (pixel count × medium absorption factor) ÷ print size

Score  =  f(effectiveDPI, minimumPerceivableDPI, mediumThresholdMultiplier)
```

**Medium Absorption Factor (MAF)** values used:

| Medium | MAF | Reasoning |
|--------|-----|-----------|
| Coated photo paper | 1.00 | Maximum detail retention |
| Uncoated paper | 0.90 | ~10% dot gain |
| Metal / aluminum | 1.00 | Hard surface, no spread |
| Canvas | 0.80 | Fabric weave absorbs ink spread |
| Ceramic / glass | 0.85 | Glazed surface, slight spread |
| Polyester fabric | 0.75 | Weave absorbs significant detail |
| Vinyl | 0.82 | Slight ink spread on substrate |

**AI upscaling quality retention:**

| Method | Retention | Notes |
|--------|-----------|-------|
| Basic interpolation | 55% | Photoshop Bicubic — adds pixels, not detail |
| AI 2× | 88% | Topaz / Adobe Super Resolution |
| AI 4× | 78% | Diminishing returns, artifacts at extremes |

The algorithm is versioned. See [CHANGELOG](#changelog) for update history.

---

## Honest limitations

This tool gives you a **perceptual quality estimate** — not a print guarantee. Be aware of what it cannot tell you:

- **Compression artifacts** — a JPEG at 300 DPI can still look bad if heavily compressed
- **Color accuracy** — score is resolution-only; color management is a separate workflow
- **Image content** — a soft-focus portrait needs less DPI than sharp architectural detail
- **Printer hardware** — actual output varies by printer model, ink brand, paper batch
- **AI upscaling variance** — scores assume industry-average tool quality; Topaz ≠ free online upscaler
- **Subjective quality** — a 100/100 score means the resolution is strong, not that the print will satisfy every client

Use this tool to **catch problems before printing** — not as a final proof substitute.

---

## File structure

```
pixel-to-print/
├── index.html                  # Main calculator page
├── dpi-guide.html              # DPI vs PPI guide
├── sublimation-tips.html       # Sublimation DPI by material
├── print-size-chart.html       # Print size reference chart
├── privacy-policy.html         # Privacy policy
├── assets/
│   ├── css/
│   │   ├── style.css           # Main stylesheet (design tokens, all components)
│   │   ├── guide.css           # Shared guide/article page styles
│   │   └── size-chart.css      # Size chart page specific styles
│   ├── js/
│   │   ├── ppqs.js             # PPQS algorithm engine (v2.1)
│   │   ├── presets.js          # 50+ medium/size presets
│   │   └── ui.js               # UI controller, events, results rendering
│   └── img/                    # Static assets
└── README.md
```

---

## Tech stack

- **Pure HTML / CSS / JavaScript** — zero dependencies, zero build step
- **No frameworks** — no React, no Vue, no bundler
- **No backend** — fully static, hosted on GitHub Pages
- **FileReader API** — local image processing, never leaves the browser
- **EXIF.js** — optional EXIF dimension extraction

---

## Running locally

No build step needed.

```bash
git clone https://github.com/xcreativedesign/pixel-to-print.git
cd pixel-to-print

# Option 1: Python
python3 -m http.server 8000

# Option 2: Node
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8000` in your browser.

---

## Contributing

Contributions are welcome — especially:

- **Algorithm feedback** — if a score doesn't match your real-world result, open an issue with the image dimensions, print size, medium, and what the actual output looked like
- **New medium presets** — with verified DPI standards and viewing distance data
- **Translations** — the UI is English-only currently
- **Bug reports** — browser compatibility issues, edge cases in the calculator

Please open an issue before submitting a large PR so we can discuss the approach first.

---

## Changelog

### v2.1.0 — February 2026
- **Fixed:** AI upscaling logic — previously applied multiplier to effectiveDPI directly, producing impossible scores (50px image at AI 4× scored 100). Now applies multiplier to rawDPI with quality retention factor and hard cap at `medium.recommended_dpi × 1.1`
- **Fixed:** Canvas medium threshold — v2.0 used fixed ×2 denominator; v2.1 uses medium-aware `qualityThresholdMultiplier` derived from recommended DPI and typical viewing distance. Canvas 1500px at 10×8 now correctly scores 80 (Excellent) instead of 42 (Marginal)
- **Fixed:** Mobile nav — CSS `display:flex` was overriding HTML `hidden` attribute, causing nav to always show. Fixed with `[hidden] { display:none !important }` and `display:none` default on `.mobile-nav`
- **Added:** How-to-Use section, Use Cases, visible FAQ, Trust/Limitations section
- **Added:** 4 schema types on index.html — SoftwareApplication, WebPage, HowTo, FAQPage
- **Fixed:** WCAG AA contrast — `--text-muted` updated from `#8896A8` (3.5:1) to `#6B7280` (4.6:1)
---

## Privacy

Pixel to Print collects nothing. No images, no data, no analytics, no cookies (except your theme preference in localStorage). See [privacy-policy.html](privacy-policy.html) for the full explanation and how to verify it yourself.

---

## License

MIT License — free to use, modify, and distribute. Attribution appreciated but not required.

---

*Built by [XCreativeDesign](https://xcreativedesign.com) · Feedback via [GitHub Issues](https://github.com/xcreativedesign/pixel-to-print/issues) or [X / Twitter](https://x.com/xcreativedesig)*
