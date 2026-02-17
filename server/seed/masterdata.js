// Seed data for masterdata collections. Idempotent upsert by stable key (code or normalized name).

const vehicles = [
  { regNo: 'EHS041', code: '113' },
  { regNo: 'YAM722', code: '116' },
  { regNo: 'OEG319', code: '118' },
  { regNo: 'YTM725', code: '119' },
  { regNo: 'YTM731', code: '120' },
  { regNo: 'CPX23E', code: '121' },
  { regNo: 'KLJ02F', code: '122' },
  { regNo: 'ERF67K', code: '123' },
  { regNo: 'SUD96N', code: '125' },
  { regNo: 'JWE88G', code: '126' },
  { regNo: 'ZDT16N', code: '127' },
  { regNo: 'ZJR53A', code: '128' },
  { regNo: 'MKY10F', code: '200' },
  { regNo: 'FTS16B', code: '210' },
  { regNo: 'RYJ547', code: '401' },
  { regNo: 'FCA445', code: '402' },
  { regNo: 'Hjullastare', code: '600' },
  { regNo: 'LAGER', code: '99' },
];

const drivers = [
  { code: 'ANBL', name: 'Andreas Blom' },
  { code: 'ANHN', name: 'Anders Harris' },
  { code: 'BOCR', name: 'Bosse Cronwald' },
  { code: 'CAWI', name: 'Calle Windh' },
  { code: 'CHHA', name: 'Christian Harris' },
  { code: 'CHKA', name: 'Christer Karlsson' },
  { code: 'DANI', name: 'Daniel Nilsson' },
  { code: 'DANO', name: 'Daniel Norling' },
  { code: 'ELKA', name: 'Elias Kart' },
  { code: 'EMED', name: 'Emil Edgren' },
  { code: 'FRWI', name: 'Fredrik Wikström Lagergren' },
  { code: 'GUSA', name: 'Gustaf Sandin' },
  { code: 'GÖRO', name: 'Göran Romeborn' },
  { code: 'JALI', name: 'Janne Lilleste' },
  { code: 'JECA', name: 'Jesper Carlsson' },
  { code: 'JITO', name: 'Jimmy Torstensson' },
  { code: 'JOHE', name: 'Jonas Hellberg' },
  { code: 'JOSE', name: 'Johan Sernemo' },
  { code: 'LAGER', name: 'Lagerpersonal' },
  { code: 'LANI', name: 'Lars Nilsson' },
  { code: 'LARO', name: 'Lasse Rosell' },
  { code: 'LITO', name: 'Linus Torgersson' },
  { code: 'MAAN', name: 'Martin Andersson' },
  { code: 'PEFA', name: 'Peter Fager' },
  { code: 'PELE', name: 'Peter Lengfelt' },
  { code: 'POAN', name: 'Pontus Andersson' },
  { code: 'SIER', name: 'Simon Eriksson' },
  { code: 'STBA', name: 'Stefan Baatz' },
  { code: 'STKO', name: 'Stefan Korneliusson' },
  { code: 'TIAX', name: 'Tim Axelsson' },
  { code: 'ULHE', name: 'Ulf Hellberg' },
];

// Placeholder until full list is added. Each item: { name, address, city } (empty string for missing).
const customers = [
  { name: 'Example Customer AB', address: 'Example Street 1', city: 'Stockholm' },
];

module.exports = {
  customers,
  vehicles,
  drivers,
};
