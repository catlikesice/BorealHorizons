const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const TourInterest = require('../assets/tour-interest');

const router = express.Router();

const DATA_DIR = process.env.TOUR_INTEREST_DATA_DIR
  ? path.resolve(process.env.TOUR_INTEREST_DATA_DIR)
  : path.join(__dirname, '..', 'data');
const INTEREST_FILE = path.join(DATA_DIR, 'tour-interest.json');

const interestLimiter = process.env.TOUR_INTEREST_RATE_LIMIT_DISABLED === '1'
  ? function skipInterestLimit(req, res, next) { next(); }
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 8,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: TourInterest.messageFor('rate', 'en'), code: 'rate' }
    });

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INTEREST_FILE)) {
    fs.writeFileSync(INTEREST_FILE, '[]', 'utf8');
  }
}

function readInterest() {
  ensureStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(INTEREST_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeInterest(records) {
  ensureStore();
  fs.writeFileSync(INTEREST_FILE, JSON.stringify(records, null, 2), 'utf8');
}

router.post('/', interestLimiter, function (req, res) {
  const result = TourInterest.validate(req.body);
  if (!result.ok) {
    return res.status(400).json({
      error: TourInterest.messageFor(result.code, 'en'),
      code: result.code
    });
  }

  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: result.value.name,
    email: result.value.email,
    country: result.value.country,
    countryName: result.value.countryName,
    tour: result.value.tour,
    tourName: result.value.tourName,
    place: result.value.place,
    partySize: result.value.partySize,
    month: result.value.month,
    message: result.value.message
  };

  const records = readInterest();
  records.push(record);
  writeInterest(records);

  res.status(201).json({ ok: true, id: record.id });
});

module.exports = router;
