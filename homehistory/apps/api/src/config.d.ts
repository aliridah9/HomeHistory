/**
 * API configuration with environment variable validation
 * Throws errors on missing required values
 */
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
    jwt: {
        secret: string;
        expiresIn: string;
    };
    sentry: {
        dsn: string;
    };
    server: {
        port: number;
        corsOrigin: string;
        nodeEnv: string;
    };
}
export declare function getConfig(): Config;
export declare const isProduction: () => boolean;
export declare const isDevelopment: () => boolean;
export declare const isTest: () => boolean;
export declare function logConfig(): void;
//# sourceMappingURL=config.d.ts.map
