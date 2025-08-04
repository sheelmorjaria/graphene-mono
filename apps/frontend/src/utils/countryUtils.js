// Map of ISO country codes to country names
export const COUNTRY_MAP = {
  'GB': 'United Kingdom',
  'US': 'United States',
  'CA': 'Canada',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'IE': 'Ireland',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'PT': 'Portugal',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'GR': 'Greece',
  'JP': 'Japan',
  'SG': 'Singapore',
  'HK': 'Hong Kong',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'IL': 'Israel',
  'AE': 'United Arab Emirates',
  'ZA': 'South Africa'
};

// Convert country code to name
export const getCountryName = (code) => {
  return COUNTRY_MAP[code] || code;
};

// Convert country name to code (for backward compatibility)
export const getCountryCode = (name) => {
  const entry = Object.entries(COUNTRY_MAP).find(([_, countryName]) => countryName === name);
  return entry ? entry[0] : name;
};