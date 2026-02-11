import React from 'react';

/**
 * Tab navigation for booking status categories
 * Displays tabs with counts and active state
 */
function BookingTabs({ currentTab, onTabChange, bookings }) {
  const tabs = [
    { id: 'bokad', label: 'Bokad' },
    { id: 'planerad', label: 'Planerad' },
    { id: 'genomford', label: 'Genomförd' },
    { id: 'prissatt', label: 'Prissatt' },
    { id: 'fakturerad', label: 'Fakturerad' },
  ];

  const getTabCount = tabId => {
    if (tabId === 'bokad') {
      return bookings.filter(b => b.status === 'Bokad' || (b.status === 'Planerad' && !b.vehicleId))
        .length;
    }
    if (tabId === 'planerad') {
      return bookings.filter(b => b.status === 'Planerad' && b.vehicleId).length;
    }
    if (tabId === 'genomford') {
      return bookings.filter(b => b.status === 'Genomförd').length;
    }
    if (tabId === 'prissatt') {
      return bookings.filter(b => b.status === 'Prissatt').length;
    }
    if (tabId === 'fakturerad') {
      return bookings.filter(b => b.status === 'Fakturerad').length;
    }
    return 0;
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--color-border)',
        paddingBottom: '0',
      }}
    >
      {tabs.map(tab => {
        const count = getTabCount(tab.id);
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="btn btn-secondary"
            style={{
              borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: '4px 4px 0 0',
              marginBottom: '-2px',
              backgroundColor: isActive ? 'var(--color-primary-glow)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontWeight: isActive ? '700' : '600',
              padding: '0.5rem 0.75rem',
            }}
          >
            {tab.label} ({count})
          </button>
        );
      })}
    </div>
  );
}

export default BookingTabs;
