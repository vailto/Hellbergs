import React from 'react';

/**
 * Sort indicator for table headers. Renders ↕ when column is not sorted, ↑/↓ when sorted.
 * Use with currentField and direction from sort state.
 */
function SortIcon({ field, currentField, direction }) {
  const isActive = field === currentField;
  return (
    <span className="sort-icon-inline">
      <span className={`sort-indicator${!isActive ? ' sort-indicator--neutral' : ''}`}>
        {!isActive ? '↕' : direction === 'asc' ? '↑' : '↓'}
      </span>
    </span>
  );
}

export default SortIcon;
