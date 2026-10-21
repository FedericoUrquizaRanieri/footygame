const isDev = process.env.NODE_ENV !== "production";

// Origen de las fotos cuando salen de Supabase Storage (si no, se sirven desde el propio sitio).
const photosOrigin = process.env.NEXT_PUBLIC_PHOTOS_BASE_URL
  ? ` ${new URL(process.env.NEXT_PUBLIC_PHOTOS_BASE_URL).origin}`
  : "";

// 'unsafe-inline' en script-src es necesario hasta pasar a CSP con nonce (mejora pendiente, ver docs/02-architecture/security.md).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${photosOrigin}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
