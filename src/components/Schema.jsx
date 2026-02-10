import React, { useState, useEffect } from 'react';
import { formatTime24, getCustomerShort } from '../utils/formatters';
import { isVehicleOccupied, isDriverOccupied, assignVehicleToBooking, assignDriverToBooking, getAuthorizedDrivers } from '../utils/vehicleUtils';

function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function getWeekNumber(d) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
}

const SEGMENTS_PER_DAY = 24; // 30 min var: 06:00–06:30, 06:30–07:00, …, 17:30–18:00 (bara 06–18)
const SEGMENT_START_HOUR = 6; // första segmentet börjar 06:00

function timeToSegmentIndex(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const hour = h + m / 60;
  const seg = Math.floor((hour - SEGMENT_START_HOUR) * 2); // 30-min intervall
  return Math.max(0, Math.min(SEGMENTS_PER_DAY - 1, seg));
}

const STATUS_COLORS = {
  Bokad: { bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444' },
  Planerad: { bg: 'rgba(234, 179, 8, 0.25)', border: '#eab308' },
  Genomförd: { bg: 'rgba(34, 197, 94, 0.25)', border: '#22c55e' },
  Prissatt: { bg: 'rgba(168, 85, 247, 0.25)', border: '#a78bfa' },
  Fakturerad: { bg: 'rgba(59, 130, 246, 0.25)', border: '#3b82f6' }
};

const DRAG_BOOKING_KEY = 'application/x-booking-id';

function Schema({ data, updateData, setCurrentSection, setEditingBookingId, setReturnToSection }) {
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date().toISOString().split('T')[0]));
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'day'
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [pendingOverlap, setPendingOverlap] = useState(null);
  const [overlapBlockName, setOverlapBlockName] = useState('');
  const [blockModalExpanded, setBlockModalExpanded] = useState(false);
  const [blockNameEditValue, setBlockNameEditValue] = useState(null);
  const [dragOverVehicleId, setDragOverVehicleId] = useState(null);
  const [dragOverUnplanned, setDragOverUnplanned] = useState(false);
  const [schemaRowMode, setSchemaRowMode] = useState('vehicle'); // 'vehicle' | 'driver'

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const displayDays = viewMode === 'day' ? [selectedDay] : weekDays;
  const totalSegmentCols = displayDays.length * SEGMENTS_PER_DAY;

  const weekLabel = (() => {
    const m = new Date(weekStart + 'T12:00:00');
    const f = new Date(m);
    f.setDate(f.getDate() + 4);
    const fmt = (d) => d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    return `Vecka ${getWeekNumber(m)}, ${fmt(m)} – ${fmt(f)} ${m.getFullYear()}`;
  })();

  const dayLabel = (() => {
    const d = new Date(selectedDay + 'T12:00:00');
    return d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const bookings = (data.bookings || []).filter(b => b.status !== 'Avbruten');
  const unplanned = bookings.filter(b => !b.vehicleId);

  const getLiveBooking = (id) => (data.bookings || []).find((b) => b.id === id) || null;
  const activeVehicles = (data.vehicles || []).filter(v => v.active);
  const activeDrivers = (data.drivers || []).filter(d => d.active);

  // Oplanerade: global kolumnindex (dag*24 + segment), med spann över segment
  const unplannedInWeek = unplanned.filter(b => {
    const start = b.pickupDate || b.date;
    const end = b.deliveryDate || start;
    const lastDay = displayDays[displayDays.length - 1];
    const firstDay = displayDays[0];
    return start <= lastDay && end >= firstDay;
  }).map(b => {
    const start = b.pickupDate || b.date;
    const end = b.deliveryDate || start;
    let dayStart = displayDays.indexOf(start);
    let dayEnd = displayDays.indexOf(end);
    if (dayStart < 0) dayStart = 0;
    if (dayEnd < 0) dayEnd = displayDays.length - 1;
    if (dayEnd < dayStart) dayEnd = dayStart;
    const segStart = timeToSegmentIndex(b.pickupTime || b.time);
    const segEnd = timeToSegmentIndex(b.deliveryTime || b.pickupTime || b.time);
    const colStart = dayStart * SEGMENTS_PER_DAY + segStart;
    const colEnd = dayEnd * SEGMENTS_PER_DAY + segEnd;
    const colSpan = Math.max(1, colEnd - colStart + 1);
    const maxCol = totalSegmentCols - 1;
    const span = Math.min(colSpan, maxCol - colStart + 1);
    return { booking: b, colStart, colSpan: span };
  });

  // Per bil för visade dagar: alla bokningar som överlappar displayDays
  const getBookingsForVehicleWeek = (vehicleId) =>
    bookings
      .filter(b => {
        if (b.vehicleId !== vehicleId) return false;
        const dayStart = b.pickupDate || b.date;
        const dayEnd = b.deliveryDate || dayStart;
        const firstDay = displayDays[0];
        const lastDay = displayDays[displayDays.length - 1];
        return dayEnd >= firstDay && dayStart <= lastDay;
      })
      .sort((a, b) => (a.pickupDate || a.date || '').localeCompare(b.pickupDate || b.date || '') || (a.pickupTime || a.time || '').localeCompare(b.pickupTime || b.time || ''));

  // Per förare för visade dagar: alla bokningar som överlappar displayDays
  const getBookingsForDriverWeek = (driverId) =>
    bookings
      .filter(b => {
        if (b.driverId !== driverId) return false;
        const dayStart = b.pickupDate || b.date;
        const dayEnd = b.deliveryDate || dayStart;
        const firstDay = displayDays[0];
        const lastDay = displayDays[displayDays.length - 1];
        return dayEnd >= firstDay && dayStart <= lastDay;
      })
      .sort((a, b) => (a.pickupDate || a.date || '').localeCompare(b.pickupDate || b.date || '') || (a.pickupTime || a.time || '').localeCompare(b.pickupTime || b.time || ''));

  // Spann för en bokning i grid (en bar över visade dagar)
  const getBookingWeekSpan = (booking) => {
    const dayStart = booking.pickupDate || booking.date;
    const dayEnd = booking.deliveryDate || dayStart;
    let firstDayIdx = displayDays.indexOf(dayStart);
    let lastDayIdx = displayDays.indexOf(dayEnd);
    if (firstDayIdx < 0) firstDayIdx = 0;
    if (lastDayIdx < 0) lastDayIdx = displayDays.length - 1;
    if (lastDayIdx < firstDayIdx) lastDayIdx = firstDayIdx;
    const startSeg = timeToSegmentIndex(booking.pickupTime || booking.time);
    const endSeg = timeToSegmentIndex(booking.deliveryTime || booking.pickupTime || booking.time);
    const colStart = firstDayIdx * SEGMENTS_PER_DAY + startSeg;
    const colEnd = lastDayIdx * SEGMENTS_PER_DAY + endSeg;
    const colSpan = Math.max(1, colEnd - colStart + 1);
    const maxCol = totalSegmentCols - 1;
    const span = Math.min(colSpan, maxCol - colStart + 1);
    return { colStart, colSpan: span };
  };

  // Tilldela radindex så att icke-överlappande bokningar hamnar på samma rad
  const assignBookingRows = (weekBookingsList) => {
    const withSpan = weekBookingsList.map((b) => {
      const live = getLiveBooking(b.id) || b;
      const { colStart, colSpan } = getBookingWeekSpan(live);
      return { booking: live, colStart, colSpan, colEnd: colStart + colSpan };
    }).sort((a, b) => a.colStart - b.colStart || (a.booking.pickupTime || '').localeCompare(b.booking.pickupTime || ''));
    const rowEnds = [];
    const withRow = withSpan.map(({ booking, colStart, colSpan }) => {
      let row = 0;
      while (row < rowEnds.length && rowEnds[row] > colStart) row++;
      if (row === rowEnds.length) rowEnds.push(0);
      rowEnds[row] = colStart + colSpan;
      return { booking, colStart, colSpan, row };
    });
    return withRow;
  };

  // Klumpa överlappande bokningar till ett block per kluster (samma fordon)
  const clusterOverlapping = (weekBookings) => {
    if (weekBookings.length === 0) return [];
    const withSpan = weekBookings.map((b) => {
      const live = getLiveBooking(b.id) || b;
      const { colStart, colSpan } = getBookingWeekSpan(live);
      return { booking: live, colStart, colSpan, colEnd: colStart + colSpan };
    }).sort((a, b) => a.colStart - b.colStart || (a.booking.pickupTime || '').localeCompare(b.booking.pickupTime || ''));
    const clusters = [];
    for (const item of withSpan) {
      const overlapping = clusters.filter(c => item.colStart < c.colEnd && item.colEnd > c.colStart);
      if (overlapping.length === 0) {
        clusters.push({ bookings: [item.booking], colStart: item.colStart, colEnd: item.colEnd });
      } else {
        const merged = {
          bookings: [...overlapping.flatMap(c => c.bookings), item.booking],
          colStart: Math.min(item.colStart, ...overlapping.map(c => c.colStart)),
          colEnd: Math.max(item.colEnd, ...overlapping.map(c => c.colEnd))
        };
        clusters.splice(0, clusters.length, ...clusters.filter(c => !overlapping.includes(c)), merged);
      }
    }
    return clusters;
  };

  // Tilldela radindex till kluster (så att icke-överlappande kluster kan ligga på samma rad)
  const assignClusterRows = (clusters) => {
    const rowEnds = [];
    return clusters.map(({ bookings, colStart, colEnd }) => {
      const colSpan = Math.max(1, colEnd - colStart);
      let row = 0;
      while (row < rowEnds.length && rowEnds[row] > colStart) row++;
      if (row === rowEnds.length) rowEnds.push(0);
      rowEnds[row] = colEnd;
      return { bookings, colStart, colSpan, row };
    });
  };

  // Från ett kluster: dela upp i block-grupper (samma blockId) och enskilda (utan blockId). Blockets spann = första till sista tiden bland kvarvarande.
  const expandClusterToRowItems = (cluster) => {
    const { bookings } = cluster;
    const byBlockId = {};
    for (const b of bookings) {
      const key = b.blockId || `_single_${b.id}`;
      if (!byBlockId[key]) byBlockId[key] = [];
      byBlockId[key].push(b);
    }
    const items = [];
    for (const key of Object.keys(byBlockId)) {
      const group = byBlockId[key];
      if (key.startsWith('_single_')) {
        const b = group[0];
        const { colStart, colSpan } = getBookingWeekSpan(b);
        items.push({ type: 'booking', booking: b, colStart, colSpan });
      } else {
        const spans = group.map(b => getBookingWeekSpan(b));
        const colStart = Math.min(...spans.map(s => s.colStart));
        const colEnd = Math.max(...spans.map(s => s.colStart + s.colSpan));
        items.push({ type: 'block', blockId: key, bookings: group, colStart, colSpan: Math.max(1, colEnd - colStart) });
      }
    }
    return items;
  };

  const assignRowToItems = (items) => {
    const rowEnds = [];
    return items.map((item) => {
      const colStart = item.colStart;
      const colEnd = item.colStart + item.colSpan;
      let row = 0;
      while (row < rowEnds.length && rowEnds[row] > colStart) row++;
      if (row === rowEnds.length) rowEnds.push(0);
      rowEnds[row] = colEnd;
      return { ...item, row };
    });
  };

  // Hitta vilka boknings-id:n som ingår i samma överlappande kluster som bookingId (på fordon vehicleId)
  const getOverlappingGroup = (vehicleId, bookingId) => {
    const weekBookings = getBookingsForVehicleWeek(vehicleId);
    const clusters = clusterOverlapping(weekBookings);
    const cluster = clusters.find(c => c.bookings.some(b => b.id === bookingId));
    return cluster ? cluster.bookings.map(b => b.id) : [];
  };

  const handleVehicleAssign = (bookingId, vehicleId) => {
    const updatedBooking = (data.bookings || []).find(b => b.id === bookingId);
    if (!updatedBooking) return;
    const newBooking = assignVehicleToBooking(updatedBooking, vehicleId, data.drivers || [], { clearBlockId: true });
    const updatedBookings = (data.bookings || []).map(b => b.id === bookingId ? newBooking : b);
    updateData({ bookings: updatedBookings });
    setSelectedBooking(prev => prev?.id === bookingId ? newBooking : prev);
  };

  const handleDriverAssign = (bookingId, driverId) => {
    const updatedBooking = (data.bookings || []).find(b => b.id === bookingId);
    if (!updatedBooking) return;
    const newBooking = assignDriverToBooking(updatedBooking, driverId);
    const updatedBookings = (data.bookings || []).map(b => b.id === bookingId ? newBooking : b);
    updateData({ bookings: updatedBookings });
    setSelectedBooking(prev => prev?.id === bookingId ? newBooking : prev);
  };

  const handleDropOnVehicle = (bookingId, vehicleId) => {
    const authorizedDrivers = getAuthorizedDrivers(vehicleId, data.drivers || []);
    const driverId = authorizedDrivers.length === 1 ? authorizedDrivers[0].id : null;
    const updatedBookings = (data.bookings || []).map(b => {
      if (b.id !== bookingId) return b;
      return { ...b, vehicleId, driverId, status: 'Planerad' };
    });
    updateData({ bookings: updatedBookings });
    setDragOverVehicleId(null);
    setSelectedBooking(prev => prev?.id === bookingId ? { ...prev, vehicleId, driverId } : prev);
    setPendingOverlap({ vehicleId, bookingId });
  };

  const handleDropOnUnplanned = (bookingId) => {
    const updatedBookings = (data.bookings || []).map(b => {
      if (b.id !== bookingId) return b;
      return { ...b, vehicleId: null, driverId: null, blockId: null, status: 'Bokad' };
    });
    updateData({ bookings: updatedBookings });
    setDragOverUnplanned(false);
  };

  const handleRemoveFromBlock = (bookingId, blockId) => {
    const block = (data.bookingBlocks || []).find(bl => bl.id === blockId);
    if (!block) return;
    const newBookingIds = block.bookingIds.filter(id => id !== bookingId);
    const updatedBookings = (data.bookings || []).map(b =>
      b.id === bookingId ? { ...b, blockId: null } : b
    );
    const updatedBlocks = newBookingIds.length === 0
      ? (data.bookingBlocks || []).filter(bl => bl.id !== blockId)
      : (data.bookingBlocks || []).map(bl =>
          bl.id === blockId ? { ...bl, bookingIds: newBookingIds } : bl
        );
    updateData({ bookings: updatedBookings, bookingBlocks: updatedBlocks });
    if (newBookingIds.length === 0) {
      setSelectedBlock(null);
      setBlockModalExpanded(false);
    } else {
      const blockName = block.name;
      setSelectedBlock({ blockId, name: blockName, bookingIds: newBookingIds });
    }
  };

  const handleBookingDragStart = (e, bookingId) => {
    e.dataTransfer.setData(DRAG_BOOKING_KEY, bookingId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleVehicleDragOver = (e, vehicleId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverVehicleId(vehicleId);
  };

  const handleVehicleDragLeave = () => {
    setDragOverVehicleId(null);
  };

  const handleVehicleDrop = (e, vehicleId) => {
    e.preventDefault();
    const bookingId = e.dataTransfer.getData(DRAG_BOOKING_KEY);
    if (bookingId) handleDropOnVehicle(bookingId, vehicleId);
    setDragOverVehicleId(null);
  };

  const handleUnplannedDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverUnplanned(true);
  };

  const handleUnplannedDragLeave = () => {
    setDragOverUnplanned(false);
  };

  const handleUnplannedDrop = (e) => {
    e.preventDefault();
    const bookingId = e.dataTransfer.getData(DRAG_BOOKING_KEY);
    if (bookingId) handleDropOnUnplanned(bookingId);
    setDragOverUnplanned(false);
  };

  const openEditInBooking = () => {
    if (!selectedBooking?.id || !setEditingBookingId || !setCurrentSection) return;
    if (setReturnToSection) setReturnToSection('schema');
    setEditingBookingId(selectedBooking.id);
    setCurrentSection('booking');
    setSelectedBooking(null);
  };

  const dayNames = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre'];

  // Rensa pendingOverlap om det inte längre finns överlapp (t.ex. användaren flyttade bokningar)
  useEffect(() => {
    if (!pendingOverlap) return;
    const overlappingIds = getOverlappingGroup(pendingOverlap.vehicleId, pendingOverlap.bookingId);
    if (overlappingIds.length < 2) {
      setPendingOverlap(null);
      setOverlapBlockName('');
    }
  }, [pendingOverlap, data.bookings]);

  useEffect(() => {
    if (selectedBlock) {
      setBlockModalExpanded(false);
      setBlockNameEditValue(null);
    }
  }, [selectedBlock]);

  const headerDayCells = displayDays.map((dayStr, dayIdx) => {
    const d = new Date(dayStr + 'T12:00:00');
    const dateLabel = d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    const dayName = viewMode === 'week' ? dayNames[dayIdx] : d.toLocaleDateString('sv-SE', { weekday: 'short' });
    const isClickable = viewMode === 'week';
    return (
      <div
        key={dayStr}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={isClickable ? () => { setViewMode('day'); setSelectedDay(dayStr); } : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') { setViewMode('day'); setSelectedDay(dayStr); } } : undefined}
        style={{
          gridColumn: `${2 + dayIdx * SEGMENTS_PER_DAY} / span ${SEGMENTS_PER_DAY}`,
          padding: '0.5rem 0.35rem',
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text)',
          fontSize: '0.8rem',
          fontWeight: 600,
          textAlign: 'center',
          borderRight: dayIdx < displayDays.length - 1 ? '2px solid var(--color-border)' : undefined,
          cursor: isClickable ? 'pointer' : undefined
        }}
        title={isClickable ? 'Klicka för att visa denna dag' : undefined}
      >
        {dayName} {dateLabel}
      </div>
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Schema</h1>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            className={`btn btn-small ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setViewMode('week');
              setWeekStart(getMondayOfWeek(selectedDay));
            }}
          >
            Vecka
          </button>
          <button
            type="button"
            className={`btn btn-small ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setViewMode('day');
              setSelectedDay(new Date().toISOString().split('T')[0]);
            }}
          >
            Dag
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {viewMode === 'week' ? (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                const d = new Date(weekStart + 'T12:00:00');
                d.setDate(d.getDate() - 7);
                setWeekStart(d.toISOString().split('T')[0]);
              }}
            >
              ← Föregående vecka
            </button>
            <span className="detail-value" style={{ fontWeight: 600, minWidth: '220px' }}>{weekLabel}</span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                const d = new Date(weekStart + 'T12:00:00');
                d.setDate(d.getDate() + 7);
                setWeekStart(d.toISOString().split('T')[0]);
              }}
            >
              Nästa vecka →
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                const d = new Date(selectedDay + 'T12:00:00');
                d.setDate(d.getDate() - 1);
                setSelectedDay(d.toISOString().split('T')[0]);
              }}
            >
              ← Föregående dag
            </button>
            <span className="detail-value" style={{ fontWeight: 600, minWidth: '280px' }}>{dayLabel}</span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                const d = new Date(selectedDay + 'T12:00:00');
                d.setDate(d.getDate() + 1);
                setSelectedDay(d.toISOString().split('T')[0]);
              }}
            >
              Nästa dag →
            </button>
          </>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `100px repeat(${totalSegmentCols}, minmax(0, 1fr))`,
          gap: 0,
          background: 'var(--color-border)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflow: 'auto',
          minWidth: 0
        }}
      >
        {/* Header: Fordon/Förare toggle + dagar */}
        <button
          type="button"
          onClick={() => setSchemaRowMode(prev => prev === 'vehicle' ? 'driver' : 'vehicle')}
          className="btn btn-small btn-secondary"
          style={{
            gridColumn: '1',
            padding: '0.5rem 0.5rem',
            background: 'var(--color-bg-elevated)',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--color-text)'
          }}
        >
          {schemaRowMode === 'vehicle' ? 'Fordon' : 'Förare'} / Dag
        </button>
        {headerDayCells}

        {/* Oplanerade – en rad, barer i grid */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setSchemaRowMode(prev => prev === 'vehicle' ? 'driver' : 'vehicle')}
          onDragOver={handleUnplannedDragOver}
          onDragLeave={handleUnplannedDragLeave}
          onDrop={handleUnplannedDrop}
          onClick={() => setSchemaRowMode(prev => prev === 'vehicle' ? 'driver' : 'vehicle')}
          style={{
            gridColumn: '1',
            padding: '0.5rem 0.5rem',
            background: dragOverUnplanned ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-bg-elevated)',
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'background 0.15s ease',
            cursor: 'pointer'
          }}
        >
          Oplanerade
        </div>
        <div
          onDragOver={handleUnplannedDragOver}
          onDragLeave={handleUnplannedDragLeave}
          onDrop={handleUnplannedDrop}
          style={{
            gridColumn: '2 / -1',
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${totalSegmentCols}, minmax(0, 1fr))`,
            gap: 0,
            minHeight: '36px',
            background: dragOverUnplanned ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-bg)',
            padding: '0.25rem',
            alignContent: 'start',
            transition: 'background 0.15s ease'
          }}
        >
          {unplannedInWeek.map(({ booking, colStart, colSpan }, idx) => {
            const b = getLiveBooking(booking.id) || booking;
            const customer = data.customers.find(c => c.id === b.customerId);
            const colors = STATUS_COLORS.Bokad;
            return (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(e) => handleBookingDragStart(e, b.id)}
                onDragEnd={() => { setDragOverVehicleId(null); setDragOverUnplanned(false); }}
                onClick={() => setSelectedBooking(b)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedBooking(b)}
                style={{
                  gridColumn: `${colStart + 1} / span ${colSpan}`,
                  gridRow: idx + 1,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  padding: '0.25rem 0.35rem',
                  fontSize: '0.7rem',
                  minWidth: 0,
                  cursor: 'grab'
                }}
              >
                <span className="detail-value" style={{ fontWeight: 600 }}>{formatTime24(b.pickupTime)} – {formatTime24(b.deliveryTime)}</span>
                <span className="text-muted-2" style={{ marginLeft: '0.35rem' }}>{getCustomerShort(customer)}</span>
              </div>
            );
          })}
          {displayDays.length > 1 && [1, 2, 3, 4].slice(0, displayDays.length - 1).map((d) => (
            <div
              key={`unplanned-sep-${d}`}
              style={{
                position: 'absolute',
                left: `${(d * SEGMENTS_PER_DAY / totalSegmentCols) * 100}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'var(--color-border)',
                pointerEvents: 'none'
              }}
            />
          ))}
        </div>

        {/* En rad per bil ELLER per förare */}
        {(schemaRowMode === 'vehicle' ? activeVehicles : activeDrivers).map((item) => {
          const isVehicle = schemaRowMode === 'vehicle';
          const id = item.id;
          const label = isVehicle ? item.regNo : item.name;
          const weekBookings = isVehicle ? getBookingsForVehicleWeek(id) : getBookingsForDriverWeek(id);
          const handleDragOver = isVehicle ? (e) => handleVehicleDragOver(e, id) : undefined;
          const handleDrop = isVehicle ? (e) => handleVehicleDrop(e, id) : (e) => {
            e.preventDefault();
            const bookingId = e.dataTransfer.getData(DRAG_BOOKING_KEY);
            if (bookingId) handleDriverAssign(bookingId, id);
            setDragOverVehicleId(null);
          };
          const handleDragOverDriver = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverVehicleId(id); // reuse for driver highlight
          };
          return (
            <React.Fragment key={id}>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSchemaRowMode(prev => prev === 'vehicle' ? 'driver' : 'vehicle')}
                onDragOver={handleDragOver || handleDragOverDriver}
                onDragLeave={handleVehicleDragLeave}
                onDrop={handleDrop}
                onClick={() => setSchemaRowMode(prev => prev === 'vehicle' ? 'driver' : 'vehicle')}
                style={{
                  gridColumn: '1',
                  padding: '0.5rem 0.5rem',
                  background: dragOverVehicleId === id ? 'rgba(34, 197, 94, 0.15)' : 'var(--color-bg-elevated)',
                  borderTop: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'background 0.15s ease',
                  cursor: 'pointer'
                }}
              >
                {label}
              </div>
              <div
                onDragOver={handleDragOver || handleDragOverDriver}
                onDragLeave={handleVehicleDragLeave}
                onDrop={handleDrop}
                style={{
                  gridColumn: '2 / -1',
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${totalSegmentCols}, minmax(0, 1fr))`,
                  gap: 0,
                  padding: '0.2rem',
                  background: dragOverVehicleId === id ? 'rgba(34, 197, 94, 0.12)' : 'var(--color-bg)',
                  borderTop: '1px solid var(--color-border)',
                  minHeight: '36px',
                  alignContent: 'start',
                  transition: 'background 0.15s ease'
                }}
              >
                {(() => {
                  const clusters = clusterOverlapping(weekBookings);
                  const allItems = clusters.flatMap(c => expandClusterToRowItems(c));
                  const withRow = assignRowToItems(allItems);
                  if (allItems.length === 0) return <span style={{ gridColumn: '1 / -1', fontSize: '0.65rem', color: '#475569' }}>–</span>;
                  return withRow.map((item, idx) => {
                    const { colStart, colSpan, row } = item;
                    if (item.type === 'block') {
                      const { blockId, bookings: blockBookings } = item;
                      const block = (data.bookingBlocks || []).find(bl => bl.id === blockId);
                      const blockName = block ? block.name : 'Överlappande';
                      const firstB = blockBookings[0];
                      const effectiveStatus = (firstB.status === 'Planerad' && !firstB.vehicleId) ? 'Bokad' : (firstB.status || 'Bokad');
                      const colors = STATUS_COLORS[effectiveStatus] || STATUS_COLORS.Bokad;
                      const handleClick = () => {
                        setSelectedBlock({ blockId, name: blockName, bookingIds: blockBookings.map(b => b.id) });
                        setSelectedBooking(null);
                      };
                      return (
                        <div
                          key={`block-${blockId}-${idx}`}
                          role="button"
                          tabIndex={0}
                          draggable={false}
                          onDragEnd={() => { setDragOverVehicleId(null); setDragOverUnplanned(false); }}
                          onClick={handleClick}
                          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                          style={{
                            gridColumn: `${colStart + 1} / span ${colSpan}`,
                            gridRow: row + 1,
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '4px',
                            padding: '0.25rem 0.35rem',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            minWidth: 0
                          }}
                        >
                          <div className="detail-value" style={{ fontWeight: 600 }}>{blockName}</div>
                          <div className="text-muted-2" style={{ lineHeight: 1.2 }}>{blockBookings.length} körningar</div>
                        </div>
                      );
                    }
                    const b = item.booking;
                    const customer = data.customers.find(c => c.id === b.customerId);
                    const effectiveStatus = (b.status === 'Planerad' && !b.vehicleId) ? 'Bokad' : (b.status || 'Bokad');
                    const colors = STATUS_COLORS[effectiveStatus] || STATUS_COLORS.Bokad;
                    const handleClick = () => {
                      setSelectedBooking(b);
                      setSelectedBlock(null);
                    };
                    return (
                      <div
                        key={b.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => handleBookingDragStart(e, b.id)}
                        onDragEnd={() => { setDragOverVehicleId(null); setDragOverUnplanned(false); }}
                        onClick={handleClick}
                        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                        style={{
                          gridColumn: `${colStart + 1} / span ${colSpan}`,
                          gridRow: row + 1,
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          padding: '0.25rem 0.35rem',
                          fontSize: '0.7rem',
                          cursor: 'grab',
                          minWidth: 0
                        }}
                      >
                        <div className="detail-value" style={{ fontWeight: 600 }}>
                          {formatTime24(b.pickupTime || b.time)}
                        </div>
                        <div className="text-muted-2" style={{ lineHeight: 1.2 }}>
                          {schemaRowMode === 'driver'
                            ? ((data.vehicles || []).find(v => v.id === b.vehicleId)?.regNo || '–')
                            : getCustomerShort(customer)}
                        </div>
                      </div>
                    );
                  });
                })()}
                {displayDays.length > 1 && [1, 2, 3, 4].slice(0, displayDays.length - 1).map((d) => (
                  <div
                    key={`row-sep-${id}-${d}`}
                    style={{
                      position: 'absolute',
                      left: `${(d * SEGMENTS_PER_DAY / totalSegmentCols) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      background: 'var(--color-border)',
                      pointerEvents: 'none'
                    }}
                  />
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Modal: Överlappande körning – namnge block, Spara eller Avbryt (bokning tillbaka till oplanerade) */}
      {pendingOverlap && (() => {
        const overlappingIds = getOverlappingGroup(pendingOverlap.vehicleId, pendingOverlap.bookingId);
        if (overlappingIds.length < 2) return null;
        const overlappingBooks = overlappingIds.map(id => getLiveBooking(id)).filter(Boolean);
        // Finns det redan ett block bland de överlappande (andra än den droppade)? Då erbjud "lägg till i block".
        const others = overlappingBooks.filter(b => b.id !== pendingOverlap.bookingId);
        const blockIdsAmongOthers = others.map(b => b.blockId).filter(Boolean);
        const uniqueBlockIds = [...new Set(blockIdsAmongOthers)];
        const existingBlock = uniqueBlockIds.length === 1
          ? (data.bookingBlocks || []).find(bl => bl.id === uniqueBlockIds[0])
          : null;

        if (existingBlock) {
          const handleAddToBlock = () => {
            const updatedBookings = (data.bookings || []).map(b =>
              b.id === pendingOverlap.bookingId ? { ...b, blockId: existingBlock.id } : b
            );
            // Lägg bara till den droppade bokningen i blocket – inte andra överlappande som inte redan är i blocket
            const newBlockIds = existingBlock.bookingIds.includes(pendingOverlap.bookingId)
              ? existingBlock.bookingIds
              : [...existingBlock.bookingIds, pendingOverlap.bookingId];
            const updatedBlocks = (data.bookingBlocks || []).map(bl =>
              bl.id === existingBlock.id ? { ...bl, bookingIds: newBlockIds } : bl
            );
            updateData({ bookings: updatedBookings, bookingBlocks: updatedBlocks });
            setPendingOverlap(null);
          };
          const handleAddToBlockCancel = () => {
            const updatedBookings = (data.bookings || []).map(b => {
              if (b.id !== pendingOverlap.bookingId) return b;
              return { ...b, vehicleId: null, driverId: null, blockId: null, status: 'Bokad' };
            });
            updateData({ bookings: updatedBookings });
            setPendingOverlap(null);
          };
          return (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '400px',
                  border: '1px solid var(--color-border)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-lg" style={{ marginBottom: '1.5rem' }}>
                  Vill du lägga till i &quot;{existingBlock.name}&quot;?
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" onClick={handleAddToBlockCancel} className="btn btn-secondary">
                    Avbryt
                  </button>
                  <button type="button" onClick={handleAddToBlock} className="btn btn-primary">
                    Ja
                  </button>
                </div>
              </div>
            </div>
          );
        }

        const handleOverlapSave = () => {
          const name = (overlapBlockName || '').trim() || 'Namnlös tur';
          const blockId = 'block-' + Date.now();
          const newBlock = { id: blockId, name, bookingIds: overlappingIds };
          const updatedBlocks = [...(data.bookingBlocks || []), newBlock];
          const updatedBookings = (data.bookings || []).map(b =>
            overlappingIds.includes(b.id) ? { ...b, blockId } : b
          );
          updateData({ bookingBlocks: updatedBlocks, bookings: updatedBookings });
          setPendingOverlap(null);
          setOverlapBlockName('');
        };
        const handleOverlapCancel = () => {
          const updatedBookings = (data.bookings || []).map(b => {
            if (b.id !== pendingOverlap.bookingId) return b;
            return { ...b, vehicleId: null, driverId: null, blockId: null, status: 'Bokad' };
          });
          updateData({ bookings: updatedBookings });
          setPendingOverlap(null);
          setOverlapBlockName('');
        };
        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
          >
            <div
              style={{
                backgroundColor: '#1a2332',
                padding: '1.5rem',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid var(--color-border)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-subtitle" style={{ margin: '0 0 1rem 0' }}>
                Överlappande körning
              </h2>
              <p className="text-muted-2 text-md" style={{ marginBottom: '1rem' }}>
                Namnge block
              </p>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={overlapBlockName}
                  onChange={(e) => setOverlapBlockName(e.target.value)}
                  placeholder="t.ex. City-turen"
                  className="form-input"
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleOverlapCancel} className="btn btn-secondary">
                  Avbryt
                </button>
                <button type="button" onClick={handleOverlapSave} className="btn btn-primary">
                  Spara
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: full bokningsinfo + planera (fordon/förare) + redigera */}
      {selectedBooking && (() => {
        const booking = (data.bookings || []).find(b => b.id === selectedBooking.id) || selectedBooking;
        const customer = (data.customers || []).find(c => c.id === booking.customerId);
        const driver = (data.drivers || []).find(d => d.id === booking.driverId);
        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => setSelectedBooking(null)}
          >
            <div
              style={{
                backgroundColor: '#1a2332',
                padding: '1.5rem',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid var(--color-border)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-subtitle" style={{ margin: '0 0 0.5rem 0' }}>
                Bokning {booking.bookingNo}
              </h2>
              <p className="text-muted-2 text-md" style={{ marginBottom: '1rem' }}>
                {customer?.name || 'Okänd'} · {booking.pickupDate || booking.date} {formatTime24(booking.pickupTime)} – {formatTime24(booking.deliveryTime)}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h4 className="detail-section-title" style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-base)', paddingBottom: '0.35rem' }}>
                    Upphämtning
                  </h4>
                  <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem' }}>
                    <div><span className="detail-label">Adress: </span><span className="detail-value">{booking.pickupAddress || '-'}</span></div>
                    <div><span className="detail-label">Datum: </span><span className="detail-value">{booking.pickupDate || booking.date || '-'}</span></div>
                    <div><span className="detail-label">Tid: </span><span className="detail-value">{formatTime24(booking.pickupTime || booking.time)}</span></div>
                    {booking.pickupContactName && <div><span className="detail-label">Kontakt: </span><span className="detail-value">{booking.pickupContactName}</span></div>}
                    {booking.pickupContactPhone && <div><span className="detail-label">Telefon: </span><span className="detail-value">{booking.pickupContactPhone}</span></div>}
                  </div>
                </div>
                <div>
                  <h4 className="detail-section-title" style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-base)', paddingBottom: '0.35rem' }}>
                    Lämning
                  </h4>
                  <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem' }}>
                    <div><span className="detail-label">Adress: </span><span className="detail-value">{booking.deliveryAddress || '-'}</span></div>
                    <div><span className="detail-label">Datum: </span><span className="detail-value">{booking.deliveryDate || '-'}</span></div>
                    <div><span className="detail-label">Tid: </span><span className="detail-value">{formatTime24(booking.deliveryTime)}</span></div>
                    {booking.deliveryContactName && <div><span className="detail-label">Kontakt: </span><span className="detail-value">{booking.deliveryContactName}</span></div>}
                    {booking.deliveryContactPhone && <div><span className="detail-label">Telefon: </span><span className="detail-value">{booking.deliveryContactPhone}</span></div>}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div><span className="detail-label">Bokningsnr: </span><span className="detail-value" style={{ fontWeight: 600 }}>{booking.bookingNo}</span></div>
                {booking.marking && <div><span className="detail-label">Märkning: </span><span className="detail-value" style={{ fontWeight: 600 }}>{booking.marking}</span></div>}
                <div><span className="detail-label">Förare: </span><span className="detail-value" style={{ fontWeight: 600 }}>{driver?.name || '-'}</span></div>
                {booking.km != null && booking.km !== '' && <div><span className="detail-label">Sträcka: </span><span className="detail-value" style={{ fontWeight: 600 }}>{booking.km} km</span></div>}
                {booking.amountSek != null && booking.amountSek !== '' && <div><span className="detail-label">Pris: </span><span className="detail-value" style={{ fontWeight: 600 }}>{booking.amountSek} SEK</span></div>}
              </div>
              {booking.note && (
                <div style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <span className="detail-label">Anteckning: </span><span className="detail-value">{booking.note}</span>
                </div>
              )}

              {updateData && (
                <>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="label-sm text-muted-2">Fordon</label>
                    <select
                      value={booking.vehicleId || ''}
                      onChange={(e) => handleVehicleAssign(booking.id, e.target.value || null)}
                      className="form-select"
                      style={{ width: '100%' }}
                    >
                      <option value="">Ej tilldelad</option>
                      {(() => {
                        const available = activeVehicles.filter(v => !isVehicleOccupied(v.id, booking, data.bookings || []));
                        const occupied = activeVehicles.filter(v => isVehicleOccupied(v.id, booking, data.bookings || []));
                        return (
                          <>
                            {available.length > 0 && (
                              <optgroup label="Tillgängliga">
                                {available.map(v => (
                                  <option key={v.id} value={v.id}>{v.regNo}</option>
                                ))}
                              </optgroup>
                            )}
                            {occupied.length > 0 && (
                              <optgroup label="Upptagna">
                                {occupied.map(v => (
                                  <option key={v.id} value={v.id}>{v.regNo}</option>
                                ))}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="label-sm text-muted-2">Förare</label>
                    <select
                      value={booking.driverId || ''}
                      onChange={(e) => handleDriverAssign(booking.id, e.target.value || null)}
                      className="form-select"
                      style={{ width: '100%' }}
                    >
                      <option value="">Ej tilldelad</option>
                      {(() => {
                        const eligible = booking.vehicleId
                          ? activeDrivers.filter(d => (d.vehicleIds || []).includes(booking.vehicleId) || d.id === booking.driverId)
                          : activeDrivers;
                        const available = eligible.filter(d => !isDriverOccupied(d.id, booking, data.bookings || []));
                        const occupied = eligible.filter(d => isDriverOccupied(d.id, booking, data.bookings || []));
                        return (
                          <>
                            {booking.vehicleId && eligible.length === 0 && (
                              <option disabled>Inga behöriga förare för valt fordon</option>
                            )}
                            {available.length > 0 && (
                              <optgroup label="Tillgängliga">
                                {available.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </optgroup>
                            )}
                            {occupied.length > 0 && (
                              <optgroup label="Upptagna">
                                {occupied.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setSelectedBooking(null)} className="btn btn-secondary">
                  Stäng
                </button>
                {setCurrentSection && setEditingBookingId && (
                  <button type="button" onClick={openEditInBooking} className="btn btn-primary">
                    Redigera bokning
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: block (flera överlappande bokningar) – blocknamn, första bokningen synlig, expandera för resten */}
      {selectedBlock && (() => {
        const blockBookings = selectedBlock.bookingIds
          .map(id => (data.bookings || []).find(b => b.id === id))
          .filter(Boolean);
        const first = blockBookings[0];
        const firstCustomer = first && (data.customers || []).find(c => c.id === first.customerId);
        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => { setSelectedBlock(null); setBlockModalExpanded(false); }}
          >
            <div
              style={{
                backgroundColor: '#1a2332',
                padding: '1.5rem',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid var(--color-border)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {blockNameEditValue !== null ? (
                <div style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={blockNameEditValue}
                    onChange={(e) => setBlockNameEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const name = blockNameEditValue.trim() || selectedBlock.name;
                        updateData({
                          bookingBlocks: (data.bookingBlocks || []).map(bl =>
                            bl.id === selectedBlock.blockId ? { ...bl, name } : bl
                          )
                        });
                        setSelectedBlock(prev => prev ? { ...prev, name } : null);
                        setBlockNameEditValue(null);
                      }
                      if (e.key === 'Escape') setBlockNameEditValue(null);
                    }}
                    className="form-input"
                    style={{ fontSize: '1.1rem', fontWeight: 600 }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setBlockNameEditValue(null)} className="btn btn-small btn-secondary">Avbryt</button>
                    <button
                      type="button"
                      className="btn btn-small btn-primary"
                      onClick={() => {
                        const name = blockNameEditValue.trim() || selectedBlock.name;
                        updateData({
                          bookingBlocks: (data.bookingBlocks || []).map(bl =>
                            bl.id === selectedBlock.blockId ? { ...bl, name } : bl
                          )
                        });
                        setSelectedBlock(prev => prev ? { ...prev, name } : null);
                        setBlockNameEditValue(null);
                      }}
                    >
                      Spara
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h2 className="text-subtitle" style={{ margin: 0 }}>
                    {selectedBlock.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setBlockNameEditValue(selectedBlock.name)}
                    className="btn btn-small btn-secondary"
                    title="Redigera blocknamn"
                    style={{ minWidth: '2rem', padding: '0.35rem' }}
                    aria-label="Redigera blocknamn"
                  >
                    ✎
                  </button>
                </div>
              )}
              {first && (
                <p className="text-muted-2 text-md" style={{ marginBottom: '1rem' }}>
                  {firstCustomer?.name || 'Okänd'} · {first.pickupDate || first.date} {formatTime24(first.pickupTime)} – {formatTime24(first.deliveryTime)}
                </p>
              )}
              <div
                role="button"
                tabIndex={0}
                className="text-muted-2 text-md" style={{ marginBottom: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => setBlockModalExpanded(prev => !prev)}
                onKeyDown={(e) => e.key === 'Enter' && setBlockModalExpanded(prev => !prev)}
              >
                <span style={{ fontSize: '0.7rem' }}>{blockModalExpanded ? '▼' : '▶'}</span>
                <span>{blockModalExpanded ? 'Dölj' : 'Visa'} alla {blockBookings.length} bokningar</span>
              </div>
              {blockModalExpanded && (
                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #2a3647' }}>
                  {blockBookings.map(b => {
                    const cust = (data.customers || []).find(c => c.id === b.customerId);
                    const openEdit = () => {
                      if (setReturnToSection) setReturnToSection('schema');
                      if (setEditingBookingId) setEditingBookingId(b.id);
                      if (setCurrentSection) setCurrentSection('booking');
                      setSelectedBlock(null);
                      setBlockModalExpanded(false);
                    };
                    const removeFromBlock = () => {
                      if (selectedBlock?.blockId) handleRemoveFromBlock(b.id, selectedBlock.blockId);
                    };
                    return (
                      <div key={b.id} style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '6px', fontSize: 'var(--font-size-base)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#e1e8ed', marginBottom: '0.35rem' }}>Bokning {b.bookingNo}</div>
                          <div style={{ color: '#94a3b8' }}>{cust?.name || 'Okänd'} · {b.pickupDate || b.date} {formatTime24(b.pickupTime)} – {formatTime24(b.deliveryTime)}</div>
                          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                            {b.pickupAddress || '-'} → {b.deliveryAddress || '-'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
                          {setCurrentSection && setEditingBookingId && (
                            <button type="button" onClick={openEdit} className="btn btn-small btn-primary">
                              Redigera
                            </button>
                          )}
                          {selectedBlock?.blockId && (
                            <button type="button" onClick={removeFromBlock} className="btn btn-small btn-secondary">
                              Ta bort från block
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setSelectedBlock(null); setBlockModalExpanded(false); }} className="btn btn-secondary">
                  Stäng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Schema;
