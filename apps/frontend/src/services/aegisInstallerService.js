const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Aegis web installer service — licence-link parsing and validation, plus
 * the APK stream URL handed to the ADB installer.
 */

// Accepts a bare token, the emailed download URL, or the installer deep
// link — anything containing (or consisting of) the token.
export const parseLicenceToken = (input) => {
  if (!input) return null;
  const value = String(input).trim();
  const bare = value.match(/^[A-Za-z0-9_-]{16,}$/);
  if (bare) return value;
  const fromUrl = value.match(/download\/([A-Za-z0-9_-]{16,})/);
  if (fromUrl) return fromUrl[1];
  const fromInstallerLink = value.match(/[?&]token=([A-Za-z0-9_-]{16,})/);
  if (fromInstallerLink) return fromInstallerLink[1];
  return null;
};

/**
 * Validate a download token against the backend (no file access).
 * @returns {Promise<Object>} { orderNumber, pixelModel, amountGbp }
 */
export const getDownloadMeta = async (token) => {
  const response = await fetch(`${API_BASE_URL}/aegis-orders/download/${encodeURIComponent(token)}/meta`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Could not verify this licence link');
  }
  return data.data;
};

/**
 * The raw signed APK stream URL for the ADB installer.
 */
export const apkUrlFor = (token) =>
  `${API_BASE_URL}/aegis-orders/download/${encodeURIComponent(token)}?file=apk`;
