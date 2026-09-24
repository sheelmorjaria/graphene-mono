// GrapheneOS support timeline for devices we sell.
// GrapheneOS provides updates for the full vendor support window of each
// device (5 years from launch for Pixel 7-era hardware, 7 years from
// Pixel 8 onwards).

// Keyed by the bare baseModel values used in the catalog ("7", "7 Pro",
// "Fold", "9 Pro Fold", ...) — getSupportInfo also accepts "Pixel 7 Pro"
// style names for use outside the catalog.
export const DEVICE_SUPPORT_TIMELINE = {
  '7': { launch: 2022, supportEnd: 'October 2027' },
  '7 Pro': { launch: 2022, supportEnd: 'October 2027' },
  '7a': { launch: 2023, supportEnd: 'May 2028' },

  '8': { launch: 2023, supportEnd: 'October 2030' },
  '8 Pro': { launch: 2023, supportEnd: 'October 2030' },
  '8a': { launch: 2024, supportEnd: 'May 2031' },

  '9': { launch: 2024, supportEnd: 'August 2031' },
  '9 Pro': { launch: 2024, supportEnd: 'August 2031' },
  '9 Pro XL': { launch: 2024, supportEnd: 'August 2031' },
  '9 Pro Fold': { launch: 2024, supportEnd: 'August 2031' },
  '9a': { launch: 2025, supportEnd: 'August 2031' },

  '10': { launch: 2025, supportEnd: 'October 2032' },
  '10 Pro': { launch: 2025, supportEnd: 'October 2032' },
  '10 Pro XL': { launch: 2025, supportEnd: 'October 2032' },
  '10 Pro Fold': { launch: 2025, supportEnd: 'October 2032' },
  '10a': { launch: 2026, supportEnd: 'October 2032' },

  // Original Fold (2023, 5-year vendor window) — not in the owner's table;
  // confirm the wording if this needs adjusting.
  'Fold': { launch: 2023, supportEnd: 'June 2028' }
};

// Accepts a bare baseModel ("9 Pro XL") or a full name ("Pixel 9 Pro XL").
// Returns { launch, supportEnd } or null when unknown.
export const getSupportInfo = (model) => {
  if (!model) return null;
  const bare = String(model).replace(/^Pixel\s+/i, '').trim();
  return DEVICE_SUPPORT_TIMELINE[bare] || null;
};
