import { useEffect } from 'react';
import {
  generateId,
  generateBookingNumber,
  parseNumber,
  getCurrentTime24,
} from '../../utils/formatters';
import { validateBooking } from '../../utils/validation';
import BookingModals from './BookingModals';
import useRecurringBooking from '../../hooks/useRecurringBooking';
import BookingFormSection from './BookingFormSection';
import BookingTableSection from './BookingTableSection';
import useBookingState from '../../hooks/useBookingState';

function BookingPage({
  data,
  updateData,
  setCurrentSection,
  editingBookingId,
  setEditingBookingId,
  returnToSection,
  setReturnToSection,
  saveBooking: saveBookingToApi,
  removeBooking: removeBookingFromApi,
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

  const { saveBookingWithRecurring, recurringMessage } = useRecurringBooking({
    data,
    updateData,
    saveBookingToApi,
    resetForm,
    setShowForm,
  });

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

  const handleDelete = async bookingId => {
    if (window.confirm('Är du säker på att du vill ta bort denna bokning?')) {
      try {
        await removeBookingFromApi(bookingId);
      } catch {
        alert('Kunde inte ta bort bokning. Försök igen.');
      }
    }
  };

  const handleSubmit = async e => {
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
      try {
        await saveBookingToApi(bookingData);
        resetForm();
        setShowForm(false);
        if (returnToSection && setCurrentSection) {
          setCurrentSection(returnToSection);
          if (setReturnToSection) setReturnToSection(null);
        }
      } catch {
        alert('Kunde inte spara bokning. Försök igen.');
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
        saveBookingWithRecurring(bookingData);
      }
    }
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
      saveBookingWithRecurring(pendingBookingData);
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

  const handleVehicleAssign = async (bookingId, vehicleId) => {
    const booking = data.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const authorizedDrivers = vehicleId
      ? (data.drivers || []).filter(d => (d.vehicleIds || []).includes(vehicleId))
      : [];
    const keepDriver =
      vehicleId && booking?.driverId && authorizedDrivers.some(d => d.id === booking.driverId);
    const driverId = keepDriver ? booking.driverId : null;

    const updatedBooking = { ...booking, vehicleId: vehicleId || null, driverId };
    if (
      vehicleId &&
      (booking.status === 'Bokad' || (booking.status === 'Planerad' && !booking.vehicleId))
    )
      updatedBooking.status = 'Planerad';
    if (!vehicleId && booking.status === 'Planerad') updatedBooking.status = 'Bokad';

    try {
      await saveBookingToApi(updatedBooking);
    } catch {
      alert('Kunde inte tilldela fordon. Försök igen.');
    }
  };

  const handleDriverAssign = async (bookingId, driverId) => {
    const booking = data.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const updatedBooking = { ...booking, driverId: driverId || null };
    // Om fordon redan tilldelat och status Bokad, sätt till Planerad
    if (booking.vehicleId && driverId && booking.status === 'Bokad') {
      updatedBooking.status = 'Planerad';
    }

    try {
      await saveBookingToApi(updatedBooking);
    } catch {
      alert('Kunde inte tilldela förare. Försök igen.');
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    const booking = data.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const updatedBooking = { ...booking, status: newStatus };
    try {
      await saveBookingToApi(updatedBooking);
    } catch {
      alert('Kunde inte ändra status. Försök igen.');
    }
  };

  const handleCostSave = async updatedBooking => {
    const bookingWithStatus = { ...updatedBooking, status: 'Prissatt' };
    try {
      await saveBookingToApi(bookingWithStatus);
      setCostEntryBookingId(null);
    } catch {
      alert('Kunde inte spara kostnader. Försök igen.');
    }
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

      {/* Recurring confirmation message */}
      {recurringMessage && (
        <div
          className="alert alert-success mb-2"
          style={{ padding: '0.75rem', backgroundColor: '#d4edda', border: '1px solid #c3e6cb' }}
        >
          {recurringMessage}
        </div>
      )}

      {/* Booking Form */}
      <BookingFormSection
        showForm={showForm}
        editingId={editingId}
        errors={errors}
        formData={formData}
        pickupMode={pickupMode}
        deliveryMode={deliveryMode}
        selectedPickupLocationId={selectedPickupLocationId}
        selectedDeliveryLocationId={selectedDeliveryLocationId}
        data={data}
        activeCustomers={activeCustomers}
        activeVehicles={activeVehicles}
        driversForSelectedVehicle={driversForSelectedVehicle}
        customerPickupLocations={customerPickupLocations}
        allPickupLocations={allPickupLocations}
        formVehicleId={formVehicleId}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleDelete={handleDelete}
        handleDuplicateBooking={handleDuplicateBooking}
        handleCancelForm={handleCancelForm}
        handlePickupLocationSelect={handlePickupLocationSelect}
        handleDeliveryLocationSelect={handleDeliveryLocationSelect}
        setShowNewCustomerModal={setShowNewCustomerModal}
        setPickupMode={setPickupMode}
        setDeliveryMode={setDeliveryMode}
        setSelectedPickupLocationId={setSelectedPickupLocationId}
        setSelectedDeliveryLocationId={setSelectedDeliveryLocationId}
        setFormData={setFormData}
      />

      {/* Bookings List */}
      <BookingTableSection
        showForm={showForm}
        currentTab={currentTab}
        sortField={sortField}
        sortDirection={sortDirection}
        expandedBookingId={expandedBookingId}
        expandedBlockId={expandedBlockId}
        data={data}
        rowsToRender={rowsToRender}
        activeVehicles={activeVehicles}
        activeDrivers={activeDrivers}
        vehicleOccupied={vehicleOccupied}
        driverOccupied={driverOccupied}
        setCurrentTab={setCurrentTab}
        handleSort={handleSort}
        setExpandedBookingId={setExpandedBookingId}
        setExpandedBlockId={setExpandedBlockId}
        setEditingBlockId={setEditingBlockId}
        setEditingBlockNameValue={setEditingBlockNameValue}
        handleEdit={handleEdit}
        setCostEntryBookingId={setCostEntryBookingId}
        handleVehicleAssign={handleVehicleAssign}
        handleDriverAssign={handleDriverAssign}
        handleStatusChange={handleStatusChange}
      />

      {/* All Modals */}
      <BookingModals
        showSaveLocationModal={showSaveLocationModal}
        tempLocationName={tempLocationName}
        tempLocationCustomerId={tempLocationCustomerId}
        pendingBookingData={pendingBookingData}
        editingBlockId={editingBlockId}
        editingBlockNameValue={editingBlockNameValue}
        showNewCustomerModal={showNewCustomerModal}
        tempCustomerData={tempCustomerData}
        costEntryBookingId={costEntryBookingId}
        data={data}
        activeCustomers={activeCustomers}
        setTempLocationName={setTempLocationName}
        setTempLocationCustomerId={setTempLocationCustomerId}
        handleSaveLocation={handleSaveLocation}
        setEditingBlockId={setEditingBlockId}
        setEditingBlockNameValue={setEditingBlockNameValue}
        updateData={updateData}
        handleTempCustomerChange={handleTempCustomerChange}
        setShowNewCustomerModal={setShowNewCustomerModal}
        setTempCustomerData={setTempCustomerData}
        handleSaveTempCustomer={handleSaveTempCustomer}
        handleCostSave={handleCostSave}
        setCostEntryBookingId={setCostEntryBookingId}
      />
    </div>
  );
}

export default BookingPage;
