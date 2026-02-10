/**
 * Kontrollerar om ett fordon är upptaget under samma tidsperiod som bokningen.
 */
export function isVehicleOccupied(vehicleId, currentBooking, allBookings = []) {
  const bkStart = currentBooking.pickupDate || currentBooking.date || '';
  const bkEnd = currentBooking.deliveryDate || bkStart;
  if (!bkStart) return false;
  return allBookings.some(b => {
    if (b.id === currentBooking.id) return false;
    if (b.vehicleId !== vehicleId) return false;
    const otherStart = b.pickupDate || b.date || '';
    const otherEnd = b.deliveryDate || otherStart;
    if (!otherStart) return false;
    return bkStart <= otherEnd && bkEnd >= otherStart;
  });
}

/**
 * Kontrollerar om en förare är upptagen under samma tidsperiod som bokningen.
 */
export function isDriverOccupied(driverId, currentBooking, allBookings = []) {
  const bkStart = currentBooking.pickupDate || currentBooking.date || '';
  const bkEnd = currentBooking.deliveryDate || bkStart;
  if (!bkStart) return false;
  return allBookings.some(b => {
    if (b.id === currentBooking.id) return false;
    if (b.driverId !== driverId) return false;
    const otherStart = b.pickupDate || b.date || '';
    const otherEnd = b.deliveryDate || otherStart;
    if (!otherStart) return false;
    return bkStart <= otherEnd && bkEnd >= otherStart;
  });
}

/**
 * Synkar vehicle.driverIds och driver.vehicleIds.
 * Tar vehicles med driverIds (eller legacy driverId) och uppdaterar drivers så att vehicleIds matchar.
 * Returnerar { vehicles, drivers } med konsistent data.
 */
export function syncVehicleDriverRelation(vehicles = [], drivers = []) {
  const vehiclesNorm = vehicles.map(v => ({
    ...v,
    driverIds: Array.isArray(v.driverIds) ? v.driverIds : (v.driverId ? [v.driverId] : [])
  }));

  const driverMap = new Map(drivers.map(d => [d.id, { ...d, vehicleIds: [] }]));
  for (const v of vehiclesNorm) {
    for (const did of v.driverIds) {
      const d = driverMap.get(did);
      if (d && !d.vehicleIds.includes(v.id)) d.vehicleIds.push(v.id);
    }
  }

  const driversNorm = Array.from(driverMap.values()).map(d => ({
    ...d,
    vehicleIds: d.vehicleIds || []
  }));

  return { vehicles: vehiclesNorm, drivers: driversNorm };
}

/**
 * Synkar vehicle.driverIds från driver.vehicleIds.
 * Använd vid sparning av förare – uppdaterar vehicles så att driverIds matchar.
 */
export function syncVehicleDriverIdsFromDrivers(vehicles = [], drivers = []) {
  const vehicleMap = new Map(vehicles.map(v => [v.id, { ...v, driverIds: [] }]));
  for (const d of drivers) {
    const ids = d.vehicleIds || [];
    for (const vid of ids) {
      const v = vehicleMap.get(vid);
      if (v && !v.driverIds.includes(d.id)) v.driverIds.push(d.id);
    }
  }
  return Array.from(vehicleMap.values());
}

/**
 * Returnerar förare som har behörighet för ett fordon.
 */
export function getAuthorizedDrivers(vehicleId, drivers = []) {
  if (!vehicleId) return [];
  return drivers.filter(d => (d.vehicleIds || []).includes(vehicleId));
}

/**
 * Uppdaterar en bokning med nytt fordon.
 * Returnerar ny bokningsobjekt med uppdaterade vehicleId, driverId och status.
 * options: { clearBlockId: boolean, handlePlaneradWithoutVehicle: boolean }
 */
export function assignVehicleToBooking(booking, vehicleId, drivers, options = {}) {
  const { clearBlockId = false, handlePlaneradWithoutVehicle = false } = options;
  const authorizedDrivers = getAuthorizedDrivers(vehicleId, drivers);
  const keepDriver = vehicleId && booking.driverId && authorizedDrivers.some(d => d.id === booking.driverId);
  const driverId = keepDriver ? booking.driverId : null;
  
  const next = { ...booking, vehicleId: vehicleId || null, driverId };
  
  // Status transitions
  if (vehicleId && (booking.status === 'Bokad' || (handlePlaneradWithoutVehicle && booking.status === 'Planerad' && !booking.vehicleId))) {
    next.status = 'Planerad';
  }
  if (!vehicleId && booking.status === 'Planerad') {
    next.status = 'Bokad';
  }
  
  // Clear blockId if requested (Schema uses this)
  if (!vehicleId && clearBlockId) {
    next.blockId = null;
  }
  
  return next;
}

/**
 * Uppdaterar en bokning med ny förare.
 * Returnerar ny bokningsobjekt med uppdaterade driverId och status.
 * options: { updateStatusToPlanerad: boolean }
 */
export function assignDriverToBooking(booking, driverId, options = {}) {
  const { updateStatusToPlanerad = false } = options;
  const next = { ...booking, driverId: driverId || null };
  
  // Status transition: if vehicle assigned and driver assigned and status is Bokad → Planerad
  if (updateStatusToPlanerad && booking.vehicleId && driverId && booking.status === 'Bokad') {
    next.status = 'Planerad';
  }
  
  return next;
}
