/**
 * Smart Presets — Pixel to Print
 * XCreativeDesign | MIT License
 *
 * Preset data for common print sizes and sublimation products.
 * Each preset includes physical dimensions + recommended medium + DPI.
 */

'use strict';

const PRINT_PRESETS = {

  // ── Photo Prints ──────────────────────────────────────────
  photo: {
    label: 'Photo Prints',
    icon: '📷',
    items: [
      { label: '4×6 in',       w: 4,    h: 6,    medium: 'coated_paper', dpi: 300 },
      { label: '5×7 in',       w: 5,    h: 7,    medium: 'coated_paper', dpi: 300 },
      { label: '8×10 in',      w: 8,    h: 10,   medium: 'coated_paper', dpi: 300 },
      { label: '11×14 in',     w: 11,   h: 14,   medium: 'coated_paper', dpi: 300 },
      { label: '16×20 in',     w: 16,   h: 20,   medium: 'coated_paper', dpi: 300 },
      { label: '20×30 in',     w: 20,   h: 30,   medium: 'coated_paper', dpi: 240 },
    ],
  },

  // ── Standard Paper Sizes ──────────────────────────────────
  paper: {
    label: 'Standard Paper',
    icon: '📄',
    items: [
      { label: 'A6 (105×148mm)',  w: 4.13,  h: 5.83,  medium: 'coated_paper', dpi: 300 },
      { label: 'A5 (148×210mm)',  w: 5.83,  h: 8.27,  medium: 'coated_paper', dpi: 300 },
      { label: 'A4 (210×297mm)',  w: 8.27,  h: 11.69, medium: 'coated_paper', dpi: 300 },
      { label: 'A3 (297×420mm)',  w: 11.69, h: 16.54, medium: 'coated_paper', dpi: 300 },
      { label: 'A2 (420×594mm)',  w: 16.54, h: 23.39, medium: 'coated_paper', dpi: 200 },
      { label: 'Letter (8.5×11)', w: 8.5,   h: 11,    medium: 'coated_paper', dpi: 300 },
      { label: 'Legal (8.5×14)',  w: 8.5,   h: 14,    medium: 'coated_paper', dpi: 300 },
      { label: 'Tabloid (11×17)', w: 11,    h: 17,    medium: 'coated_paper', dpi: 300 },
    ],
  },

  // ── Canvas Prints ─────────────────────────────────────────
  canvas: {
    label: 'Canvas Prints',
    icon: '🖼️',
    items: [
      { label: '8×8 in',    w: 8,  h: 8,  medium: 'canvas', dpi: 150 },
      { label: '12×12 in',  w: 12, h: 12, medium: 'canvas', dpi: 150 },
      { label: '16×16 in',  w: 16, h: 16, medium: 'canvas', dpi: 150 },
      { label: '12×16 in',  w: 12, h: 16, medium: 'canvas', dpi: 150 },
      { label: '16×20 in',  w: 16, h: 20, medium: 'canvas', dpi: 150 },
      { label: '20×24 in',  w: 20, h: 24, medium: 'canvas', dpi: 150 },
      { label: '24×36 in',  w: 24, h: 36, medium: 'canvas', dpi: 120 },
      { label: '30×40 in',  w: 30, h: 40, medium: 'canvas', dpi: 100 },
    ],
  },

  // ── Sublimation Products ──────────────────────────────────
  sublimation: {
    label: 'Sublimation',
    icon: '☕',
    items: [
      { label: '11oz Mug Wrap',       w: 8.5,  h: 3.7,  medium: 'ceramic',          dpi: 200 },
      { label: '15oz Mug Wrap',       w: 9.5,  h: 4.0,  medium: 'ceramic',          dpi: 200 },
      { label: 'T-Shirt Front (A4)',   w: 8.27, h: 11.69,medium: 'polyester_fabric', dpi: 150 },
      { label: 'T-Shirt Full Front',   w: 12,   h: 16,   medium: 'polyester_fabric', dpi: 150 },
      { label: 'Phone Case (iPhone)',  w: 2.65, h: 5.3,  medium: 'phone_case',       dpi: 300 },
      { label: 'Mouse Pad (9×7in)',    w: 9,    h: 7,    medium: 'polyester_fabric', dpi: 150 },
      { label: 'Tote Bag Front',       w: 13,   h: 15,   medium: 'polyester_fabric', dpi: 150 },
      { label: 'Metal Panel 8×10',     w: 8,    h: 10,   medium: 'metal',            dpi: 300 },
      { label: 'Ceramic Tile 4×4',     w: 4,    h: 4,    medium: 'ceramic',          dpi: 200 },
      { label: 'Pillow Cover 18×18',   w: 18,   h: 18,   medium: 'polyester_fabric', dpi: 150 },
    ],
  },

  // ── Large Format / Signage ────────────────────────────────
  signage: {
    label: 'Signage & Banners',
    icon: '🪧',
    items: [
      { label: 'Roll-Up Banner 33×79',  w: 33,  h: 79,  medium: 'banner_vinyl', dpi: 100 },
      { label: 'A1 Poster (594×841mm)', w: 23.4,h: 33.1,medium: 'uncoated_paper',dpi: 150 },
      { label: 'A0 Poster (841×1189mm)',w: 33.1,h: 46.8,medium: 'uncoated_paper',dpi: 100 },
      { label: 'Vinyl Banner 2×4ft',    w: 24,  h: 48,  medium: 'banner_vinyl', dpi: 100 },
      { label: 'Vinyl Banner 3×6ft',    w: 36,  h: 72,  medium: 'banner_vinyl', dpi: 72  },
      { label: 'Step & Repeat 8×8ft',   w: 96,  h: 96,  medium: 'banner_vinyl', dpi: 72  },
      { label: 'Billboard 14×48ft',     w: 168, h: 576, medium: 'billboard',    dpi: 25  },
    ],
  },

  // ── Business & Marketing ──────────────────────────────────
  business: {
    label: 'Business & Marketing',
    icon: '💼',
    items: [
      { label: 'Business Card',         w: 3.5,  h: 2,    medium: 'coated_paper', dpi: 300 },
      { label: 'Postcard 4×6',          w: 4,    h: 6,    medium: 'coated_paper', dpi: 300 },
      { label: 'Flyer A5',              w: 5.83, h: 8.27, medium: 'uncoated_paper',dpi: 300 },
      { label: 'Brochure Tri-fold A4',  w: 8.27, h: 11.69,medium: 'coated_paper', dpi: 300 },
      { label: 'Rack Card 4×9',         w: 4,    h: 9,    medium: 'coated_paper', dpi: 300 },
    ],
  },

  // ── Social Media to Print ─────────────────────────────────
  social: {
    label: 'Social → Print',
    icon: '📱',
    items: [
      { label: 'Instagram Square 1080px',   w: 3.6,  h: 3.6,  medium: 'coated_paper', dpi: 300 },
      { label: 'Instagram Portrait 1080px', w: 3.6,  h: 4.5,  medium: 'coated_paper', dpi: 300 },
      { label: 'Facebook Cover',            w: 6.9,  h: 2.56, medium: 'coated_paper', dpi: 300 },
      { label: 'YouTube Thumbnail',         w: 5.33, h: 3,    medium: 'coated_paper', dpi: 300 },
      { label: 'Midjourney Default 1024px', w: 3.41, h: 3.41, medium: 'coated_paper', dpi: 300 },
      { label: 'Midjourney 1792×1024',      w: 5.97, h: 3.41, medium: 'coated_paper', dpi: 300 },
    ],
  },
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRINT_PRESETS;
}
if (typeof window !== 'undefined') {
  window.PRINT_PRESETS = PRINT_PRESETS;
}
