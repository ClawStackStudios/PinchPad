import { CorsOptions } from 'cors';

export function getCorsConfig(): CorsOptions {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = !isProduction;
  const corsOrigin = process.env.CORS_ORIGIN;

  // Development mode: Allow all local origins (localhost + LAN IPs)
  if (isDevelopment) {
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) {
          return callback(null, true);
        }

        // Parse the origin URL
        try {
          const url = new URL(origin);
          const hostname = url.hostname;

          // Allow localhost/127.0.0.1
          if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
            return callback(null, true);
          }

          // Allow private IP ranges (LAN + Tailscale CGNAT)
          const isPrivateIP =
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname);

          if (isPrivateIP) {
            return callback(null, true);
          }

          // Reject public IPs/domains in dev mode
          console.warn(`⚠️ CORS: Rejected public origin in dev mode: ${origin}`);
          callback(new Error(`CORS: Public origins not allowed in dev mode`));
        } catch (err) {
          callback(new Error(`CORS: Invalid origin format: ${origin}`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
      maxAge: 3600,
    };
  }

  // LAN mode: If CORS_ORIGIN not set, allow local network access
  if (!corsOrigin) {
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) {
          return callback(null, true);
        }

        // Parse the origin URL
        try {
          const url = new URL(origin);
          const hostname = url.hostname;

          // Allow localhost/127.0.0.1
          if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
            return callback(null, true);
          }

          // Allow private IP ranges (LAN + Tailscale CGNAT)
          const isPrivateIP =
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname);

          if (isPrivateIP) {
            return callback(null, true);
          }

          // Reject public IPs/domains when in LAN mode
          console.warn(`⚠️ CORS: Rejected public origin in LAN mode: ${origin}`);
          callback(new Error(`CORS: Public origins not allowed in LAN mode. Set CORS_ORIGIN.`));
        } catch (err) {
          callback(new Error(`CORS: Invalid origin format: ${origin}`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
      maxAge: 3600,
    };
  }

  // Strict mode: CORS_ORIGIN is set (for reverse proxy/CF tunnel)
  const allowedOrigins = corsOrigin.split(",").map((o) => o.trim());

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS: Rejected origin: ${origin}`);
        callback(new Error(`CORS: Origin not in allowed list`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAge: 86400,
  };
}
