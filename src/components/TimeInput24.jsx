import React from 'react';

/**
 * Tidsfält som alltid visar och använder 24h (HH:mm).
 * Ersätter <input type="time"> som i vissa webbläsare visar AM/PM.
 */
function TimeInput24({ name, value, onChange, className = '', hasError }) {
  const HOUR_MIN = 5;
  const HOUR_MAX = 18;

  const parts = String(value || '08:00').trim().split(':');
  const hourRaw = parseInt(parts[0], 10) || 8;
  const hour = Math.min(HOUR_MAX, Math.max(HOUR_MIN, hourRaw));
  const minute = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));

  const fireChange = (newHour, newMinute) => {
    const h = Math.min(HOUR_MAX, Math.max(HOUR_MIN, newHour));
    const m = Math.min(59, Math.max(0, newMinute));
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange?.({ target: { name, value: timeStr } });
  };

  const hours = Array.from({ length: HOUR_MAX - HOUR_MIN + 1 }, (_, i) => HOUR_MIN + i);
  const minuteOptions = [0, 10, 20, 30, 40, 50];
  const minuteSnapped = minuteOptions.reduce((best, m) => (Math.abs(m - minute) <= Math.abs(best - minute) ? m : best), minuteOptions[0]);

  return (
    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
      <select
        name={`${name}-hour`}
        aria-label={`${name} timme`}
        value={hour}
        onChange={(e) => fireChange(parseInt(e.target.value, 10), minute)}
        className={`${className} ${hasError ? 'error' : ''}`.trim()}
        style={{ minWidth: '4rem' }}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, '0')}
          </option>
        ))}
      </select>
      <span style={{ color: '#64748b', fontWeight: 600 }}>:</span>
      <select
        name={`${name}-minute`}
        aria-label={`${name} minut`}
        value={minuteSnapped}
        onChange={(e) => fireChange(hour, parseInt(e.target.value, 10))}
        className={`${className} ${hasError ? 'error' : ''}`.trim()}
        style={{ minWidth: '4rem' }}
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, '0')}
          </option>
        ))}
      </select>
    </div>
  );
}

export default TimeInput24;
