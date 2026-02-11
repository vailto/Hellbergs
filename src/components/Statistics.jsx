import React, { useState } from 'react';
import { formatNumber, formatCurrency } from '../utils/formatters';

function Statistics({ data }) {
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [showCustomerFilter, setShowCustomerFilter] = useState(false);
  const [showVehicleFilter, setShowVehicleFilter] = useState(false);

  const toggleCustomer = customerId => {
    setSelectedCustomers(prev =>
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const toggleVehicle = vehicleId => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId) ? prev.filter(id => id !== vehicleId) : [...prev, vehicleId]
    );
  };

  const calculateStats = () => {
    // Filter bookings based on date range, customers, vehicles, and status
    const filteredBookings = data.bookings.filter(booking => {
      const bookingDate = booking.pickupDate || booking.date;
      if (!bookingDate) return false;

      // Date filter
      if (bookingDate < dateFrom || bookingDate > dateTo) return false;

      // Status filter - exclude cancelled
      if (booking.status === 'Avbruten') return false;

      // Customer filter
      if (selectedCustomers.length > 0 && !selectedCustomers.includes(booking.customerId))
        return false;

      // Vehicle filter
      if (selectedVehicles.length > 0 && !selectedVehicles.includes(booking.vehicleId))
        return false;

      return true;
    });

    // Calculate totals
    const totalKm = filteredBookings.reduce((sum, booking) => {
      return sum + (booking.km || 0);
    }, 0);

    const totalAmount = filteredBookings.reduce((sum, booking) => {
      return sum + (booking.amountSek || 0);
    }, 0);

    const totalBookings = filteredBookings.length;

    // Calculate by status
    const byStatus = {
      Bokad: 0,
      Planerad: 0,
      Genomförd: 0,
      Prissatt: 0,
      Fakturerad: 0,
    };
    filteredBookings.forEach(booking => {
      if (byStatus.hasOwnProperty(booking.status)) {
        byStatus[booking.status]++;
      }
    });

    return {
      totalKm,
      totalAmount,
      totalBookings,
      byStatus,
    };
  };

  // Calculate comparison periods
  const calculateComparisonStats = (compareFrom, compareTo) => {
    const filteredBookings = data.bookings.filter(booking => {
      const bookingDate = booking.pickupDate || booking.date;
      if (!bookingDate) return false;
      if (bookingDate < compareFrom || bookingDate > compareTo) return false;
      if (booking.status === 'Avbruten') return false;
      if (selectedCustomers.length > 0 && !selectedCustomers.includes(booking.customerId))
        return false;
      if (selectedVehicles.length > 0 && !selectedVehicles.includes(booking.vehicleId))
        return false;
      return true;
    });

    return {
      totalKm: filteredBookings.reduce((sum, b) => sum + (b.km || 0), 0),
      totalAmount: filteredBookings.reduce((sum, b) => sum + (b.amountSek || 0), 0),
      totalBookings: filteredBookings.length,
    };
  };

  // Calculate date ranges for comparisons
  const getPreviousPeriod = () => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const daysDiff = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - daysDiff + 1);

    return {
      from: prevFrom.toISOString().split('T')[0],
      to: prevTo.toISOString().split('T')[0],
    };
  };

  const getSamePeriodLastYear = () => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    from.setFullYear(from.getFullYear() - 1);
    to.setFullYear(to.getFullYear() - 1);

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  };

  const stats = calculateStats();
  const previousPeriod = getPreviousPeriod();
  const prevStats = calculateComparisonStats(previousPeriod.from, previousPeriod.to);
  const lastYearPeriod = getSamePeriodLastYear();
  const lastYearStats = calculateComparisonStats(lastYearPeriod.from, lastYearPeriod.to);

  const activeCustomers = data.customers.filter(c => c.active);
  const activeVehicles = data.vehicles.filter(v => v.active);

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const setDateRange = range => {
    const now = new Date();
    let from, to;

    switch (range) {
      case 'today':
        from = to = now.toISOString().split('T')[0];
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        from = startOfWeek.toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
        break;
      default:
        break;
    }

    setDateFrom(from);
    setDateTo(to);
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <div
        style={{
          background: '#1a2332',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid #2a3647',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            marginBottom: '1rem',
          }}
        >
          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label
              className="label-sm text-muted"
              style={{ marginBottom: '0.5rem', display: 'block' }}
            >
              Från
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label
              className="label-sm text-muted"
              style={{ marginBottom: '0.5rem', display: 'block' }}
            >
              Till
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className="btn btn-small btn-secondary"
            >
              Idag
            </button>
            <button
              type="button"
              onClick={() => setDateRange('week')}
              className="btn btn-small btn-secondary"
            >
              Vecka
            </button>
            <button
              type="button"
              onClick={() => setDateRange('month')}
              className="btn btn-small btn-secondary"
            >
              Månad
            </button>
            <button
              type="button"
              onClick={() => setDateRange('year')}
              className="btn btn-small btn-secondary"
            >
              År
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '200px' }}>
            <button
              type="button"
              onClick={() => setShowCustomerFilter(!showCustomerFilter)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>Kunder {selectedCustomers.length > 0 && `(${selectedCustomers.length})`}</span>
              <span>{showCustomerFilter ? '▲' : '▼'}</span>
            </button>
            {showCustomerFilter && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {activeCustomers.map(customer => (
                  <label
                    key={customer.id}
                    className="checkbox-label"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      padding: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomer(customer.id)}
                    />
                    <span style={{ marginLeft: '0.5rem' }}>{customer.name}</span>
                  </label>
                ))}
                {selectedCustomers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCustomers([])}
                    className="btn btn-small btn-secondary"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    Rensa alla
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '200px' }}>
            <button
              type="button"
              onClick={() => setShowVehicleFilter(!showVehicleFilter)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>Bilar {selectedVehicles.length > 0 && `(${selectedVehicles.length})`}</span>
              <span>{showVehicleFilter ? '▲' : '▼'}</span>
            </button>
            {showVehicleFilter && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {activeVehicles.map(vehicle => (
                  <label
                    key={vehicle.id}
                    className="checkbox-label"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      padding: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVehicles.includes(vehicle.id)}
                      onChange={() => toggleVehicle(vehicle.id)}
                    />
                    <span style={{ marginLeft: '0.5rem' }}>
                      {vehicle.regNo} ({vehicle.type})
                    </span>
                  </label>
                ))}
                {selectedVehicles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedVehicles([])}
                    className="btn btn-small btn-secondary"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    Rensa alla
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stats-container">
        {/* Card 1: Current Period Stats with Status Distribution */}
        <div className="stat-card">
          <div className="stat-label">Vald Period</div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>
                Bokningar
              </div>
              <div className="text-2xl" style={{ fontWeight: 700 }}>
                {stats.totalBookings}
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>
                Körsträcka
              </div>
              <div className="text-2xl" style={{ fontWeight: 700 }}>
                {formatNumber(stats.totalKm)} km
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>
                Intäkt
              </div>
              <div className="text-2xl" style={{ fontWeight: 700 }}>
                {formatNumber(stats.totalAmount)} SEK
              </div>
            </div>
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <div className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                Status
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="status-badge status-bokad">Bokad: {stats.byStatus['Bokad']}</span>
                <span className="status-badge status-planerad">
                  Planerad: {stats.byStatus['Planerad']}
                </span>
                <span className="status-badge status-genomförd">
                  Genomförd: {stats.byStatus['Genomförd']}
                </span>
                <span className="status-badge status-prissatt">
                  Prissatta: {stats.byStatus['Prissatt']}
                </span>
                <span className="status-badge status-fakturerad">
                  Fakturerad: {stats.byStatus['Fakturerad']}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Comparison vs Previous Period */}
        <div className="stat-card">
          <div className="stat-label">Jämfört med Föregående Period</div>
          <div style={{ color: '#8899a6', fontSize: '0.7rem', marginTop: '0.25rem' }}>
            {previousPeriod.from} till {previousPeriod.to}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ color: '#8899a6', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Bokningar
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-2xl" style={{ fontWeight: 700 }}>
                  {stats.totalBookings}
                </span>
                <span
                  style={{
                    color: stats.totalBookings >= prevStats.totalBookings ? '#34d399' : '#f87171',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {stats.totalBookings >= prevStats.totalBookings ? '▲' : '▼'}{' '}
                  {Math.abs(
                    calculatePercentageChange(stats.totalBookings, prevStats.totalBookings)
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="text-2xs text-muted">Förra: {prevStats.totalBookings}</div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ color: '#8899a6', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Körsträcka
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-2xl" style={{ fontWeight: 700 }}>
                  {formatNumber(stats.totalKm)} km
                </span>
                <span
                  style={{
                    color: stats.totalKm >= prevStats.totalKm ? '#34d399' : '#f87171',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {stats.totalKm >= prevStats.totalKm ? '▲' : '▼'}{' '}
                  {Math.abs(calculatePercentageChange(stats.totalKm, prevStats.totalKm)).toFixed(1)}
                  %
                </span>
              </div>
              <div className="text-2xs text-muted">Förra: {formatNumber(prevStats.totalKm)} km</div>
            </div>
            <div>
              <div style={{ color: '#8899a6', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Intäkt
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-2xl" style={{ fontWeight: 700 }}>
                  {formatNumber(stats.totalAmount)} SEK
                </span>
                <span
                  style={{
                    color: stats.totalAmount >= prevStats.totalAmount ? '#34d399' : '#f87171',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {stats.totalAmount >= prevStats.totalAmount ? '▲' : '▼'}{' '}
                  {Math.abs(
                    calculatePercentageChange(stats.totalAmount, prevStats.totalAmount)
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="text-2xs text-muted">
                Förra: {formatNumber(prevStats.totalAmount)} SEK
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Comparison vs Same Period Last Year */}
        <div className="stat-card">
          <div className="stat-label">Jämfört med Samma Period Förra Året</div>
          <div style={{ color: '#8899a6', fontSize: '0.7rem', marginTop: '0.25rem' }}>
            {lastYearPeriod.from} till {lastYearPeriod.to}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ color: '#8899a6', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Bokningar
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-2xl" style={{ fontWeight: 700 }}>
                  {stats.totalBookings}
                </span>
                <span
                  style={{
                    color:
                      stats.totalBookings >= lastYearStats.totalBookings ? '#34d399' : '#f87171',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {stats.totalBookings >= lastYearStats.totalBookings ? '▲' : '▼'}{' '}
                  {Math.abs(
                    calculatePercentageChange(stats.totalBookings, lastYearStats.totalBookings)
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div style={{ color: '#8899a6', fontSize: '0.7rem' }}>
                Förra året: {lastYearStats.totalBookings}
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ color: '#8899a6', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Körsträcka
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-2xl" style={{ fontWeight: 700 }}>
                  {formatNumber(stats.totalKm)} km
                </span>
                <span
                  style={{
                    color: stats.totalKm >= lastYearStats.totalKm ? '#34d399' : '#f87171',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {stats.totalKm >= lastYearStats.totalKm ? '▲' : '▼'}{' '}
                  {Math.abs(
                    calculatePercentageChange(stats.totalKm, lastYearStats.totalKm)
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div style={{ color: '#8899a6', fontSize: '0.7rem' }}>
                Förra året: {formatNumber(lastYearStats.totalKm)} km
              </div>
            </div>
            <div>
              <div style={{ color: '#8899a6', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Intäkt
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-2xl" style={{ fontWeight: 700 }}>
                  {formatNumber(stats.totalAmount)} SEK
                </span>
                <span
                  style={{
                    color: stats.totalAmount >= lastYearStats.totalAmount ? '#34d399' : '#f87171',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {stats.totalAmount >= lastYearStats.totalAmount ? '▲' : '▼'}{' '}
                  {Math.abs(
                    calculatePercentageChange(stats.totalAmount, lastYearStats.totalAmount)
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div style={{ color: '#8899a6', fontSize: '0.7rem' }}>
                Förra året: {formatNumber(lastYearStats.totalAmount)} SEK
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
