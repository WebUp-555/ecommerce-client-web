// Central utility to build an absolute image URL for a product.
// Supports fields: image, productImage, images[0]. Handles absolute URLs (http/https)
// and relative paths (with or without leading slash). Strips trailing /api/v1 from base.
export function buildProductImageUrl(product) {
  if (!product) return null;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  const ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");
  let raw = product.image || product.productImage;
  if (!raw && Array.isArray(product.images) && typeof product.images[0] === "string") {
    raw = product.images[0];
  }
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw; // Already full URL (e.g. Cloudinary)
  const clean = raw.startsWith('/') ? raw.slice(1) : raw;
  try {
    return new URL(clean, ORIGIN + '/').toString();
  } catch (_) {
    return ORIGIN + '/' + clean;
  }
}

// Debug helper: logs reason when URL cannot be constructed.
export function debugImage(product) {
  if (!product) return;
  if (product.image || product.productImage) return; // we have something
  if (Array.isArray(product.images) && product.images[0]) return; // we have array entry
  console.warn('[imageUrl] No image fields for product:', {
    id: product._id || product.id,
    keys: Object.keys(product)
  });
}

// Generic helper to build absolute URL for any asset path or absolute URL
export function buildAssetUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  const ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");
  const clean = path.startsWith('/') ? path.slice(1) : path;

  try {
    return new URL(clean, ORIGIN + '/').toString();
  } catch (_) {
    return `${ORIGIN}/${clean}`;
  }
}