import React, { useState, useMemo } from 'react';
import { parseNumber, formatNumber } from '../utils/formatters';

function CostEntryModal({ booking, data, onSave, onClose }) {
  const customer = data.customers.find(c => c.id === booking.customerId);
  const vehicle = data.vehicles.find(v => v.id === booking.vehicleId);
  const vehicleType = vehicle?.type || '';
  const prices = customer?.pricesByVehicleType?.[vehicleType] || null;
  const hasPriceTemplate = prices && Object.keys(prices).length > 0;

  const [manualAmount, setManualAmount] = useState(
    booking.amountSek != null ? String(booking.amountSek) : ''
  );
  const [km, setKm] = useState(
    booking.costDetails?.km != null ? String(booking.costDetails.km) : ''
  );
  const [stops, setStops] = useState(
    booking.costDetails?.stops != null ? String(booking.costDetails.stops) : ''
  );
  const [waitHours, setWaitHours] = useState(
    booking.costDetails?.waitHours != null ? String(booking.costDetails.waitHours) : ''
  );
  const [driveHours, setDriveHours] = useState(
    booking.costDetails?.driveHours != null ? String(booking.costDetails.driveHours) : ''
  );
  const [useFixed, setUseFixed] = useState(
    booking.costDetails?.fixed != null ? Boolean(booking.costDetails.fixed) : false
  );

  const num = (v) => parseNumber(v) ?? 0;
  const priceNum = (p) => (p && p !== '' ? parseFloat(String(p).replace(',', '.')) : 0) || 0;

  const calculatedTotal = useMemo(() => {
    if (!hasPriceTemplate || !prices) return null;
    const pKm = priceNum(prices.km);
    const pStop = priceNum(prices.stop);
    const pWait = priceNum(prices.wait);
    const pHour = priceNum(prices.hour);
    const pFixed = priceNum(prices.fixed);
    const total =
      num(km) * pKm +
      num(stops) * pStop +
      num(waitHours) * pWait +
      num(driveHours) * pHour +
      (useFixed ? pFixed : 0);
    return total;
  }, [hasPriceTemplate, prices, km, stops, waitHours, driveHours, useFixed]);

  const overrideAmount = parseNumber(manualAmount);
  const finalAmount = hasPriceTemplate
    ? (overrideAmount != null && String(manualAmount).trim() !== '' ? overrideAmount : calculatedTotal)
    : overrideAmount;

  const canSave = vehicle && finalAmount != null && finalAmount >= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    const amount = finalAmount;
    const costDetails = hasPriceTemplate
      ? {
          km: num(km) || undefined,
          stops: num(stops) || undefined,
          waitHours: num(waitHours) || undefined,
          driveHours: num(driveHours) || undefined,
          fixed: useFixed ? priceNum(prices?.fixed) : undefined
        }
      : undefined;
    onSave({
      ...booking,
      amountSek: amount,
      km: num(km) || booking.km,
      costDetails
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title text-lg">Ange kostnad</h2>
        <p className="text-muted-2 text-sm mb-1">
          {booking.bookingNo} · {customer?.name || 'Okänd kund'}
          {vehicle && ` · ${vehicle.regNo} (${vehicleType})`}
        </p>

        {!vehicle ? (
          <p className="text-sm mb-1" style={{ color: '#e67e22' }}>
            Ingen fordon tilldelad. Tilldela fordon i Planering först.
          </p>
        ) : !hasPriceTemplate ? (
          <div className="mb-1">
            <p className="text-muted-2 text-sm mb-1">
              Kundens prismall saknas för fordonstyp &quot;{vehicleType}&quot;. Ange totalbelopp manuellt eller lägg till prismall under Kunder.
            </p>
            <div>
              <label className="label-sm">Belopp (SEK)</label>
              <input type="text" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="form-input input-sm" placeholder="0" />
            </div>
          </div>
        ) : (
          <>
            <div className="card mb-1">
              <strong className="text-sm block mb-1">Tider och antal</strong>
              <div className="grid-cols-5">
                <div>
                  <input type="text" value={km} onChange={e => setKm(e.target.value)} className="form-input input-sm mb-1" placeholder="0" style={{ marginBottom: '0.15rem' }} />
                  <label className="label-sm" style={{ marginBottom: 0 }}>kr/km{prices.km ? ` × ${prices.km} SEK` : ''}</label>
                </div>
                <div>
                  <input type="text" value={stops} onChange={e => setStops(e.target.value)} className="form-input input-sm" placeholder="0" style={{ marginBottom: '0.15rem' }} />
                  <label className="label-sm" style={{ marginBottom: 0 }}>kr/stopp{prices.stop ? ` × ${prices.stop} SEK` : ''}</label>
                </div>
                <div>
                  <input type="text" value={waitHours} onChange={e => setWaitHours(e.target.value)} className="form-input input-sm" placeholder="0" style={{ marginBottom: '0.15rem' }} />
                  <label className="label-sm" style={{ marginBottom: 0 }}>Väntetid kr/h{prices.wait ? ` × ${prices.wait} SEK` : ''}</label>
                </div>
                <div>
                  <input type="text" value={driveHours} onChange={e => setDriveHours(e.target.value)} className="form-input input-sm" placeholder="0" style={{ marginBottom: '0.15rem' }} />
                  <label className="label-sm" style={{ marginBottom: 0 }}>Timpris kr{prices.hour ? ` × ${prices.hour} SEK` : ''}</label>
                </div>
                <div>
                  <label className="checkbox-label text-sm" style={{ marginBottom: '0.15rem' }}>
                    <input type="checkbox" checked={useFixed} onChange={e => setUseFixed(e.target.checked)} />
                    Inkludera
                  </label>
                  <label className="label-sm" style={{ marginBottom: 0 }}>Fast kr{prices.fixed ? ` × ${prices.fixed} SEK` : ''}</label>
                </div>
              </div>
            </div>
            {calculatedTotal != null && (
              <p className="mb-1 text-base" style={{ fontWeight: 600 }}>
                Summa: {formatNumber(calculatedTotal)} SEK
              </p>
            )}
          </>
        )}

        {hasPriceTemplate && (
          <div className="mb-1">
            <label className="label-sm">Alternativt, överstig belopp (SEK)</label>
            <input type="text" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="form-input input-sm" placeholder="Lämna tomt för beräknat belopp" />
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-small">Avbryt</button>
          <button type="button" onClick={handleSubmit} className="btn btn-primary btn-small" disabled={!canSave}>Spara</button>
        </div>
      </div>
    </div>
  );
}

export default CostEntryModal;
