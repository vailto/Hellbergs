import React, { useState, useMemo } from 'react';
import { parseNumber, formatNumber } from '../utils/formatters';

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: '#1a2332',
  padding: '2rem',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '720px',
  maxHeight: '90vh',
  overflow: 'auto',
  border: '1px solid #2a3647'
};

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
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '0.35rem', fontSize: '1rem' }}>Ange kostnad</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {booking.bookingNo} · {customer?.name || 'Okänd kund'}
          {vehicle && ` · ${vehicle.regNo} (${vehicleType})`}
        </p>

        {!vehicle ? (
          <p style={{ color: '#e67e22', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Ingen fordon tilldelad. Tilldela fordon i Planering först.
          </p>
        ) : !hasPriceTemplate ? (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Kundens prismall saknas för fordonstyp &quot;{vehicleType}&quot;. Ange totalbelopp manuellt eller lägg till prismall under Kunder.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.15rem' }}>Belopp (SEK)</label>
              <input type="text" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="form-input" placeholder="0" style={{ padding: '0.25rem 0.35rem', fontSize: '0.75rem' }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid #2a3647', fontSize: '0.8rem' }}>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: '#e1e8ed', marginBottom: '0.35rem' }}>Tider och antal</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(70px, 1fr))', gap: '0.35rem' }}>
                <div>
                  <input type="text" value={km} onChange={e => setKm(e.target.value)} className="form-input" placeholder="0" style={{ padding: '0.25rem 0.35rem', fontSize: '0.75rem', marginBottom: '0.15rem' }} />
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>kr/km{prices.km ? ` × ${prices.km} SEK` : ''}</label>
                </div>
                <div>
                  <input type="text" value={stops} onChange={e => setStops(e.target.value)} className="form-input" placeholder="0" style={{ padding: '0.25rem 0.35rem', fontSize: '0.75rem', marginBottom: '0.15rem' }} />
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>kr/stopp{prices.stop ? ` × ${prices.stop} SEK` : ''}</label>
                </div>
                <div>
                  <input type="text" value={waitHours} onChange={e => setWaitHours(e.target.value)} className="form-input" placeholder="0" style={{ padding: '0.25rem 0.35rem', fontSize: '0.75rem', marginBottom: '0.15rem' }} />
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Väntetid kr/h{prices.wait ? ` × ${prices.wait} SEK` : ''}</label>
                </div>
                <div>
                  <input type="text" value={driveHours} onChange={e => setDriveHours(e.target.value)} className="form-input" placeholder="0" style={{ padding: '0.25rem 0.35rem', fontSize: '0.75rem', marginBottom: '0.15rem' }} />
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Timpris kr{prices.hour ? ` × ${prices.hour} SEK` : ''}</label>
                </div>
                <div>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                    <input type="checkbox" checked={useFixed} onChange={e => setUseFixed(e.target.checked)} />
                    Inkludera
                  </label>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Fast kr{prices.fixed ? ` × ${prices.fixed} SEK` : ''}</label>
                </div>
              </div>
            </div>
            {calculatedTotal != null && (
              <p style={{ marginBottom: '1rem', fontWeight: 600, color: '#e1e8ed', fontSize: '0.9rem' }}>
                Summa: {formatNumber(calculatedTotal)} SEK
              </p>
            )}
          </>
        )}

        {hasPriceTemplate && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.15rem' }}>Alternativt, överstig belopp (SEK)</label>
            <input type="text" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="form-input" placeholder="Lämna tomt för beräknat belopp" style={{ padding: '0.25rem 0.35rem', fontSize: '0.75rem' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-small" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Avbryt</button>
          <button type="button" onClick={handleSubmit} className="btn btn-primary btn-small" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} disabled={!canSave}>Spara</button>
        </div>
      </div>
    </div>
  );
}

export default CostEntryModal;
