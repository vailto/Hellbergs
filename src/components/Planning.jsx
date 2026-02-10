import React, { useState } from 'react';
import { formatNumber, generateId, generateBookingNumber } from '../utils/formatters';
import ConfirmModal from './ConfirmModal';

function Planning({ data, updateData, setCurrentSection }) {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerId: '',
    status: '',
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
    if (filters.status) {
      filtered = filtered.filter(b => b.status === filters.status);
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
      status: 'Planerad',
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
    // Navigate to booking section and trigger edit
    // This is a simplified approach - in a real app you'd pass the booking to edit
    setCurrentSection('booking');
  };

  const filteredBookings = getFilteredBookings();
  const activeCustomers = data.customers.filter(c => c.active);
  const activeDrivers = data.drivers.filter(d => d.active);
  const activeVehicles = data.vehicles.filter(v => v.active);

  return (
    <div>
      <h1>Planering</h1>

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
            <label className="form-label">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">Alla status</option>
              <option value="Planerad">Planerad</option>
              <option value="Genomförd">Genomförd</option>
              <option value="Fakturerad">Fakturerad</option>
              <option value="Avbruten">Avbruten</option>
            </select>
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
                  <span className="sort-indicator">
                    {sortField === 'pickupDate' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th>Tid</th>
                <th className="sortable" onClick={() => handleSort('customer')}>
                  Kund
                  <span className="sort-indicator">
                    {sortField === 'customer' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('bookingNo')}>
                  Bokningsnr
                  <span className="sort-indicator">
                    {sortField === 'bookingNo' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('vehicle')}>
                  Fordon
                  <span className="sort-indicator">
                    {sortField === 'vehicle' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('driver')}>
                  Förare
                  <span className="sort-indicator">
                    {sortField === 'driver' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  Status
                  <span className="sort-indicator">
                    {sortField === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
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
                    <td>{booking.pickupTime || booking.time || '-'}</td>
                    <td>{customer?.name || 'Okänd'}</td>
                    <td>{booking.bookingNo}</td>
                    <td>{vehicle?.regNo || '-'}</td>
                    <td>{driver?.name || '-'}</td>
                    <td>
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>{booking.km !== null ? formatNumber(booking.km) : '-'}</td>
                    <td>{booking.amountSek !== null ? formatNumber(booking.amountSek) : '-'}</td>
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
                        {booking.status === 'Planerad' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'Genomförd')}
                            className="btn btn-small btn-success"
                            title="Markera som genomförd"
                          >
                            ✓
                          </button>
                        )}
                        {booking.status === 'Genomförd' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'Fakturerad')}
                            className="btn btn-small btn-success"
                            title="Markera som fakturerad"
                          >
                            Fakturera
                          </button>
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

      {deleteId && (
        <ConfirmModal
          title="Ta bort booking"
          message="Är du säker på att du vill ta bort denna booking? Detta kan inte ångras."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

export default Planning;


