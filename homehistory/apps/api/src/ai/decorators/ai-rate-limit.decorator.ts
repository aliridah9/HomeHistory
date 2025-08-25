/**
 * AI Rate Limiting Decorator
 * Custom rate limiting for AI operations to prevent abuse and control costs
 */

import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AI_RATE_LIMIT_KEY = 'ai_rate_limit';

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
export const AIRateLimit = (options: AIRateLimitOptions) => 
  SetMetadata(AI_RATE_LIMIT_KEY, options);

/**
 * Extract AI operation context from request
 */
export const AIContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return {
      userId: user?.id,
      userRole: user?.role,
      operation: request.route?.path,
      timestamp: new Date(),
      requestId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  },
);
