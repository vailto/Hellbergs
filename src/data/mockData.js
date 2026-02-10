// Testdata för Hellbergs – kunder, förare, bilar, platser, bokningar

const getMockData = () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const year = today.getFullYear();

  const customers = [
    {
      id: 'cust_mock_1',
      name: 'Ankeborg Stål & Metall AB',
      shortName: 'Anke',
      customerNumber: 'ANK-001',
      contactPerson: 'Kalle Anka',
      address: 'Paradisäppelvägen 13',
      postalCode: '123 45',
      city: 'Ankeborg',
      phone: '031-123 45 67',
      mobile: '070-123 45 67',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '45', stop: '350', wait: '450', hour: '550', fixed: '' },
        Släp: { km: '65', stop: '500', wait: '650', hour: '750', fixed: '' }
      }
    },
    {
      id: 'cust_mock_2',
      name: 'Joakim von Ankas Förvaltning',
      shortName: 'Joakim',
      customerNumber: 'ANK-002',
      contactPerson: 'Joakim von Anka',
      address: 'Penningfallet 1',
      postalCode: '123 99',
      city: 'Ankeborg',
      phone: '031-999 99 99',
      mobile: '070-999 99 99',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '50', stop: '400', wait: '500', hour: '600', fixed: '' },
        Släp: { km: '70', stop: '550', wait: '700', hour: '800', fixed: '' }
      }
    },
    {
      id: 'cust_mock_3',
      name: 'Ankeborgs Dagblad',
      shortName: 'Dagbl',
      customerNumber: 'ANK-003',
      contactPerson: 'Alexander Lukas',
      address: 'Tidningsvägen 7',
      postalCode: '123 50',
      city: 'Ankeborg',
      phone: '031-777 88 99',
      mobile: '070-777 88 99',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '42', stop: '320', wait: '420', hour: '520', fixed: '' }
      }
    },
    {
      id: 'cust_mock_4',
      name: 'Ankeborgs Hamn & Logistik',
      shortName: 'Hamn',
      customerNumber: 'ANK-004',
      contactPerson: 'Kapten Krok',
      address: 'Hamnkajen 3',
      postalCode: '123 88',
      city: 'Ankeborg',
      phone: '031-444 55 66',
      mobile: '070-444 55 66',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '48', stop: '380', wait: '480', hour: '580', fixed: '' },
        Släp: { km: '68', stop: '530', wait: '680', hour: '780', fixed: '' }
      }
    },
    {
      id: 'cust_mock_5',
      name: 'Guld-Ivars Skrothandel',
      shortName: 'GuldI',
      customerNumber: 'ANK-005',
      contactPerson: 'Guld-Ivar Flinthjärta',
      address: 'Skrotgatan 15',
      postalCode: '123 77',
      city: 'Ankeborg',
      phone: '031-333 22 11',
      mobile: '070-333 22 11',
      active: true,
      pricesByVehicleType: {
        Släp: { km: '75', stop: '600', wait: '750', hour: '850', fixed: '' }
      }
    },
    {
      id: 'cust_mock_6',
      name: 'Nordic Bygg & Transport AB',
      shortName: 'Nordic',
      customerNumber: 'ANK-006',
      contactPerson: 'Erik Nord',
      address: 'Byggvägen 22',
      postalCode: '124 10',
      city: 'Ankeborg',
      phone: '031-555 44 33',
      mobile: '070-555 44 33',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '46', stop: '360', wait: '460', hour: '560', fixed: '' },
        Släp: { km: '66', stop: '510', wait: '660', hour: '760', fixed: '' }
      }
    },
    {
      id: 'cust_mock_7',
      name: 'Ankeborgs Restaurang AB',
      shortName: 'Rest.',
      customerNumber: 'ANK-007',
      contactPerson: 'Anna Kök',
      address: 'Smakgatan 5',
      postalCode: '123 20',
      city: 'Ankeborg',
      phone: '031-111 22 33',
      mobile: '070-111 22 33',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '44', stop: '340', wait: '440', hour: '540', fixed: '' }
      }
    },
    {
      id: 'cust_mock_8',
      name: 'Södergården Lantbruk',
      shortName: 'Söder',
      customerNumber: 'ANK-008',
      contactPerson: 'Per Bonden',
      address: 'Åkervägen 100',
      postalCode: '125 50',
      city: 'Ankeborg',
      phone: '031-888 77 66',
      mobile: '070-888 77 66',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '52', stop: '420', wait: '520', hour: '620', fixed: '' },
        Släp: { km: '72', stop: '560', wait: '720', hour: '820', fixed: '' }
      }
    },
    {
      id: 'cust_mock_9',
      name: 'Tech Solutions Nordic',
      shortName: 'TechSol',
      customerNumber: 'ANK-009',
      contactPerson: 'Maria Data',
      address: 'IT-parken 1',
      postalCode: '123 60',
      city: 'Ankeborg',
      phone: '031-999 00 11',
      mobile: '070-999 00 11',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '48', stop: '390', wait: '490', hour: '590', fixed: '' }
      }
    },
    {
      id: 'cust_mock_10',
      name: 'Ankeborgs Renhållning',
      shortName: 'Renhåll',
      customerNumber: 'ANK-010',
      contactPerson: 'Städar Stig',
      address: 'Återvinningsvägen 8',
      postalCode: '123 90',
      city: 'Ankeborg',
      phone: '031-666 55 44',
      mobile: '070-666 55 44',
      active: true,
      pricesByVehicleType: {
        Skåpbil: { km: '45', stop: '350', wait: '450', hour: '550', fixed: '' },
        Släp: { km: '65', stop: '500', wait: '650', hour: '750', fixed: '' }
      }
    }
  ];

  const drivers = [
    { id: 'drv_mock_1', name: 'Kalle Karlsson', phone: '070-111 11 11', active: true, code: 'KAKA' },
    { id: 'drv_mock_2', name: 'Lisa Lind', phone: '070-222 22 22', active: true, code: 'LILI' },
    { id: 'drv_mock_3', name: 'Olof Olsson', phone: '070-333 33 33', active: true, code: 'OLOL' },
    { id: 'drv_mock_4', name: 'Sara Svensson', phone: '070-444 44 44', active: true, code: 'SASV' },
    { id: 'drv_mock_5', name: 'Peter Pettersson', phone: '070-555 55 55', active: true, code: 'PEPE' },
    { id: 'drv_mock_6', name: 'Emma Eriksson', phone: '070-666 66 66', active: true, code: 'EMER' },
    { id: 'drv_mock_7', name: 'Johan Johansson', phone: '070-777 77 77', active: true, code: 'JOJO' }
  ];

  const vehicles = [
    { id: 'veh_mock_1', regNo: 'ABC123', type: 'Skåpbil', driverId: 'drv_mock_1', active: true },
    { id: 'veh_mock_2', regNo: 'DEF456', type: 'Skåpbil', driverId: null, active: true },
    { id: 'veh_mock_3', regNo: 'SLP789', type: 'Släp', driverId: 'drv_mock_2', active: true },
    { id: 'veh_mock_4', regNo: 'GHI012', type: 'Skåpbil', driverId: 'drv_mock_3', active: true },
    { id: 'veh_mock_5', regNo: 'JKL345', type: 'Skåpbil', driverId: 'drv_mock_4', active: true },
    { id: 'veh_mock_6', regNo: 'SLP456', type: 'Släp', driverId: 'drv_mock_5', active: true },
    { id: 'veh_mock_7', regNo: 'MNO678', type: 'Skåpbil', driverId: 'drv_mock_6', active: true }
  ];

  const pickupLocations = [
    { id: 'loc_mock_1', name: 'Hamnen Terminal A', address: 'Hamnkajen 3, Terminal A', postalCode: '123 88', city: 'Ankeborg', customerIds: ['cust_mock_4'] },
    { id: 'loc_mock_2', name: 'Hamnen Terminal B', address: 'Hamnkajen 3, Terminal B', postalCode: '123 88', city: 'Ankeborg', customerIds: ['cust_mock_4'] },
    { id: 'loc_mock_3', name: 'Von Ankas förråd', address: 'Penningfallet 1', postalCode: '123 99', city: 'Ankeborg', customerIds: ['cust_mock_2'] },
    { id: 'loc_mock_4', name: 'Stål & Metall Lager Nord', address: 'Paradisäppelvägen 13, Lager 1', postalCode: '123 45', city: 'Ankeborg', customerIds: ['cust_mock_1'] },
    { id: 'loc_mock_5', name: 'Stål & Metall Lager Syd', address: 'Paradisäppelvägen 13, Lager 2', postalCode: '123 45', city: 'Ankeborg', customerIds: ['cust_mock_1'] },
    { id: 'loc_mock_6', name: 'Dagbladets Tryckeri', address: 'Tidningsvägen 7', postalCode: '123 50', city: 'Ankeborg', customerIds: ['cust_mock_3'] },
    { id: 'loc_mock_7', name: 'Skrotgården', address: 'Skrotgatan 15', postalCode: '123 77', city: 'Ankeborg', customerIds: ['cust_mock_5'] },
    { id: 'loc_mock_8', name: 'Ankeborg Centrum', address: 'Centrumgatan 1', postalCode: '123 00', city: 'Ankeborg', customerIds: [] }
  ];

  const bookings = [
    {
      id: 'bk_mock_1',
      bookingNo: `${year}-0001`,
      customerId: 'cust_mock_1',
      vehicleId: null,
      driverId: null,
      hasContainer: false,
      hasTrailer: false,
      containerNr: '',
      trailerNr: '',
      marking: 'Stål till hamnen',
      pickupAddress: 'Paradisäppelvägen 13, Lager 1',
      pickupPostalCode: '123 45',
      pickupCity: 'Ankeborg',
      pickupDate: todayStr,
      pickupTime: '08:00',
      pickupContactName: 'Lagerchef',
      pickupContactPhone: '070-111 11 11',
      deliveryAddress: 'Hamnkajen 3, Terminal A',
      deliveryPostalCode: '123 88',
      deliveryCity: 'Ankeborg',
      deliveryDate: todayStr,
      deliveryTime: '09:00',
      deliveryContactName: 'Terminal A',
      deliveryContactPhone: '070-222 22 22',
      km: null,
      amountSek: null,
      status: 'Bokad',
      note: 'Bokad utan fordon – tilldela bil/förare i Planering.',
      date: todayStr,
      time: '08:00'
    },
    {
      id: 'bk_mock_2',
      bookingNo: `${year}-0002`,
      customerId: 'cust_mock_4',
      vehicleId: 'veh_mock_1',
      driverId: 'drv_mock_1',
      hasContainer: false,
      hasTrailer: true,
      containerNr: '',
      trailerNr: 'TR-01',
      marking: 'Importgods',
      pickupAddress: 'Hamnkajen 3, Terminal B',
      pickupPostalCode: '123 88',
      pickupCity: 'Ankeborg',
      pickupDate: todayStr,
      pickupTime: '10:00',
      pickupContactName: 'Terminal B',
      pickupContactPhone: '070-222 22 22',
      deliveryAddress: 'Paradisäppelvägen 13, Lager 2',
      deliveryPostalCode: '123 45',
      deliveryCity: 'Ankeborg',
      deliveryDate: todayStr,
      deliveryTime: '11:00',
      deliveryContactName: 'Lager Syd',
      deliveryContactPhone: '070-111 11 11',
      km: null,
      amountSek: null,
      status: 'Planerad',
      note: 'Redan planerad med bil och förare.',
      date: todayStr,
      time: '10:00'
    },
    {
      id: 'bk_mock_3',
      bookingNo: `${year}-0003`,
      customerId: 'cust_mock_2',
      vehicleId: 'veh_mock_1',
      driverId: 'drv_mock_1',
      hasContainer: false,
      hasTrailer: false,
      containerNr: '',
      trailerNr: '',
      marking: 'Kontorsmaterial',
      pickupAddress: 'Paradisäppelvägen 13, Lager 1',
      pickupPostalCode: '123 45',
      pickupCity: 'Ankeborg',
      pickupDate: todayStr,
      pickupTime: '13:00',
      pickupContactName: 'Lagerchef',
      pickupContactPhone: '070-111 11 11',
      deliveryAddress: 'Penningfallet 1',
      deliveryPostalCode: '123 99',
      deliveryCity: 'Ankeborg',
      deliveryDate: todayStr,
      deliveryTime: '14:00',
      deliveryContactName: 'Reception',
      deliveryContactPhone: '070-999 99 99',
      km: null,
      amountSek: null,
      status: 'Genomförd',
      note: 'Testa "Ange kostnad" för denna körning.',
      date: todayStr,
      time: '13:00'
    },
    {
      id: 'bk_mock_4',
      bookingNo: `${year}-0004`,
      customerId: 'cust_mock_3',
      vehicleId: 'veh_mock_3',
      driverId: 'drv_mock_2',
      hasContainer: false,
      hasTrailer: true,
      containerNr: '',
      trailerNr: 'TR-99',
      marking: 'Tidningsrullar',
      pickupAddress: 'Tidningsvägen 7',
      pickupPostalCode: '123 50',
      pickupCity: 'Ankeborg',
      pickupDate: tomorrowStr,
      pickupTime: '06:30',
      pickupContactName: 'Tryckeri',
      pickupContactPhone: '070-777 88 99',
      deliveryAddress: 'Centrumgatan 1',
      deliveryPostalCode: '123 00',
      deliveryCity: 'Ankeborg',
      deliveryDate: tomorrowStr,
      deliveryTime: '07:30',
      deliveryContactName: 'Butik',
      deliveryContactPhone: '070-555 55 55',
      km: 35,
      amountSek: 4200,
      status: 'Fakturerad',
      note: 'Exempel på fakturerad körning.',
      date: tomorrowStr,
      time: '06:30',
      costDetails: { km: 35, stops: 1, waitHours: 0.5, driveHours: 1 }
    }
  ];

  return {
    customers,
    drivers,
    vehicles,
    pickupLocations,
    bookings,
    lastBookingNumber: { year, number: 4 }
  };
};

export default getMockData;
