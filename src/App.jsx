import { useState, useEffect, useRef, useCallback } from 'react';
import { loadData, saveData } from './utils/storage';
import { useBookingSync } from './hooks/useBookingSync';
import { useMasterdata } from './hooks/useMasterdata';
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
  const [newBookingFromWarehouse, setNewBookingFromWarehouse] = useState(null);
  const didApplyMasterdataRef = useRef(false);

  // Sync bookings with API
  const { bookings, loading, saveBooking, removeBooking, updateBookings } = useBookingSync();
  const { customers, vehicles, drivers, loading: masterdataLoading, refresh } = useMasterdata();

  // Once masterdata has loaded, merge into data exactly once (only customers/vehicles/drivers)
  useEffect(() => {
    if (masterdataLoading || didApplyMasterdataRef.current) return;
    didApplyMasterdataRef.current = true;
    setData(prev => ({
      ...prev,
      customers,
      vehicles,
      drivers,
    }));
  }, [masterdataLoading, customers, vehicles, drivers]);

  const refreshMasterdata = useCallback(() => {
    return refresh().then(fetched => {
      setData(prev => ({
        ...prev,
        customers: fetched.customers ?? [],
        vehicles: fetched.vehicles ?? [],
        drivers: fetched.drivers ?? [],
      }));
    });
  }, [refresh]);

  // Save non-booking data to localStorage
  useEffect(() => {
    const { bookings: _, ...otherData } = data;
    saveData(otherData);
  }, [data]);

  // När leveranstid (godset ska vara framme) har passerat: sätt Planerad → Genomförd
  useEffect(() => {
    if (loading || bookings.length === 0) return;

    const checkDeliveryPassed = async () => {
      const now = new Date();
      const updatedBookings = bookings.map(b => {
        if (b.status !== 'Planerad' || !b.vehicleId) return b;
        const dateStr = b.deliveryDate || b.pickupDate || b.date;
        const timeStr = (b.deliveryTime || b.pickupTime || b.time || '23:59').trim();
        if (!dateStr) return b;
        const [h, m] = timeStr.split(':').map(s => parseInt(s, 10) || 0);
        const delivery = new Date(
          dateStr + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00'
        );
        if (now < delivery) return b;
        return { ...b, status: 'Genomförd' };
      });
      const changed = updatedBookings.some((nb, i) => nb.status !== bookings[i]?.status);
      if (changed) {
        await updateBookings(updatedBookings);
      }
    };

    checkDeliveryPassed();
    const interval = setInterval(checkDeliveryPassed, 60000); // varje minut
    return () => clearInterval(interval);
  }, [bookings, loading, updateBookings]);

  const updateData = updates => {
    // If updating bookings, use the API
    if (updates.bookings !== undefined) {
      // Handle booking updates via API (handled by child components)
      const { bookings: _, ...otherUpdates } = updates;
      if (Object.keys(otherUpdates).length > 0) {
        setData(prev => ({ ...prev, ...otherUpdates }));
      }
    } else {
      setData(prev => ({ ...prev, ...updates }));
    }
  };

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '' },
    { id: 'booking', label: 'Bokningar', icon: '' },
    { id: 'schema', label: 'Schema', icon: '' },
    { id: 'settings', label: 'Inställningar', icon: '' },
  ];

  const renderSection = () => {
    // Merge bookings from API with other data
    const mergedData = { ...data, bookings };
    const props = {
      data: mergedData,
      updateData,
      setCurrentSection,
      saveBooking,
      removeBooking,
      refreshMasterdata,
    };

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
            newBookingFromWarehouse={newBookingFromWarehouse}
            setNewBookingFromWarehouse={setNewBookingFromWarehouse}
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
        return (
          <Settings
            {...props}
            setCurrentSection={setCurrentSection}
            setNewBookingFromWarehouse={setNewBookingFromWarehouse}
            setEditingBookingId={setEditingBookingId}
          />
        );
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
        </nav>
      </aside>
      <main className="main-content">{renderSection()}</main>
    </div>
  );
}

export default App;
