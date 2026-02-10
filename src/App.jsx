import React, { useState, useEffect } from 'react';
import { loadData, saveData } from './utils/storage';
import Booking from './components/Booking';
import Planning from './components/Planning';
import Customers from './components/Customers';
import Equipage from './components/Equipage';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import logo from './Hellbergs logo.png';

function App() {
  const [data, setData] = useState(loadData());
  const [currentSection, setCurrentSection] = useState('dashboard');

  // Save data whenever it changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateData = (updates) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '' },
    { id: 'booking', label: 'Bokningar', icon: '' },
    { id: 'planning', label: 'Planering', icon: '' },
    { id: 'settings', label: 'Inställningar', icon: '' },
  ];

  const renderSection = () => {
    const props = { data, updateData, setCurrentSection };
    
    switch (currentSection) {
      case 'dashboard':
        return <Statistics {...props} />;
      case 'booking':
        return <Booking {...props} />;
      case 'planning':
        return <Planning {...props} />;
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
        </nav>
      </aside>
      <main className="main-content">
        {renderSection()}
      </main>
    </div>
  );
}

export default App;

