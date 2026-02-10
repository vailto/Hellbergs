import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import SortIcon from './SortIcon';
import { generateId } from '../utils/formatters';
import { exportToJSON, importFromJSON, saveData } from '../utils/storage';
import getMockData from '../data/mockData';

function Settings({ data, updateData }) {
  // Tab State
  const [currentTab, setCurrentTab] = useState('fordon');

  // Vehicle Types State
  const [vehicleTypeForm, setVehicleTypeForm] = useState('');
  const [showVehicleTypeForm, setShowVehicleTypeForm] = useState(false);
  const [deleteType, setDeleteType] = useState(null);

  // Drivers State
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', active: true });
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [deleteDriverId, setDeleteDriverId] = useState(null);
  const [showDriverForm, setShowDriverForm] = useState(false);

  // Vehicles State
  const [vehicleForm, setVehicleForm] = useState({ regNo: '', type: '', driverId: '', active: true });
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [deleteVehicleId, setDeleteVehicleId] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  // Backup State
  const [importFile, setImportFile] = useState(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  // Pickup Locations State
  const [locationForm, setLocationForm] = useState({ name: '', address: '', postalCode: '', city: '', customerIds: [] });
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [deleteLocationId, setDeleteLocationId] = useState(null);
  const [showLocationForm, setShowLocationForm] = useState(false);

  // Customer State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    shortName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    mobile: '',
    customerNumber: '',
    contactPerson: '',
    active: true,
    pricesByVehicleType: {}
  });
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showCustomerPriceForm, setShowCustomerPriceForm] = useState(false);
  const [selectedCustomerVehicleType, setSelectedCustomerVehicleType] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [customerSortField, setCustomerSortField] = useState('customerNumber');
  const [customerSortDirection, setCustomerSortDirection] = useState('asc');

  // Visibility State for lists
  const [showAllActiveVehicles, setShowAllActiveVehicles] = useState(false);
  const [showAllInactiveVehicles, setShowAllInactiveVehicles] = useState(false);
  const [showAllActiveDrivers, setShowAllActiveDrivers] = useState(false);
  const [showAllInactiveDrivers, setShowAllInactiveDrivers] = useState(false);

  // Sorting State
  const [vehicleSortField, setVehicleSortField] = useState('regNo');
  const [vehicleSortDirection, setVehicleSortDirection] = useState('asc');
  const [driverSortField, setDriverSortField] = useState('name');
  const [driverSortDirection, setDriverSortDirection] = useState('asc');
  const [vehicleTypeSortDirection, setVehicleTypeSortDirection] = useState('asc');
  const [testDataLoaded, setTestDataLoaded] = useState(false);

  // Vehicle Types Handlers
  const handleAddType = (e) => {
    e.preventDefault();
    
    if (!vehicleTypeForm.trim()) {
      alert('Fordonstyp krävs');
      return;
    }

    if (data.vehicleTypes.includes(vehicleTypeForm.trim())) {
      alert('Denna fordonstyp finns redan');
      return;
    }

    updateData({
      vehicleTypes: [...data.vehicleTypes, vehicleTypeForm.trim()]
    });
    setVehicleTypeForm('');
    setShowVehicleTypeForm(false);
  };

  const handleDeleteType = () => {
    if (!deleteType) return;

    const vehiclesUsingType = data.vehicles.filter(v => v.type === deleteType);
    if (vehiclesUsingType.length > 0) {
      alert(`Kan inte ta bort fordonstyp som används av ${vehiclesUsingType.length} fordon`);
      setDeleteType(null);
      return;
    }

    updateData({
      vehicleTypes: data.vehicleTypes.filter(t => t !== deleteType)
    });
    setDeleteType(null);
  };

  // Generate driver code from name (e.g., "Martin Vailto" -> "MAVA")
  const generateDriverCode = (name) => {
    const parts = name.trim().split(' ');
    if (parts.length < 2) {
      // If only one name, take first 4 letters
      return name.substring(0, 4).toUpperCase();
    }
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
  };

  // Driver Handlers
  const handleDriverSubmit = (e) => {
    e.preventDefault();
    
    if (!driverForm.name.trim()) {
      alert('Namn krävs');
      return;
    }

    const code = generateDriverCode(driverForm.name);

    if (editingDriverId) {
      const updatedDrivers = data.drivers.map(d =>
        d.id === editingDriverId ? { ...driverForm, id: editingDriverId, code } : d
      );
      updateData({ drivers: updatedDrivers });
    } else {
      const newDriver = { ...driverForm, id: generateId('drv'), code };
      updateData({ drivers: [...data.drivers, newDriver] });
    }

    resetDriverForm();
  };

  const resetDriverForm = () => {
    setDriverForm({ name: '', phone: '', active: true });
    setEditingDriverId(null);
    setShowDriverForm(false);
  };

  const handleEditDriver = (driver) => {
    setDriverForm(driver);
    setEditingDriverId(driver.id);
    setShowDriverForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDriver = () => {
    const updatedDrivers = data.drivers.filter(d => d.id !== deleteDriverId);
    updateData({ drivers: updatedDrivers });
    setDeleteDriverId(null);
  };

  const toggleDriverActive = (driverId, currentActive) => {
    const updatedDrivers = data.drivers.map(d =>
      d.id === driverId ? { ...d, active: !currentActive } : d
    );
    updateData({ drivers: updatedDrivers });
  };

  // Vehicle Handlers
  const handleVehicleSubmit = (e) => {
    e.preventDefault();
    
    if (!vehicleForm.regNo.trim()) {
      alert('Registreringsnummer krävs');
      return;
    }
    if (!vehicleForm.type) {
      alert('Fordonstyp krävs');
      return;
    }

    if (editingVehicleId) {
      const updatedVehicles = data.vehicles.map(v =>
        v.id === editingVehicleId ? { ...vehicleForm, id: editingVehicleId } : v
      );
      updateData({ vehicles: updatedVehicles });
    } else {
      const newVehicle = { ...vehicleForm, id: generateId('veh') };
      updateData({ vehicles: [...data.vehicles, newVehicle] });
    }

    resetVehicleForm();
  };

  const resetVehicleForm = () => {
    setVehicleForm({ regNo: '', type: '', driverId: '', active: true });
    setEditingVehicleId(null);
    setShowVehicleForm(false);
  };

  const handleEditVehicle = (vehicle) => {
    setVehicleForm(vehicle);
    setEditingVehicleId(vehicle.id);
    setShowVehicleForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVehicle = () => {
    const updatedVehicles = data.vehicles.filter(v => v.id !== deleteVehicleId);
    updateData({ vehicles: updatedVehicles });
    setDeleteVehicleId(null);
  };

  const toggleVehicleActive = (vehicleId, currentActive) => {
    const updatedVehicles = data.vehicles.map(v =>
      v.id === vehicleId ? { ...v, active: !currentActive } : v
    );
    updateData({ vehicles: updatedVehicles });
  };

  // Pickup Location Handlers
  const handleLocationSubmit = (e) => {
    e.preventDefault();
    
    if (!locationForm.name.trim()) {
      alert('Namn krävs');
      return;
    }
    if (!locationForm.address.trim()) {
      alert('Adress krävs');
      return;
    }

    if (editingLocationId) {
      const updatedLocations = data.pickupLocations.map(l =>
        l.id === editingLocationId ? { ...locationForm, id: editingLocationId } : l
      );
      updateData({ pickupLocations: updatedLocations });
    } else {
      const newLocation = { ...locationForm, id: generateId('loc') };
      updateData({ pickupLocations: [...data.pickupLocations, newLocation] });
    }

    resetLocationForm();
  };

  const resetLocationForm = () => {
    setLocationForm({ name: '', address: '', postalCode: '', city: '', customerIds: [] });
    setEditingLocationId(null);
    setShowLocationForm(false);
  };

  const handleEditLocation = (location) => {
    // Handle both old format (customerId) and new format (customerIds)
    const formattedLocation = {
      ...location,
      postalCode: location.postalCode || '',
      city: location.city || '',
      customerIds: location.customerIds || (location.customerId ? [location.customerId] : [])
    };
    setLocationForm(formattedLocation);
    setEditingLocationId(location.id);
    setShowLocationForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLocation = () => {
    const updatedLocations = data.pickupLocations.filter(l => l.id !== deleteLocationId);
    updateData({ pickupLocations: updatedLocations });
    setDeleteLocationId(null);
  };

  // Customer Handlers
  const handleCustomerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCustomerPriceChange = (vehicleType, field, value) => {
    setCustomerForm(prev => ({
      ...prev,
      pricesByVehicleType: {
        ...prev.pricesByVehicleType,
        [vehicleType]: {
          ...prev.pricesByVehicleType[vehicleType],
          [field]: value
        }
      }
    }));
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();

    if (!customerForm.name.trim()) {
      alert('Namn krävs');
      return;
    }

    const customerData = {
      ...customerForm,
      pricesByVehicleType: customerForm.pricesByVehicleType
    };

    if (editingCustomerId) {
      const updatedCustomers = data.customers.map(c =>
        c.id === editingCustomerId ? { ...customerData, id: editingCustomerId } : c
      );
      updateData({ customers: updatedCustomers });
    } else {
      const newCustomer = {
        ...customerData,
        id: generateId('cust')
      };
      updateData({ customers: [...data.customers, newCustomer] });
    }

    resetCustomerForm();
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      shortName: '',
      address: '',
      postalCode: '',
      city: '',
      phone: '',
      mobile: '',
      customerNumber: '',
      contactPerson: '',
      active: true,
      pricesByVehicleType: {}
    });
    setEditingCustomerId(null);
    setShowCustomerForm(false);
    setShowCustomerPriceForm(false);
    setSelectedCustomerVehicleType('');
  };

  const handleEditCustomer = (customer) => {
    setCustomerForm({
      ...customer,
      pricesByVehicleType: customer.pricesByVehicleType || {}
    });
    setEditingCustomerId(customer.id);
    setExpandedCustomerId(null);
    setShowCustomerForm(true);
    setShowCustomerPriceForm(false);
    setSelectedCustomerVehicleType('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCustomer = () => {
    const updatedCustomers = data.customers.filter(c => c.id !== deleteCustomerId);
    updateData({ customers: updatedCustomers });
    setDeleteCustomerId(null);
  };

  const toggleCustomerActive = (customerId, currentActive) => {
    const updatedCustomers = data.customers.map(c =>
      c.id === customerId ? { ...c, active: !currentActive } : c
    );
    updateData({ customers: updatedCustomers });
  };

  const handleCustomerVehicleTypeSelect = (e) => {
    const type = e.target.value;
    setSelectedCustomerVehicleType(type);
    if (type && !customerForm.pricesByVehicleType[type]) {
      setCustomerForm(prev => ({
        ...prev,
        pricesByVehicleType: {
          ...prev.pricesByVehicleType,
          [type]: { km: '', stop: '', wait: '', hour: '', fixed: '' }
        }
      }));
    }
  };

  const handleRemoveCustomerPriceTemplate = (vehicleType) => {
    const updatedPrices = { ...customerForm.pricesByVehicleType };
    delete updatedPrices[vehicleType];
    setCustomerForm(prev => ({
      ...prev,
      pricesByVehicleType: updatedPrices
    }));
    if (selectedCustomerVehicleType === vehicleType) {
      setSelectedCustomerVehicleType('');
    }
  };

  const toggleCustomerExpand = (customerId) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  const handleLoadTestData = () => {
    try {
      const mock = getMockData();
      updateData({
        customers: mock.customers,
        drivers: mock.drivers,
        vehicles: mock.vehicles,
        pickupLocations: mock.pickupLocations,
        bookings: mock.bookings,
        lastBookingNumber: mock.lastBookingNumber
      });
      setTestDataLoaded(true);
    } catch (err) {
      console.error('Ladda testdata:', err);
      alert('Kunde inte ladda testdata: ' + (err.message || err));
    }
  };

  const handleCustomerSort = (field) => {
    if (customerSortField === field) {
      setCustomerSortDirection(customerSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCustomerSortField(field);
      setCustomerSortDirection('asc');
    }
  };

  const sortCustomers = (customers) => {
    return [...customers].sort((a, b) => {
      let aVal, bVal;

      switch (customerSortField) {
        case 'customerNumber':
          aVal = a.customerNumber || '';
          bVal = b.customerNumber || '';
          break;
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'contactPerson':
          aVal = a.contactPerson || '';
          bVal = b.contactPerson || '';
          break;
        case 'mobile':
          aVal = a.mobile || '';
          bVal = b.mobile || '';
          break;
        case 'city':
          aVal = a.city || '';
          bVal = b.city || '';
          break;
        case 'status':
          aVal = a.active ? 'aktiv' : 'inaktiv';
          bVal = b.active ? 'aktiv' : 'inaktiv';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return customerSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return customerSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Backup Handlers
  const handleExportBackup = () => {
    exportToJSON(data);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportConfirm(true);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;

    try {
      const importedData = await importFromJSON(importFile);
      
      if (!importedData.customers || !importedData.drivers || !importedData.vehicles || !importedData.bookings) {
        alert('Ogiltigt backup-format');
        return;
      }

      updateData(importedData);
      saveData(importedData);
      
      alert('Data importerad framgångsrikt!');
      setShowImportConfirm(false);
      setImportFile(null);
    } catch (error) {
      alert('Fel vid import av data: ' + error.message);
    }
  };

  // Sorting functions
  const handleVehicleSort = (field) => {
    if (vehicleSortField === field) {
      setVehicleSortDirection(vehicleSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setVehicleSortField(field);
      setVehicleSortDirection('asc');
    }
  };

  const handleDriverSort = (field) => {
    if (driverSortField === field) {
      setDriverSortDirection(driverSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setDriverSortField(field);
      setDriverSortDirection('asc');
    }
  };

  const sortVehicles = (vehicles) => {
    return [...vehicles].sort((a, b) => {
      let aVal = a[vehicleSortField];
      let bVal = b[vehicleSortField];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return vehicleSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return vehicleSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortDrivers = (drivers) => {
    return [...drivers].sort((a, b) => {
      let aVal, bVal;
      
      if (driverSortField === 'code') {
        aVal = (a.code || generateDriverCode(a.name)).toLowerCase();
        bVal = (b.code || generateDriverCode(b.name)).toLowerCase();
      } else {
        aVal = a[driverSortField] || '';
        bVal = b[driverSortField] || '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return driverSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return driverSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const activeDrivers = sortDrivers(data.drivers.filter(d => d.active));
  const inactiveDrivers = sortDrivers(data.drivers.filter(d => !d.active));
  const activeVehicles = sortVehicles(data.vehicles.filter(v => v.active));
  const inactiveVehicles = sortVehicles(data.vehicles.filter(v => !v.active));
  const activeCustomers = sortCustomers(data.customers.filter(c => c.active));
  const inactiveCustomers = sortCustomers(data.customers.filter(c => !c.active));

  // Sort vehicle types
  const sortedVehicleTypes = vehicleTypeSortDirection === 'asc'
    ? [...data.vehicleTypes].sort()
    : [...data.vehicleTypes].sort().reverse();

  // Display limits
  const displayedActiveVehicles = showAllActiveVehicles ? activeVehicles : activeVehicles.slice(0, 5);
  const displayedInactiveVehicles = showAllInactiveVehicles ? inactiveVehicles : inactiveVehicles.slice(0, 5);
  const displayedActiveDrivers = showAllActiveDrivers ? activeDrivers : activeDrivers.slice(0, 5);
  const displayedInactiveDrivers = showAllInactiveDrivers ? inactiveDrivers : inactiveDrivers.slice(0, 5);

  return (
    <div>
      <h1>Inställningar</h1>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--color-border)',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setCurrentTab('fordon')}
          className={`btn btn-small ${currentTab === 'fordon' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: currentTab === 'fordon' ? '2px solid #2563ab' : 'none',
            marginBottom: '-2px'
          }}
        >
          Fordon
        </button>
        <button
          onClick={() => setCurrentTab('forare')}
          className={`btn btn-small ${currentTab === 'forare' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: currentTab === 'forare' ? '2px solid #2563ab' : 'none',
            marginBottom: '-2px'
          }}
        >
          Förare
        </button>
        <button
          onClick={() => setCurrentTab('kunder')}
          className={`btn btn-small ${currentTab === 'kunder' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: currentTab === 'kunder' ? '2px solid #2563ab' : 'none',
            marginBottom: '-2px'
          }}
        >
          Kunder
        </button>
        <button
          onClick={() => setCurrentTab('platser')}
          className={`btn btn-small ${currentTab === 'platser' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: currentTab === 'platser' ? '2px solid #2563ab' : 'none',
            marginBottom: '-2px'
          }}
        >
          Platser
        </button>
        <button
          onClick={() => setCurrentTab('backup')}
          className={`btn btn-small ${currentTab === 'backup' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: currentTab === 'backup' ? '2px solid #2563ab' : 'none',
            marginBottom: '-2px'
          }}
        >
          Backup
        </button>
        <button
          onClick={() => setCurrentTab('testdata')}
          className={`btn btn-small ${currentTab === 'testdata' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: currentTab === 'testdata' ? '2px solid #2563ab' : 'none',
            marginBottom: '-2px'
          }}
        >
          Testdata
        </button>
      </div>

      {/* Tab Content */}
      {currentTab === 'fordon' && (
        <div>
          {/* SAMMANFATTNING */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-label">Aktiva fordon</div>
              <div className="stat-value">{activeVehicles.length}</div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-label">Fordon med förare</div>
              <div className="stat-value">
                {activeVehicles.filter(v => v.driverId).length}
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-label">Fordon utan förare</div>
              <div className="stat-value">
                {activeVehicles.filter(v => !v.driverId).length}
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-label">Aktiva förare</div>
              <div className="stat-value">{activeDrivers.length}</div>
            </div>
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* LEFT COLUMN - AKTIVA FORDON OCH INAKTIVA FORDON */}
            <div>
              {/* AKTIVA FORDON */}
              <div className="form" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Aktiva fordon ({activeVehicles.length})</h2>
              {!showVehicleForm && (
                <button onClick={() => setShowVehicleForm(true)} className="btn btn-primary btn-small">
                  + Nytt
                </button>
              )}
            </div>

            {showVehicleForm && (
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #dee2e6' }}>
                <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>
                  {editingVehicleId ? 'Redigera fordon' : 'Nytt fordon'}
                </h3>
                
                <form onSubmit={handleVehicleSubmit}>
                  <div className="form-row" style={{ gap: '0.5rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={vehicleForm.regNo}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, regNo: e.target.value })}
                        className="form-input"
                        placeholder="Reg.nr (ABC123)"
                        required
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <select
                        value={vehicleForm.type}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                        className="form-select"
                        required
                      >
                        <option value="">Fordonstyp</option>
                        {data.vehicleTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <select
                      value={vehicleForm.driverId || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, driverId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Ingen förare tilldelad</option>
                      {data.drivers.filter(d => d.active).map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={vehicleForm.active}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, active: e.target.checked })}
                      />
                      Aktiv
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn btn-primary btn-small">
                      {editingVehicleId ? 'Spara' : 'Lägg till'}
                    </button>
                    {editingVehicleId && (
                      <>
                        <button 
                          type="button" 
                          onClick={() => toggleVehicleActive(editingVehicleId, vehicleForm.active)} 
                          className="btn btn-secondary btn-small"
                        >
                          {vehicleForm.active ? 'Inaktivera' : 'Aktivera'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setDeleteVehicleId(editingVehicleId)} 
                          className="btn btn-danger btn-small"
                        >
                          Ta bort
                        </button>
                      </>
                    )}
                    <button type="button" onClick={resetVehicleForm} className="btn btn-secondary btn-small">
                      Avbryt
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeVehicles.length === 0 ? (
              <div className="empty-state">
                <p>Inga aktiva fordon</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th onClick={() => handleVehicleSort('regNo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                          Reg.nr
                          <SortIcon field="regNo" currentField={vehicleSortField} direction={vehicleSortDirection} />
                        </th>
                        <th onClick={() => handleVehicleSort('type')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                          Typ
                          <SortIcon field="type" currentField={vehicleSortField} direction={vehicleSortDirection} />
                        </th>
                        <th>Förare</th>
                        <th style={{ width: '100px' }}>Åtgärder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedActiveVehicles.map(vehicle => {
                        const assignedDriver = data.drivers.find(d => d.id === vehicle.driverId);
                        return (
                          <tr key={vehicle.id}>
                            <td><strong>{vehicle.regNo}</strong></td>
                            <td>{vehicle.type}</td>
                            <td>
                              {assignedDriver ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{
                                    background: '#667eea',
                                    color: 'white',
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '3px',
                                    fontWeight: 'bold',
                                    fontSize: '0.7rem',
                                    minWidth: '45px',
                                    textAlign: 'center'
                                  }}>
                                    {assignedDriver.code || generateDriverCode(assignedDriver.name)}
                                  </span>
                                  <span className="text-base">{assignedDriver.name}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => handleEditVehicle(vehicle)}
className="btn btn-small btn-primary text-sm" style={{ padding: '0.25rem 0.75rem', width: '100%' }}
                              >
                                Redigera
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {activeVehicles.length > 5 && (
                  <button
                    onClick={() => setShowAllActiveVehicles(!showAllActiveVehicles)}
                    className="btn btn-secondary btn-small"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    {showAllActiveVehicles ? `Visa mindre` : `Visa alla (${activeVehicles.length})`}
                  </button>
                )}
              </>
            )}
          </div>

              {/* INAKTIVA FORDON */}
              {inactiveVehicles.length > 0 && (
                <div className="form">
                  <h2 style={{ marginBottom: '1rem' }}>Inaktiva fordon ({inactiveVehicles.length})</h2>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th onClick={() => handleVehicleSort('regNo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Reg.nr
                        <SortIcon field="regNo" currentField={vehicleSortField} direction={vehicleSortDirection} />
                      </th>
                      <th onClick={() => handleVehicleSort('type')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Typ
                        <SortIcon field="type" currentField={vehicleSortField} direction={vehicleSortDirection} />
                      </th>
                      <th>Förare</th>
                      <th style={{ width: '100px' }}>Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInactiveVehicles.map(vehicle => {
                      const assignedDriver = data.drivers.find(d => d.id === vehicle.driverId);
                      return (
                        <tr key={vehicle.id} style={{ opacity: 0.6 }}>
                          <td>{vehicle.regNo}</td>
                          <td>{vehicle.type}</td>
                          <td>
                            {assignedDriver ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                  background: '#95a5a6',
                                  color: 'white',
                                  padding: '0.2rem 0.4rem',
                                  borderRadius: '3px',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '45px',
                                  textAlign: 'center'
                                }}>
                                  {assignedDriver.code || generateDriverCode(assignedDriver.name)}
                                </span>
                                <span className="text-base">{assignedDriver.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
className="btn btn-small btn-primary text-sm" style={{ padding: '0.25rem 0.75rem', width: '100%' }}
                            >
                              Redigera
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
                  {inactiveVehicles.length > 5 && (
                    <button
                      onClick={() => setShowAllInactiveVehicles(!showAllInactiveVehicles)}
                      className="btn btn-secondary btn-small"
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      {showAllInactiveVehicles ? `Visa mindre` : `Visa alla (${inactiveVehicles.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - FORDONSTYPER */}
            <div>
              <div className="form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Fordonstyper ({data.vehicleTypes.length})</h2>
              {!showVehicleTypeForm && (
                <button onClick={() => setShowVehicleTypeForm(true)} className="btn btn-primary btn-small">
                  + Nytt
                </button>
              )}
            </div>

            {showVehicleTypeForm && (
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #dee2e6' }}>
                <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>
                  Ny fordonstyp
                </h3>

                <form onSubmit={handleAddType}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={vehicleTypeForm}
                      onChange={(e) => setVehicleTypeForm(e.target.value)}
                      className="form-input"
                      placeholder="T.ex. Lastbil, Skåpbil..."
                      required
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary btn-small">
                      Lägg till
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowVehicleTypeForm(false);
                        setVehicleTypeForm('');
                      }}
                      className="btn btn-secondary btn-small"
                    >
                      Avbryt
                    </button>
                  </div>
                </form>
              </div>
            )}

            {data.vehicleTypes.length === 0 ? (
              <div className="empty-state">
                <p>Inga fordonstyper</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => setVehicleTypeSortDirection(vehicleTypeSortDirection === 'asc' ? 'desc' : 'asc')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        Fordonstyp
                        <span style={{ marginLeft: '0.25rem' }}>{vehicleTypeSortDirection === 'asc' ? '↑' : '↓'}</span>
                      </th>
                      <th style={{ width: '80px' }}>Antal</th>
                      <th style={{ width: '100px' }}>Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVehicleTypes.map(type => {
                      const count = data.vehicles.filter(v => v.type === type).length;
                      return (
                        <tr key={type}>
                          <td><strong>{type}</strong></td>
                          <td>{count}</td>
                          <td>
                            <button
                              onClick={() => setDeleteType(type)}
className="btn btn-small btn-danger text-sm"
                              disabled={count > 0}
                            >
                              Ta bort
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FÖRARE TAB */}
      {currentTab === 'forare' && (
        <div>
          {/* AKTIVA FÖRARE */}
          <div className="form" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Aktiva förare ({activeDrivers.length})</h2>
              {!showDriverForm && (
                <button onClick={() => setShowDriverForm(true)} className="btn btn-primary btn-small">
                  + Ny
                </button>
              )}
            </div>
            {showDriverForm && (
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #dee2e6' }}>
                <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>
                  {editingDriverId ? 'Redigera förare' : 'Ny förare'}
                </h3>
                
                <form onSubmit={handleDriverSubmit}>
                  <div className="form-row" style={{ gap: '0.5rem' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <input
                        type="text"
                        value={driverForm.name}
                        onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                        className="form-input"
                        placeholder="För- och efternamn"
                        required
                      />
                      {driverForm.name && (
                        <div className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
                          Kod: <strong>{generateDriverCode(driverForm.name)}</strong>
                        </div>
                      )}
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <input
                        type="tel"
                        value={driverForm.phone}
                        onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                        className="form-input"
                        placeholder="Telefon"
                      />
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={driverForm.active}
                          onChange={(e) => setDriverForm({ ...driverForm, active: e.target.checked })}
                        />
                        Aktiv
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn btn-primary btn-small">
                      {editingDriverId ? 'Spara' : 'Lägg till'}
                    </button>
                    {editingDriverId && (
                      <>
                        <button 
                          type="button" 
                          onClick={() => toggleDriverActive(editingDriverId, driverForm.active)} 
                          className="btn btn-secondary btn-small"
                        >
                          {driverForm.active ? 'Inaktivera' : 'Aktivera'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setDeleteDriverId(editingDriverId)} 
                          className="btn btn-danger btn-small"
                        >
                          Ta bort
                        </button>
                      </>
                    )}
                    <button type="button" onClick={resetDriverForm} className="btn btn-secondary btn-small">
                      Avbryt
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeDrivers.length === 0 ? (
              <div className="empty-state">
                <p>Inga aktiva förare</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th onClick={() => handleDriverSort('name')} style={{ cursor: 'pointer', userSelect: 'none', minWidth: '220px' }}>
                          Förare
                          <SortIcon field="name" currentField={driverSortField} direction={driverSortDirection} />
                        </th>
                        <th onClick={() => handleDriverSort('phone')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                          Telefon
                          <SortIcon field="phone" currentField={driverSortField} direction={driverSortDirection} />
                        </th>
                        <th>Fordon</th>
                        <th style={{ width: '100px' }}>Åtgärder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedActiveDrivers.map(driver => {
                        const assignedVehicles = data.vehicles.filter(v => v.driverId === driver.id && v.active);
                        return (
                          <tr key={driver.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ 
                                  background: '#667eea', 
                                  color: 'white', 
                                  padding: '0.2rem 0.4rem', 
                                  borderRadius: '3px',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '45px',
                                  textAlign: 'center'
                                }}>
                                  {driver.code || generateDriverCode(driver.name)}
                                </span>
                                <strong className="text-base">{driver.name}</strong>
                              </div>
                            </td>
                            <td>{driver.phone || '-'}</td>
                            <td>
                              {assignedVehicles.length > 0 ? (
                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                  {assignedVehicles.map(vehicle => (
                                    <span 
                                      key={vehicle.id}
                                      style={{ 
                                        background: '#e8f5e9', 
                                        color: '#2e7d32', 
                                        padding: '0.15rem 0.4rem', 
                                        borderRadius: '3px',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      {vehicle.regNo}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => handleEditDriver(driver)}
className="btn btn-small btn-primary text-sm" style={{ padding: '0.25rem 0.75rem', width: '100%' }}
                              >
                                Redigera
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {activeDrivers.length > 5 && (
                  <button
                    onClick={() => setShowAllActiveDrivers(!showAllActiveDrivers)}
                    className="btn btn-secondary btn-small"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    {showAllActiveDrivers ? `Visa mindre` : `Visa alla (${activeDrivers.length})`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* INAKTIVA FÖRARE */}
          {inactiveDrivers.length > 0 && (
            <div className="form">
              <h2 style={{ marginBottom: '1rem' }}>Inaktiva förare ({inactiveDrivers.length})</h2>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th onClick={() => handleDriverSort('name')} style={{ cursor: 'pointer', userSelect: 'none', minWidth: '220px' }}>
                        Förare
                        <SortIcon field="name" currentField={driverSortField} direction={driverSortDirection} />
                      </th>
                      <th onClick={() => handleDriverSort('phone')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Telefon
                        <SortIcon field="phone" currentField={driverSortField} direction={driverSortDirection} />
                      </th>
                      <th>Fordon</th>
                      <th style={{ width: '100px' }}>Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInactiveDrivers.map(driver => {
                      const assignedVehicles = data.vehicles.filter(v => v.driverId === driver.id);
                      return (
                        <tr key={driver.id} style={{ opacity: 0.6 }}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                background: '#95a5a6', 
                                color: 'white', 
                                padding: '0.2rem 0.4rem', 
                                borderRadius: '3px',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                                minWidth: '45px',
                                textAlign: 'center'
                              }}>
                                {driver.code || generateDriverCode(driver.name)}
                              </span>
                              <span className="text-base">{driver.name}</span>
                            </div>
                          </td>
                          <td>{driver.phone || '-'}</td>
                          <td>
                            {assignedVehicles.length > 0 ? (
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                {assignedVehicles.map(vehicle => (
                                  <span 
                                    key={vehicle.id}
                                    style={{ 
                                      background: '#e0e0e0', 
                                      color: '#616161', 
                                      padding: '0.15rem 0.4rem', 
                                      borderRadius: '3px',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {vehicle.regNo}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleEditDriver(driver)}
className="btn btn-small btn-primary text-sm" style={{ padding: '0.25rem 0.75rem', width: '100%' }}
                            >
                              Redigera
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {inactiveDrivers.length > 5 && (
                <button
                  onClick={() => setShowAllInactiveDrivers(!showAllInactiveDrivers)}
                  className="btn btn-secondary btn-small"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  {showAllInactiveDrivers ? `Visa mindre` : `Visa alla (${inactiveDrivers.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* KUNDER TAB */}
      {currentTab === 'kunder' && (
        <div>
          <div className="form" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Kunder ({data.customers.length})</h2>
              {!showCustomerForm && (
                <button onClick={() => setShowCustomerForm(true)} className="btn btn-primary btn-small">
                  + Nytt
                </button>
              )}
            </div>

            {showCustomerForm && (
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #dee2e6' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '1.5rem', alignItems: 'start' }}>
                  {/* Vänster: kompakt kundformulär */}
                  <div>
                    <h3 className="section-title section-title--tight">
                      {editingCustomerId ? 'Redigera kund' : 'Ny kund'}
                    </h3>
                    <form onSubmit={handleCustomerSubmit} className="text-sm">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.2rem 0.5rem', marginBottom: '0.2rem' }}>
                        <input type="text" name="name" value={customerForm.name} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Namn *" required />
                        <input type="text" name="customerNumber" value={customerForm.customerNumber} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Kundnr" style={{ width: '5.5rem' }} />
                      </div>
                      <div style={{ marginBottom: '0.2rem' }}>
                        <input type="text" name="shortName" value={customerForm.shortName || ''} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Förkortning" maxLength={6} />
                      </div>
                      <div style={{ marginBottom: '0.2rem' }}>
                        <input type="text" name="contactPerson" value={customerForm.contactPerson} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Kontaktperson" />
                      </div>
                      <div style={{ marginBottom: '0.2rem' }}>
                        <input type="text" name="address" value={customerForm.address} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Adress" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.2rem 0.5rem', marginBottom: '0.2rem' }}>
                        <input type="text" name="postalCode" value={customerForm.postalCode} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Postnr" style={{ width: '4rem' }} />
                        <input type="text" name="city" value={customerForm.city} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Ort" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 0.5rem', marginBottom: '0.2rem' }}>
                        <input type="tel" name="phone" value={customerForm.phone} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Telefon" />
                        <input type="tel" name="mobile" value={customerForm.mobile} onChange={handleCustomerChange} className="form-input input-sm" placeholder="Mobil" />
                      </div>
                      <label className="checkbox-label text-sm" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input type="checkbox" name="active" checked={customerForm.active} onChange={handleCustomerChange} />
                        Aktiv
                      </label>
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        <button type="submit" className="btn btn-primary btn-small text-2xs">{editingCustomerId ? 'Spara' : 'Lägg till'}</button>
                        {editingCustomerId && (
                          <>
                            <button type="button" onClick={() => toggleCustomerActive(editingCustomerId, customerForm.active)} className="btn btn-secondary btn-small text-2xs">{customerForm.active ? 'Inaktivera' : 'Aktivera'}</button>
                            <button type="button" onClick={() => setDeleteCustomerId(editingCustomerId)} className="btn btn-danger btn-small text-2xs">Ta bort</button>
                          </>
                        )}
                        <button type="button" onClick={resetCustomerForm} className="btn btn-secondary btn-small text-2xs">Avbryt</button>
                      </div>
                    </form>
                  </div>

                  {/* Höger: priser per fordonstyp, väntetid m.m. */}
                  <div>
                    <h3 className="section-title">
                      Priser (kundspecifika)
                    </h3>
                    <div className="text-base">
                      <div style={{ marginBottom: '0.5rem' }}>
                        <select
                          value={selectedCustomerVehicleType}
                          onChange={handleCustomerVehicleTypeSelect}
className="form-select form-input input-sm" style={{ width: '100%', maxWidth: '200px' }}
                        >
                          <option value="">+ Lägg till fordonstyp</option>
                          {(data.vehicleTypes || []).filter(t => !customerForm.pricesByVehicleType[t]).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      {Object.entries(customerForm.pricesByVehicleType || {}).map(([vehicleType, prices]) => (
                        <div key={vehicleType} className="card-block mb-1">
                          <strong className="text-sm block" style={{ flexShrink: 0, marginBottom: '0.25rem' }}>{vehicleType}</strong>
                          <div className="grid-cols-5">
                            <div>
                              <label className="label-sm">kr/km</label>
                              <input type="text" inputMode="decimal" value={prices.km || ''} onChange={(e) => handleCustomerPriceChange(vehicleType, 'km', e.target.value)} className="form-input input-sm" placeholder="–" />
                            </div>
                            <div>
                              <label className="label-sm">kr/stopp</label>
                              <input type="text" inputMode="decimal" value={prices.stop || ''} onChange={(e) => handleCustomerPriceChange(vehicleType, 'stop', e.target.value)} className="form-input input-sm" placeholder="–" />
                            </div>
                            <div>
                              <label className="label-sm">Väntetid kr/h</label>
                              <input type="text" inputMode="decimal" value={prices.wait || ''} onChange={(e) => handleCustomerPriceChange(vehicleType, 'wait', e.target.value)} className="form-input input-sm" placeholder="–" />
                            </div>
                            <div>
                              <label className="label-sm">Timpris kr</label>
                              <input type="text" inputMode="decimal" value={prices.hour || ''} onChange={(e) => handleCustomerPriceChange(vehicleType, 'hour', e.target.value)} className="form-input input-sm" placeholder="–" />
                            </div>
                            <div>
                              <label className="label-sm">Fast kr</label>
                              <input type="text" inputMode="decimal" value={prices.fixed || ''} onChange={(e) => handleCustomerPriceChange(vehicleType, 'fixed', e.target.value)} className="form-input input-sm" placeholder="–" />
                            </div>
                          </div>
                          <button type="button" onClick={() => handleRemoveCustomerPriceTemplate(vehicleType)} className="btn btn-danger btn-small text-2xs" style={{ flexShrink: 0, marginBottom: '0.25rem', marginLeft: 'auto', padding: '0.2rem 0.4rem' }}>Ta bort</button>
                        </div>
                      ))}
                      {(!customerForm.pricesByVehicleType || Object.keys(customerForm.pricesByVehicleType).length === 0) && (
                        <p className="text-muted-2 text-sm" style={{ margin: 0 }}>Välj fordonstyp ovan för att lägga till priser (kr/km, väntetid, timpris m.m.)</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCustomers.length === 0 ? (
              <div className="empty-state">
                <p>Inga aktiva kunder</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th onClick={() => handleCustomerSort('customerNumber')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Kundnr
                        <SortIcon field="customerNumber" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th onClick={() => handleCustomerSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Namn
                        <SortIcon field="name" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th onClick={() => handleCustomerSort('contactPerson')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Kontaktperson
                        <SortIcon field="contactPerson" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th onClick={() => handleCustomerSort('mobile')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Mobil
                        <SortIcon field="mobile" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th onClick={() => handleCustomerSort('city')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Ort
                        <SortIcon field="city" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th style={{ width: '100px' }}>Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCustomers.map(customer => {
                      const isExpanded = expandedCustomerId === customer.id;
                      return (
                        <React.Fragment key={customer.id}>
                          <tr
                            onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className="text-2xs text-muted" style={{ marginRight: '0.35rem' }}>{isExpanded ? '▼' : '▶'}</span>
                              {customer.customerNumber || '-'}
                            </td>
                            <td><strong>{customer.name}</strong></td>
                            <td>{customer.contactPerson || '-'}</td>
                            <td>{customer.mobile || '-'}</td>
                            <td>{customer.city || '-'}</td>
                            <td onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleEditCustomer(customer)}
className="btn btn-small btn-primary text-sm" style={{ padding: '0.25rem 0.75rem', width: '100%' }}
                              >
                                Redigera
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} style={{ backgroundColor: '#0f1419', padding: '1rem', verticalAlign: 'top' }}>
                                <div style={{ marginBottom: '0.75rem', fontSize: '1rem', color: '#e1e8ed', fontWeight: 600 }}>
                                  {customer.name}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.85rem' }}>
                                  <div>
                                    <div style={{ marginBottom: '0.35rem' }}><span style={{ color: '#8899a6' }}>Kundnr: </span><span style={{ color: '#e1e8ed' }}>{customer.customerNumber || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span style={{ color: '#8899a6' }}>Förkortning: </span><span style={{ color: '#e1e8ed' }}>{customer.shortName || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span style={{ color: '#8899a6' }}>Kontaktperson: </span><span style={{ color: '#e1e8ed' }}>{customer.contactPerson || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span style={{ color: '#8899a6' }}>Telefon: </span><span style={{ color: '#e1e8ed' }}>{customer.phone || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span style={{ color: '#8899a6' }}>Mobil: </span><span style={{ color: '#e1e8ed' }}>{customer.mobile || '-'}</span></div>
                                  </div>
                                  <div>
                                    <div style={{ marginBottom: '0.35rem' }}><span style={{ color: '#8899a6' }}>Adress: </span><span style={{ color: '#e1e8ed' }}>{customer.address || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span style={{ color: '#8899a6' }}>Postnr / Ort: </span><span style={{ color: '#e1e8ed' }}>{[customer.postalCode, customer.city].filter(Boolean).join(' ') || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span style={{ color: '#8899a6' }}>Aktiv: </span><span style={{ color: '#e1e8ed' }}>{customer.active ? 'Ja' : 'Nej'}</span></div>
                                    {(customer.pricesByVehicleType && Object.keys(customer.pricesByVehicleType).length > 0) && (
                                      <div style={{ marginTop: '0.5rem' }}>
                                        <span style={{ color: '#8899a6' }}>Priser: </span>
                                        <span style={{ color: '#e1e8ed' }}>{Object.keys(customer.pricesByVehicleType).join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
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
          </div>

          {/* INAKTIVA KUNDER */}
          {inactiveCustomers.length > 0 && (
            <div className="form">
              <h2 style={{ marginBottom: '1rem' }}>Inaktiva kunder ({inactiveCustomers.length})</h2>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th onClick={() => handleCustomerSort('customerNumber')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Kundnr
                        <SortIcon field="customerNumber" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th onClick={() => handleCustomerSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Namn
                        <SortIcon field="name" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th onClick={() => handleCustomerSort('contactPerson')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Kontaktperson
                        <SortIcon field="contactPerson" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th onClick={() => handleCustomerSort('mobile')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Mobil
                        <SortIcon field="mobile" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th onClick={() => handleCustomerSort('city')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Ort
                        <SortIcon field="city" currentField={customerSortField} direction={customerSortDirection} />
                      </th>
                      <th style={{ width: '100px' }}>Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveCustomers.map(customer => {
                      const isExpanded = expandedCustomerId === customer.id;
                      return (
                        <React.Fragment key={customer.id}>
                          <tr
                            onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                            style={{ cursor: 'pointer', opacity: 0.6 }}
                          >
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className="text-2xs text-muted" style={{ marginRight: '0.35rem' }}>{isExpanded ? '▼' : '▶'}</span>
                              {customer.customerNumber || '-'}
                            </td>
                            <td>{customer.name}</td>
                            <td>{customer.contactPerson || '-'}</td>
                            <td>{customer.mobile || '-'}</td>
                            <td>{customer.city || '-'}</td>
                            <td onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleEditCustomer(customer)}
className="btn btn-small btn-primary text-sm" style={{ padding: '0.25rem 0.75rem', width: '100%' }}
                              >
                                Redigera
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="text-base" style={{ backgroundColor: 'var(--color-bg)', padding: '1rem', verticalAlign: 'top' }}>
                                <div className="mb-1" style={{ fontWeight: 600 }}>{customer.name}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                  <div>
                                    <div style={{ marginBottom: '0.35rem' }}><span className="detail-label">Kundnr: </span><span className="detail-value">{customer.customerNumber || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span className="detail-label">Förkortning: </span><span className="detail-value">{customer.shortName || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span className="detail-label">Kontaktperson: </span><span className="detail-value">{customer.contactPerson || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span className="detail-label">Telefon: </span><span className="detail-value">{customer.phone || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span className="detail-label">Mobil: </span><span className="detail-value">{customer.mobile || '-'}</span></div>
                                  </div>
                                  <div>
                                    <div style={{ marginBottom: '0.35rem' }}><span className="detail-label">Adress: </span><span className="detail-value">{customer.address || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span className="detail-label">Postnr / Ort: </span><span className="detail-value">{[customer.postalCode, customer.city].filter(Boolean).join(' ') || '-'}</span></div>
                                    <div style={{ marginBottom: '0.35rem' }}><span className="detail-label">Aktiv: </span><span className="detail-value">Nej</span></div>
                                    {(customer.pricesByVehicleType && Object.keys(customer.pricesByVehicleType).length > 0) && (
                                      <div style={{ marginTop: '0.5rem' }}>
                                        <span className="detail-label">Priser: </span>
                                        <span className="detail-value">{Object.keys(customer.pricesByVehicleType).join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
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
            </div>
          )}
        </div>
      )}

      {/* PLATSER TAB */}
      {currentTab === 'platser' && (
        <div className="form" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Platser ({(data.pickupLocations || []).length})</h2>
          {!showLocationForm && (
            <button onClick={() => setShowLocationForm(true)} className="btn btn-primary btn-small">
              + Ny plats
            </button>
          )}
        </div>

        {showLocationForm && (
          <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #dee2e6' }}>
            <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>
              {editingLocationId ? 'Redigera plats' : 'Ny plats'}
            </h3>
            
            <form onSubmit={handleLocationSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="form-input"
                  placeholder="Namn (t.ex. Huvudlager, Hamnen...)"
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  className="form-input"
                  placeholder="Adress"
                  required
                />
              </div>

              <div className="form-row" style={{ gap: '0.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={locationForm.postalCode}
                    onChange={(e) => setLocationForm({ ...locationForm, postalCode: e.target.value })}
                    className="form-input"
                    placeholder="Postnummer"
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <input
                    type="text"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    className="form-input"
                    placeholder="Ort"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--font-size-base)' }}>
                  Kopplade kunder (valfritt)
                </label>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '6px', 
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-bg)'
                }}>
                  {data.customers.map(customer => (
                    <label 
                      key={customer.id} 
                      className="checkbox-label" 
                      style={{ display: 'block', padding: '0.25rem 0', margin: 0 }}
                    >
                      <input
                        type="checkbox"
                        checked={locationForm.customerIds.includes(customer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLocationForm({ 
                              ...locationForm, 
                              customerIds: [...locationForm.customerIds, customer.id] 
                            });
                          } else {
                            setLocationForm({ 
                              ...locationForm, 
                              customerIds: locationForm.customerIds.filter(id => id !== customer.id) 
                            });
                          }
                        }}
                      />
                      {customer.name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="submit" className="btn btn-primary btn-small">
                  {editingLocationId ? 'Spara' : 'Lägg till'}
                </button>
                {editingLocationId && (
                  <button 
                    type="button" 
                    onClick={() => setDeleteLocationId(editingLocationId)} 
                    className="btn btn-danger btn-small"
                  >
                    Ta bort
                  </button>
                )}
                <button type="button" onClick={resetLocationForm} className="btn btn-secondary btn-small">
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        )}

        {(data.pickupLocations || []).length === 0 ? (
          <div className="empty-state">
            <p>Inga platser ännu</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Namn</th>
                  <th>Adress</th>
                  <th>Postnr</th>
                  <th>Ort</th>
                  <th>Kunder</th>
                  <th style={{ width: '100px' }}>Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {(data.pickupLocations || []).map(location => {
                  // Handle both old and new format
                  const customerIds = location.customerIds || (location.customerId ? [location.customerId] : []);
                  const customers = customerIds
                    .map(id => data.customers.find(c => c.id === id))
                    .filter(Boolean);
                  
                  return (
                    <tr key={location.id}>
                      <td style={{ whiteSpace: 'nowrap' }}><strong>{location.name}</strong></td>
                      <td>{location.address}</td>
                      <td>{location.postalCode || '-'}</td>
                      <td>{location.city || '-'}</td>
                      <td>
                        {customers.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {customers.map(customer => (
                              <span 
                                key={customer.id}
                                style={{ 
                                  background: '#667eea', 
                                  color: 'white', 
                                  padding: '0.15rem 0.4rem', 
                                  borderRadius: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {customer.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#95a5a6' }}>-</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleEditLocation(location)}
                          className="btn btn-small btn-primary text-sm" style={{ padding: '0.25rem 0.75rem', width: '100%' }}
                        >
                          Redigera
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}

      {/* BACKUP TAB */}
      {currentTab === 'backup' && (
        <div className="form">
          <h2 style={{ marginBottom: '1rem' }}>Backup</h2>
          <p style={{ color: '#7f8c8d', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Exportera all data till backup-fil eller importera tidigare backup.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            <button onClick={handleExportBackup} className="btn btn-success" style={{ width: '100%' }}>
              Exportera backup (JSON)
            </button>

            <label className="btn btn-secondary" style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}>
              Importera backup
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            padding: '0.75rem',
            fontSize: '0.875rem'
          }}>
            <strong style={{ color: '#856404' }}>Varning:</strong>
            <span style={{ color: '#856404' }}> Import ersätter all befintlig data.</span>
          </div>
        </div>
      )}

      {/* TESTDATA TAB */}
      {currentTab === 'testdata' && (
        <div className="form">
          <h2 style={{ marginBottom: '1rem' }}>Testdata</h2>
          <p style={{ color: '#7f8c8d', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Ladda in exempeldata för att testa appen: kunder, förare, bilar, platser och några bokningar (planerade, genomförda och fakturerade).
          </p>
          <button
            type="button"
            onClick={handleLoadTestData}
            className="btn btn-primary"
            style={{ marginBottom: '1rem' }}
          >
            Ladda testdata
          </button>
          {testDataLoaded && (
            <p style={{ color: '#22c55e', marginBottom: '1rem', fontWeight: 600 }}>
              Testdata laddad. Gå till Bokningar eller Planering för att se datan.
            </p>
          )}
          <p className="text-muted text-base">
            Gå till <strong>Bokningar</strong> för att se bokningarna, <strong>Planering</strong> för att tilldela bil/förare och ange kostnad, och flikarna <strong>Fordon</strong>, <strong>Förare</strong>, <strong>Kunder</strong>, <strong>Platser</strong> här ovanför för att se listorna.
          </p>
        </div>
      )}

      {/* MODALS */}
      {deleteType && (
        <ConfirmModal
          title="Ta bort fordonstyp"
          message={`Är du säker på att du vill ta bort fordonstypen "${deleteType}"?`}
          onConfirm={handleDeleteType}
          onCancel={() => setDeleteType(null)}
        />
      )}

      {deleteDriverId && (
        <ConfirmModal
          title="Ta bort förare"
          message="Är du säker på att du vill ta bort denna förare permanent? Detta kan inte ångras."
          onConfirm={handleDeleteDriver}
          onCancel={() => setDeleteDriverId(null)}
        />
      )}

      {deleteVehicleId && (
        <ConfirmModal
          title="Ta bort fordon"
          message="Är du säker på att du vill ta bort detta fordon permanent? Detta kan inte ångras."
          onConfirm={handleDeleteVehicle}
          onCancel={() => setDeleteVehicleId(null)}
        />
      )}

      {showImportConfirm && (
        <ConfirmModal
          title="Importera backup"
          message="Detta kommer att ersätta all befintlig data med data från backup-filen. Är du säker på att du vill fortsätta?"
          onConfirm={handleImportConfirm}
          onCancel={() => {
            setShowImportConfirm(false);
            setImportFile(null);
          }}
          confirmText="Ja, importera"
        />
      )}

      {deleteLocationId && (
        <ConfirmModal
          title="Ta bort plats"
          message="Är du säker på att du vill ta bort denna plats permanent? Detta kan inte ångras."
          onConfirm={handleDeleteLocation}
          onCancel={() => setDeleteLocationId(null)}
        />
      )}

      {deleteCustomerId && (
        <ConfirmModal
          title="Ta bort kund"
          message="Är du säker på att du vill ta bort denna kund permanent? Detta kan inte ångras."
          onConfirm={handleDeleteCustomer}
          onCancel={() => setDeleteCustomerId(null)}
        />
      )}
    </div>
  );
}

export default Settings;
