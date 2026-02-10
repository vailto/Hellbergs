import React, { useState } from 'react';
import { formatNumber, formatTime24, generateId, generateBookingNumber } from '../utils/formatters';
import { assignVehicleToBooking, assignDriverToBooking } from '../utils/vehicleUtils';
import ConfirmModal from './ConfirmModal';
import CostEntryModal from './CostEntryModal';
import SortIcon from './SortIcon';

// Måndag för veckan som innehåller datum
function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function Planning({ data, updateData, setCurrentSection }) {
  const [planningTab, setPlanningTab] = useState('list'); // 'list' | 'week'
  const [costEntryBookingId, setCostEntryBookingId] = useState(null);
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date().toISOString().split('T')[0]));
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerId: '',
    status: '',
    selectedStatuses: [],
    includeUnplanned: false,
    vehicleId: '',
    driverId: ''
  });
  const [deleteId, setDeleteId] = useState(null);
  const [sortField, setSortField] = useState('pickupDate');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const toggleStatusFilter = (status) => {
    setFilters(prev => {
      const current = prev.selectedStatuses || [];
      return {
        ...prev,
        selectedStatuses: current.includes(status)
          ? current.filter(s => s !== status)
          : [...current, status]
      };
    });
  };

  const toggleUnplannedFilter = () => {
    setFilters(prev => ({
      ...prev,
      includeUnplanned: !prev.includeUnplanned
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFilteredBookings = () => {
    let filtered = [...data.bookings];

    if (filters.dateFrom) {
      filtered = filtered.filter(b => {
        const bookingDate = b.pickupDate || b.date;
        return bookingDate && bookingDate >= filters.dateFrom;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(b => {
        const bookingDate = b.pickupDate || b.date;
        return bookingDate && bookingDate <= filters.dateTo;
      });
    }
    if (filters.customerId) {
      filtered = filtered.filter(b => b.customerId === filters.customerId);
    }
    const statusList = filters.selectedStatuses || [];
    const includeUnplanned = filters.includeUnplanned;
    if (statusList.length > 0 || includeUnplanned) {
      filtered = filtered.filter(b => {
        const matchesStatus = statusList.length === 0 || statusList.includes(b.status);
        const isUnplanned = !b.vehicleId;
        const matchesUnplanned = includeUnplanned && isUnplanned;
        return matchesStatus || matchesUnplanned;
      });
    }
    if (filters.vehicleId) {
      filtered = filtered.filter(b => b.vehicleId === filters.vehicleId);
    }
    if (filters.driverId) {
      filtered = filtered.filter(b => b.driverId === filters.driverId);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'bookingNo':
          aVal = a.bookingNo || '';
          bVal = b.bookingNo || '';
          break;
        case 'pickupDate':
          const dateA = a.pickupDate || a.date || '';
          const dateB = b.pickupDate || b.date || '';
          const timeA = a.pickupTime || a.time || '';
          const timeB = b.pickupTime || b.time || '';
          aVal = `${dateA} ${timeA}`;
          bVal = `${dateB} ${timeB}`;
          break;
        case 'customer':
          const customerA = data.customers.find(c => c.id === a.customerId);
          const customerB = data.customers.find(c => c.id === b.customerId);
          aVal = customerA?.name || '';
          bVal = customerB?.name || '';
          break;
        case 'vehicle':
          const vehicleA = data.vehicles.find(v => v.id === a.vehicleId);
          const vehicleB = data.vehicles.find(v => v.id === b.vehicleId);
          aVal = vehicleA?.regNo || '';
          bVal = vehicleB?.regNo || '';
          break;
        case 'driver':
          const driverA = data.drivers.find(d => d.id === a.driverId);
          const driverB = data.drivers.find(d => d.id === b.driverId);
          aVal = driverA?.name || '';
          bVal = driverB?.name || '';
          break;
        case 'pickup':
          const pickupLocA = data.pickupLocations?.find(
            loc => loc.address.toLowerCase() === a.pickupAddress?.toLowerCase()
          );
          const pickupLocB = data.pickupLocations?.find(
            loc => loc.address.toLowerCase() === b.pickupAddress?.toLowerCase()
          );
          aVal = pickupLocA?.name || a.pickupCity || a.pickupAddress || '';
          bVal = pickupLocB?.name || b.pickupCity || b.pickupAddress || '';
          break;
        case 'delivery':
          const deliveryLocA = data.pickupLocations?.find(
            loc => loc.address.toLowerCase() === a.deliveryAddress?.toLowerCase()
          );
          const deliveryLocB = data.pickupLocations?.find(
            loc => loc.address.toLowerCase() === b.deliveryAddress?.toLowerCase()
          );
          aVal = deliveryLocA?.name || a.deliveryCity || a.deliveryAddress || '';
          bVal = deliveryLocB?.name || b.deliveryCity || b.deliveryAddress || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const handleStatusChange = (bookingId, newStatus) => {
    const updatedBookings = data.bookings.map(b =>
      b.id === bookingId ? { ...b, status: newStatus } : b
    );
    updateData({ bookings: updatedBookings });
  };

  const handleDuplicate = (booking) => {
    const { id, bookingNo, ...bookingData } = booking;
    const { bookingNo: newBookingNo, lastBookingNumber } = generateBookingNumber(data.lastBookingNumber);
    const newBooking = {
      ...bookingData,
      id: generateId('bk'),
      bookingNo: newBookingNo,
      status: 'Bokad',
      pickupDate: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0] // Keep for backwards compatibility
    };
    updateData({
      bookings: [...data.bookings, newBooking],
      lastBookingNumber
    });
  };

  const handleDelete = () => {
    const updatedBookings = data.bookings.filter(b => b.id !== deleteId);
    updateData({ bookings: updatedBookings });
    setDeleteId(null);
  };

  const handleEdit = (booking) => {
    setCurrentSection('booking');
  };

  const handleVehicleAssign = (bookingId, vehicleId) => {
    const updatedBookings = data.bookings.map(b =>
      b.id === bookingId ? assignVehicleToBooking(b, vehicleId, data.drivers) : b
    );
    updateData({ bookings: updatedBookings });
  };

  const handleDriverAssign = (bookingId, driverId) => {
    const updatedBookings = data.bookings.map(b =>
      b.id === bookingId ? assignDriverToBooking(b, driverId) : b
    );
    updateData({ bookings: updatedBookings });
  };

  const handleCostSave = (updatedBooking) => {
    const updatedBookings = data.bookings.map(b =>
      b.id === updatedBooking.id ? updatedBooking : b
    );
    updateData({ bookings: updatedBookings });
    setCostEntryBookingId(null);
  };

  const filteredBookings = getFilteredBookings();
  const activeCustomers = data.customers.filter(c => c.active);
  const activeDrivers = data.drivers.filter(d => d.active);
  const activeVehicles = data.vehicles.filter(v => v.active);

  // Veckoschema: Mån–Fre (5 dagar) från weekStart
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
  const bookingsByDay = weekDays.map(dayStr =>
    filteredBookings
      .filter(b => (b.pickupDate || b.date) === dayStr)
      .sort((a, b) => (a.pickupTime || a.time || '').localeCompare(b.pickupTime || b.time || ''))
  );
  const weekLabel = (() => {
    const m = new Date(weekStart + 'T12:00:00');
    const f = new Date(m);
    f.setDate(f.getDate() + 4);
    const fmt = (d) => d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    return `Vecka ${getWeekNumber(m)}, ${fmt(m)} – ${fmt(f)} ${m.getFullYear()}`;
  })();
  function getWeekNumber(d) {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  }

  return (
    <div>
      <h1>Planering</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #2a3647', paddingBottom: 0 }}>
        <button
          type="button"
          onClick={() => setPlanningTab('list')}
          className={`btn btn-small ${planningTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: planningTab === 'list' ? '2px solid #2563ab' : 'none',
            marginBottom: '-2px'
          }}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setPlanningTab('week')}
          className={`btn btn-small ${planningTab === 'week' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: planningTab === 'week' ? '2px solid #2563ab' : 'none',
            marginBottom: '-2px'
          }}
        >
          Veckoschema
        </button>
      </div>

      <div className="filters">
        <h3 className="filters-title">Filter</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label className="form-label">Från datum</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Till datum</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kund</label>
            <select
              name="customerId"
              value={filters.customerId}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">Alla kunder</option>
              {activeCustomers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Status / typ</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1rem', alignItems: 'center' }}>
              {['Bokad', 'Planerad', 'Genomförd', 'Fakturerad'].map(status => (
                <label key={status} className="checkbox-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={(filters.selectedStatuses || []).includes(status)}
                    onChange={() => toggleStatusFilter(status)}
                  />
                  {status}
                </label>
              ))}
              <label className="checkbox-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(filters.includeUnplanned)}
                  onChange={toggleUnplannedFilter}
                />
                Oplanerade (inga bil)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fordon</label>
            <select
              name="vehicleId"
              value={filters.vehicleId}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">Alla fordon</option>
              {activeVehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.regNo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Förare</label>
            <select
              name="driverId"
              value={filters.driverId}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">Alla förare</option>
              {activeDrivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {planningTab === 'list' && (
      <>
      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <p>Inga bookingar matchar filtren</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('pickupDate')}>
                  Datum
                  <SortIcon field="pickupDate" currentField={sortField} direction={sortDirection} />
                </th>
                <th>Tid</th>
                <th className="sortable" onClick={() => handleSort('customer')}>
                  Kund
                  <SortIcon field="customer" currentField={sortField} direction={sortDirection} />
                </th>
                <th className="sortable" onClick={() => handleSort('bookingNo')}>
                  Bokningsnr
                  <SortIcon field="bookingNo" currentField={sortField} direction={sortDirection} />
                </th>
                <th className="sortable" onClick={() => handleSort('vehicle')}>
                  Fordon
                  <SortIcon field="vehicle" currentField={sortField} direction={sortDirection} />
                </th>
                <th className="sortable" onClick={() => handleSort('driver')}>
                  Förare
                  <SortIcon field="driver" currentField={sortField} direction={sortDirection} />
                </th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  Status
                  <SortIcon field="status" currentField={sortField} direction={sortDirection} />
                </th>
                <th>Km</th>
                <th>Belopp</th>
                <th>Anteckning</th>
                <th>Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => {
                const customer = data.customers.find(c => c.id === booking.customerId);
                const vehicle = data.vehicles.find(v => v.id === booking.vehicleId);
                const driver = data.drivers.find(d => d.id === booking.driverId);

                return (
                  <tr key={booking.id}>
                    <td>{booking.pickupDate || booking.date || '-'}</td>
                    <td>{formatTime24(booking.pickupTime || booking.time)}</td>
                    <td>{customer?.name || 'Okänd'}</td>
                    <td>{booking.bookingNo}</td>
                    <td>
                      <select
                        value={booking.vehicleId || ''}
                        onChange={(e) => handleVehicleAssign(booking.id, e.target.value || null)}
                        className="form-select"
                        style={{ minWidth: '100px' }}
                      >
                        <option value="">Ej tilldelad</option>
                        {activeVehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.regNo}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={booking.driverId || ''}
                        onChange={(e) => handleDriverAssign(booking.id, e.target.value || null)}
                        className="form-select"
                        style={{ minWidth: '120px' }}
                      >
                        <option value="">Ej tilldelad</option>
                        {(() => {
                          const eligible = booking.vehicleId
                            ? activeDrivers.filter(d => (d.vehicleIds || []).includes(booking.vehicleId) || d.id === booking.driverId)
                            : activeDrivers;
                          return eligible.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ));
                        })()}
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>{booking.km != null ? formatNumber(booking.km) : '-'}</td>
                    <td>{booking.amountSek != null ? formatNumber(booking.amountSek) : '-'}</td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {booking.note || '-'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleEdit(booking)}
                          className="btn btn-small btn-primary"
                          title="Redigera"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => handleDuplicate(booking)}
                          className="btn btn-small btn-secondary"
                          title="Duplicera"
                        >
                          Duplicera
                        </button>
                        {(booking.status === 'Bokad' || booking.status === 'Planerad') && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'Genomförd')}
                            className="btn btn-small btn-success"
                            title="Markera som genomförd"
                          >
                            Genomförd
                          </button>
                        )}
                        {booking.status === 'Genomförd' && (
                          <>
                            <button
                              onClick={() => setCostEntryBookingId(booking.id)}
                              className="btn btn-small btn-secondary"
                              title="Ange kostnad"
                            >
                              Ange kostnad
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'Fakturerad')}
                              className="btn btn-small btn-success"
                              title="Markera som fakturerad"
                            >
                              Fakturera
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteId(booking.id)}
                          className="btn btn-small btn-danger"
                          title="Ta bort"
                        >
                          Ta bort
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}

      {planningTab === 'week' && (
        <div className="planning-week-view">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
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
            <span style={{ fontWeight: 600, color: '#e1e8ed', minWidth: '220px' }}>{weekLabel}</span>
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
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.75rem',
            minHeight: '200px'
          }}>
            {weekDays.map((dayStr, i) => {
              const d = new Date(dayStr + 'T12:00:00');
              const dayName = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre'][i];
              const dateLabel = d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
              const dayBookings = bookingsByDay[i];
              return (
                <div
                  key={dayStr}
                  style={{
                    background: '#1a2332',
                    border: '1px solid #2a3647',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '120px'
                  }}
                >
                  <div style={{ borderBottom: '1px solid #2a3647', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#e1e8ed' }}>
                    {dayName} {dateLabel}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {dayBookings.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: '#8899a6' }}>Inga körningar</span>
                    ) : (
                      dayBookings.map(booking => {
                        const customer = data.customers.find(c => c.id === booking.customerId);
                        const vehicle = data.vehicles.find(v => v.id === booking.vehicleId);
                        const status = booking.status || 'Bokad';
                        const statusColors = {
                          Bokad: { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444' },
                          Planerad: { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308' },
                          Genomförd: { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e' },
                          Fakturerad: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6' }
                        };
                        const colors = statusColors[status] || statusColors.Bokad;
                        return (
                          <div
                            key={booking.id}
                            style={{
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              padding: '0.5rem',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: '#e1e8ed', marginBottom: '0.25rem' }}>
                              {formatTime24(booking.pickupTime || booking.time)}
                            </div>
                            <div style={{ color: '#cbd5e1', marginBottom: '0.15rem' }}>
                              {customer?.name || 'Okänd'}
                            </div>
                            <div style={{ color: '#8899a6', fontSize: '0.75rem' }}>
                              {booking.bookingNo} · {vehicle ? vehicle.regNo : 'Ej tilldelad'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Ta bort booking"
          message="Är du säker på att du vill ta bort denna booking? Detta kan inte ångras."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {costEntryBookingId && (() => {
        const booking = data.bookings.find(b => b.id === costEntryBookingId);
        return booking ? (
          <CostEntryModal
            booking={booking}
            data={data}
            onSave={handleCostSave}
            onClose={() => setCostEntryBookingId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

export default Planning;


