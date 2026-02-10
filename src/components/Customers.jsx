import React, { useState } from 'react';
import { generateId } from '../utils/formatters';
import ConfirmModal from './ConfirmModal';

function Customers({ data, updateData }) {
  const [formData, setFormData] = useState({
    name: '',
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
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [sortField, setSortField] = useState('customerNumber');
  const [sortDirection, setSortDirection] = useState('asc');

  // Initialize prices for each vehicle type
  const initializePrices = () => {
    const prices = {};
    data.vehicleTypes.forEach(type => {
      prices[type] = { km: '', stop: '', wait: '', hour: '', fixed: '' };
    });
    return prices;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePriceChange = (vehicleType, field, value) => {
    setFormData(prev => ({
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Namn krävs');
      return;
    }

    const customerData = {
      ...formData,
      pricesByVehicleType: formData.pricesByVehicleType
    };

    if (editingId) {
      const updatedCustomers = data.customers.map(c =>
        c.id === editingId ? { ...customerData, id: editingId } : c
      );
      updateData({ customers: updatedCustomers });
    } else {
      const newCustomer = {
        ...customerData,
        id: generateId('cust')
      };
      updateData({ customers: [...data.customers, newCustomer] });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
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
    setEditingId(null);
    setShowForm(false);
    setShowPriceForm(false);
    setSelectedVehicleType('');
  };

  const handleEdit = (customer) => {
    setFormData({
      ...customer,
      pricesByVehicleType: customer.pricesByVehicleType || {}
    });
    setEditingId(customer.id);
    setShowForm(true);
    setShowPriceForm(false);
    setSelectedVehicleType('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeactivate = (customerId) => {
    const updatedCustomers = data.customers.map(c =>
      c.id === customerId ? { ...c, active: false } : c
    );
    updateData({ customers: updatedCustomers });
  };

  const handleActivate = (customerId) => {
    const updatedCustomers = data.customers.map(c =>
      c.id === customerId ? { ...c, active: true } : c
    );
    updateData({ customers: updatedCustomers });
  };

  const handleDelete = () => {
    const updatedCustomers = data.customers.filter(c => c.id !== deleteId);
    updateData({ customers: updatedCustomers });
    setDeleteId(null);
  };

  const handleNewCustomer = () => {
    setFormData({
      name: '',
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
    setEditingId(null);
    setShowForm(true);
    setShowPriceForm(false);
    setSelectedVehicleType('');
  };

  const handleCreateTemplate = () => {
    setShowPriceForm(true);
  };

  const handleVehicleTypeSelect = (e) => {
    const type = e.target.value;
    setSelectedVehicleType(type);
    if (type && !formData.pricesByVehicleType[type]) {
      setFormData(prev => ({
        ...prev,
        pricesByVehicleType: {
          ...prev.pricesByVehicleType,
          [type]: { km: '', stop: '', wait: '', hour: '', fixed: '' }
        }
      }));
    }
  };

  const handleRemovePriceTemplate = (vehicleType) => {
    const updatedPrices = { ...formData.pricesByVehicleType };
    delete updatedPrices[vehicleType];
    setFormData(prev => ({
      ...prev,
      pricesByVehicleType: updatedPrices
    }));
    if (selectedVehicleType === vehicleType) {
      setSelectedVehicleType('');
    }
  };

  const toggleCustomerExpand = (customerId) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortCustomers = (customers) => {
    return [...customers].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
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

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  return (
    <div>
      <h1>Kunder</h1>

      {!showForm && (
        <button onClick={handleNewCustomer} className="btn btn-primary mb-2">
          + Ny kund
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <h2>{editingId ? 'Redigera kund' : 'Ny kund'}</h2>

          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Namn *"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="customerNumber"
                value={formData.customerNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="Kundnummer"
              />
            </div>
          </div>

          <div className="form-group">
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="form-input"
              placeholder="Kontaktperson"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
              placeholder="Adress"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="form-input"
                placeholder="Postnummer"
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
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
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="Telefon"
              />
            </div>

            <div className="form-group">
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="form-input"
                placeholder="Mobil"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />
              Aktiv
            </label>
          </div>

          <div style={{ marginTop: '2rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a3647' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Prismallar</h3>
              {!showPriceForm && (
                <button 
                  type="button"
                  onClick={handleCreateTemplate} 
                  className="btn btn-secondary btn-small"
                >
                  + Skapa mall
                </button>
              )}
            </div>

            {showPriceForm && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <select
                    value={selectedVehicleType}
                    onChange={handleVehicleTypeSelect}
                    className="form-select"
                  >
                    <option value="">Välj fordonstyp</option>
                    {data.vehicleTypes
                      .filter(type => !formData.pricesByVehicleType[type])
                      .map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
            )}

            {Object.keys(formData.pricesByVehicleType).length > 0 && (
              <div>
                {Object.keys(formData.pricesByVehicleType).map(vehicleType => {
                  const prices = formData.pricesByVehicleType[vehicleType];
                  return (
                    <div key={vehicleType} className="form-section" style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 className="form-section-title" style={{ margin: 0 }}>{vehicleType}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemovePriceTemplate(vehicleType)}
                          className="btn btn-danger btn-small"
                        >
                          Ta bort
                        </button>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <input
                            type="text"
                            value={prices.km}
                            onChange={(e) => handlePriceChange(vehicleType, 'km', e.target.value)}
                            className="form-input"
                            placeholder="Pris per km (SEK)"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            value={prices.stop}
                            onChange={(e) => handlePriceChange(vehicleType, 'stop', e.target.value)}
                            className="form-input"
                            placeholder="Pris per stopp (SEK)"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            value={prices.wait}
                            onChange={(e) => handlePriceChange(vehicleType, 'wait', e.target.value)}
                            className="form-input"
                            placeholder="Pris per väntetimme (SEK)"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            value={prices.hour}
                            onChange={(e) => handlePriceChange(vehicleType, 'hour', e.target.value)}
                            className="form-input"
                            placeholder="Pris per timme (SEK)"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            value={prices.fixed}
                            onChange={(e) => handlePriceChange(vehicleType, 'fixed', e.target.value)}
                            className="form-input"
                            placeholder="Fast pris (SEK)"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="form-actions">
            {editingId && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Är du säker på att du vill ta bort denna kund permanent?')) {
                      const updatedCustomers = data.customers.filter(c => c.id !== editingId);
                      updateData({ customers: updatedCustomers });
                      resetForm();
                    }
                  }}
                  className="btn btn-danger"
                >
                  Ta bort
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.active) {
                      handleDeactivate(editingId);
                      resetForm();
                    } else {
                      handleActivate(editingId);
                      resetForm();
                    }
                  }}
                  className="btn btn-secondary"
                >
                  {formData.active ? 'Inaktivera' : 'Aktivera'}
                </button>
              </>
            )}
            <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
              Avbryt
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Uppdatera' : 'Spara'}
            </button>
          </div>
        </form>
      )}

      <h2 className="mt-2">Kundlista</h2>
      {data.customers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <p>Inga kunder ännu</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('customerNumber')}>
                  Kundnummer
                  <span className="sort-indicator">
                    {sortField === 'customerNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('name')}>
                  Namn
                  <span className="sort-indicator">
                    {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('contactPerson')}>
                  Kontaktperson
                  <span className="sort-indicator">
                    {sortField === 'contactPerson' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('mobile')}>
                  Mobilnummer
                  <span className="sort-indicator">
                    {sortField === 'mobile' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('city')}>
                  Ort
                  <span className="sort-indicator">
                    {sortField === 'city' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
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
              {sortCustomers(data.customers).map(customer => {
                const isExpanded = expandedCustomerId === customer.id;
                const hasPrices = customer.pricesByVehicleType && Object.keys(customer.pricesByVehicleType).length > 0;

                return (
                  <React.Fragment key={customer.id}>
                    <tr
                      onClick={() => toggleCustomerExpand(customer.id)}
                      style={{
                        opacity: customer.active ? 1 : 0.5,
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: '#8899a6' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <strong>{customer.customerNumber || '-'}</strong>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{customer.name}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{customer.contactPerson || '-'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{customer.mobile || '-'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{customer.city || '-'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`status-badge ${customer.active ? 'status-completed' : 'status-cancelled'}`}>
                          {customer.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="btn btn-small btn-primary"
                        >
                          Redigera
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan="7" style={{ backgroundColor: '#0f1419', padding: '1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                            {/* Kontaktinformation */}
                            <div>
                              <h4 style={{ margin: '0 0 0.75rem 0', color: '#e1e8ed', fontSize: '0.9rem', borderBottom: '1px solid #2a3647', paddingBottom: '0.5rem' }}>
                                Kontaktinformation
                              </h4>
                              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                                {customer.address && (
                                  <div>
                                    <span style={{ color: '#8899a6' }}>Adress: </span>
                                    <span style={{ color: '#e1e8ed' }}>{customer.address}</span>
                                  </div>
                                )}
                                {customer.postalCode && (
                                  <div>
                                    <span style={{ color: '#8899a6' }}>Postnummer: </span>
                                    <span style={{ color: '#e1e8ed' }}>{customer.postalCode}</span>
                                  </div>
                                )}
                                {customer.city && (
                                  <div>
                                    <span style={{ color: '#8899a6' }}>Ort: </span>
                                    <span style={{ color: '#e1e8ed' }}>{customer.city}</span>
                                  </div>
                                )}
                                {customer.phone && (
                                  <div>
                                    <span style={{ color: '#8899a6' }}>Telefon: </span>
                                    <span style={{ color: '#e1e8ed' }}>{customer.phone}</span>
                                  </div>
                                )}
                                {customer.mobile && (
                                  <div>
                                    <span style={{ color: '#8899a6' }}>Mobil: </span>
                                    <span style={{ color: '#e1e8ed' }}>{customer.mobile}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Kunduppgifter */}
                            <div>
                              <h4 style={{ margin: '0 0 0.75rem 0', color: '#e1e8ed', fontSize: '0.9rem', borderBottom: '1px solid #2a3647', paddingBottom: '0.5rem' }}>
                                Kunduppgifter
                              </h4>
                              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <div>
                                  <span style={{ color: '#8899a6' }}>Kundnummer: </span>
                                  <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{customer.customerNumber || '-'}</span>
                                </div>
                                {customer.contactPerson && (
                                  <div>
                                    <span style={{ color: '#8899a6' }}>Kontaktperson: </span>
                                    <span style={{ color: '#e1e8ed' }}>{customer.contactPerson}</span>
                                  </div>
                                )}
                                <div>
                                  <span style={{ color: '#8899a6' }}>Status: </span>
                                  <span style={{ color: '#e1e8ed' }}>{customer.active ? 'Aktiv' : 'Inaktiv'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Prismallar */}
                          {hasPrices && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a3647' }}>
                              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                                {Object.entries(customer.pricesByVehicleType).map(([vehicleType, prices]) => (
                                  <div key={vehicleType} style={{ display: 'grid', gridTemplateColumns: '120px repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                                    <div>
                                      <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{vehicleType}:</span>
                                    </div>
                                    {prices.km && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Per km: </span>
                                        <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{prices.km} SEK</span>
                                      </div>
                                    )}
                                    {prices.stop && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Per stopp: </span>
                                        <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{prices.stop} SEK</span>
                                      </div>
                                    )}
                                    {prices.wait && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Per väntetimme: </span>
                                        <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{prices.wait} SEK</span>
                                      </div>
                                    )}
                                    {prices.hour && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Per timme: </span>
                                        <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{prices.hour} SEK</span>
                                      </div>
                                    )}
                                    {prices.fixed && (
                                      <div>
                                        <span style={{ color: '#8899a6' }}>Fast pris: </span>
                                        <span style={{ color: '#e1e8ed', fontWeight: 600 }}>{prices.fixed} SEK</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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

      {deleteId && (
        <ConfirmModal
          title="Ta bort kund"
          message="Är du säker på att du vill ta bort denna kund permanent? Detta kan inte ångras."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

export default Customers;


