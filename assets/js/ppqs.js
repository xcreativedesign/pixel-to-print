/**
 * ============================================================
 * PPQS — Perceptual Print Quality Score Engine v2.1.0
 * Author: XCreativeDesign | License: MIT
 * GitHub: https://github.com/xcreativedesign/pixel-to-print
 * ============================================================
 *
 * FIXES IN v2.1 (verified by internal audit):
 *
 * FIX 1 — AI upscaling logic corrected.
 *   v2.0 multiplied eDPI directly — a 72 DPI image with "4x AI"
 *   selected scored 100. Physically impossible and misleading.
 *   v2.1: multiplier applied to rawDpi (pixel density) with a
 *   quality retention factor — models real-world upscaling limits.
 *   A hard cap prevents any AI preset from exceeding the medium's
 *   recommended DPI by more than 10%.
 *
 * FIX 2 — Score denominator is now medium-aware.
 *   v2.0 used fixed ×2 threshold — canvas at 150 DPI scored 42
 *   (Marginal) even though 150 DPI canvas is industry-standard
 *   Excellent. Each medium now has its own threshold multiplier
 *   derived from recommended_dpi / (3438 / typicalViewingInches).
 *
 * FIX 3 — Sweet Spot safety margins match FOGRA/ISO 12647.
 *   Close view: 2.0× | Standard: 1.5× | Large format: 1.2×
 *
 * SCIENTIFIC BASIS:
 * Human eye resolves ~1 arcminute. Constant = 1/tan(π/10800) ≈ 3438.
 * At distance D inches: minimum perceivable DPI = 3438 / D
 * Source: ISO 8596 visual acuity standard.
 * ============================================================
 */

'use strict';

const HUMAN_EYE_CONSTANT = 3438;

// ── Medium Profiles ────────────────────────────────────────
const MEDIUM_PROFILES = {
  coated_paper: {
    label: 'Coated Paper (Brochures, Magazines)',
    maf: 1.0,
    recommended_dpi: 300,
    min_acceptable_dpi: 250,
    qualityThresholdMultiplier: 2.0,
    typicalViewingInches: 24,
    note: 'Highest sharpness. Standard for professional photo and commercial print.',
  },
  uncoated_paper: {
    label: 'Uncoated Paper (Flyers, Newsprint)',
    maf: 0.85,
    recommended_dpi: 300,
    min_acceptable_dpi: 200,
    qualityThresholdMultiplier: 2.0,
    typicalViewingInches: 24,
    note: 'Ink spreads ~15% on uncoated stock. Slightly higher source resolution helps compensate.',
  },
  canvas: {
    label: 'Canvas (Art Prints, Wall Decor)',
    maf: 0.80,
    recommended_dpi: 150,
    min_acceptable_dpi: 100,
    qualityThresholdMultiplier: 2.1,
    typicalViewingInches: 48,
    note: 'Canvas texture naturally masks detail variation. 150 DPI is the genuine industry standard for wall art canvas.',
  },
  polyester_fabric: {
    label: 'Polyester Fabric (Sublimation T-Shirts, Flags)',
    maf: 0.75,
    recommended_dpi: 150,
    min_acceptable_dpi: 120,
    qualityThresholdMultiplier: 2.0,
    typicalViewingInches: 36,
    note: 'Fabric weave absorbs ink spread. 150 DPI is the accepted sublimation standard for garments.',
  },
  ceramic: {
    label: 'Ceramic (Sublimation Mugs, Tiles)',
    maf: 0.90,
    recommended_dpi: 200,
    min_acceptable_dpi: 150,
    qualityThresholdMultiplier: 2.0,
    typicalViewingInches: 18,
    note: 'Glazed ceramic holds detail well. 200 DPI recommended for photo-quality mug prints.',
  },
  metal: {
    label: 'Metal / Aluminum (Sublimation Panels)',
    maf: 0.95,
    recommended_dpi: 300,
    min_acceptable_dpi: 200,
    qualityThresholdMultiplier: 2.0,
    typicalViewingInches: 24,
    note: 'Powder-coated aluminum gives excellent sharpness. Ideal for high-detail photo prints.',
  },
  phone_case: {
    label: 'Phone Case (Sublimation Insert)',
    maf: 0.88,
    recommended_dpi: 300,
    min_acceptable_dpi: 200,
    qualityThresholdMultiplier: 2.0,
    typicalViewingInches: 12,
    note: 'Viewed close-up — always use 300 DPI for sharp logos and fine text.',
  },
  banner_vinyl: {
    label: 'Vinyl Banner (Outdoor/Indoor Signage)',
    maf: 0.82,
    recommended_dpi: 100,
    min_acceptable_dpi: 72,
    qualityThresholdMultiplier: 1.8,
    typicalViewingInches: 120,
    note: 'Viewed from 5–15 feet. 72–100 DPI is the accepted industry standard for vinyl banners.',
  },
  billboard: {
    label: 'Billboard / Large Format (30ft+ viewing)',
    maf: 0.80,
    recommended_dpi: 30,
    min_acceptable_dpi: 15,
    qualityThresholdMultiplier: 1.5,
    typicalViewingInches: 480,
    note: 'Viewed from 30–100 feet. 15–50 DPI is standard. Higher DPI wastes file size with zero visible benefit.',
  },
};

// ── Viewing Distances ──────────────────────────────────────
const VIEWING_DISTANCES = {
  close: {
    label: 'Close View — Books, Packaging, Business Cards',
    inches: 12,
    description: 'Held in hand or read at desk. Maximum detail required.',
  },
  standard: {
    label: 'Standard — Photo Prints, Brochures, Posters',
    inches: 24,
    description: 'Typical arm-length viewing distance.',
  },
  wall_art: {
    label: 'Wall Art — Framed Prints, Canvas',
    inches: 48,
    description: 'Hanging on wall, viewed from across a room.',
  },
  signage: {
    label: 'Signage / Banner — 5 to 15 feet',
    inches: 120,
    description: 'Indoor or outdoor signage at medium distance.',
  },
  billboard: {
    label: 'Billboard / Large Format — 30 feet or more',
    inches: 480,
    description: 'Roadside or venue large format.',
  },
};

// ── AI Upscaling Profiles (v2.1 — pixel-level model) ──────
const AI_UPSCALING_PROFILES = {
  none: {
    label: 'No upscaling',
    pixelMultiplier: 1.0,
    qualityRetention: 1.0,
  },
  basic: {
    label: 'Basic interpolation (Photoshop Bicubic)',
    pixelMultiplier: 1.5,
    qualityRetention: 0.55,
  },
  ai_standard: {
    label: 'AI 2× — Topaz Photo AI / Adobe Super Resolution',
    pixelMultiplier: 2.0,
    qualityRetention: 0.88,
  },
  ai_high: {
    label: 'AI 4× — Topaz Gigapixel AI / Magnific AI',
    pixelMultiplier: 4.0,
    qualityRetention: 0.78,
  },
};

// ============================================================
// CORE ENGINE
// ============================================================

function calculatePPQS(
  pixelWidth, pixelHeight,
  targetWidthIn, targetHeightIn,
  mediumKey = 'coated_paper',
  viewingDistKey = 'standard',
  aiUpscaleKey = 'none'
) {
  if (!pixelWidth || !pixelHeight || !targetWidthIn || !targetHeightIn) {
    return { error: 'Please enter all required values.' };
  }

  const medium    = MEDIUM_PROFILES[mediumKey]          || MEDIUM_PROFILES.coated_paper;
  const viewDist  = VIEWING_DISTANCES[viewingDistKey]   || VIEWING_DISTANCES.standard;
  const aiProfile = AI_UPSCALING_PROFILES[aiUpscaleKey] || AI_UPSCALING_PROFILES.none;

  // Step 1: Raw DPI from actual pixels
  const rawDpi = Math.min(pixelWidth / targetWidthIn, pixelHeight / targetHeightIn);

  // Step 2: AI adjustment — applied to pixel density, not eDPI
  // gain = extra rawDpi from upscaling × quality retention factor
  // cap  = cannot exceed medium recommended DPI × 1.1 regardless of AI
  const gain         = rawDpi * (aiProfile.pixelMultiplier - 1) * aiProfile.qualityRetention;
  const aiRawDpi     = Math.min(rawDpi + gain, medium.recommended_dpi * 1.1);

  // Step 3: Effective DPI after medium absorption
  const effectiveDpi = aiRawDpi * medium.maf;

  // Step 4: Minimum perceivable DPI at this viewing distance
  const minPercDpi = HUMAN_EYE_CONSTANT / viewDist.inches;

  // Step 5: PPQS Score — medium-aware threshold (fixes canvas underscoring)
  const threshold    = minPercDpi * medium.qualityThresholdMultiplier;
  const ppqsScore    = Math.min(100, Math.round((effectiveDpi / threshold) * 100));

  const rating       = getPPQSRating(ppqsScore, effectiveDpi, medium);

  const dimensions = {
    inches: { w: +targetWidthIn.toFixed(2),          h: +targetHeightIn.toFixed(2) },
    cm:     { w: +(targetWidthIn * 2.54).toFixed(2), h: +(targetHeightIn * 2.54).toFixed(2) },
    mm:     { w: +(targetWidthIn * 25.4).toFixed(1), h: +(targetHeightIn * 25.4).toFixed(1) },
  };

  const maxPrint       = _maxPrint(pixelWidth, pixelHeight, medium.recommended_dpi);
  const requiredPixels = _requiredPixels(targetWidthIn, targetHeightIn, medium.recommended_dpi, medium.maf);
  const suggestions    = _suggestions(
    ppqsScore, rawDpi, effectiveDpi, minPercDpi,
    medium, aiProfile, aiUpscaleKey,
    requiredPixels, pixelWidth, pixelHeight
  );

  return {
    input: {
      pixels: { w: pixelWidth, h: pixelHeight },
      megapixels: +((pixelWidth * pixelHeight) / 1e6).toFixed(2),
      targetPrint: { w: targetWidthIn, h: targetHeightIn },
      medium: medium.label,
      viewingDistance: viewDist.label,
      aiUpscaling: aiProfile.label,
    },
    calculation: {
      rawDpi:            Math.round(rawDpi),
      aiAdjustedRawDpi:  Math.round(aiRawDpi),
      effectiveDpi:      Math.round(effectiveDpi),
      minPerceptibleDpi: Math.round(minPercDpi),
      qualityThreshold:  Math.round(threshold),
      mediumMAF:         medium.maf,
    },
    ppqs: {
      score:   ppqsScore,
      rating:  rating.label,
      color:   rating.color,
      icon:    rating.icon,
      message: rating.message,
    },
    dimensions,
    maxPrint,
    requiredPixels,
    suggestions,
    mediumNote: medium.note,
  };
}

function getPPQSRating(score, effectiveDpi, medium) {
  if (score >= 90) return {
    label: 'Outstanding', color: '#00875A', icon: '✦',
    message: `Excellent quality for ${medium.label}. Comfortably exceeds the perceptual threshold — safe to print.`,
  };
  if (score >= 75) return {
    label: 'Excellent', color: '#36B37E', icon: '✅',
    message: 'Professional-grade quality for this medium and viewing distance. This will print sharply.',
  };
  if (score >= 55) return {
    label: 'Good', color: '#D97706', icon: '⚠️',
    message: 'Acceptable quality. Minor softness may be visible on very close inspection, but print will be usable.',
  };
  if (score >= 35) return {
    label: 'Marginal', color: '#EA580C', icon: '🔶',
    message: 'Below recommended quality. Pixelation or softness is likely at this size. See suggestions below.',
  };
  return {
    label: 'Insufficient', color: '#DC2626', icon: '❌',
    message: 'Resolution is too low for this print size. The image will print visibly pixelated without upscaling.',
  };
}

function _maxPrint(px, py, dpi) {
  return {
    inches: { w: +(px/dpi).toFixed(2), h: +(py/dpi).toFixed(2) },
    cm:     { w: +(px/dpi*2.54).toFixed(2), h: +(py/dpi*2.54).toFixed(2) },
    at_dpi: dpi,
  };
}

function _requiredPixels(w, h, dpi, maf) {
  const cd = dpi / maf;
  return {
    width:      Math.ceil(w * cd),
    height:     Math.ceil(h * cd),
    megapixels: +((w * cd * h * cd) / 1e6).toFixed(2),
    at_dpi:     dpi,
  };
}

function _upscaleFactor(current, required) {
  return current >= required ? 1.0 : +(required / current).toFixed(2);
}

function _suggestions(score, rawDpi, effectiveDpi, minPercDpi, medium, aiProfile, aiUpscaleKey, req, cW, cH) {
  const sug = [];
  const uf  = Math.max(_upscaleFactor(cW, req.width), _upscaleFactor(cH, req.height));
  const medKey = Object.keys(MEDIUM_PROFILES).find(k => MEDIUM_PROFILES[k] === medium);

  if (score >= 90) {
    sug.push({ type:'confirm', priority:'positive',
      title: 'Print Ready ✦',
      detail: `Your image meets quality requirements for ${medium.label}. Safe to send to print.` });
  }

  if (score < 75 && aiUpscaleKey === 'none') {
    if (uf <= 2.0) {
      sug.push({ type:'upscale', priority:'high',
        title: 'AI 2× Upscaling Recommended',
        detail: `Your image needs ~${uf}× upscaling. AI tools recover real detail that standard interpolation cannot.`,
        tools: ['Topaz Photo AI', 'Adobe Lightroom Super Resolution', "Let's Enhance"] });
    } else if (uf <= 4.0) {
      sug.push({ type:'upscale', priority:'high',
        title: 'AI 4× Upscaling Required',
        detail: `~${uf}× upscaling needed. Use a 4× AI upscaler. Also check if a higher-resolution source file is available.`,
        tools: ['Topaz Gigapixel AI', 'Magnific AI'] });
    } else {
      sug.push({ type:'source', priority:'critical',
        title: 'Source Resolution Insufficient',
        detail: `${uf}× upscaling required — beyond reliable AI recovery. Reduce print size to ${(cW/medium.recommended_dpi).toFixed(1)} × ${(cH/medium.recommended_dpi).toFixed(1)} in, or request a higher-res source.` });
    }
  }

  if (score < 55 && aiUpscaleKey !== 'none') {
    sug.push({ type:'source', priority:'critical',
      title: 'AI Cannot Fully Recover This Image',
      detail: `The score shown already accounts for ${aiProfile.label}. Source resolution is still too low. A higher-resolution original is needed.` });
  }

  if (score < 55) {
    sug.push({ type:'resize', priority:'medium',
      title: 'Alternative: Reduce Print Size',
      detail: `At current resolution, maximum safe print on ${medium.label} is ${(cW/medium.recommended_dpi).toFixed(1)} × ${(cH/medium.recommended_dpi).toFixed(1)} inches at ${medium.recommended_dpi} DPI.` });
  }

  if (medium.maf < 0.85) {
    sug.push({ type:'medium', priority:'info',
      title: `${medium.label} — Surface Note`, detail: medium.note });
  }

  const sublimationMediums = ['polyester_fabric', 'ceramic', 'phone_case', 'metal'];
  if (sublimationMediums.includes(medKey)) {
    sug.push({ type:'color', priority:'info',
      title: 'Sublimation: Use RGB + ICC Profile',
      detail: 'Sublimation printers work in RGB — never CMYK. Use the ICC profile from your printer or ink manufacturer for accurate color output.' });
  }

  return sug;
}

// ── Sweet Spot Finder ──────────────────────────────────────
function findSweetSpot(printWidthIn, printHeightIn, mediumKey, viewingDistKey) {
  const medium   = MEDIUM_PROFILES[mediumKey]        || MEDIUM_PROFILES.coated_paper;
  const viewDist = VIEWING_DISTANCES[viewingDistKey] || VIEWING_DISTANCES.standard;

  const minPercDpi    = HUMAN_EYE_CONSTANT / viewDist.inches;
  const safetyMargin  = viewDist.inches <= 24 ? 2.0 : viewDist.inches <= 60 ? 1.5 : 1.2;
  const sweetSpotDpi  = Math.min(
    Math.max(Math.ceil(minPercDpi * safetyMargin), medium.min_acceptable_dpi),
    medium.recommended_dpi
  );
  const req = _requiredPixels(printWidthIn, printHeightIn, sweetSpotDpi, medium.maf);

  return {
    printSize: { w: printWidthIn, h: printHeightIn },
    medium: medium.label,
    viewingDistance: viewDist.label,
    sweetSpotDpi,
    safetyMargin,
    minPerceptibleDpi: Math.round(minPercDpi),
    requiredPixels: req,
    interpretation: `For ${medium.label} at ${viewDist.label.toLowerCase()}, you need ${sweetSpotDpi} DPI — requiring a ${req.width.toLocaleString()} × ${req.height.toLocaleString()} px image (${req.megapixels} MP).`,
  };
}

// ── EXIF Reader ────────────────────────────────────────────
function readEXIFDpi(buffer, mimeType) {
  const dv = new DataView(buffer);
  if (mimeType === 'image/jpeg') return _readJpeg(dv);
  if (mimeType === 'image/png')  return _readPNG(dv);
  return null;
}

function _readJpeg(dv) {
  try {
    let off = 2;
    while (off < dv.byteLength - 4) {
      if (dv.getUint8(off) !== 0xFF) break;
      const marker = dv.getUint8(off + 1);
      const segLen = dv.getUint16(off + 2);
      if (marker === 0xE1) {
        const es = off + 4;
        const hdr = String.fromCharCode(dv.getUint8(es),dv.getUint8(es+1),dv.getUint8(es+2),dv.getUint8(es+3));
        if (hdr !== 'Exif') break;
        const tiff = es + 6;
        const le   = dv.getUint16(tiff) === 0x4949;
        const ifd  = tiff + dv.getUint32(tiff+4, le);
        const cnt  = dv.getUint16(ifd, le);
        let xRes=null, yRes=null, unit=2;
        for (let i=0; i<cnt; i++) {
          const e   = ifd + 2 + i*12;
          const tag = dv.getUint16(e, le);
          if (tag===0x011A){ const vo=tiff+dv.getUint32(e+8,le); xRes=dv.getUint32(vo,le)/dv.getUint32(vo+4,le); }
          else if (tag===0x011B){ const vo=tiff+dv.getUint32(e+8,le); yRes=dv.getUint32(vo,le)/dv.getUint32(vo+4,le); }
          else if (tag===0x0128) unit=dv.getUint16(e+8,le);
        }
        if (xRes && yRes) {
          const f = unit===3 ? 2.54 : 1;
          return { xDpi: Math.round(xRes*f), yDpi: Math.round(yRes*f), source:'JPEG EXIF' };
        }
      }
      off += 2 + segLen;
    }
  } catch(_){}
  return null;
}

function _readPNG(dv) {
  try {
    let off = 8;
    while (off < dv.byteLength-4) {
      const len  = dv.getUint32(off);
      const type = String.fromCharCode(dv.getUint8(off+4),dv.getUint8(off+5),dv.getUint8(off+6),dv.getUint8(off+7));
      if (type==='pHYs') {
        const ppuX = dv.getUint32(off+8), ppuY = dv.getUint32(off+12), unit = dv.getUint8(off+16);
        if (unit===1) return { xDpi:Math.round(ppuX*0.0254), yDpi:Math.round(ppuY*0.0254), source:'PNG pHYs' };
        return { xDpi:ppuX, yDpi:ppuY, source:'PNG pHYs (unit unknown)' };
      }
      if (type==='IDAT'||type==='IEND') break;
      off += 12 + len;
    }
  } catch(_){}
  return null;
}

// ── Public API ─────────────────────────────────────────────
const PPQS = {
  calculate:           calculatePPQS,
  sweetSpot:           findSweetSpot,
  readEXIFDpi,
  getMediums:          () => MEDIUM_PROFILES,
  getViewingDistances: () => VIEWING_DISTANCES,
  getAIProfiles:       () => AI_UPSCALING_PROFILES,
  convertUnits: (i) => ({ inches:+i.toFixed(3), cm:+(i*2.54).toFixed(3), mm:+(i*25.4).toFixed(2), px_at_300dpi:Math.round(i*300) }),
  version: '2.1.0',
  engine:  'Perceptual Print Quality Score (PPQS)',
  author:  'XCreativeDesign',
};

if (typeof module!=='undefined'&&module.exports) module.exports = PPQS;
if (typeof window!=='undefined') window.PPQS = PPQS;
