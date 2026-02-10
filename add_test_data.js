// Script to add test data - Run this in browser console

const newCustomers = [
  {
    id: 'cust_ankeborg_1',
    name: 'Ankeborg Stål & Metall AB',
    customerNumber: 'ANK-001',
    contactPerson: 'Kalle Anka',
    address: 'Paradisäppelvägen 13',
    postalCode: '123 45',
    city: 'Ankeborg',
    phone: '031-123 45 67',
    mobile: '070-123 45 67',
    active: true,
    pricesByVehicleType: {
      'Skåpbil': { km: '45', stop: '350', wait: '450', hour: '550', fixed: '' },
      'Släp': { km: '65', stop: '500', wait: '650', hour: '750', fixed: '' }
    }
  },
  {
    id: 'cust_ankeborg_2',
    name: 'Joakim von Ankas Förvaltning',
    customerNumber: 'ANK-002',
    contactPerson: 'Joakim von Anka',
    address: 'Penningfallet 1',
    postalCode: '123 99',
    city: 'Ankeborg',
    phone: '031-999 99 99',
    mobile: '070-999 99 99',
    active: true,
    pricesByVehicleType: {
      'Skåpbil': { km: '50', stop: '400', wait: '500', hour: '600', fixed: '' },
      'Släp': { km: '70', stop: '550', wait: '700', hour: '800', fixed: '' }
    }
  },
  {
    id: 'cust_ankeborg_3',
    name: 'Ankeborgs Dagblad',
    customerNumber: 'ANK-003',
    contactPerson: 'Alexander Lukas',
    address: 'Tidningsvägen 7',
    postalCode: '123 50',
    city: 'Ankeborg',
    phone: '031-777 88 99',
    mobile: '070-777 88 99',
    active: true,
    pricesByVehicleType: {
      'Skåpbil': { km: '42', stop: '320', wait: '420', hour: '520', fixed: '' }
    }
  },
  {
    id: 'cust_ankeborg_4',
    name: 'Ankeborgs Hamn & Logistik',
    customerNumber: 'ANK-004',
    contactPerson: 'Kapten Krok',
    address: 'Hamnkajen 3',
    postalCode: '123 88',
    city: 'Ankeborg',
    phone: '031-444 55 66',
    mobile: '070-444 55 66',
    active: true,
    pricesByVehicleType: {
      'Skåpbil': { km: '48', stop: '380', wait: '480', hour: '580', fixed: '' },
      'Släp': { km: '68', stop: '530', wait: '680', hour: '780', fixed: '' }
    }
  },
  {
    id: 'cust_ankeborg_5',
    name: 'Guld-Ivars Skrothandel',
    customerNumber: 'ANK-005',
    contactPerson: 'Guld-Ivar Flinthjärta',
    address: 'Skrotgatan 15',
    postalCode: '123 77',
    city: 'Ankeborg',
    phone: '031-333 22 11',
    mobile: '070-333 22 11',
    active: true,
    pricesByVehicleType: {
      'Släp': { km: '75', stop: '600', wait: '750', hour: '850', fixed: '' }
    }
  }
];

const newLocations = [
  {
    id: 'loc_ankeborg_1',
    name: 'Ankeborg Hamnen - Terminal A',
    address: 'Hamnkajen 3, Terminal A',
    postalCode: '123 88',
    city: 'Ankeborg',
    customerIds: ['cust_ankeborg_4']
  },
  {
    id: 'loc_ankeborg_2',
    name: 'Ankeborg Hamnen - Terminal B',
    address: 'Hamnkajen 3, Terminal B',
    postalCode: '123 88',
    city: 'Ankeborg',
    customerIds: ['cust_ankeborg_4']
  },
  {
    id: 'loc_ankeborg_3',
    name: 'Von Ankas Penningförråd',
    address: 'Penningfallet 1, källarvalv 3',
    postalCode: '123 99',
    city: 'Ankeborg',
    customerIds: ['cust_ankeborg_2']
  },
  {
    id: 'loc_ankeborg_4',
    name: 'Stål & Metall - Lager Nord',
    address: 'Paradisäppelvägen 13, Lager 1',
    postalCode: '123 45',
    city: 'Ankeborg',
    customerIds: ['cust_ankeborg_1']
  },
  {
    id: 'loc_ankeborg_5',
    name: 'Stål & Metall - Lager Syd',
    address: 'Paradisäppelvägen 13, Lager 2',
    postalCode: '123 45',
    city: 'Ankeborg',
    customerIds: ['cust_ankeborg_1']
  },
  {
    id: 'loc_ankeborg_6',
    name: 'Dagbladets Tryckeri',
    address: 'Tidningsvägen 7, Byggnad C',
    postalCode: '123 50',
    city: 'Ankeborg',
    customerIds: ['cust_ankeborg_3']
  },
  {
    id: 'loc_ankeborg_7',
    name: 'Skrotgården - Huvudområde',
    address: 'Skrotgatan 15',
    postalCode: '123 77',
    city: 'Ankeborg',
    customerIds: ['cust_ankeborg_5']
  },
  {
    id: 'loc_ankeborg_8',
    name: 'Ankeborg Centrum',
    address: 'Centrumgatan 1',
    postalCode: '123 00',
    city: 'Ankeborg',
    customerIds: []
  }
];

// Get current data from localStorage
const currentData = JSON.parse(localStorage.getItem('truckPlannerData') || '{"customers":[],"pickupLocations":[]}');

// Add new customers
currentData.customers = [...(currentData.customers || []), ...newCustomers];

// Add new pickup locations
currentData.pickupLocations = [...(currentData.pickupLocations || []), ...newLocations];

// Save back to localStorage
localStorage.setItem('truckPlannerData', JSON.stringify(currentData));

console.log('Added 5 new customers and 8 new locations!');
console.log('Reload the page to see the changes.');
