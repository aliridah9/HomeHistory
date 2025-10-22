import * as React from 'react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage?: number;
  timestamp: number;
}

interface UsePerformanceMonitoringReturn {
  metrics: PerformanceMetrics | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getPerformanceReport: () => PerformanceMetrics[];
}

export function usePerformanceMonitoring(): UsePerformanceMonitoringReturn {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const [metricsHistory, setMetricsHistory] = React.useState<PerformanceMetrics[]>([]);
  const observersRef = React.useRef<PerformanceObserver[]>([]);

  const measureMetrics = React.useCallback(() => {
    if (!('performance' in window)) return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const loadTime = navigation.loadEventEnd - navigation.navigationStart;

    // Get memory usage if available
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }

    return {
      loadTime: Math.round(loadTime),
      firstContentfulPaint: Math.round(fcp),
      largestContentfulPaint: 0, // Will be updated by observer
      cumulativeLayoutShift: 0, // Will be updated by observer
      firstInputDelay: 0, // Will be updated by observer
      memoryUsage,
      timestamp: Date.now(),
    };
  }, []);

  const startMonitoring = React.useCallback(() => {
    if (!('PerformanceObserver' in window) || isMonitoring) return;

    setIsMonitoring(true);
    
    // Initial measurement
    const initialMetrics = measureMetrics();
    if (initialMetrics) {
      setMetrics(initialMetrics);
    }

    // Set up observers for Web Vitals
    const observers: PerformanceObserver[] = [];

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => prev ? {
          ...prev,
          largestContentfulPaint: Math.round(lastEntry.startTime)
        } : null);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setMetrics(prev => prev ? {
          ...prev,
          cumulativeLayoutShift: Math.round(clsValue * 1000) / 1000
        } : null);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];
        setMetrics(prev => prev ? {
          ...prev,
          firstInputDelay: Math.round((firstEntry as any).processingStart - firstEntry.startTime)
        } : null);
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);

    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }

    observersRef.current = observers;

    // Periodic memory monitoring
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => prev ? { ...prev, memoryUsage } : null);
      }
    }, 5000);

    // Cleanup function
    return () => {
      clearInterval(memoryInterval);
      observers.forEach(observer => observer.disconnect());
    };
  }, [isMonitoring, measureMetrics]);

  const stopMonitoring = React.useCallback(() => {
    setIsMonitoring(false);
    observersRef.current.forEach(observer => observer.disconnect());
    observersRef.current = [];
  }, []);

  const getPerformanceReport = React.useCallback(() => {
    return metricsHistory;
  }, [metricsHistory]);

  // Save metrics to history when they change
  React.useEffect(() => {
    if (metrics) {
      setMetricsHistory(prev => {
        const newHistory = [...prev, metrics];
        // Keep only last 10 measurements
        return newHistory.slice(-10);
      });
    }
  }, [metrics]);

  // Auto-start monitoring on mount
  React.useEffect(() => {
    if (document.readyState === 'complete') {
      startMonitoring();
    } else {
      const handleLoad = () => startMonitoring();
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [startMonitoring]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getPerformanceReport,
  };
}
