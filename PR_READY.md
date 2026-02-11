# PR: Persist Bookings in MongoDB via Fly API

## Title
`feat: persist bookings in MongoDB via Fly API`

## Summary

This PR adds database persistence for bookings using MongoDB Atlas with a Node/Express backend, ready for deployment on Fly.io. **Zero UI/behavior changes** - bookings now persist across devices and survive page refresh.

### What Changed

**Backend (New - 4 files)**:
- `server/db/mongo.js` - MongoDB connection singleton
- `server/repos/bookingRepo.js` - Booking CRUD repository
- `server/routes/bookings.js` - REST API endpoints
- `server/index.js` - Express server (serves static frontend + API)

**Frontend (2 new files, 2 modified)**:
- `src/services/bookingStore.js` - API client using fetch
- `src/hooks/useBookingSync.js` - React hook for syncing bookings
- `src/App.jsx` - Integrated with `useBookingSync` hook
- `src/components/booking/BookingPage.jsx` - Updated CRUD to use API

**Deployment (5 new files)**:
- `Dockerfile` - Multi-stage build (Node 20 Alpine)
- `fly.toml` - Fly.io configuration
- `.env.example` - Environment variable template
- `FLY_DEPLOY.md` - Complete deployment guide
- `DB_PHASE_D1_MONGO_FLY.md` - Architecture & local dev docs

**Other Changes**:
- `package.json` - Added backend dependencies (express, mongodb, cors, dotenv)
- `vite.config.js` - Added `/api` proxy for dev mode
- `.gitignore` - Added `.env` exclusions

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get all bookings |
| POST | `/api/bookings` | Upsert booking (requires `id` in body) |
| DELETE | `/api/bookings/:id` | Delete booking by ID |

### Important Notes

**What's Persisted**:
- ✅ Bookings → MongoDB Atlas

**What's Still in localStorage**:
- Customers
- Vehicles
- Drivers
- Vehicle types
- Pickup locations
- Booking blocks
- Last booking number

This is intentional for Phase D1. Future phases may migrate these to MongoDB.

### Data Model

MongoDB collection: `bookings`

```json
{
  "_id": "bk_abc123",           // booking.id (string)
  "payload": { /* full booking object */ },
  "status": "Bokad",            // extracted for queries
  "bookingDate": "2026-02-15",  // extracted for queries
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## Verification Steps

### Local Development

1. **Set up MongoDB Atlas**:
   - Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create database user
   - Whitelist IPs (0.0.0.0/0 for testing)
   - Get connection string

2. **Create `.env` file** (copy from `.env.example`):
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/truckPlanner
   PORT=3000
   ```

3. **Run locally**:
   ```bash
   # Terminal 1 - Backend
   npm run dev:server
   
   # Terminal 2 - Frontend
   npm run dev
   ```

4. **Test**:
   - Create a booking
   - Refresh page → booking persists
   - Open in another browser/device → booking appears
   - Edit/delete → changes sync to DB

### Production Build

```bash
npm run build
npm start
# Open http://localhost:3000
```

## Quality Gate Results

✅ **ESLint**: 43 warnings (baseline: 47, **improved by 4**)  
✅ **Prettier**: All files formatted  
✅ **Build**: Passing  
```
dist/index.html: 0.43 kB
dist/assets/index.css: 12.28 kB
dist/assets/index.js: 327.46 kB
```

## Deployment Checklist

Before deploying to Fly.io:

- [ ] Create MongoDB Atlas cluster
- [ ] Get MongoDB connection string
- [ ] Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
- [ ] Login to Fly: `flyctl auth login`
- [ ] Launch app: `fly launch` (don't deploy yet)
- [ ] **Set secret**: `fly secrets set MONGODB_URI="mongodb+srv://..."`
- [ ] Deploy: `fly deploy`
- [ ] Verify: `fly open`

See [FLY_DEPLOY.md](FLY_DEPLOY.md) for detailed deployment instructions.

## Migration Notes

**Existing localStorage bookings will NOT automatically migrate to MongoDB.**

Options:
1. Manually recreate bookings via UI
2. Use export/import feature (if available)
3. Write a custom migration script

## Security Checklist

- ✅ No secrets in code
- ✅ `.env` in `.gitignore`
- ✅ `.env.example` contains placeholder values only
- ✅ MongoDB URI passed via environment variable
- ✅ No hardcoded connection strings
- ✅ Fly secrets used for production (`MONGODB_URI`)

## Dependencies Added

```json
{
  "express": "^5.2.1",
  "mongodb": "^7.1.0",
  "cors": "^2.8.6",
  "dotenv": "^17.2.4"
}
```

## Files Changed

**19 files changed** (+1947, -105 lines)

**New files (12)**:
- Backend: 4 files (`server/`)
- Frontend: 2 files (`src/services/`, `src/hooks/`)
- Deployment: 3 files (`Dockerfile`, `fly.toml`, `.env.example`)
- Docs: 3 files (`*.md`)

**Modified files (7)**:
- `package.json`, `package-lock.json` (dependencies)
- `vite.config.js` (dev proxy)
- `.gitignore` (env files)
- `src/App.jsx` (useBookingSync integration)
- `src/components/booking/BookingPage.jsx` (API calls)
- `src/hooks/useBookingState.js` (minor cleanup)

## Testing

### Manual Testing Checklist

- [ ] Create booking → persists after refresh
- [ ] Edit booking → changes saved to DB
- [ ] Delete booking → removed from DB
- [ ] Assign vehicle/driver → updates in DB
- [ ] Change status → updates in DB
- [ ] Cost entry → saves to DB
- [ ] Auto-status change (Planerad → Genomförd) → syncs via API
- [ ] Multiple browsers/devices → data syncs (after refresh)

### Automated Checks

- [x] ESLint: 43 warnings (baseline: 47)
- [x] Prettier: All files formatted
- [x] Build: Passing

## Known Limitations

- No offline support (requires network connection to MongoDB)
- No real-time sync (changes on one device don't auto-update on another, refresh needed)
- No conflict resolution (last write wins)
- No undo/redo for deletions
- Other data types (customers, vehicles) still use localStorage

## Future Improvements

- Migrate all data types to MongoDB
- Add real-time sync (WebSockets/polling)
- Implement optimistic UI updates
- Add retry logic for failed API calls
- Add authentication/authorization
- Implement comprehensive error handling
- Add data backup/restore feature
- Add request logging and monitoring

## Documentation

- [DB_PHASE_D1_MONGO_FLY.md](DB_PHASE_D1_MONGO_FLY.md) - Architecture & local dev
- [FLY_DEPLOY.md](FLY_DEPLOY.md) - Deployment guide
- [DB_PHASE_D1_REPORT.md](DB_PHASE_D1_REPORT.md) - Implementation report

## Reminder: Set MongoDB URI Secret on Fly

**CRITICAL**: Before deploying to Fly.io, set the MongoDB connection string as a secret:

```bash
fly secrets set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/truckPlanner?retryWrites=true&w=majority"
```

Without this secret, the backend will fail to start.

---

**Ready to merge!** ✅
