import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import SortIcon from './SortIcon';
import { syncVehicleDriverRelation } from '../utils/vehicleUtils';

function Equipage({ data, updateData }) {
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [sortField, setSortField] = useState('regNo');
  const [sortDirection, setSortDirection] = useState('asc');

  // Generate driver code from name (same as in Settings)
  const generateDriverCode = name => {
    const parts = name.trim().split(' ');
    if (parts.length < 2) {
      return name.substring(0, 4).toUpperCase();
    }
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
  };

  const handleAssignDrivers = (vehicleId, driverIds) => {
    const updatedVehicles = data.vehicles.map(v =>
      v.id === vehicleId ? { ...v, driverIds: driverIds || [] } : v
    );
    const { vehicles: syncedVehicles, drivers: syncedDrivers } = syncVehicleDriverRelation(
      updatedVehicles,
      data.drivers
    );
    updateData({ vehicles: syncedVehicles, drivers: syncedDrivers });
    setEditingVehicleId(null);
    setSelectedDriverIds([]);
  };

  const startEditDriver = vehicle => {
    setEditingVehicleId(vehicle.id);
    const ids = vehicle.driverIds || (vehicle.driverId ? [vehicle.driverId] : []);
    setSelectedDriverIds(ids);
  };

  const cancelEdit = () => {
    setEditingVehicleId(null);
    setSelectedDriverIds([]);
  };

  const toggleDriverSelection = driverId => {
    setSelectedDriverIds(prev =>
      prev.includes(driverId) ? prev.filter(id => id !== driverId) : [...prev, driverId]
    );
  };

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortVehicles = vehicles => {
    return [...vehicles].sort((a, b) => {
      let aVal, bVal;

      const aDriverIds = a.driverIds || (a.driverId ? [a.driverId] : []);
      const bDriverIds = b.driverIds || (b.driverId ? [b.driverId] : []);
      const driverA = aDriverIds[0] ? data.drivers.find(d => d.id === aDriverIds[0]) : null;
      const driverB = bDriverIds[0] ? data.drivers.find(d => d.id === bDriverIds[0]) : null;
      if (sortField === 'driver') {
        aVal = driverA?.name?.toLowerCase() || 'zzz';
        bVal = driverB?.name?.toLowerCase() || 'zzz';
      } else if (sortField === 'code') {
        aVal = driverA ? (driverA.code || generateDriverCode(driverA.name)).toLowerCase() : 'zzz';
        bVal = driverB ? (driverB.code || generateDriverCode(driverB.name)).toLowerCase() : 'zzz';
      } else if (sortField === 'phone') {
        aVal = driverA?.phone?.toLowerCase() || 'zzz';
        bVal = driverB?.phone?.toLowerCase() || 'zzz';
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const activeVehicles = sortVehicles(data.vehicles.filter(v => v.active));
  const activeDrivers = data.drivers.filter(d => d.active);

  return (
    <div>
      <h1>Bilar</h1>
      <p className="text-muted mb-2">Översikt över alla fordon och deras tilldelade förare.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* LEFT COLUMN - TABLE */}
        <div>
          {activeVehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"></div>
              <p>Inga aktiva fordon ännu</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort('regNo')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Reg.nr
                      <SortIcon field="regNo" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th
                      onClick={() => handleSort('type')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Typ
                      <SortIcon field="type" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th
                      onClick={() => handleSort('driver')}
                      style={{ cursor: 'pointer', userSelect: 'none', minWidth: '220px' }}
                    >
                      Förare
                      <SortIcon field="driver" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th
                      onClick={() => handleSort('phone')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Telefon
                      <SortIcon field="phone" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {activeVehicles.map(vehicle => {
                    const driverIds =
                      vehicle.driverIds || (vehicle.driverId ? [vehicle.driverId] : []);
                    const assignedDrivers = driverIds
                      .map(id => data.drivers.find(d => d.id === id))
                      .filter(Boolean);
                    const isEditing = editingVehicleId === vehicle.id;

                    return (
                      <tr key={vehicle.id}>
                        <td>
                          <strong>{vehicle.regNo}</strong>
                        </td>
                        <td>{vehicle.type}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                minWidth: '200px',
                              }}
                            >
                              {activeDrivers.map(driver => (
                                <label
                                  key={driver.id}
                                  className="checkbox-label"
                                  style={{ margin: 0 }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedDriverIds.includes(driver.id)}
                                    onChange={() => toggleDriverSelection(driver.id)}
                                  />
                                  {driver.code || generateDriverCode(driver.name)} – {driver.name}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div>
                              {assignedDrivers.length > 0 ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {assignedDrivers.map((d, i) => (
                                    <span
                                      key={d.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                      }}
                                    >
                                      {i > 0 && <span className="text-muted">,</span>}
                                      <span
                                        style={{
                                          background: '#667eea',
                                          color: 'white',
                                          padding: '0.2rem 0.4rem',
                                          borderRadius: '3px',
                                          fontWeight: 'bold',
                                          fontSize: 'var(--font-size-2xs)',
                                          minWidth: '45px',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {d.code || generateDriverCode(d.name)}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: '#95a5a6' }}>Ingen</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {assignedDrivers[0] && !isEditing ? assignedDrivers[0].phone || '-' : '-'}
                        </td>
                        <td>
                          <div className="table-actions">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleAssignDrivers(vehicle.id, selectedDriverIds)}
                                  className="btn btn-small btn-success text-sm"
                                  style={{ padding: '0.25rem 0.5rem' }}
                                >
                                  Spara
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="btn btn-small btn-secondary text-sm"
                                  style={{ padding: '0.25rem 0.5rem' }}
                                >
                                  Avbryt
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditDriver(vehicle)}
                                className="btn btn-small btn-primary text-sm"
                                style={{ padding: '0.25rem 0.5rem' }}
                              >
                                Ändra förare
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - SUMMARY */}
        <div>
          <div className="form">
            <h2 style={{ marginBottom: '1rem' }}>Sammanfattning</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="stat-card">
                <div className="stat-label">Aktiva fordon</div>
                <div className="stat-value">{activeVehicles.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Fordon med förare</div>
                <div className="stat-value">
                  {activeVehicles.filter(v => (v.driverIds || []).length > 0).length}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Fordon utan förare</div>
                <div className="stat-value">
                  {activeVehicles.filter(v => !(v.driverIds || []).length).length}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Aktiva förare</div>
                <div className="stat-value">{activeDrivers.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Equipage;
