// Local Storage utilities

const STORAGE_KEY = 'truckPlannerData';

const DEFAULT_DATA = {
  customers: [],
  drivers: [],
  vehicles: [],
  vehicleTypes: ['Skåpbil', 'Släp'],
  bookings: [],
  pickupLocations: [],
  lastBookingNumber: { year: new Date().getFullYear(), number: 0 }
};

export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Ensure all required fields exist
      const loadedData = {
        ...DEFAULT_DATA,
        ...data,
        vehicleTypes: data.vehicleTypes || DEFAULT_DATA.vehicleTypes,
        pickupLocations: data.pickupLocations || []
      };
      
      // Ensure all vehicles have a driverId field (even if null)
      if (loadedData.vehicles) {
        loadedData.vehicles = loadedData.vehicles.map(vehicle => ({
          ...vehicle,
          driverId: vehicle.driverId || null
        }));
      }
      
      return loadedData;
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return DEFAULT_DATA;
};

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const exportToJSON = (data) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const importFromJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};


