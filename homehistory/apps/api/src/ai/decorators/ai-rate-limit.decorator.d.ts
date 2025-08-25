/**
 * AI Rate Limiting Decorator
 * Custom rate limiting for AI operations to prevent abuse and control costs
 */
export declare const AI_RATE_LIMIT_KEY = "ai_rate_limit";
export interface AIRateLimitOptions {
    maxRequests: number;
    windowMs: number;
    maxTokensPerWindow?: number;
    maxCostPerWindow?: number;
    skipSuccessfulHits?: boolean;
    keyGenerator?: (req: any) => string;
}
/**
 * Rate limiting decorator for AI endpoints
 * @param options Rate limiting configuration
 */
export declare const AIRateLimit: (options: AIRateLimitOptions) => import("@nestjs/common").CustomDecorator<string>;
/**
 * Extract AI operation context from request
 */
export declare const AIContext: (...dataOrPipes: unknown[]) => ParameterDecorator;
//# sourceMappingURL=ai-rate-limit.decorator.d.ts.map
