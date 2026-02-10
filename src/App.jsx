import React, { useState, useEffect } from 'react';
import { loadData, saveData } from './utils/storage';
import getMockData from './data/mockData';
import Booking from './components/Booking';
import Schema from './components/Schema';
import Customers from './components/Customers';
import Equipage from './components/Equipage';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import logo from './Hellbergs logo.png';

function App() {
  const [data, setData] = useState(loadData());
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [returnToSection, setReturnToSection] = useState(null);

  // Save data whenever it changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // När leveranstid (godset ska vara framme) har passerat: sätt Planerad → Genomförd
  useEffect(() => {
    const checkDeliveryPassed = () => {
      setData(prev => {
        const now = new Date();
        const bookings = (prev.bookings || []).map(b => {
          if (b.status !== 'Planerad' || !b.vehicleId) return b;
          const dateStr = b.deliveryDate || b.pickupDate || b.date;
          const timeStr = (b.deliveryTime || b.pickupTime || b.time || '23:59').trim();
          if (!dateStr) return b;
          const [h, m] = timeStr.split(':').map(s => parseInt(s, 10) || 0);
          const delivery = new Date(dateStr + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00');
          if (now < delivery) return b;
          return { ...b, status: 'Genomförd' };
        });
        const changed = bookings.some((nb, i) => nb.status !== (prev.bookings || [])[i]?.status);
        return changed ? { ...prev, bookings } : prev;
      });
    };
    checkDeliveryPassed();
    const interval = setInterval(checkDeliveryPassed, 60000); // varje minut
    return () => clearInterval(interval);
  }, []);

  const updateData = (updates) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleLoadTestData = () => {
    const mock = getMockData();
    const current = loadData();
    const newData = {
      ...current,
      customers: mock.customers,
      drivers: mock.drivers,
      vehicles: mock.vehicles,
      pickupLocations: mock.pickupLocations,
      bookings: mock.bookings,
      lastBookingNumber: mock.lastBookingNumber
    };
    saveData(newData);
    window.location.reload();
  };

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '' },
    { id: 'booking', label: 'Bokningar', icon: '' },
    { id: 'schema', label: 'Schema', icon: '' },
    { id: 'settings', label: 'Inställningar', icon: '' },
  ];

  const renderSection = () => {
    const props = { data, updateData, setCurrentSection };
    
    switch (currentSection) {
      case 'dashboard':
        return <Statistics {...props} />;
      case 'booking':
        return (
          <Booking
            {...props}
            editingBookingId={editingBookingId}
            setEditingBookingId={setEditingBookingId}
            returnToSection={returnToSection}
            setReturnToSection={setReturnToSection}
          />
        );
      case 'schema':
        return (
          <Schema
            data={data}
            updateData={updateData}
            setCurrentSection={setCurrentSection}
            setEditingBookingId={setEditingBookingId}
            setReturnToSection={setReturnToSection}
          />
        );
      case 'customers':
        return <Customers {...props} />;
      case 'equipage':
        return <Equipage {...props} />;
      case 'settings':
        return <Settings {...props} />;
      default:
        return <Statistics {...props} />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Hellbergs" />
          </div>
        </div>
        <nav className="sidebar-nav">
          {sections.map(section => (
            <div key={section.id}>
              <button
                className={`sidebar-button ${currentSection === section.id ? 'active' : ''}`}
                onClick={() => setCurrentSection(section.id)}
              >
                <span className="sidebar-icon">{section.icon}</span>
                <span className="sidebar-label">{section.label}</span>
              </button>
            </div>
          ))}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a3647' }}>
            <button
              type="button"
              className="sidebar-button"
              onClick={handleLoadTestData}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
            >
              Ladda testdata
            </button>
          </div>
        </nav>
      </aside>
      <main className="main-content">
        {renderSection()}
      </main>
    </div>
  );
}

export default App;

