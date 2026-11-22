require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimiter = require('./middleware/rateLimitMiddleware');
const authRouter = require('./routes/auth');
const bookingsRouter = require('./routes/bookings');
const propertiesRouter = require('./routes/properties');
const searchRouter = require('./routes/search');
const hotelAddonsRouter = require('./routes/hotel-addons');
const contactRouter = require('./routes/contact');
const tourInterestRouter = require('./routes/tour-interest');
const { serveCityPage } = require('./lib/city-pages');

const app = express();
app.use(express.json({ limit: '200kb' }));

// Keep auth/user storage and server internals off the public static surface.
app.use((req, res, next) => {
  const blocked = ['/data', '/routes', '/middleware', '/node_modules', '/.env', '/package.json', '/package-lock.json'];
  if (blocked.some((prefix) => req.path === prefix || req.path.startsWith(prefix + '/'))) {
    return res.status(404).end();
  }
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/search', searchRouter);
app.use('/api/hotel-addons', hotelAddonsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/tour-interest', tourInterestRouter);

// City listings and hotel pages live under html/cities/<region>/. A request
// for the old root filename redirects there. If a city file is missing, serve
// the copy stored in docs/sql/city-pages.sql before the static handler.
app.use(serveCityPage);

// Serve the static multi-page site alongside the API.
app.use(express.static(path.join(__dirname)));

// Apply rate limiter middleware before remaining route handlers
app.use(rateLimiter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Boreal Horizons server running on port ${PORT}`);
});
