import CostEntryModal from '../CostEntryModal';

function BookingModals({
  // State
  showSaveLocationModal,
  tempLocationName,
  tempLocationCustomerId,
  pendingBookingData,
  editingBlockId,
  editingBlockNameValue,
  showNewCustomerModal,
  tempCustomerData,
  costEntryBookingId,
  // Data
  data,
  activeCustomers,
  // Actions
  setTempLocationName,
  setTempLocationCustomerId,
  handleSaveLocation,
  setEditingBlockId,
  setEditingBlockNameValue,
  updateData,
  handleTempCustomerChange,
  setShowNewCustomerModal,
  setTempCustomerData,
  handleSaveTempCustomer,
  handleCostSave,
  setCostEntryBookingId,
}) {
  return (
    <>
      {/* Save Location Modal */}
      {showSaveLocationModal && (
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
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              border: '1px solid var(--color-border)',
            }}
          >
            <h2 style={{ marginBottom: '1rem' }}>Spara plats?</h2>
            <p className="text-muted mb-2" style={{ marginBottom: '1.5rem' }}>
              Vill du spara <strong>{pendingBookingData?.pickupAddress}</strong> som en ny plats?
            </p>

            <div className="form-group">
              <input
                type="text"
                value={tempLocationName}
                onChange={e => setTempLocationName(e.target.value)}
                className="form-input"
                placeholder="Namn på platsen (t.ex. Huvudlager, Hamnen...)"
              />
            </div>

            <div className="form-group">
              <select
                value={tempLocationCustomerId}
                onChange={e => setTempLocationCustomerId(e.target.value)}
                className="form-select"
              >
                <option value="">Ingen kund (allmän plats)</option>
                {activeCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <div className="text-base text-muted" style={{ marginTop: '0.5rem' }}>
                Välj kund för att koppla platsen (kan läggas till fler senare i Inställningar)
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={() => handleSaveLocation(true)}
                className="btn btn-primary"
                disabled={!tempLocationName.trim()}
              >
                Spara plats
              </button>
              <button onClick={() => handleSaveLocation(false)} className="btn btn-secondary">
                Nej tack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Block Name Modal */}
      {editingBlockId &&
        (() => {
          const block = (data.bookingBlocks || []).find(bl => bl.id === editingBlockId);
          const handleSaveBlockName = () => {
            const name = editingBlockNameValue.trim();
            if (!name || !block) return;
            const updatedBlocks = (data.bookingBlocks || []).map(bl =>
              bl.id === editingBlockId ? { ...bl, name } : bl
            );
            updateData({ bookingBlocks: updatedBlocks });
            setEditingBlockId(null);
            setEditingBlockNameValue('');
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
              }}
              onClick={() => {
                setEditingBlockId(null);
                setEditingBlockNameValue('');
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  width: '90%',
                  maxWidth: '400px',
                  border: '1px solid var(--color-border)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-subtitle" style={{ margin: '0 0 1rem 0' }}>
                  Blocknamn
                </h2>
                <input
                  type="text"
                  value={editingBlockNameValue}
                  onChange={e => setEditingBlockNameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveBlockName();
                    if (e.key === 'Escape') {
                      setEditingBlockId(null);
                      setEditingBlockNameValue('');
                    }
                  }}
                  className="form-input"
                  placeholder="t.ex. City-turen"
                  style={{ marginBottom: '1rem' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBlockId(null);
                      setEditingBlockNameValue('');
                    }}
                    className="btn btn-secondary"
                  >
                    Avbryt
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBlockName}
                    className="btn btn-primary"
                    disabled={!editingBlockNameValue.trim()}
                  >
                    Spara
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* New Customer Modal */}
      {showNewCustomerModal && (
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
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--color-border)',
            }}
          >
            <h2 style={{ marginBottom: '1.5rem' }}>Ny kund</h2>
            <form onSubmit={handleSaveTempCustomer}>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={tempCustomerData.name}
                    onChange={handleTempCustomerChange}
                    className="form-input"
                    placeholder="Namn *"
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="customerNumber"
                    value={tempCustomerData.customerNumber}
                    onChange={handleTempCustomerChange}
                    className="form-input"
                    placeholder="Kundnummer"
                  />
                </div>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="contactPerson"
                  value={tempCustomerData.contactPerson}
                  onChange={handleTempCustomerChange}
                  className="form-input"
                  placeholder="Kontaktperson"
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="address"
                  value={tempCustomerData.address}
                  onChange={handleTempCustomerChange}
                  className="form-input"
                  placeholder="Adress"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="postalCode"
                    value={tempCustomerData.postalCode}
                    onChange={handleTempCustomerChange}
                    className="form-input"
                    placeholder="Postnummer"
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="city"
                    value={tempCustomerData.city}
                    onChange={handleTempCustomerChange}
                    className="form-input"
                    placeholder="Ort"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="tel"
                    name="phone"
                    value={tempCustomerData.phone}
                    onChange={handleTempCustomerChange}
                    className="form-input"
                    placeholder="Telefon"
                  />
                </div>

                <div className="form-group">
                  <input
                    type="tel"
                    name="mobile"
                    value={tempCustomerData.mobile}
                    onChange={handleTempCustomerChange}
                    className="form-input"
                    placeholder="Mobil"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Spara
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCustomerModal(false);
                    setTempCustomerData({
                      name: '',
                      address: '',
                      postalCode: '',
                      city: '',
                      phone: '',
                      mobile: '',
                      customerNumber: '',
                      contactPerson: '',
                      active: true,
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cost Entry Modal */}
      {costEntryBookingId &&
        (() => {
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
    </>
  );
}

export default BookingModals;
