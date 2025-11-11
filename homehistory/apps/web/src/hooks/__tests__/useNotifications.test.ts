import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
  },
});

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with empty notifications', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('loads notifications from localStorage on mount', () => {
    const storedNotifications = JSON.stringify([
      {
        id: '1',
        type: 'info',
        title: 'Test',
        message: 'Test message',
        timestamp: '2023-01-01T10:00:00.000Z',
        read: false,
      },
    ]);
    localStorageMock.getItem.mockReturnValue(storedNotifications);

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Test');
    expect(result.current.unreadCount).toBe(1);
  });

  it('handles invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    console.error = jest.fn(); // Mock console.error

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('adds new notification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toEqual({
      id: 'mock-uuid',
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
      timestamp: expect.any(Date),
      read: false,
    });
    expect(result.current.unreadCount).toBe(1);
  });

  it('saves notifications to localStorage when they change', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Info',
        message: 'Information',
      });
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'homehistory-notifications',
      expect.stringContaining('"title":"Info"')
    );
  });

  it('marks notification as read', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
    });

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.markAsRead(notificationId);
    });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('marks all notifications as read', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Test message 1',
      });
      result.current.addNotification({
        type: 'warning',
        title: 'Test 2',
        message: 'Test message 2',
      });
    });

    expect(result.current.unreadCount).toBe(2);

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.notifications.every(n => n.read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('deletes notification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
    });

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.deleteNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Test message 1',
      });
      result.current.addNotification({
        type: 'warning',
        title: 'Test 2',
        message: 'Test message 2',
      });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('calculates unread count correctly', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Test message 1',
      });
      result.current.addNotification({
        type: 'warning',
        title: 'Test 2',
        message: 'Test message 2',
      });
    });

    expect(result.current.unreadCount).toBe(2);

    const firstNotificationId = result.current.notifications[0].id;

    act(() => {
      result.current.markAsRead(firstNotificationId);
    });

    expect(result.current.unreadCount).toBe(1);
  });

  it('auto-removes non-error notifications after timeout', (done) => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Auto Remove',
        message: 'This should be removed',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    // Fast-forward time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Check that notification was removed
    setTimeout(() => {
      expect(result.current.notifications).toHaveLength(0);
      jest.useRealTimers();
      done();
    }, 0);
  });

  it('does not auto-remove error notifications', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'error',
        title: 'Error',
        message: 'This should not be removed',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    // Fast-forward time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Error notification should still be there
    expect(result.current.notifications).toHaveLength(1);
    jest.useRealTimers();
  });

  it('handles multiple operations correctly', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      // Add multiple notifications
      result.current.addNotification({
        type: 'info',
        title: 'Info 1',
        message: 'Message 1',
      });
      result.current.addNotification({
        type: 'success',
        title: 'Success 1',
        message: 'Message 2',
      });
      result.current.addNotification({
        type: 'error',
        title: 'Error 1',
        message: 'Message 3',
      });
    });

    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.unreadCount).toBe(3);

    // Mark one as read
    act(() => {
      result.current.markAsRead(result.current.notifications[0].id);
    });

    expect(result.current.unreadCount).toBe(2);

    // Delete one
    act(() => {
      result.current.deleteNotification(result.current.notifications[1].id);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });
});
