import React from 'react';
import { getCustomerShort, formatTime24 } from '../../utils/formatters';
import BookingTabs from './BookingTabs';

function isRecurringBooking(booking) {
  return !!(booking?.recurringKey || booking?.recurringRuleId || booking?.recurringDate);
}

function BookingTableSection({
  // State
  showForm,
  currentTab,
  sortField,
  sortDirection,
  expandedBookingId,
  expandedBlockId,
  // Data
  data,
  // Derived
  rowsToRender,
  activeVehicles,
  activeDrivers,
  vehicleOccupied,
  driverOccupied,
  // Actions
  setCurrentTab,
  handleSort,
  setExpandedBookingId,
  setExpandedBlockId,
  setEditingBlockId,
  setEditingBlockNameValue,
  handleEdit,
  setCostEntryBookingId,
  handleVehicleAssign,
  handleDriverAssign,
  handleStatusChange,
}) {
  if (showForm) {
    return null;
  }

  return (
    <>
      {/* Tab Navigation */}
      <BookingTabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        bookings={data.bookings || []}
      />

      {rowsToRender.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <p>
            {currentTab === 'bokad' && 'Inga bokade bokningar ännu'}
            {currentTab === 'planerad' && 'Inga planerade bokningar ännu'}
            {currentTab === 'genomford' && 'Inga genomförda bokningar ännu'}
            {currentTab === 'prissatt' && 'Inga prissatta bokningar ännu'}
            {currentTab === 'fakturerad' && 'Inga fakturerade bokningar ännu'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('bookingNo')}>
                  Bokningsnr
                  <span className="sort-indicator">
                    {sortField === 'bookingNo' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('pickupDate')}>
                  Datum
                  <span className="sort-indicator">
                    {sortField === 'pickupDate' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('customer')}>
                  Kund
                  <span className="sort-indicator">
                    {sortField === 'customer' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('vehicle')}>
                  Fordon
                  <span className="sort-indicator">
                    {sortField === 'vehicle' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th>Förare</th>
                <th className="sortable" onClick={() => handleSort('pickup')}>
                  Upphämtning
                  <span className="sort-indicator">
                    {sortField === 'pickup' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('delivery')}>
                  Avlämning
                  <span className="sort-indicator">
                    {sortField === 'delivery' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  Status
                  <span className="sort-indicator">
                    {sortField === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th title="Lagervara med i bokningen" style={{ whiteSpace: 'nowrap' }}>
                  Lagervara
                </th>
                <th title="Åtgärder" style={{ width: '1%', whiteSpace: 'nowrap' }}>
                  Åtg.
                </th>
              </tr>
            </thead>
            <tbody>
              {rowsToRender.map((item, _idx) => {
                if (item.type === 'block') {
                  const { block, bookings } = item;
                  const first = bookings[0];
                  const isBlockExpanded = expandedBlockId === block.id;
                  const vehicle = data.vehicles.find(v => v.id === first?.vehicleId);
                  const driver = data.drivers.find(d => d.id === first?.driverId);
                  return (
                    <tr
                      key={`block-${block.id}`}
                      onClick={() => setExpandedBlockId(isBlockExpanded ? null : block.id)}
                      style={{
                        cursor: 'pointer',
                        background: isBlockExpanded ? 'rgba(42, 54, 71, 0.3)' : undefined,
                      }}
                    >
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="text-2xs text-muted">{isBlockExpanded ? '▼' : '▶'}</span>
                          <strong
                            style={{
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              textUnderlineOffset: '2px',
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              setEditingBlockId(block.id);
                              setEditingBlockNameValue(block.name || '');
                            }}
                            title="Klicka för att byta blocknamn"
                          >
                            {block.name}
                          </strong>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {first?.pickupDate || first?.date || '–'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{bookings.length} körningar</td>
                      <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        {vehicle ? vehicle.regNo : '–'}
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        {driver ? driver.name : '–'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>–</td>
                      <td style={{ whiteSpace: 'nowrap' }}>–</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          className={`status-badge status-${(first?.status || 'planerad').toLowerCase()}`}
                        >
                          {first?.status || 'Planerad'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {bookings.some(
                          b =>
                            (b.warehouseItems && b.warehouseItems.length > 0) ||
                            (b.warehouseStorageCost != null && b.warehouseStorageCost > 0)
                        )
                          ? 'Ja'
                          : '–'}
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditingBlockId(block.id);
                            setEditingBlockNameValue(block.name || '');
                          }}
                          className="btn btn-small btn-secondary"
                          title="Redigera blocknamn"
                          style={{ minWidth: '2rem', padding: '0.35rem' }}
                          aria-label="Redigera blocknamn"
                        >
                          ✎
                        </button>
                      </td>
                    </tr>
                  );
                }

                const booking = item.booking;
                const customer = data.customers.find(c => c.id === booking.customerId);
                const vehicle = data.vehicles.find(v => v.id === booking.vehicleId);
                const driver = data.drivers.find(d => d.id === booking.driverId);
                const isExpanded = expandedBookingId === booking.id;

                const pickupLocationData = data.pickupLocations.find(
                  loc => loc.address.toLowerCase() === booking.pickupAddress?.toLowerCase()
                );
                const deliveryLocationData = data.pickupLocations.find(
                  loc => loc.address.toLowerCase() === booking.deliveryAddress?.toLowerCase()
                );

                const pickupLocation =
                  pickupLocationData?.name || booking.pickupCity || booking.pickupAddress || '-';
                const deliveryLocation =
                  deliveryLocationData?.name ||
                  booking.deliveryCity ||
                  booking.deliveryAddress ||
                  '-';

                return (
                  <React.Fragment key={booking.id}>
                    <tr
                      onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                      style={{
                        cursor: 'pointer',
                        ...(item.isInBlock ? { background: 'rgba(15, 20, 25, 0.6)' } : {}),
                      }}
                    >
                      <td
                        style={{
                          whiteSpace: 'nowrap',
                          paddingLeft: item.isInBlock ? '2rem' : undefined,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span className="text-2xs text-muted">{isExpanded ? '▼' : '▶'}</span>
                          <strong>{booking.bookingNo}</strong>
                          {isRecurringBooking(booking) && (
                            <span className="recurring-badge" title="Återkommande bokning">
                              Återkommande
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{booking.pickupDate || booking.date}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{getCustomerShort(customer)}</td>
                      <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        {currentTab === 'bokad' || currentTab === 'planerad' ? (
                          <select
                            value={booking.vehicleId || ''}
                            onChange={e => handleVehicleAssign(booking.id, e.target.value || null)}
                            className="form-select table-select-inline"
                            style={{
                              minWidth: '58px',
                              maxWidth: '72px',
                              padding: '0.2rem 0.35rem',
                              fontSize: '0.75rem',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              background: booking.vehicleId
                                ? 'var(--color-bg-elevated)'
                                : 'var(--color-bg)',
                              color: 'var(--color-text)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                            }}
                          >
                            <option value="">Ej tilldelad</option>
                            {(() => {
                              const available = activeVehicles.filter(
                                v => !vehicleOccupied(v.id, booking)
                              );
                              const occupied = activeVehicles.filter(v =>
                                vehicleOccupied(v.id, booking)
                              );
                              return (
                                <>
                                  {available.length > 0 && (
                                    <optgroup label="Tillgängliga">
                                      {available.map(v => (
                                        <option key={v.id} value={v.id}>
                                          {v.regNo}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {occupied.length > 0 && (
                                    <optgroup label="Upptagna">
                                      {occupied.map(v => (
                                        <option key={v.id} value={v.id}>
                                          {v.regNo}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </>
                              );
                            })()}
                          </select>
                        ) : vehicle ? (
                          vehicle.regNo
                        ) : (
                          '-'
                        )}
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        {currentTab === 'bokad' || currentTab === 'planerad' ? (
                          <select
                            value={booking.driverId || ''}
                            onChange={e => handleDriverAssign(booking.id, e.target.value || null)}
                            className="form-select table-select-inline"
                            style={{
                              minWidth: '70px',
                              maxWidth: '88px',
                              padding: '0.2rem 0.35rem',
                              fontSize: '0.75rem',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              background: booking.driverId
                                ? 'var(--color-bg-elevated)'
                                : 'var(--color-bg)',
                              color: 'var(--color-text)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                            }}
                          >
                            <option value="">Ej tilldelad</option>
                            {(() => {
                              const eligible = booking.vehicleId
                                ? activeDrivers.filter(
                                    d =>
                                      (d.vehicleIds || []).includes(booking.vehicleId) ||
                                      d.id === booking.driverId
                                  )
                                : activeDrivers;
                              const available = eligible.filter(
                                d => !driverOccupied(d.id, booking)
                              );
                              const occupied = eligible.filter(d => driverOccupied(d.id, booking));
                              return (
                                <>
                                  {booking.vehicleId && eligible.length === 0 && (
                                    <option disabled>Inga behöriga förare</option>
                                  )}
                                  {available.length > 0 && (
                                    <optgroup label="Tillgängliga">
                                      {available.map(d => (
                                        <option key={d.id} value={d.id}>
                                          {d.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {occupied.length > 0 && (
                                    <optgroup label="Upptagna">
                                      {occupied.map(d => (
                                        <option key={d.id} value={d.id}>
                                          {d.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </>
                              );
                            })()}
                          </select>
                        ) : driver ? (
                          driver.name
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{pickupLocation}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{deliveryLocation}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          className={`status-badge status-${(booking.status === 'Planerad' && !booking.vehicleId ? 'Bokad' : booking.status).toLowerCase()}`}
                        >
                          {booking.status === 'Planerad' && !booking.vehicleId
                            ? 'Bokad'
                            : booking.status}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {(booking.warehouseItems && booking.warehouseItems.length > 0) ||
                        (booking.warehouseStorageCost != null && booking.warehouseStorageCost > 0)
                          ? 'Ja'
                          : '–'}
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        <div className="table-actions" style={{ flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleEdit(booking)}
                            className="btn btn-small btn-primary"
                            title="Redigera"
                            style={{ minWidth: '2rem', padding: '0.35rem' }}
                            aria-label="Redigera"
                          >
                            ✎
                          </button>
                          {booking.status === 'Genomförd' && (
                            <button
                              onClick={() => setCostEntryBookingId(booking.id)}
                              className="btn btn-small btn-warning"
                              title="Prissätta (ange kostnad)"
                              style={{ minWidth: '2rem', padding: '0.35rem' }}
                              aria-label="Prissätta"
                            >
                              $
                            </button>
                          )}
                          {booking.status === 'Prissatt' && (
                            <button
                              onClick={() => handleStatusChange(booking.id, 'Fakturerad')}
                              className="btn btn-small btn-success"
                              title="Fakturera"
                              style={{ minWidth: '2rem', padding: '0.35rem' }}
                              aria-label="Fakturera"
                            >
                              🧾
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td
                          colSpan="10"
                          style={{ backgroundColor: 'var(--color-bg)', padding: '1rem' }}
                        >
                          <div className="text-base mb-1" style={{ fontWeight: 600 }}>
                            {customer?.name || 'Okänd'}
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '1.5rem',
                            }}
                          >
                            {/* Upphämtning */}
                            <div>
                              <h4 className="detail-section-title">Upphämtning</h4>
                              <div className="text-base" style={{ display: 'grid', gap: '0.5rem' }}>
                                <div>
                                  <span className="detail-label">Adress: </span>
                                  <span className="detail-value">
                                    {booking.pickupAddress || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="detail-label">Datum: </span>
                                  <span className="detail-value">
                                    {booking.pickupDate || booking.date || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="detail-label">Tid: </span>
                                  <span className="detail-value">
                                    {formatTime24(booking.pickupTime || booking.time)}
                                  </span>
                                </div>
                                {booking.pickupContactName && (
                                  <div>
                                    <span className="detail-label">Kontakt: </span>
                                    <span className="detail-value">
                                      {booking.pickupContactName}
                                    </span>
                                  </div>
                                )}
                                {booking.pickupContactPhone && (
                                  <div>
                                    <span className="detail-label">Telefon: </span>
                                    <span className="detail-value">
                                      {booking.pickupContactPhone}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Lämning */}
                            <div>
                              <h4 className="detail-section-title">Lämning</h4>
                              <div className="text-base" style={{ display: 'grid', gap: '0.5rem' }}>
                                <div>
                                  <span className="detail-label">Adress: </span>
                                  <span className="detail-value">
                                    {booking.deliveryAddress || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="detail-label">Datum: </span>
                                  <span className="detail-value">
                                    {booking.deliveryDate || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="detail-label">Tid: </span>
                                  <span className="detail-value">
                                    {formatTime24(booking.deliveryTime)}
                                  </span>
                                </div>
                                {booking.deliveryContactName && (
                                  <div>
                                    <span className="detail-label">Kontakt: </span>
                                    <span className="detail-value">
                                      {booking.deliveryContactName}
                                    </span>
                                  </div>
                                )}
                                {booking.deliveryContactPhone && (
                                  <div>
                                    <span className="detail-label">Telefon: </span>
                                    <span className="detail-value">
                                      {booking.deliveryContactPhone}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Övrig info */}
                          <div
                            className="mt-1"
                            style={{
                              paddingTop: '1rem',
                              borderTop: '1px solid var(--color-border)',
                            }}
                          >
                            <div
                              className="text-base"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '0.75rem',
                              }}
                            >
                              <div>
                                <span className="detail-label">Bokningsnr: </span>
                                <span className="detail-value" style={{ fontWeight: 600 }}>
                                  {booking.bookingNo}
                                </span>
                              </div>
                              {booking.marking && (
                                <div>
                                  <span className="detail-label">Märkning: </span>
                                  <span className="detail-value" style={{ fontWeight: 600 }}>
                                    {booking.marking}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="detail-label">Förare: </span>
                                <span className="detail-value" style={{ fontWeight: 600 }}>
                                  {driver?.name || '-'}
                                </span>
                              </div>
                              {booking.km && (
                                <div>
                                  <span className="detail-label">Sträcka: </span>
                                  <span className="detail-value" style={{ fontWeight: 600 }}>
                                    {booking.km} km
                                  </span>
                                </div>
                              )}
                              {booking.amountSek && (
                                <div>
                                  <span className="detail-label">Pris: </span>
                                  <span className="detail-value" style={{ fontWeight: 600 }}>
                                    {booking.amountSek} SEK
                                  </span>
                                </div>
                              )}
                            </div>
                            {booking.note && (
                              <div style={{ marginTop: '0.75rem' }}>
                                <span className="detail-label">Anteckning: </span>
                                <span className="detail-value">{booking.note}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default BookingTableSection;
