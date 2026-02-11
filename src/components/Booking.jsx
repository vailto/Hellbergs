import React, { useEffect } from 'react';
import {
  generateId,
  generateBookingNumber,
  formatNumber,
  parseNumber,
  formatTime24,
  getCurrentTime24,
  getCustomerShort,
} from '../utils/formatters';
import { BOOKING_STATUSES } from '../utils/constants';
import { validateBooking } from '../utils/validation';
import CostEntryModal from './CostEntryModal';
import TimeInput24 from './TimeInput24';
import BookingTabs from './booking/BookingTabs';
import useBookingState from '../hooks/useBookingState';

function Booking({
  data,
  updateData,
  setCurrentSection,
  editingBookingId,
  setEditingBookingId,
  returnToSection,
  setReturnToSection,
}) {
  // Use custom hook for all state management
  const {
    currentTab,
    setCurrentTab,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    costEntryBookingId,
    setCostEntryBookingId,
    showNewCustomerModal,
    setShowNewCustomerModal,
    showSaveLocationModal,
    setShowSaveLocationModal,
    editingBlockId,
    setEditingBlockId,
    editingBlockNameValue,
    setEditingBlockNameValue,
    showForm,
    setShowForm,
    editingId,
    setEditingId,
    errors,
    setErrors,
    formData,
    setFormData,
    pickupMode,
    setPickupMode,
    deliveryMode,
    setDeliveryMode,
    selectedPickupLocationId,
    setSelectedPickupLocationId,
    selectedDeliveryLocationId,
    setSelectedDeliveryLocationId,
    tempLocationName,
    setTempLocationName,
    tempLocationCustomerId,
    setTempLocationCustomerId,
    pendingBookingData,
    setPendingBookingData,
    tempCustomerData,
    setTempCustomerData,
    expandedBookingId,
    setExpandedBookingId,
    expandedBlockId,
    setExpandedBlockId,
    activeCustomers,
    activeVehicles,
    activeDrivers,
    formVehicleId,
    formDriverId,
    driversForSelectedVehicle,
    customerPickupLocations,
    allPickupLocations,
    rowsToRender,
    resetForm,
    vehicleOccupied,
    driverOccupied,
  } = useBookingState(data, editingBookingId);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Reset pickup mode when customer changes
    if (name === 'customerId') {
      setPickupMode('customer');
      setSelectedPickupLocationId('');
    }

    if (name === 'vehicleId') {
      const vehicleId = value || null;
      const authorizedDrivers = vehicleId
        ? (data.drivers || []).filter(d => (d.vehicleIds || []).includes(vehicleId))
        : [];
      const driverId = authorizedDrivers.length === 1 ? authorizedDrivers[0].id : null;
      setFormData(prev => ({
        ...prev,
        vehicleId: vehicleId || '',
        driverId: driverId || '',
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePickupLocationSelect = e => {
    const locationId = e.target.value;
    setSelectedPickupLocationId(locationId);

    if (locationId) {
      const location = data.pickupLocations.find(l => l.id === locationId);
      if (location) {
        setFormData(prev => ({
          ...prev,
          pickupAddress: location.address,
          pickupPostalCode: location.postalCode || '',
          pickupCity: location.city || '',
        }));
      }
    }
  };

  const handleDeliveryLocationSelect = e => {
    const locationId = e.target.value;
    setSelectedDeliveryLocationId(locationId);

    if (locationId) {
      const location = data.pickupLocations.find(l => l.id === locationId);
      if (location) {
        setFormData(prev => ({
          ...prev,
          deliveryAddress: location.address,
          deliveryPostalCode: location.postalCode || '',
          deliveryCity: location.city || '',
        }));
      }
    }
  };

  const handleNewBooking = () => {
    setShowForm(true);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = booking => {
    const cd = booking.costDetails || {};
    setFormData({
      ...booking,
      km: booking.km !== null ? String(booking.km) : '',
      amountSek: booking.amountSek !== null ? String(booking.amountSek) : '',
      costStops: cd.stops != null ? String(cd.stops) : '',
      costWaitHours: cd.waitHours != null ? String(cd.waitHours) : '',
      costDriveHours: cd.driveHours != null ? String(cd.driveHours) : '',
      costUseFixed: cd.fixed != null && cd.fixed !== 0,
      costFixedAmount: cd.fixed != null ? String(cd.fixed) : '',
    });
    setEditingId(booking.id);
    setShowForm(true);
  };

  // Öppna redigering när vi kommer från Schema (editingBookingId satt från App)
  useEffect(() => {
    if (!editingBookingId || !setEditingBookingId || !data?.bookings) return;
    const b = data.bookings.find(x => x.id === editingBookingId);
    if (b) handleEdit(b);
    setEditingBookingId(null);
  }, [editingBookingId]);

  const handleDelete = bookingId => {
    if (window.confirm('Är du säker på att du vill ta bort denna bokning?')) {
      const updatedBookings = data.bookings.filter(b => b.id !== bookingId);
      updateData({ bookings: updatedBookings });
    }
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Validate
    const validationErrors = validateBooking(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    const existing = editingId ? data.bookings.find(b => b.id === editingId) : null;
    const kmVal = formData.km !== '' && formData.km != null ? parseNumber(formData.km) : null;
    const amountVal =
      formData.amountSek !== '' && formData.amountSek != null
        ? parseNumber(formData.amountSek)
        : null;
    const num = v => parseNumber(v) ?? 0;
    const costDetails = {
      km: num(formData.km) || undefined,
      stops: num(formData.costStops) || undefined,
      waitHours: num(formData.costWaitHours) || undefined,
      driveHours: num(formData.costDriveHours) || undefined,
      fixed: formData.costUseFixed ? (num(formData.costFixedAmount) ?? undefined) : undefined,
    };
    const hasCostDetails =
      costDetails.km ||
      costDetails.stops ||
      costDetails.waitHours ||
      costDetails.driveHours ||
      (formData.costUseFixed && costDetails.fixed != null);
    const bookingData =
      editingId && existing
        ? {
            ...formData,
            id: editingId,
            bookingNo: existing.bookingNo,
            vehicleId: formData.vehicleId || null,
            driverId: formData.driverId || null,
            km: kmVal,
            amountSek: amountVal,
            costDetails: hasCostDetails ? costDetails : (existing.costDetails ?? undefined),
          }
        : {
            ...formData,
            vehicleId: formData.vehicleId || null,
            driverId: formData.driverId || null,
            status: formData.vehicleId ? 'Planerad' : formData.status,
            km: kmVal,
            amountSek: amountVal,
            costDetails: hasCostDetails ? costDetails : undefined,
          };

    if (editingId) {
      const updatedBookings = data.bookings.map(b => (b.id === editingId ? bookingData : b));
      updateData({ bookings: updatedBookings });
      resetForm();
      setShowForm(false);
      if (returnToSection && setCurrentSection) {
        setCurrentSection(returnToSection);
        if (setReturnToSection) setReturnToSection(null);
      }
    } else {
      // Check if we should ask to save pickup location
      const pickupAddressExists = data.pickupLocations.some(
        loc => loc.address.toLowerCase() === formData.pickupAddress.toLowerCase()
      );

      if (pickupMode === 'freetext' && formData.pickupAddress && !pickupAddressExists) {
        // Ask to save location
        setPendingBookingData(bookingData);
        setTempLocationName('');
        setTempLocationCustomerId(formData.customerId);
        setShowSaveLocationModal(true);
      } else {
        // Save booking directly
        saveBooking(bookingData);
      }
    }
  };

  const saveBooking = bookingData => {
    const { bookingNo, lastBookingNumber } = generateBookingNumber(data.lastBookingNumber);
    const newBooking = {
      ...bookingData,
      id: generateId('bk'),
      bookingNo,
    };
    updateData({
      bookings: [...data.bookings, newBooking],
      lastBookingNumber,
    });
    resetForm();
    setShowForm(false);
  };

  const handleSaveLocation = shouldSave => {
    if (shouldSave && tempLocationName.trim()) {
      const newLocation = {
        id: generateId('loc'),
        name: tempLocationName.trim(),
        address: pendingBookingData.pickupAddress,
        postalCode: pendingBookingData.pickupPostalCode || '',
        city: pendingBookingData.pickupCity || '',
        customerIds: tempLocationCustomerId ? [tempLocationCustomerId] : [],
      };
      updateData({
        pickupLocations: [...data.pickupLocations, newLocation],
      });
    }

    // Save the booking
    if (pendingBookingData) {
      saveBooking(pendingBookingData);
      setPendingBookingData(null);
    }

    setShowSaveLocationModal(false);
    setTempLocationName('');
    setTempLocationCustomerId('');
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
    if (returnToSection && setCurrentSection) {
      setCurrentSection(returnToSection);
      if (setReturnToSection) setReturnToSection(null);
    }
  };

  const handleDuplicateBooking = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultTime = getCurrentTime24();
    const duplicateData = {
      customerId: formData.customerId,
      vehicleId: null,
      driverId: null,
      hasContainer: formData.hasContainer,
      hasTrailer: formData.hasTrailer,
      containerNr: formData.containerNr || '',
      trailerNr: formData.trailerNr || '',
      marking: formData.marking || '',
      pickupAddress: formData.pickupAddress || '',
      pickupPostalCode: formData.pickupPostalCode || '',
      pickupCity: formData.pickupCity || '',
      pickupDate: todayStr,
      pickupTime: defaultTime,
      pickupContactName: formData.pickupContactName || '',
      pickupContactPhone: formData.pickupContactPhone || '',
      deliveryAddress: formData.deliveryAddress || '',
      deliveryPostalCode: formData.deliveryPostalCode || '',
      deliveryCity: formData.deliveryCity || '',
      deliveryDate: todayStr,
      deliveryTime: defaultTime,
      deliveryContactName: formData.deliveryContactName || '',
      deliveryContactPhone: formData.deliveryContactPhone || '',
      km: '',
      amountSek: '',
      costStops: '',
      costWaitHours: '',
      costDriveHours: '',
      costUseFixed: false,
      costFixedAmount: '',
      status: 'Bokad',
      note: formData.note || '',
    };
    const { bookingNo, lastBookingNumber } = generateBookingNumber(data.lastBookingNumber);
    const newBooking = {
      ...duplicateData,
      id: generateId('bk'),
      bookingNo,
      date: todayStr,
      time: defaultTime,
    };
    updateData({
      bookings: [...data.bookings, newBooking],
      lastBookingNumber,
    });
    setFormData(duplicateData);
    setEditingId(null);
    setPickupMode('customer');
    setDeliveryMode('customer');
    setSelectedPickupLocationId('');
    setSelectedDeliveryLocationId('');
    setErrors({});
  };

  // New customer modal handlers
  const handleTempCustomerChange = e => {
    const { name, value } = e.target;
    setTempCustomerData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveTempCustomer = e => {
    e.preventDefault();
    if (!tempCustomerData.name.trim()) {
      alert('Namn krävs');
      return;
    }

    const newCustomer = {
      ...tempCustomerData,
      id: generateId('cust'),
      pricesByVehicleType: {},
    };

    updateData({ customers: [...data.customers, newCustomer] });

    // Set the new customer as selected
    setFormData(prev => ({
      ...prev,
      customerId: newCustomer.id,
    }));

    // Close modal and reset temp data
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
  };

  const handleVehicleAssign = (bookingId, vehicleId) => {
    const booking = data.bookings.find(b => b.id === bookingId);
    const authorizedDrivers = vehicleId
      ? (data.drivers || []).filter(d => (d.vehicleIds || []).includes(vehicleId))
      : [];
    const keepDriver =
      vehicleId && booking?.driverId && authorizedDrivers.some(d => d.id === booking.driverId);
    const driverId = keepDriver ? booking.driverId : null;
    const updatedBookings = data.bookings.map(b => {
      if (b.id !== bookingId) return b;
      const next = { ...b, vehicleId: vehicleId || null, driverId };
      if (vehicleId && (b.status === 'Bokad' || (b.status === 'Planerad' && !b.vehicleId)))
        next.status = 'Planerad';
      if (!vehicleId && b.status === 'Planerad') next.status = 'Bokad';
      return next;
    });
    updateData({ bookings: updatedBookings });
  };

  const handleDriverAssign = (bookingId, driverId) => {
    const updatedBookings = data.bookings.map(b => {
      if (b.id !== bookingId) return b;
      const next = { ...b, driverId: driverId || null };
      // Om fordon redan tilldelat och status Bokad, sätt till Planerad
      if (b.vehicleId && driverId && b.status === 'Bokad') next.status = 'Planerad';
      return next;
    });
    updateData({ bookings: updatedBookings });
  };

  const handleStatusChange = (bookingId, newStatus) => {
    const updatedBookings = data.bookings.map(b =>
      b.id === bookingId ? { ...b, status: newStatus } : b
    );
    updateData({ bookings: updatedBookings });
  };

  const handleCostSave = updatedBooking => {
    const updatedBookings = data.bookings.map(b =>
      b.id === updatedBooking.id ? { ...updatedBooking, status: 'Prissatt' } : b
    );
    updateData({ bookings: updatedBookings });
    setCostEntryBookingId(null);
  };

  // Sorting function
  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div>
      <h1>Bokningar</h1>

      {!showForm && (
        <button onClick={handleNewBooking} className="btn btn-primary mb-2">
          + Ny bokning
        </button>
      )}

      {/* Single page form */}
      {showForm && (
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
                          location.customerIds ||
                          (location.customerId ? [location.customerId] : []);
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
                          location.customerIds ||
                          (location.customerId ? [location.customerId] : []);
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
                  {errors.deliveryAddress && (
                    <div className="form-error">{errors.deliveryAddress}</div>
                  )}
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
      )}

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

      {/* Redigera blocknamn – modal (ersätter prompt så att det fungerar överallt) */}
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

      {/* Bookings List */}
      {!showForm && (
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
                    <th title="Åtgärder" style={{ width: '1%', whiteSpace: 'nowrap' }}>
                      Åtg.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowsToRender.map((item, idx) => {
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
                              <span className="text-2xs text-muted">
                                {isBlockExpanded ? '▼' : '▶'}
                              </span>
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
                      pickupLocationData?.name ||
                      booking.pickupCity ||
                      booking.pickupAddress ||
                      '-';
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="text-2xs text-muted">{isExpanded ? '▼' : '▶'}</span>
                              <strong>{booking.bookingNo}</strong>
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {booking.pickupDate || booking.date}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{getCustomerShort(customer)}</td>
                          <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                            {currentTab === 'bokad' || currentTab === 'planerad' ? (
                              <select
                                value={booking.vehicleId || ''}
                                onChange={e =>
                                  handleVehicleAssign(booking.id, e.target.value || null)
                                }
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
                                onChange={e =>
                                  handleDriverAssign(booking.id, e.target.value || null)
                                }
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
                                  const occupied = eligible.filter(d =>
                                    driverOccupied(d.id, booking)
                                  );
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
                              colSpan="9"
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
                                  <div
                                    className="text-base"
                                    style={{ display: 'grid', gap: '0.5rem' }}
                                  >
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
                                  <div
                                    className="text-base"
                                    style={{ display: 'grid', gap: '0.5rem' }}
                                  >
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
      )}

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
    </div>
  );
}

export default Booking;
