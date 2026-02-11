import { useState, useMemo } from 'react';
import { getCurrentTime24 } from '../utils/formatters';
import { isVehicleOccupied, isDriverOccupied } from '../utils/vehicleUtils';
import { getRowsToRender } from '../utils/bookingGrouping';

/**
 * Custom hook for managing all Booking component state
 *
 * @param {Object} data - App data object (customers, vehicles, drivers, bookings, etc.)
 * @param {string|null} editingBookingId - Booking ID to edit (from parent/App)
 * @returns {Object} All state, setters, derived data, and helper functions
 */
function useBookingState(data, _editingBookingId) {
  // ============================================================================
  // 1. TAB & SORTING STATE (3 hooks)
  // ============================================================================
  const [currentTab, setCurrentTab] = useState('bokad');
  const [sortField, setSortField] = useState('pickupDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // ============================================================================
  // 2. MODAL STATE (5 hooks)
  // ============================================================================
  const [costEntryBookingId, setCostEntryBookingId] = useState(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingBlockNameValue, setEditingBlockNameValue] = useState('');

  // ============================================================================
  // 3. FORM STATE (4 hooks)
  // ============================================================================
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
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
    pickupTime: getCurrentTime24(),
    pickupContactName: '',
    pickupContactPhone: '',
    deliveryAddress: '',
    deliveryPostalCode: '',
    deliveryCity: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: getCurrentTime24(),
    deliveryContactName: '',
    deliveryContactPhone: '',
    km: '',
    amountSek: '',
    costStops: '',
    costWaitHours: '',
    costDriveHours: '',
    costUseFixed: false,
    costFixedAmount: '',
    status: 'Bokad',
    note: '',
    recurringEnabled: false,
    repeatWeeks: 1,
    weeksAhead: 12,
  });

  // ============================================================================
  // 4. LOCATION SELECTION STATE (7 hooks)
  // ============================================================================
  const [pickupMode, setPickupMode] = useState('customer');
  const [deliveryMode, setDeliveryMode] = useState('customer');
  const [selectedPickupLocationId, setSelectedPickupLocationId] = useState('');
  const [selectedDeliveryLocationId, setSelectedDeliveryLocationId] = useState('');
  const [tempLocationName, setTempLocationName] = useState('');
  const [tempLocationCustomerId, setTempLocationCustomerId] = useState('');
  const [pendingBookingData, setPendingBookingData] = useState(null);

  // ============================================================================
  // 5. TEMPORARY FORM DATA (1 hook)
  // ============================================================================
  const [tempCustomerData, setTempCustomerData] = useState({
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

  // ============================================================================
  // 6. LIST VIEW UI STATE (2 hooks)
  // ============================================================================
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [expandedBlockId, setExpandedBlockId] = useState(null);

  // ============================================================================
  // 7. DERIVED DATA (memoized for performance)
  // ============================================================================

  // Active entities filtered by active flag
  const activeCustomers = useMemo(() => data.customers.filter(c => c.active), [data.customers]);

  const activeVehicles = useMemo(() => data.vehicles.filter(v => v.active), [data.vehicles]);

  const activeDrivers = useMemo(() => data.drivers.filter(d => d.active), [data.drivers]);

  // Form vehicle and driver IDs (extracted for convenience)
  const formVehicleId = formData.vehicleId || null;
  const formDriverId = formData.driverId || null;

  // Drivers authorized for the selected vehicle
  const driversForSelectedVehicle = useMemo(() => {
    if (!formVehicleId) return activeDrivers;
    return activeDrivers.filter(
      d => (d.vehicleIds || []).includes(formVehicleId) || d.id === formDriverId
    );
  }, [formVehicleId, formDriverId, activeDrivers]);

  // Pickup locations filtered by selected customer
  const customerPickupLocations = useMemo(() => {
    if (!formData.customerId) return [];
    return (data.pickupLocations || []).filter(loc => {
      // Handle both old format (customerId) and new format (customerIds)
      const customerIds = loc.customerIds || (loc.customerId ? [loc.customerId] : []);
      return customerIds.includes(formData.customerId) || customerIds.length === 0;
    });
  }, [formData.customerId, data.pickupLocations]);

  // All pickup locations for browse mode
  const allPickupLocations = useMemo(() => data.pickupLocations || [], [data.pickupLocations]);

  // Filtered, sorted, and grouped bookings for display
  const rowsToRender = useMemo(
    () =>
      getRowsToRender(
        data.bookings || [],
        data.bookingBlocks || [],
        currentTab,
        sortField,
        sortDirection,
        expandedBlockId,
        data
      ),
    [data.bookings, data.bookingBlocks, currentTab, sortField, sortDirection, expandedBlockId, data]
  );

  // ============================================================================
  // 8. HELPER FUNCTIONS
  // ============================================================================

  /**
   * Reset form to initial state
   */
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
      pickupTime: getCurrentTime24(),
      pickupContactName: '',
      pickupContactPhone: '',
      deliveryAddress: '',
      deliveryPostalCode: '',
      deliveryCity: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryTime: getCurrentTime24(),
      deliveryContactName: '',
      deliveryContactPhone: '',
      km: '',
      amountSek: '',
      costStops: '',
      costWaitHours: '',
      costDriveHours: '',
      costUseFixed: false,
      costFixedAmount: '',
      status: 'Bokad',
      note: '',
      recurringEnabled: false,
      repeatWeeks: 1,
      weeksAhead: 12,
    });
    setEditingId(null);
    setErrors({});
    setPickupMode('customer');
    setDeliveryMode('customer');
    setSelectedPickupLocationId('');
    setSelectedDeliveryLocationId('');
  };

  /**
   * Check if vehicle is occupied at booking time
   */
  const vehicleOccupied = (vehicleId, booking) => {
    return isVehicleOccupied(vehicleId, booking, data.bookings || []);
  };

  /**
   * Check if driver is occupied at booking time
   */
  const driverOccupied = (driverId, booking) => {
    return isDriverOccupied(driverId, booking, data.bookings || []);
  };

  // ============================================================================
  // 9. RETURN ALL STATE AND FUNCTIONS
  // ============================================================================
  return {
    // Tab & Sorting
    currentTab,
    setCurrentTab,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,

    // Modals
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

    // Form
    showForm,
    setShowForm,
    editingId,
    setEditingId,
    errors,
    setErrors,
    formData,
    setFormData,

    // Location Selection
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

    // Temporary Form Data
    tempCustomerData,
    setTempCustomerData,

    // List View UI
    expandedBookingId,
    setExpandedBookingId,
    expandedBlockId,
    setExpandedBlockId,

    // Derived Data
    activeCustomers,
    activeVehicles,
    activeDrivers,
    formVehicleId,
    formDriverId,
    driversForSelectedVehicle,
    customerPickupLocations,
    allPickupLocations,
    rowsToRender,

    // Helper Functions
    resetForm,
    vehicleOccupied,
    driverOccupied,
  };
}

export default useBookingState;
