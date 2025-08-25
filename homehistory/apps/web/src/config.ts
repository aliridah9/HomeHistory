/**
 * Application configuration with environment variable validation
 * Throws errors on missing required values
 */

interface Config {
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    url: string;
  };
  sentry: {
    dsn: string;
  };
  environment: {
    nodeEnv: string;
    port: number;
  };
}

function getEnvVar(key: string, required: boolean = true): string {
  const value = import.meta.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || '';
}

function validateConfig(): Config {
  return {
    supabase: {
      url: getEnvVar('VITE_SUPABASE_URL', false) || 'https://your-project.supabase.co',
      anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', false) || 'your-anon-key',
    },
    api: {
      url: getEnvVar('VITE_API_URL', false) || 'http://localhost:3000',
    },
    sentry: {
      dsn: getEnvVar('VITE_SENTRY_DSN', false), // Optional in development
    },
    environment: {
      nodeEnv: getEnvVar('VITE_NODE_ENV', false) || 'development',
      port: parseInt(getEnvVar('VITE_PORT', false) || '3000', 10),
    },
  };
}

// Validate and export config
export const config = validateConfig();

// Export individual config sections for convenience
export const { supabase, api, sentry, environment } = config;

// Helper to check if we're in production
export const isProduction = environment.nodeEnv === 'production';
export const isDevelopment = environment.nodeEnv === 'development';
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000';


// Log config in development (without sensitive data)
if (isDevelopment) {
  console.log('App Config:', {
    supabase: {
      url: supabase.url,
      anonKey: '***' + supabase.anonKey.slice(-4), // Show only last 4 chars
    },
    api: api,
    sentry: {
      dsn: sentry.dsn ? '***configured***' : 'not configured',
    },
    environment: environment,
  });
}