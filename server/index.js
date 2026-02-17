const express = require('express');
const path = require('path');
const { connect } = require('./db/mongo');
const masterdataRepo = require('./repos/masterdataRepo');
const pricingRepo = require('./repos/pricingRepo');
const warehouseRepo = require('./repos/warehouseRepo');
const bookingsRouter = require('./routes/bookings');
const recurringRulesRouter = require('./routes/recurringRules');
const masterdataRouter = require('./routes/masterdata');
const adminRouter = require('./routes/admin');
const customersRouter = require('./routes/customers');
const pricingRouter = require('./routes/pricing');
const warehouseRouter = require('./routes/warehouse');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/recurring-rules', recurringRulesRouter);
app.use('/api/masterdata', masterdataRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customers', customersRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/warehouse', warehouseRouter);

// Serve static files from dist in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});


// Start server
async function start() {
  try {
    // Connect to MongoDB
    await connect();
    await masterdataRepo.ensureIndexes();
    await pricingRepo.ensureIndexes();
    await warehouseRepo.ensureIndexes();

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📦 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api/bookings`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MongoDB connection...');
  const { close } = require('./db/mongo');
  await close();
  process.exit(0);
});

start();
