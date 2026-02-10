# Truck Route Planning Tool (MVP)

En enkel intern applikation för reseplanering, fakturaförberedelse och grundläggande statistik för lastbilstransporter.

## Funktioner

### ✅ Implementerade funktioner

- **Booking** - Skapa och redigera bookingar med fullständig information
- **Planering** - Lista alla bokningar med filter och sortering
- **Kunder** - Hantera kunder med prislista per fordonstyp
- **Förare** - Hantera förare
- **Fordon** - Hantera fordon med registreringsnummer och typ
- **Inställningar** - Hantera fordonstyper
- **Statistik** - Månadssammanfattningar (km, intäkter, status)
- **Export** - Fakturarapport (TXT) och backup/återställning (JSON)

### Huvudfunktioner

- ✅ Automatisk bokningsnumrering (YYYY-XXXX format)
- ✅ Svensk UI med korrekt datum/tid/nummerformatering
- ✅ Local Storage för datalagring
- ✅ CRUD-operationer för alla enheter
- ✅ Aktivera/inaktivera kunder, förare och fordon
- ✅ Filterning och sortering av bokningar
- ✅ Status-hantering (Planerad, Genomförd, Fakturerad, Avbruten)
- ✅ Duplicera bokningar
- ✅ Månadsstatistik
- ✅ Export av fakturarapporter (semicolon-separated TXT)
- ✅ Backup och återställning (JSON)

## Installation

1. Installera dependencies:
```bash
npm install
```

2. Starta utvecklingsservern:
```bash
npm run dev
```

3. Öppna webbläsaren på den URL som visas (vanligtvis http://localhost:5173)

## Användning

### Skapa en booking

1. Gå till **Booking**-sektionen
2. Fyll i nödvändiga fält:
   - Datum och tid
   - Välj eller skapa en kund
   - Välj minst en av: Lastning eller Lossning
   - Fyll i relevanta adresser
   - Välj fordon och/eller förare (minst en krävs)
3. Klicka **Spara**

### Hantera kunder

1. Gå till **Kunder**-sektionen
2. Klicka **+ Ny kund**
3. Fyll i kundinformation
4. Valfritt: Lägg till prislista per fordonstyp
5. Aktivera/inaktivera eller ta bort kunder vid behov

### Visa planering

1. Gå till **Planering**-sektionen
2. Använd filtren för att begränsa visningen
3. Snabbåtgärder:
   - ✏️ Redigera
   - 📋 Duplicera
   - ✓ Markera som genomförd
   - 💰 Markera som fakturerad
   - 🗑️ Ta bort

### Exportera data

#### Fakturarapport
1. Gå till **Export**-sektionen
2. Välj månad
3. Klicka **Exportera fakturarapport**
4. Filen sparas som `invoice_report_YYYY-MM.txt`

#### Backup
1. Gå till **Export**-sektionen
2. Klicka **Exportera backup (JSON)** för att spara all data
3. Klicka **Importera backup** för att återställa från en tidigare backup

## Datastruktur

All data lagras i webbläsarens Local Storage under nyckeln `truckPlannerData`.

### Format

```json
{
  "customers": [
    {
      "id": "cust_...",
      "name": "Kundnamn",
      "address": "Adress",
      "phone": "Telefon",
      "active": true,
      "pricesByVehicleType": {
        "Skåpbil": { "km": "", "stop": "", "wait": "", "hour": "", "fixed": "" }
      }
    }
  ],
  "drivers": [
    {
      "id": "drv_...",
      "name": "Förarnamn",
      "phone": "Telefon",
      "active": true
    }
  ],
  "vehicles": [
    {
      "id": "veh_...",
      "regNo": "ABC123",
      "type": "Skåpbil",
      "active": true
    }
  ],
  "vehicleTypes": ["Skåpbil", "Släp"],
  "bookings": [
    {
      "id": "bk_...",
      "bookingNo": "2025-0001",
      "date": "2025-11-11",
      "time": "13:24",
      "customerId": "cust_...",
      "load": true,
      "unload": true,
      "pickupAddress": "Upphämtningsadress",
      "deliveryAddress": "Leveransadress",
      "recipientName": "Mottagare",
      "recipientPhone": "Telefon",
      "vehicleId": "veh_...",
      "driverId": "drv_...",
      "km": 120,
      "amountSek": 4500,
      "status": "Planerad",
      "note": "Anteckning"
    }
  ],
  "lastBookingNumber": {
    "year": 2025,
    "number": 1
  }
}
```

## Format och lokalisering

- **Språk**: Svenska
- **Valuta**: SEK
- **Datumformat**: `yyyy-mm-dd` (2025-11-11)
- **Tidsformat**: `hh:mm` (13:24, 24-timmars)
- **Decimalseparator**: Komma (,)
- **Tusentalseparator**: Mellanslag

## Teknisk stack

- **React 18** - UI-ramverk
- **Vite** - Build-verktyg och dev-server
- **Local Storage** - Datalagring
- **Vanilla CSS** - Styling

## Framtida funktioner (ej i MVP)

- Automatisk prisberäkning per kund + fordonstyp
- Kalender/dag/veckovy med drag & drop
- Låsning efter fakturering + leveransbekräftelse (POD)
- Fleranvändar-konton + molnsynkronisering
- Momshantering, PDF-fakturor, detaljerade rapporter

## Licens

Intern användning - Alla rättigheter förbehållna.










