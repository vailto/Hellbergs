# Database Phase D1: MongoDB + Fly.io

This document describes the MongoDB persistence implementation and deployment setup.

## Overview

**Goal**: Add database persistence for bookings using MongoDB Atlas, deployed on Fly.io with a minimal Node/Express API.

**Result**: Zero UI/behavior changes. Persistence now survives refresh and works across devices.

## Architecture

### Backend (Node.js + Express)

```
server/
  db/
    mongo.js           # MongoDB connection singleton
  repos/
    bookingRepo.js     # Booking CRUD operations
  routes/
    bookings.js        # API endpoints
  index.js             # Express server entry point
```

**Express server**:
- Serves frontend build (`dist/`) as static files
- Exposes REST API under `/api/bookings`
- Connects to MongoDB Atlas using `MONGODB_URI` env var

### Frontend Changes

```
src/
  services/
    bookingStore.js    # API client for bookings
  hooks/
    useBookingSync.js  # Hook to sync bookings with API
```

**Integration**:
- `App.jsx` uses `useBookingSync()` hook to manage bookings
- Bookings load from API on mount
- CRUD operations call API endpoints
- Other data (customers, vehicles, drivers) still use localStorage

### API Endpoints

- `GET /api/bookings` → Get all bookings
- `POST /api/bookings` → Upsert booking (requires `id` in body)
- `DELETE /api/bookings/:id` → Delete booking

### Data Model

MongoDB collection: `bookings`

Document structure:
```json
{
  "_id": "bk_abc123",
  "payload": { /* full booking object */ },
  "status": "Bokad",
  "bookingDate": "2026-02-15",
  "createdAt": ISODate("2026-02-11T10:00:00Z"),
  "updatedAt": ISODate("2026-02-11T10:30:00Z")
}
```

## Local Development Setup

### 1. MongoDB Atlas Setup

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user with read/write permissions
3. Whitelist your IP or allow all (0.0.0.0/0) for development
4. Copy connection string

### 2. Environment Variables

Create a `.env` file in project root (copy from `.env.example`):

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/truckPlanner?retryWrites=true&w=majority
PORT=3000
```

**Important**: `.env` is git-ignored. Never commit secrets.

### 3. Install Dependencies

```bash
npm install
```

New dependencies added:
- `express` - Web server
- `mongodb` - Official MongoDB driver
- `cors` - CORS middleware (if needed)
- `dotenv` - Environment variable loader

### 4. Run Development Mode

**Option A: Two terminals (recommended)**

Terminal 1 - Backend:
```bash
npm run dev:server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

The Vite dev server will proxy `/api` requests to `http://localhost:3000` (backend).

**Option B: Production mode locally**

1. Build frontend:
   ```bash
   npm run build
   ```

2. Start server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000

### 5. Verify

Open the app and:
1. Create a new booking
2. Refresh the page → booking should persist
3. Open in another browser/device (same MongoDB) → booking should appear

Check MongoDB Atlas Collections to see the stored data.

## Deployment

See [FLY_DEPLOY.md](FLY_DEPLOY.md) for deployment instructions.

## Migration from localStorage

**Current behavior**: 
- Bookings are loaded from MongoDB API on app start
- Other data (customers, vehicles, drivers, etc.) still use localStorage
- When you first deploy, existing localStorage bookings won't automatically migrate

**To migrate existing data**:
1. Export data using the app's export feature (if available)
2. Manually create bookings via the UI, or
3. Write a migration script to bulk-insert existing bookings

## Code Changes Summary

### New Files
- `server/db/mongo.js` - MongoDB connection
- `server/repos/bookingRepo.js` - Booking repository
- `server/routes/bookings.js` - API routes
- `server/index.js` - Express server
- `src/services/bookingStore.js` - API client
- `src/hooks/useBookingSync.js` - Booking sync hook
- `Dockerfile` - Docker build configuration
- `fly.toml` - Fly.io deployment config
- `.env.example` - Environment variable template

### Modified Files
- `package.json` - Added backend dependencies and scripts
- `vite.config.js` - Added `/api` proxy for dev mode
- `App.jsx` - Integrated `useBookingSync` hook
- `src/components/booking/BookingPage.jsx` - Updated to use API functions

### Scripts Added
- `dev:server` - Run backend in dev mode
- `start` - Run production server

## Testing Checklist

- [ ] Create booking → persists after refresh
- [ ] Edit booking → changes saved to DB
- [ ] Delete booking → removed from DB
- [ ] Assign vehicle/driver → updates in DB
- [ ] Change status → updates in DB
- [ ] Multiple devices/browsers → data syncs
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint` (max 47 warnings)
- [ ] Format check passes: `npm run format:check`

## Known Limitations

- **No offline support**: App requires network connection to MongoDB
- **No real-time sync**: Changes on one device don't auto-update on another (refresh needed)
- **No conflict resolution**: Last write wins
- **No undo/redo**: Deletes are permanent

## Future Improvements

- [ ] Add real-time sync with WebSockets or polling
- [ ] Implement optimistic UI updates
- [ ] Add retry logic for failed API calls
- [ ] Migrate other data (customers, vehicles, drivers) to DB
- [ ] Add authentication and multi-user support
- [ ] Implement data backup/restore feature
- [ ] Add comprehensive error handling and user feedback

## Troubleshooting

### "Failed to fetch bookings"
- Check MongoDB connection string in `.env`
- Verify MongoDB Atlas network access allows your IP
- Check server logs for connection errors

### "Booking must have an id"
- This is a validation error; check frontend booking creation logic
- Ensure `id` is generated before calling API

### Proxy not working in dev mode
- Ensure backend is running on port 3000
- Check `vite.config.js` proxy configuration
- Restart Vite dev server

### Build fails
- Run `npm run build` to see detailed errors
- Check for ESLint errors: `npm run lint`
- Check for format issues: `npm run format:check`
