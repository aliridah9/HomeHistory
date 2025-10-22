import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceMonitor } from '../PerformanceMonitor';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

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

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
  },
  writable: true,
});

describe('PerformanceMonitor', () => {
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

    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders performance monitor when metrics are available', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });
  });

  it('shows performance score badge', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText(/\/100/)).toBeInTheDocument();
    });
  });

  it('shows online status indicator', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      // Should show wifi icon for online status
      const wifiIcon = document.querySelector('[data-testid="wifi-icon"]') || 
                      document.querySelector('svg'); // Fallback to any SVG
      expect(wifiIcon).toBeInTheDocument();
    });
  });

  it('expands to show detailed metrics when clicked', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      const expandButton = screen.getByText('+');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Load Time:')).toBeInTheDocument();
      expect(screen.getByText('FCP:')).toBeInTheDocument();
      expect(screen.getByText('Memory:')).toBeInTheDocument();
      expect(screen.getByText('Connection:')).toBeInTheDocument();
    });
  });

  it('shows performance metrics with correct values', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      const expandButton = screen.getByText('+');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('2000ms')).toBeInTheDocument(); // Load time
      expect(screen.getByText('1500ms')).toBeInTheDocument(); // FCP
      expect(screen.getByText('50MB')).toBeInTheDocument(); // Memory
      expect(screen.getByText('4g')).toBeInTheDocument(); // Connection
    });
  });

  it('collapses when expand button is clicked again', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      const expandButton = screen.getByText('+');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Load Time:')).toBeInTheDocument();
    });

    const collapseButton = screen.getByText('−');
    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(screen.queryByText('Load Time:')).not.toBeInTheDocument();
    });
  });

  it('shows performance tips when score is low', async () => {
    // Mock poor performance metrics
    mockPerformance.getEntriesByType.mockImplementation((type: string) => {
      if (type === 'navigation') {
        return [{
          navigationStart: 0,
          loadEventEnd: 5000, // Slow load time
        }];
      }
      if (type === 'paint') {
        return [
          { name: 'first-contentful-paint', startTime: 3000 }, // Slow FCP
        ];
      }
      return [];
    });

    // Mock high memory usage
    mockPerformance.memory = {
      usedJSHeapSize: 150 * 1024 * 1024, // 150MB
    };

    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      const expandButton = screen.getByText('+');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Performance Tips:')).toBeInTheDocument();
      expect(screen.getByText(/Consider optimizing images/)).toBeInTheDocument();
      expect(screen.getByText(/High memory usage detected/)).toBeInTheDocument();
    });
  });

  it('shows offline indicator when offline', async () => {
    // Mock offline status
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    // Trigger offline event
    fireEvent(window, new Event('offline'));

    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      const expandButton = screen.getByText('+');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });
  });

  it('handles missing performance API gracefully', async () => {
    // Mock missing performance API
    Object.defineProperty(window, 'performance', {
      value: undefined,
      writable: true,
    });

    render(<PerformanceMonitor showDetails={true} />);

    // Should not crash and should not render anything
    expect(screen.queryByText('Performance')).not.toBeInTheDocument();
  });

  it('handles missing PerformanceObserver gracefully', async () => {
    // Mock missing PerformanceObserver
    delete (global as any).PerformanceObserver;

    render(<PerformanceMonitor showDetails={true} />);

    // Should still render basic metrics
    await waitFor(() => {
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });
  });

  it('shows quick stats when collapsed', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      // Should show quick stats in collapsed state
      expect(screen.getByText('2000ms')).toBeInTheDocument();
      expect(screen.getByText('50MB')).toBeInTheDocument();
    });
  });

  it('applies correct score colors', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      const scoreElement = screen.getByText(/\/100/);
      expect(scoreElement).toBeInTheDocument();
      // Should have appropriate color class based on score
      expect(scoreElement.className).toMatch(/text-(green|yellow|red)-/);
    });
  });

  it('updates metrics when performance changes', async () => {
    const { rerender } = render(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('2000ms')).toBeInTheDocument();
    });

    // Mock different performance metrics
    mockPerformance.getEntriesByType.mockImplementation((type: string) => {
      if (type === 'navigation') {
        return [{
          navigationStart: 0,
          loadEventEnd: 1000, // Faster load time
        }];
      }
      if (type === 'paint') {
        return [
          { name: 'first-contentful-paint', startTime: 800 }, // Faster FCP
        ];
      }
      return [];
    });

    rerender(<PerformanceMonitor showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('1000ms')).toBeInTheDocument();
    });
  });

  it('handles network connection changes', async () => {
    render(<PerformanceMonitor showDetails={true} />);

    // Simulate online event
    fireEvent(window, new Event('online'));

    await waitFor(() => {
      const expandButton = screen.getByText('+');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('4g')).toBeInTheDocument();
    });

    // Simulate offline event
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      // Should update the UI to reflect offline status
      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });
  });
});
