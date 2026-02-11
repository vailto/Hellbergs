import { BOOKING_STATUSES } from '../../utils/constants';
import TimeInput24 from '../TimeInput24';

function BookingFormSection({
  // State
  showForm,
  editingId,
  errors,
  formData,
  pickupMode,
  deliveryMode,
  selectedPickupLocationId,
  selectedDeliveryLocationId,
  // Data
  data,
  // Derived
  activeCustomers,
  activeVehicles,
  driversForSelectedVehicle,
  customerPickupLocations,
  allPickupLocations,
  formVehicleId,
  // Actions
  handleChange,
  handleSubmit,
  handleDelete,
  handleDuplicateBooking,
  handleCancelForm,
  handlePickupLocationSelect,
  handleDeliveryLocationSelect,
  setShowNewCustomerModal,
  setPickupMode,
  setDeliveryMode,
  setSelectedPickupLocationId,
  setSelectedDeliveryLocationId,
  setFormData,
}) {
  if (!showForm) {
    return null;
  }

  return (
    <div className="form">
      <h2>{editingId ? 'Redigera bokning' : 'Ny bokning'}</h2>

      {Object.keys(errors).length > 0 && (
        <div className="alert alert-error mb-2">
          <strong>Fel i formuläret:</strong>
          <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
            {Object.values(errors).map((error, idx) => error && <li key={idx}>{error}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Grunduppgifter + Fordon och förare (side by side) */}
        <div className="form-row form-row--two-cols">
          <div className="form-section" style={{ flex: 1, marginBottom: 0 }}>
            <div className="form-section-title">Grunduppgifter</div>

            <div className="form-row form-row--customer-priority">
              <div className="form-group">
                <label className="text-muted-2 label-sm">Kund *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    className={`form-select ${errors.customerId ? 'error' : ''}`}
                    style={{ flex: 1 }}
                  >
                    <option value="">Välj kund</option>
                    {activeCustomers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="btn btn-secondary"
                  >
                    + Ny
                  </button>
                </div>
                {errors.customerId && <div className="form-error">{errors.customerId}</div>}
              </div>

              {editingId && (
                <div className="form-group" style={{ maxWidth: '120px' }}>
                  <label className="text-muted-2 label-sm">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {BOOKING_STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="hasContainer"
                      checked={formData.hasContainer}
                      onChange={handleChange}
                    />
                    Container
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="hasTrailer"
                      checked={formData.hasTrailer}
                      onChange={handleChange}
                    />
                    Trailer
                  </label>
                </div>
              </div>
            </div>

            {(formData.hasContainer || formData.hasTrailer) && (
              <div className="form-row">
                {formData.hasContainer && (
                  <div className="form-group">
                    <input
                      type="text"
                      name="containerNr"
                      value={formData.containerNr}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="ContainerNr:"
                    />
                  </div>
                )}
                {formData.hasTrailer && (
                  <div className="form-group">
                    <input
                      type="text"
                      name="trailerNr"
                      value={formData.trailerNr}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="TrailerNr:"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <input
                type="text"
                name="marking"
                value={formData.marking}
                onChange={handleChange}
                className="form-input"
                placeholder="Märkning"
              />
            </div>
          </div>

          {/* Fordon och förare */}
          <div className="form-section" style={{ flex: 1, marginBottom: 0, minWidth: 200 }}>
            <div className="form-section-title">Fordon och förare</div>
            <div className="form-row" style={{ gap: '0.75rem' }}>
              <div className="form-group">
                <label className="text-muted-2 label-sm">Fordon</label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId || ''}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Välj fordon</option>
                  {activeVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.regNo} ({v.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="text-muted-2 label-sm">Förare</label>
                <select
                  name="driverId"
                  value={formData.driverId || ''}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Välj förare</option>
                  {formVehicleId && driversForSelectedVehicle.length === 0 && (
                    <option disabled>Inga behöriga förare för valt fordon</option>
                  )}
                  {driversForSelectedVehicle.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Upphämtning och Lämning */}
        <div className="form-row" style={{ gap: '0.75rem' }}>
          {/* Upphämtning */}
          <div className="form-section" style={{ flex: 1, marginBottom: 0 }}>
            <div className="form-section-title">Upphämtning</div>

            {/* Pickup mode selector */}
            <div className="form-group">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPickupMode('customer');
                    setSelectedPickupLocationId('');
                    setFormData(prev => ({ ...prev, pickupAddress: '' }));
                  }}
                  className={`btn btn-small ${pickupMode === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Kundplatser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPickupMode('browse');
                    setSelectedPickupLocationId('');
                    setFormData(prev => ({ ...prev, pickupAddress: '' }));
                  }}
                  className={`btn btn-small ${pickupMode === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Bläddra
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPickupMode('freetext');
                    setSelectedPickupLocationId('');
                    setFormData(prev => ({ ...prev, pickupAddress: '' }));
                  }}
                  className={`btn btn-small ${pickupMode === 'freetext' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Fritext
                </button>
              </div>
            </div>

            {pickupMode === 'customer' && formData.customerId && (
              <div className="form-group">
                <select
                  value={selectedPickupLocationId}
                  onChange={handlePickupLocationSelect}
                  className="form-select"
                >
                  <option value="">Välj plats</option>
                  {customerPickupLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {customerPickupLocations.length === 0 && (
                  <div className="text-base text-muted" style={{ marginTop: '0.5rem' }}>
                    Inga sparade platser för denna kund
                  </div>
                )}
              </div>
            )}

            {pickupMode === 'browse' && (
              <div className="form-group">
                <select
                  value={selectedPickupLocationId}
                  onChange={handlePickupLocationSelect}
                  className="form-select"
                >
                  <option value="">Välj plats</option>
                  {allPickupLocations.map(location => {
                    // Handle both old and new format
                    const customerIds =
                      location.customerIds || (location.customerId ? [location.customerId] : []);
                    const customers = customerIds
                      .map(id => data.customers.find(c => c.id === id))
                      .filter(Boolean);
                    const customerNames = customers.map(c => c.name).join(', ');

                    return (
                      <option key={location.id} value={location.id}>
                        {location.name} {customerNames ? `(${customerNames})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="form-group">
              <input
                type="text"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleChange}
                className={`form-input ${errors.pickupAddress ? 'error' : ''}`}
                placeholder="Adress *"
                readOnly={pickupMode !== 'freetext' && selectedPickupLocationId !== ''}
              />
              {errors.pickupAddress && <div className="form-error">{errors.pickupAddress}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="pickupPostalCode"
                  value={formData.pickupPostalCode}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Postnummer"
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <input
                  type="text"
                  name="pickupCity"
                  value={formData.pickupCity}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ort"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleChange}
                  className={`form-input ${errors.pickupDate ? 'error' : ''}`}
                />
                {errors.pickupDate && <div className="form-error">{errors.pickupDate}</div>}
              </div>

              <div className="form-group">
                <TimeInput24
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  className="form-input"
                  hasError={!!errors.pickupTime}
                />
                {errors.pickupTime && <div className="form-error">{errors.pickupTime}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="pickupContactName"
                  value={formData.pickupContactName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Kontaktperson"
                />
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  name="pickupContactPhone"
                  value={formData.pickupContactPhone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Telefon"
                />
              </div>
            </div>
          </div>

          {/* Lämning */}
          <div className="form-section" style={{ flex: 1, marginBottom: 0 }}>
            <div className="form-section-title">Lämning</div>

            {/* Delivery mode selector */}
            <div className="form-group">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode('customer');
                    setSelectedDeliveryLocationId('');
                    setFormData(prev => ({ ...prev, deliveryAddress: '' }));
                  }}
                  className={`btn btn-small ${deliveryMode === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Kundplatser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode('browse');
                    setSelectedDeliveryLocationId('');
                    setFormData(prev => ({ ...prev, deliveryAddress: '' }));
                  }}
                  className={`btn btn-small ${deliveryMode === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Bläddra
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode('freetext');
                    setSelectedDeliveryLocationId('');
                    setFormData(prev => ({ ...prev, deliveryAddress: '' }));
                  }}
                  className={`btn btn-small ${deliveryMode === 'freetext' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Fritext
                </button>
              </div>
            </div>

            {deliveryMode === 'customer' && formData.customerId && (
              <div className="form-group">
                <select
                  value={selectedDeliveryLocationId}
                  onChange={handleDeliveryLocationSelect}
                  className="form-select"
                >
                  <option value="">Välj plats</option>
                  {customerPickupLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {customerPickupLocations.length === 0 && (
                  <div className="text-base text-muted" style={{ marginTop: '0.5rem' }}>
                    Inga sparade platser för denna kund
                  </div>
                )}
              </div>
            )}

            {deliveryMode === 'browse' && (
              <div className="form-group">
                <select
                  value={selectedDeliveryLocationId}
                  onChange={handleDeliveryLocationSelect}
                  className="form-select"
                >
                  <option value="">Välj plats</option>
                  {allPickupLocations.map(location => {
                    // Handle both old and new format
                    const customerIds =
                      location.customerIds || (location.customerId ? [location.customerId] : []);
                    const customers = customerIds
                      .map(id => data.customers.find(c => c.id === id))
                      .filter(Boolean);
                    const customerNames = customers.map(c => c.name).join(', ');

                    return (
                      <option key={location.id} value={location.id}>
                        {location.name} {customerNames ? `(${customerNames})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="form-group">
              <input
                type="text"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleChange}
                className={`form-input ${errors.deliveryAddress ? 'error' : ''}`}
                placeholder="Adress *"
                readOnly={deliveryMode !== 'freetext' && selectedDeliveryLocationId !== ''}
              />
              {errors.deliveryAddress && <div className="form-error">{errors.deliveryAddress}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="deliveryPostalCode"
                  value={formData.deliveryPostalCode}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Postnummer"
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <input
                  type="text"
                  name="deliveryCity"
                  value={formData.deliveryCity}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ort"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className={`form-input ${errors.deliveryDate ? 'error' : ''}`}
                />
                {errors.deliveryDate && <div className="form-error">{errors.deliveryDate}</div>}
              </div>

              <div className="form-group">
                <TimeInput24
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleChange}
                  className="form-input"
                  hasError={!!errors.deliveryTime}
                />
                {errors.deliveryTime && <div className="form-error">{errors.deliveryTime}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="deliveryContactName"
                  value={formData.deliveryContactName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Kontaktperson"
                />
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  name="deliveryContactPhone"
                  value={formData.deliveryContactPhone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Telefon"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Prissättning */}
        <div className="form-section" style={{ marginTop: '0.75rem' }}>
          <div className="form-section-title">Prissättning</div>
          <div
            className="form-row"
            style={{
              gap: '0.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            }}
          >
            <div className="form-group">
              <label className="text-muted-2 label-sm">Km</label>
              <input
                type="text"
                name="km"
                value={formData.km}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="text-muted-2 label-sm">Stopp</label>
              <input
                type="text"
                name="costStops"
                value={formData.costStops}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="text-muted-2 label-sm">Väntetid (h)</label>
              <input
                type="text"
                name="costWaitHours"
                value={formData.costWaitHours}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="text-muted-2 label-sm">Timpris (h)</label>
              <input
                type="text"
                name="costDriveHours"
                value={formData.costDriveHours}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="text-muted-2 label-sm">Fast pris</label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="costUseFixed"
                  checked={formData.costUseFixed}
                  onChange={handleChange}
                />
                Ja
              </label>
              {formData.costUseFixed && (
                <input
                  type="text"
                  name="costFixedAmount"
                  value={formData.costFixedAmount}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="SEK"
                  style={{ marginTop: '0.25rem' }}
                />
              )}
            </div>
            <div className="form-group">
              <label className="text-muted-2 label-sm">Belopp (SEK)</label>
              <input
                type="text"
                name="amountSek"
                value={formData.amountSek}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Anteckningar */}
        <div className="form-section">
          <div className="form-section-title">Anteckningar</div>

          <div className="form-group">
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Anteckningar..."
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          {editingId && (
            <>
              <button
                type="button"
                onClick={() => handleDelete(editingId)}
                className="btn btn-danger"
              >
                Ta bort
              </button>
              <button
                type="button"
                onClick={handleDuplicateBooking}
                className="btn btn-secondary"
              >
                Duplicera
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleCancelForm}
            className="btn btn-secondary"
            style={{ marginLeft: 'auto' }}
          >
            Avbryt
          </button>
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Uppdatera' : 'Spara'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingFormSection;
