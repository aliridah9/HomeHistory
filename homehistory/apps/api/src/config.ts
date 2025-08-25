/**
 * API configuration with environment variable validation
 * Throws errors on missing required values
 */
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Try common locations both in ts-node and built code
const candidates = [
  path.resolve(__dirname, '..', '..', '.env'),                 // apps/api/.env when built
  path.resolve(process.cwd(), 'apps', 'api', '.env'),          // apps/api/.env in dev
  path.resolve(process.cwd(), '.env'),                         // repo root .env
];

for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}


export interface Config {
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  database: {
    url: string;
  };
  openai: {
    apiKey: string;
  };
  externalApis: {
    zillow: {
      apiKey: string;
    };
    googleMaps: {
      apiKey: string;
    };
    countyRecords: {
      apiKey: string;
    };
    taxAssessor: {
      apiKey: string;
    };
    permitData: {
      apiKey: string;
    };
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    facebook: {
      appId: string;
      appSecret: string;
      callbackUrl: string;
    };
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpires: string;
    refreshExpires: string;
  };
  sentry: {
    dsn: string;
  };
  server: {
    port: number;
    corsOrigin: string;
    nodeEnv: string;
    frontendUrl: string;
    apiBaseUrl: string;
  };
}

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || '';
}

function validateConfig(): Config {
  return {
    supabase: {
      url: getEnvVar('SUPABASE_URL'),
      anonKey: getEnvVar('SUPABASE_ANON_KEY'),
      serviceKey: getEnvVar('SUPABASE_SERVICE_KEY'),
    },
    database: {
      url: getEnvVar('DATABASE_URL'),
    },
    openai: {
      apiKey: getEnvVar('OPENAI_API_KEY'),
    },
    externalApis: {
      zillow: {
        apiKey: getEnvVar('ZILLOW_API_KEY'),
      },
      googleMaps: {
        apiKey: getEnvVar('GOOGLE_MAPS_API_KEY'),
      },
      countyRecords: {
        apiKey: getEnvVar('COUNTY_RECORDS_API_KEY'),
      },
      taxAssessor: {
        apiKey: getEnvVar('TAX_ASSESSOR_API_KEY'),
      },
      permitData: {
        apiKey: getEnvVar('PERMIT_DATA_API_KEY'),
      },
    },
    oauth: {
      google: {
        clientId: getEnvVar('GOOGLE_CLIENT_ID'),
        clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
        callbackUrl: getEnvVar('GOOGLE_CALLBACK_URL'),
      },
      facebook: {
        appId: getEnvVar('FACEBOOK_APP_ID'),
        appSecret: getEnvVar('FACEBOOK_APP_SECRET'),
        callbackUrl: getEnvVar('FACEBOOK_CALLBACK_URL'),
      },
    },
    jwt: {
      accessSecret: getEnvVar('JWT_ACCESS_SECRET'),
      refreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
      accessExpires: getEnvVar('JWT_ACCESS_EXPIRES') || '15m',
      refreshExpires: getEnvVar('JWT_REFRESH_EXPIRES') || '7d',
    },
    sentry: {
      dsn: getEnvVar('SENTRY_DSN', false), // Optional in development
    },
    server: {
      port: parseInt(getEnvVar('PORT') || '3001', 10),
      corsOrigin: getEnvVar('CORS_ORIGIN') || 'http://localhost:3000',
      nodeEnv: getEnvVar('NODE_ENV') || 'development',
      frontendUrl: getEnvVar('FRONTEND_URL') || 'http://localhost:3000',
      apiBaseUrl: getEnvVar('API_BASE_URL') || 'http://localhost:3001',
    },
  };
}

// Create and export config instance
let configInstance: Config;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = validateConfig();
  }
  return configInstance;
}

// Export convenience helpers
export const isProduction = () => getConfig().server.nodeEnv === 'production';
export const isDevelopment = () => getConfig().server.nodeEnv === 'development';
export const isTest = () => getConfig().server.nodeEnv === 'test';

// Log config in development (without sensitive data)
export function logConfig(): void {
  const config = getConfig();
  if (isDevelopment()) {
    console.log('API Config:', {
      supabase: {
        url: config.supabase.url,
        anonKey: '***' + config.supabase.anonKey.slice(-4),
        serviceKey: '***' + config.supabase.serviceKey.slice(-4),
      },
      database: {
        url: config.database.url.replace(/:[^@]+@/, ':***@'), // Hide password
      },
      openai: {
        apiKey: '***' + config.openai.apiKey.slice(-4),
      },
      externalApis: {
        zillow: { apiKey: '***configured***' },
        googleMaps: { apiKey: '***configured***' },
        countyRecords: { apiKey: '***configured***' },
        taxAssessor: { apiKey: '***configured***' },
        permitData: { apiKey: '***configured***' },
      },
      jwt: {
        accessSecret: '***configured***',
        refreshSecret: '***configured***',
        accessExpires: config.jwt.accessExpires,
        refreshExpires: config.jwt.refreshExpires,
      },
      sentry: {
        dsn: config.sentry.dsn ? '***configured***' : 'not configured',
      },
      server: config.server,
    });
  }
}
