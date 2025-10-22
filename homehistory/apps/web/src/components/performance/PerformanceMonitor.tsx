import * as React from 'react';
import { Activity, Zap, Clock, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage?: number;
  connectionType?: string;
  isOnline: boolean;
}

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export function PerformanceMonitor({ className, showDetails = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;

        // Get Web Vitals if available
        let lcp = 0;
        let cls = 0;
        let fid = 0;

        // Try to get LCP
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              lcp = lastEntry.startTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            // Observer not supported
          }
        }

        // Get memory usage if available
        let memoryUsage = 0;
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        }

        // Get connection info if available
        let connectionType = 'unknown';
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          connectionType = connection.effectiveType || connection.type || 'unknown';
        }

        setMetrics({
          loadTime: Math.round(loadTime),
          firstContentfulPaint: Math.round(fcp),
          largestContentfulPaint: Math.round(lcp),
          cumulativeLayoutShift: cls,
          firstInputDelay: fid,
          memoryUsage,
          connectionType,
          isOnline,
        });
      }
    };

    // Measure performance after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, [isOnline]);

  const getPerformanceScore = (metrics: PerformanceMetrics) => {
    let score = 100;
    
    // Deduct points based on metrics
    if (metrics.loadTime > 3000) score -= 20;
    else if (metrics.loadTime > 2000) score -= 10;
    
    if (metrics.firstContentfulPaint > 2000) score -= 15;
    else if (metrics.firstContentfulPaint > 1500) score -= 8;
    
    if (metrics.largestContentfulPaint > 2500) score -= 15;
    else if (metrics.largestContentfulPaint > 2000) score -= 8;
    
    if (metrics.memoryUsage && metrics.memoryUsage > 100) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (!metrics && !showDetails) return null;

  const score = metrics ? getPerformanceScore(metrics) : 0;

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Performance</span>
            {metrics && (
              <Badge 
                variant="outline" 
                className={cn('text-xs', getScoreColor(score))}
              >
                {score}/100
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          </div>
        </div>

        {/* Metrics */}
        {isExpanded && metrics && (
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Load Time:</span>
                <span className="font-mono">{metrics.loadTime}ms</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">FCP:</span>
                <span className="font-mono">{metrics.firstContentfulPaint}ms</span>
              </div>
              
              {metrics.largestContentfulPaint > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">LCP:</span>
                  <span className="font-mono">{metrics.largestContentfulPaint}ms</span>
                </div>
              )}
              
              {metrics.memoryUsage && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Memory:</span>
                  <span className="font-mono">{metrics.memoryUsage}MB</span>
                </div>
              )}
              
              <div className="flex items-center justify-between col-span-2">
                <span className="text-gray-600">Connection:</span>
                <span className="font-mono capitalize">{metrics.connectionType}</span>
              </div>
            </div>

            {/* Performance Tips */}
            {score < 70 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="h-3 w-3 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Performance Tips:</span>
                </div>
                <ul className="text-yellow-700 space-y-1">
                  {metrics.loadTime > 3000 && (
                    <li>• Consider optimizing images and reducing bundle size</li>
                  )}
                  {metrics.memoryUsage && metrics.memoryUsage > 100 && (
                    <li>• High memory usage detected - check for memory leaks</li>
                  )}
                  {!isOnline && (
                    <li>• You're offline - some features may not work</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats (when collapsed) */}
        {!isExpanded && metrics && (
          <div className="p-2 flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {metrics.loadTime}ms
            </div>
            {metrics.memoryUsage && (
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {metrics.memoryUsage}MB
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
