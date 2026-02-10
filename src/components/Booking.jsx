import React, { useState } from 'react';
import { generateId, generateBookingNumber, formatNumber, parseNumber } from '../utils/formatters';
import { validateBooking } from '../utils/validation';

function Booking({ data, updateData, setCurrentSection }) {
  const [currentTab, setCurrentTab] = useState('planerad');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [pickupMode, setPickupMode] = useState('customer'); // 'customer', 'browse', 'freetext'
  const [deliveryMode, setDeliveryMode] = useState('customer'); // 'customer', 'browse', 'freetext'
  const [selectedPickupLocationId, setSelectedPickupLocationId] = useState('');
  const [selectedDeliveryLocationId, setSelectedDeliveryLocationId] = useState('');
  const [tempLocationName, setTempLocationName] = useState('');
  const [tempLocationCustomerId, setTempLocationCustomerId] = useState('');
  const [pendingBookingData, setPendingBookingData] = useState(null);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [sortField, setSortField] = useState('pickupDate');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const [tempCustomerData, setTempCustomerData] = useState({
    name: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    mobile: '',
    customerNumber: '',
    contactPerson: '',
    active: true
  });

  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    driverId: '',
    hasContainer: false,
    hasTrailer: false,
    containerNr: '',
    trailerNr: '',
    marking: '',
    pickupAddress: '',
    pickupPostalCode: '',
    pickupCity: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: new Date().toTimeString().slice(0, 5),
    pickupContactName: '',
    pickupContactPhone: '',
    deliveryAddress: '',
    deliveryPostalCode: '',
    deliveryCity: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: new Date().toTimeString().slice(0, 5),
    deliveryContactName: '',
    deliveryContactPhone: '',
    km: '',
    amountSek: '',
    status: 'Planerad',
    note: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If vehicle changes, auto-fill driver if vehicle has one
    if (name === 'vehicleId') {
      const vehicle = data.vehicles.find(v => v.id === value);
      if (vehicle && vehicle.driverId) {
        setFormData(prev => ({
          ...prev,
          driverId: vehicle.driverId
        }));
      }
    }

    // Reset pickup mode when customer changes
    if (name === 'customerId') {
      setPickupMode('customer');
      setSelectedPickupLocationId('');
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePickupLocationSelect = (e) => {
    const locationId = e.target.value;
    setSelectedPickupLocationId(locationId);
    
    if (locationId) {
      const location = data.pickupLocations.find(l => l.id === locationId);
      if (location) {
        setFormData(prev => ({
          ...prev,
          pickupAddress: location.address,
          pickupPostalCode: location.postalCode || '',
          pickupCity: location.city || ''
        }));
      }
    }
  };

  const handleDeliveryLocationSelect = (e) => {
    const locationId = e.target.value;
    setSelectedDeliveryLocationId(locationId);
    
    if (locationId) {
      const location = data.pickupLocations.find(l => l.id === locationId);
      if (location) {
        setFormData(prev => ({
          ...prev,
          deliveryAddress: location.address,
          deliveryPostalCode: location.postalCode || '',
          deliveryCity: location.city || ''
        }));
      }
    }
  };

  const handleNewBooking = () => {
    setShowForm(true);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (booking) => {
    setFormData({
      ...booking,
      km: booking.km !== null ? String(booking.km) : '',
      amountSek: booking.amountSek !== null ? String(booking.amountSek) : ''
    });
    setEditingId(booking.id);
    setShowForm(true);
  };

  const handleDelete = (bookingId) => {
    if (window.confirm('Är du säker på att du vill ta bort denna bokning?')) {
      const updatedBookings = data.bookings.filter(b => b.id !== bookingId);
      updateData({ bookings: updatedBookings });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = validateBooking(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    // Prepare booking data
    const bookingData = {
      ...formData,
      km: parseNumber(formData.km),
      amountSek: parseNumber(formData.amountSek)
    };

    if (editingId) {
      // Update existing booking
      const updatedBookings = data.bookings.map(b =>
        b.id === editingId ? { ...bookingData, id: editingId, bookingNo: b.bookingNo } : b
      );
      updateData({ bookings: updatedBookings });
      resetForm();
      setShowForm(false);
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

  const saveBooking = (bookingData) => {
    const { bookingNo, lastBookingNumber } = generateBookingNumber(data.lastBookingNumber);
    const newBooking = {
      ...bookingData,
      id: generateId('bk'),
      bookingNo
    };
    updateData({
      bookings: [...data.bookings, newBooking],
      lastBookingNumber
    });
    resetForm();
    setShowForm(false);
  };

  const handleSaveLocation = (shouldSave) => {
    if (shouldSave && tempLocationName.trim()) {
      const newLocation = {
        id: generateId('loc'),
        name: tempLocationName.trim(),
        address: pendingBookingData.pickupAddress,
        postalCode: pendingBookingData.pickupPostalCode || '',
        city: pendingBookingData.pickupCity || '',
        customerIds: tempLocationCustomerId ? [tempLocationCustomerId] : []
      };
      updateData({
        pickupLocations: [...data.pickupLocations, newLocation]
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

  const resetForm = () => {
    setFormData({
      customerId: '',
      vehicleId: '',
      driverId: '',
      hasContainer: false,
      hasTrailer: false,
      containerNr: '',
      trailerNr: '',
      marking: '',
      pickupAddress: '',
      pickupPostalCode: '',
      pickupCity: '',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTime: new Date().toTimeString().slice(0, 5),
      pickupContactName: '',
      pickupContactPhone: '',
      deliveryAddress: '',
      deliveryPostalCode: '',
      deliveryCity: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryTime: new Date().toTimeString().slice(0, 5),
      deliveryContactName: '',
      deliveryContactPhone: '',
      km: '',
      amountSek: '',
      status: 'Planerad',
      note: ''
    });
    setEditingId(null);
    setErrors({});
    setPickupMode('customer');
    setDeliveryMode('customer');
    setSelectedPickupLocationId('');
    setSelectedDeliveryLocationId('');
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  // New customer modal handlers
  const handleTempCustomerChange = (e) => {
    const { name, value } = e.target;
    setTempCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveTempCustomer = (e) => {
    e.preventDefault();
    if (!tempCustomerData.name.trim()) {
      alert('Namn krävs');
      return;
    }

    const newCustomer = {
      ...tempCustomerData,
      id: generateId('cust'),
      pricesByVehicleType: {}
    };
    
    updateData({ customers: [...data.customers, newCustomer] });
    
    // Set the new customer as selected
    setFormData(prev => ({
      ...prev,
      customerId: newCustomer.id
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
      active: true
    });
  };

  const activeCustomers = data.customers.filter(c => c.active);
  const activeDrivers = data.drivers.filter(d => d.active);
  const activeVehicles = data.vehicles.filter(v => v.active);

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortBookings = (bookings) => {
    return [...bookings].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'bookingNo':
          aVal = a.bookingNo || '';
          bVal = b.bookingNo || '';
          break;
        case 'pickupDate':
          aVal = a.pickupDate || a.date || '';
          bVal = b.pickupDate || b.date || '';
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
        case 'pickup':
          const pickupLocA = data.pickupLocations.find(
            loc => loc.address.toLowerCase() === a.pickupAddress?.toLowerCase()
          );
          const pickupLocB = data.pickupLocations.find(
            loc => loc.address.toLowerCase() === b.pickupAddress?.toLowerCase()
          );
          aVal = pickupLocA?.name || a.pickupCity || a.pickupAddress || '';
          bVal = pickupLocB?.name || b.pickupCity || b.pickupAddress || '';
          break;
        case 'delivery':
          const deliveryLocA = data.pickupLocations.find(
            loc => loc.address.toLowerCase() === a.deliveryAddress?.toLowerCase()
          );
          const deliveryLocB = data.pickupLocations.find(
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
  };
  
  // Get pickup locations for selected customer
  const customerPickupLocations = formData.customerId 
    ? (data.pickupLocations || []).filter(loc => {
        // Handle both old format (customerId) and new format (customerIds)
        const customerIds = loc.customerIds || (loc.customerId ? [loc.customerId] : []);
        return customerIds.includes(formData.customerId) || customerIds.length === 0;
      })
    : [];
  
  // Get all pickup locations for browse mode
  const allPickupLocations = data.pickupLocations || [];

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
                {Object.values(errors).map((error, idx) => error && (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Grunduppgifter */}
            <div className="form-section">
              <div className="form-section-title">Grunduppgifter</div>
              
              <div className="form-row">
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e1e8ed' }}>
                    Kund *
                  </label>
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
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e1e8ed' }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="Planerad">Planerad</option>
                      <option value="Genomförd">Genomförd</option>
                      <option value="Fakturerad">Fakturerad</option>
                      <option value="Avbruten">Avbruten</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e1e8ed' }}>
                    Fordon *
                  </label>
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    className={`form-select ${errors.vehicleId ? 'error' : ''}`}
                  >
                    <option value="">Välj fordon</option>
                    {activeVehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.regNo} ({vehicle.type})
                      </option>
                    ))}
                  </select>
                  {errors.vehicleId && <div className="form-error">{errors.vehicleId}</div>}
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e1e8ed' }}>
                    Förare
                  </label>
                  <select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Välj förare</option>
                    {activeDrivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.code || driver.name.substring(0, 4).toUpperCase()} - {driver.name}
                      </option>
                    ))}
                  </select>
                </div>
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

            {/* Upphämtning och Lämning */}
            <div className="form-row" style={{ gap: '1.5rem' }}>
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
                      <div style={{ fontSize: '0.85rem', color: '#8899a6', marginTop: '0.5rem' }}>
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
                        const customerIds = location.customerIds || (location.customerId ? [location.customerId] : []);
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
                    <input
                      type="time"
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleChange}
                      className={`form-input ${errors.pickupTime ? 'error' : ''}`}
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
                      <div style={{ fontSize: '0.85rem', color: '#8899a6', marginTop: '0.5rem' }}>
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
                        const customerIds = location.customerIds || (location.customerId ? [location.customerId] : []);
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
                    <input
                      type="time"
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleChange}
                      className={`form-input ${errors.deliveryTime ? 'error' : ''}`}
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

            {/* Ekonomi & Anteckningar */}
            <div className="form-section" style={{ marginTop: '1.5rem' }}>
              <div className="form-section-title">Ekonomi & Anteckningar</div>
              
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="km"
                    value={formData.km}
                    onChange={handleChange}
                    className={`form-input ${errors.km ? 'error' : ''}`}
                    placeholder="Sträcka (km)"
                  />
                  {errors.km && <div className="form-error">{errors.km}</div>}
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="amountSek"
                    value={formData.amountSek}
                    onChange={handleChange}
                    className={`form-input ${errors.amountSek ? 'error' : ''}`}
                    placeholder="Pris (SEK)"
                  />
                  {errors.amountSek && <div className="form-error">{errors.amountSek}</div>}
                </div>
              </div>

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
                <button
                  type="button"
                  onClick={() => handleDelete(editingId)}
                  className="btn btn-danger"
                >
                  Ta bort
                </button>
              )}
              <button type="button" onClick={handleCancelForm} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a2332',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            border: '1px solid #2a3647'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Spara plats?</h2>
            <p style={{ color: '#8899a6', marginBottom: '1.5rem' }}>
              Vill du spara <strong>{pendingBookingData?.pickupAddress}</strong> som en ny plats?
            </p>

            <div className="form-group">
              <input
                type="text"
                value={tempLocationName}
                onChange={(e) => setTempLocationName(e.target.value)}
                className="form-input"
                placeholder="Namn på platsen (t.ex. Huvudlager, Hamnen...)"
              />
            </div>

            <div className="form-group">
              <select
                value={tempLocationCustomerId}
                onChange={(e) => setTempLocationCustomerId(e.target.value)}
                className="form-select"
              >
                <option value="">Ingen kund (allmän plats)</option>
                {activeCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.85rem', color: '#8899a6', marginTop: '0.5rem' }}>
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
              <button 
                onClick={() => handleSaveLocation(false)} 
                className="btn btn-secondary"
              >
                Nej tack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a2332',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #2a3647'
          }}>
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
                      active: true
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
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
            borderBottom: '2px solid #2a3647',
            paddingBottom: '0'
          }}>
            <button
              onClick={() => setCurrentTab('planerad')}
              className={`btn btn-small ${currentTab === 'planerad' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '6px 6px 0 0',
                borderBottom: currentTab === 'planerad' ? '2px solid #2563ab' : 'none',
                marginBottom: '-2px'
              }}
            >
              Planerade ({data.bookings.filter(b => b.status === 'Planerad').length})
            </button>
            <button
              onClick={() => setCurrentTab('genomford')}
              className={`btn btn-small ${currentTab === 'genomford' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '6px 6px 0 0',
                borderBottom: currentTab === 'genomford' ? '2px solid #2563ab' : 'none',
                marginBottom: '-2px'
              }}
            >
              Genomförda ({data.bookings.filter(b => b.status === 'Genomförd').length})
            </button>
            <button
              onClick={() => setCurrentTab('fakturerad')}
              className={`btn btn-small ${currentTab === 'fakturerad' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '6px 6px 0 0',
                borderBottom: currentTab === 'fakturerad' ? '2px solid #2563ab' : 'none',
                marginBottom: '-2px'
              }}
            >
              Fakturerade ({data.bookings.filter(b => b.status === 'Fakturerad').length})
            </button>
          </div>

          {data.bookings.filter(b => b.status === (currentTab === 'planerad' ? 'Planerad' : currentTab === 'genomford' ? 'Genomförd' : 'Fakturerad')).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"></div>
              <p>
                {currentTab === 'planerad' && 'Inga planerade bokningar ännu'}
                {currentTab === 'genomford' && 'Inga genomförda bokningar ännu'}
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
                    <th>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {sortBookings(data.bookings.filter(b => b.status === (currentTab === 'planerad' ? 'Planerad' : currentTab === 'genomford' ? 'Genomförd' : 'Fakturerad'))).map(booking => {
                    const customer = data.customers.find(c => c.id === booking.customerId);
                    const vehicle = data.vehicles.find(v => v.id === booking.vehicleId);
                    const driver = data.drivers.find(d => d.id === booking.driverId);
                    const isExpanded = expandedBookingId === booking.id;

                    // Formatera upphämtning och avlämning - visa platsnamn från sparade platser
                    const pickupLocationData = data.pickupLocations.find(
                      loc => loc.address.toLowerCase() === booking.pickupAddress?.toLowerCase()
                    );
                    const deliveryLocationData = data.pickupLocations.find(
                      loc => loc.address.toLowerCase() === booking.deliveryAddress?.toLowerCase()
                    );

                    const pickupLocation = pickupLocationData?.name
                      || booking.pickupCity
                      || booking.pickupAddress
                      || '-';
                    const deliveryLocation = deliveryLocationData?.name
                      || booking.deliveryCity
                      || booking.deliveryAddress
                      || '-';

                    return (
                      <React.Fragment key={booking.id}>
                        <tr
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#8899a6' }}>
                                {isExpanded ? '▼' : '▶'}
                              </span>
                              <strong>{booking.bookingNo}</strong>
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {booking.pickupDate || booking.date}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{customer?.name || 'Okänd'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{vehicle ? vehicle.regNo : '-'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {pickupLocation}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {deliveryLocation}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleEdit(booking)}
                              className="btn btn-small btn-primary"
                            >
                              Redigera
                            </button>
                          </td>
                        </tr>
                        
                        {isExpanded && (
                          <tr>
                            <td colSpan="8" style={{ backgroundColor: '#0f1419', padding: '1rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* Upphämtning */}
                                <div>
                                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#e1e8ed', fontSize: '0.9rem', borderBottom: '1px solid #2a3647', paddingBottom: '0.5rem' }}>
                                    Upphämtning
                                  </h4>
                                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Adress: </span>
                                      <span style={{ color: '#e1e8ed' }}>{booking.pickupAddress || '-'}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Datum: </span>
                                      <span style={{ color: '#e1e8ed' }}>{booking.pickupDate || booking.date || '-'}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Tid: </span>
                                      <span style={{ color: '#e1e8ed' }}>{booking.pickupTime || booking.time || '-'}</span>
                                    </div>
                                    {booking.pickupContactName && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Kontakt: </span>
                                        <span style={{ color: '#e1e8ed' }}>{booking.pickupContactName}</span>
                                      </div>
                                    )}
                                    {booking.pickupContactPhone && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Telefon: </span>
                                        <span style={{ color: '#e1e8ed' }}>{booking.pickupContactPhone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Lämning */}
                                <div>
                                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#e1e8ed', fontSize: '0.9rem', borderBottom: '1px solid #2a3647', paddingBottom: '0.5rem' }}>
                                    Lämning
                                  </h4>
                                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Adress: </span>
                                      <span style={{ color: '#e1e8ed' }}>{booking.deliveryAddress || '-'}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Datum: </span>
                                      <span style={{ color: '#e1e8ed' }}>{booking.deliveryDate || '-'}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Tid: </span>
                                      <span style={{ color: '#e1e8ed' }}>{booking.deliveryTime || '-'}</span>
                                    </div>
                                    {booking.deliveryContactName && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Kontakt: </span>
                                        <span style={{ color: '#e1e8ed' }}>{booking.deliveryContactName}</span>
                                      </div>
                                    )}
                                    {booking.deliveryContactPhone && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Telefon: </span>
                                        <span style={{ color: '#e1e8ed' }}>{booking.deliveryContactPhone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Övrig info */}
                              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a3647' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                                  <div>
                                    <span style={{ color: '#8899a6' }}>Bokningsnr: </span>
                                    <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{booking.bookingNo}</span>
                                  </div>
                                  {booking.marking && (
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Märkning: </span>
                                      <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{booking.marking}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span style={{ color: '#8899a6' }}>Förare: </span>
                                    <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{driver?.name || '-'}</span>
                                  </div>
                                  {booking.km && (
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Sträcka: </span>
                                      <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{booking.km} km</span>
                                    </div>
                                  )}
                                  {booking.amountSek && (
                                    <div>
                                      <span style={{ color: '#8899a6' }}>Pris: </span>
                                      <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{booking.amountSek} SEK</span>
                                    </div>
                                  )}
                                </div>
                                {booking.note && (
                                  <div style={{ marginTop: '0.75rem' }}>
                                    <span style={{ color: '#8899a6' }}>Anteckning: </span>
                                    <span style={{ color: '#e1e8ed' }}>{booking.note}</span>
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
    </div>
  );
}

export default Booking;
