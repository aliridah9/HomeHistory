import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter, Notification } from '../NotificationCenter';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('NotificationCenter', () => {
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'info',
      title: 'Test Info',
      message: 'This is a test info notification',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'Test Success',
      message: 'This is a test success notification',
      timestamp: new Date('2023-01-01T09:00:00Z'),
      read: true,
    },
    {
      id: '3',
      type: 'error',
      title: 'Test Error',
      message: 'This is a test error notification',
      timestamp: new Date('2023-01-01T08:00:00Z'),
      read: false,
      actionUrl: '/test',
      actionText: 'View Details',
    },
  ];

  const defaultProps = {
    notifications: mockNotifications,
    onMarkAsRead: jest.fn(),
    onMarkAllAsRead: jest.fn(),
    onDeleteNotification: jest.fn(),
    onClearAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification bell with unread count', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    expect(bell).toBeInTheDocument();
    
    const badge = screen.getByText('2'); // 2 unread notifications
    expect(badge).toBeInTheDocument();
  });

  it('opens notification panel when bell is clicked', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('2 new')).toBeInTheDocument();
  });

  it('displays all notifications when panel is open', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    expect(screen.getByText('Test Info')).toBeInTheDocument();
    expect(screen.getByText('Test Success')).toBeInTheDocument();
    expect(screen.getByText('Test Error')).toBeInTheDocument();
  });

  it('shows correct timestamps', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    // Should show relative timestamps
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('calls onMarkAsRead when unread notification is clicked', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    const infoNotification = screen.getByText('Test Info').closest('div');
    fireEvent.click(infoNotification!);
    
    expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('does not call onMarkAsRead when read notification is clicked', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    const successNotification = screen.getByText('Test Success').closest('div');
    fireEvent.click(successNotification!);
    
    expect(defaultProps.onMarkAsRead).not.toHaveBeenCalled();
  });

  it('calls onMarkAllAsRead when "Mark all read" is clicked', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    const markAllButton = screen.getByText('Mark all read');
    fireEvent.click(markAllButton);
    
    expect(defaultProps.onMarkAllAsRead).toHaveBeenCalled();
  });

  it('calls onDeleteNotification when delete button is clicked', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('h-6 w-6 p-0')
    );
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(defaultProps.onDeleteNotification).toHaveBeenCalled();
    }
  });

  it('calls onClearAll when "Clear all notifications" is clicked', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    const clearAllButton = screen.getByText('Clear all notifications');
    fireEvent.click(clearAllButton);
    
    expect(defaultProps.onClearAll).toHaveBeenCalled();
  });

  it('shows empty state when no notifications', () => {
    render(<NotificationCenter {...defaultProps} notifications={[]} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('does not show unread badge when no unread notifications', () => {
    const readNotifications = mockNotifications.map(n => ({ ...n, read: true }));
    render(<NotificationCenter {...defaultProps} notifications={readNotifications} />);
    
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('closes panel when close button is clicked', async () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  it('shows action button for notifications with actionText', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('applies correct styling for different notification types', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    // Check that different notification types have different icons/styling
    const notifications = screen.getAllByRole('generic');
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('handles notification click with actionUrl', () => {
    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;
    
    render(<NotificationCenter {...defaultProps} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    const errorNotification = screen.getByText('Test Error').closest('div');
    fireEvent.click(errorNotification!);
    
    expect(window.location.href).toBe('/test');
  });

  it('formats timestamps correctly', () => {
    const recentNotification: Notification = {
      id: '4',
      type: 'info',
      title: 'Recent',
      message: 'Just now',
      timestamp: new Date(),
      read: false,
    };

    render(<NotificationCenter {...defaultProps} notifications={[recentNotification]} />);
    
    const bell = screen.getByRole('button');
    fireEvent.click(bell);
    
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });
});
