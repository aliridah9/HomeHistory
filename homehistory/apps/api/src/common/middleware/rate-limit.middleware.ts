import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly maxRequests = 100; // requests per window

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.getKey(req);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);
    
    // Initialize or get current count
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }
    
    const record = this.store[key];
    
    // Reset if window has expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + this.windowMs;
    }
    
    // Increment count
    record.count++;
    
    // Set headers
    res.set({
      'X-RateLimit-Limit': this.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.maxRequests - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
    });
    
    // Check if limit exceeded
    if (record.count > this.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    next();
  }
  
  private getKey(req: Request): string {
    // Use user ID if authenticated, otherwise use IP
    const userId = (req as any).user?.id;
    return userId || req.ip || 'unknown';
  }
  
  private cleanup(now: number) {
    const keys = Object.keys(this.store);
    for (const key of keys) {
      if (now > this.store[key].resetTime + this.windowMs) {
        delete this.store[key];
      }
    }
  }
}
