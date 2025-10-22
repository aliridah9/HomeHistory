import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitoring } from '../usePerformanceMonitoring';

// Mock performance API
const mockPerformance = {
  getEntriesByType: jest.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  },
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock PerformanceObserver
const mockObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
};

global.PerformanceObserver = jest.fn().mockImplementation((callback) => {
  // Store callback for later use
  (mockObserver as any).callback = callback;
  return mockObserver;
});

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock performance entries
    mockPerformance.getEntriesByType.mockImplementation((type: string) => {
      if (type === 'navigation') {
        return [{
          navigationStart: 0,
          loadEventEnd: 2000,
        }];
      }
      if (type === 'paint') {
        return [
          { name: 'first-contentful-paint', startTime: 1500 },
        ];
      }
      return [];
    });

    // Mock document ready state
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with null metrics and not monitoring', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    expect(result.current.metrics).toBeNull();
    expect(result.current.isMonitoring).toBe(false);
  });

  it('starts monitoring and collects initial metrics', async () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    expect(result.current.isMonitoring).toBe(true);
    expect(result.current.metrics).toEqual({
      loadTime: 2000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      memoryUsage: 50,
      timestamp: expect.any(Number),
    });
  });

  it('sets up performance observers when starting monitoring', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    expect(PerformanceObserver).toHaveBeenCalledTimes(3); // LCP, CLS, FID
    expect(mockObserver.observe).toHaveBeenCalledTimes(3);
  });

  it('updates metrics when performance observers trigger', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    // Simulate LCP observer callback
    const lcpEntry = { startTime: 2500 };
    act(() => {
      (mockObserver as any).callback({ getEntries: () => [lcpEntry] });
    });

    expect(result.current.metrics?.largestContentfulPaint).toBe(2500);
  });

  it('stops monitoring and disconnects observers', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    expect(result.current.isMonitoring).toBe(true);

    act(() => {
      result.current.stopMonitoring();
    });

    expect(result.current.isMonitoring).toBe(false);
    expect(mockObserver.disconnect).toHaveBeenCalledTimes(3);
  });

  it('handles missing performance API gracefully', () => {
    Object.defineProperty(window, 'performance', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    expect(result.current.metrics).toBeNull();
  });

  it('handles missing PerformanceObserver gracefully', () => {
    delete (global as any).PerformanceObserver;

    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    // Should still collect basic metrics
    expect(result.current.metrics).toEqual({
      loadTime: 2000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      memoryUsage: 50,
      timestamp: expect.any(Number),
    });
  });

  it('prevents starting monitoring when already monitoring', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    const observerCallCount = (PerformanceObserver as jest.Mock).mock.calls.length;

    act(() => {
      result.current.startMonitoring(); // Try to start again
    });

    // Should not create new observers
    expect((PerformanceObserver as jest.Mock).mock.calls.length).toBe(observerCallCount);
  });

  it('tracks metrics history', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    const report = result.current.getPerformanceReport();
    expect(report).toHaveLength(1);
    expect(report[0]).toEqual(result.current.metrics);
  });

  it('limits metrics history to 10 entries', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    // Add 15 metrics entries
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.startMonitoring();
        result.current.stopMonitoring();
      });
    }

    const report = result.current.getPerformanceReport();
    expect(report.length).toBeLessThanOrEqual(10);
  });

  it('auto-starts monitoring when document is ready', () => {
    // Mock document not ready initially
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      writable: true,
    });

    const { result } = renderHook(() => usePerformanceMonitoring());

    expect(result.current.isMonitoring).toBe(false);

    // Simulate load event
    act(() => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });
      window.dispatchEvent(new Event('load'));
    });

    expect(result.current.isMonitoring).toBe(true);
  });

  it('cleans up observers on unmount', () => {
    const { result, unmount } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    unmount();

    expect(mockObserver.disconnect).toHaveBeenCalledTimes(3);
  });

  it('handles observer errors gracefully', () => {
    // Mock PerformanceObserver to throw error
    global.PerformanceObserver = jest.fn().mockImplementation(() => {
      throw new Error('Observer not supported');
    });

    console.warn = jest.fn(); // Mock console.warn

    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    // Should still collect basic metrics despite observer error
    expect(result.current.metrics).toEqual({
      loadTime: 2000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      memoryUsage: 50,
      timestamp: expect.any(Number),
    });
  });

  it('updates memory usage periodically', (done) => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    const initialMemory = result.current.metrics?.memoryUsage;

    // Change memory usage
    mockPerformance.memory.usedJSHeapSize = 75 * 1024 * 1024; // 75MB

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    setTimeout(() => {
      expect(result.current.metrics?.memoryUsage).toBe(75);
      expect(result.current.metrics?.memoryUsage).not.toBe(initialMemory);
      jest.useRealTimers();
      done();
    }, 0);
  });

  it('handles missing memory API', () => {
    const performanceWithoutMemory = {
      ...mockPerformance,
    };
    delete (performanceWithoutMemory as any).memory;

    Object.defineProperty(window, 'performance', {
      value: performanceWithoutMemory,
      writable: true,
    });

    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    expect(result.current.metrics?.memoryUsage).toBe(0);
  });

  it('measures performance correctly with different navigation timings', () => {
    mockPerformance.getEntriesByType.mockImplementation((type: string) => {
      if (type === 'navigation') {
        return [{
          navigationStart: 1000,
          loadEventEnd: 4000, // 3 second load time
        }];
      }
      if (type === 'paint') {
        return [
          { name: 'first-contentful-paint', startTime: 2500 }, // 2.5 second FCP
        ];
      }
      return [];
    });

    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.startMonitoring();
    });

    expect(result.current.metrics).toEqual({
      loadTime: 3000, // loadEventEnd - navigationStart
      firstContentfulPaint: 2500,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      memoryUsage: 50,
      timestamp: expect.any(Number),
    });
  });
});
