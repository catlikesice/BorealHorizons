const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const http = require('http');

const root = path.join(__dirname, '..');
const CountryTours = require('../assets/country-tours');
const TourInterest = require('../assets/tour-interest');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-tour-interest-'));
process.env.TOUR_INTEREST_DATA_DIR = dataDir;
process.env.TOUR_INTEREST_RATE_LIMIT_DISABLED = '1';

const tourInterestRouter = require('../routes/tour-interest');

let server;
let base;

before(() => new Promise((resolve, reject) => {
  const app = express();
  app.use(express.json());
  app.use('/api/tour-interest', tourInterestRouter);
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    base = 'http://127.0.0.1:' + server.address().port;
    resolve();
  });
  server.on('error', reject);
}));

after(() => new Promise((resolve, reject) => {
  server.close((error) => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
}));

test('every country has a rural tour page with the navbar and an interest form', () => {
  const seen = new Set();
  assert.equal(CountryTours.countries.length, 12);
  assert.equal(CountryTours.get('svalbard'), null);
  const norway = CountryTours.get('norway');
  assert.ok(norway);
  assert.ok(CountryTours.ruralTours(norway).some((tour) => tour.place === 'Ny-Ålesund'));

  CountryTours.countries.forEach((country) => {
    assert.equal(seen.has(country.id), false, country.id + ' is listed twice');
    seen.add(country.id);
    const filePath = path.join(root, country.page);
    assert.equal(fs.existsSync(filePath), true, country.page + ' should exist');
    const html = fs.readFileSync(filePath, 'utf8');

    assert.match(html, /class="site-nav"/, country.name + ' should include the navbar');
    assert.match(html, /nav-dropdown-environment/, country.name + ' should include the environment menu');
    assert.match(html, /class="nav-rural-tours"/, country.name + ' should link to rural tours');
    assert.match(html, /nav-dropdown-account/, country.name + ' should include the account menu');
    assert.match(html, /assets\/nav-rail\.js/, country.name + ' should load the nav rail');
    assert.match(html, /<h2 id="rural-tours-title">Rural locations<\/h2>/);
    assert.match(html, /id="tour-interest-form"/);
    assert.match(html, /id="tour-interest-send"/);
    assert.match(html, new RegExp('name="country" type="hidden" value="' + country.id + '"'));
    assert.match(html, new RegExp('aria-current="page">' + country.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</a>'));

    const rural = CountryTours.ruralTours(country);
    assert.ok(rural.length > 0, country.name + ' should list rural tours');
    const badges = html.match(/tour-card__badge">Rural location/g) || [];
    assert.equal(badges.length, rural.length, country.name + ' should badge every rural tour');
    assert.equal((html.match(/class="tour-card /g) || []).length, rural.length);

    rural.forEach((tour) => {
      assert.equal(tour.rural, true);
      assert.equal(seen.has(tour.id), false, tour.id + ' is used twice');
      seen.add(tour.id);
      assert.match(html, new RegExp('<option value="' + tour.id + '"'));
      assert.match(html, new RegExp(tour.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      const stayPath = path.join(root, tour.stayUrl);
      assert.equal(fs.existsSync(stayPath), true, tour.stayUrl + ' should be a real stay page');
      assert.match(html, new RegExp('href="' + tour.stayUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'));
    });
  });
});

test('the tours index emphasises rural locations and can register interest', () => {
  const html = fs.readFileSync(path.join(root, 'html/tours/index.html'), 'utf8');
  assert.match(html, /Rural tours by country/);
  assert.match(html, /nav-rural-tours" aria-current="page"/);
  assert.match(html, /id="tour-interest-form"/);
  assert.match(html, /<select id="tour-interest-country" name="country" required>/);
  CountryTours.countries.forEach((country) => {
    assert.match(html, new RegExp('href="' + country.page.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'));
    assert.match(html, /Rural locations:/);
    CountryTours.ruralTours(country).forEach((tour) => {
      assert.match(html, new RegExp('<option value="' + tour.id + '"'));
    });
  });
  const uk = fs.readFileSync(path.join(root, 'html/tours/united-kingdom.html'), 'utf8');
  assert.match(uk, /Kielder/);
  assert.match(uk, /Loch Lomond/);
  assert.match(uk, /Rural location/);
});

test('primary pages link rural tours from the navbar', () => {
  const pages = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
  pages.forEach((fileName) => {
    const html = fs.readFileSync(path.join(root, fileName), 'utf8');
    if (!html.includes('nav-dropdown-environment')) return;
    assert.match(html, /class="nav-rural-tours"/, fileName + ' should include Rural tours in the navbar');
    assert.match(html, /href="html\/tours\/index\.html"/, fileName + ' should open the tours index');
  });
  const preferences = fs.readFileSync(path.join(root, 'site-preferences.js'), 'utf8');
  assert.match(preferences, /nav-rural-tours/);
  const translations = fs.readFileSync(path.join(root, 'assets/nav-translations.js'), 'utf8');
  assert.match(translations, /ruralTours: 'Rural tours'/);
  assert.match(translations, /ruralTours: 'Сельские туры'/);
  assert.match(translations, /nav-rural-tours/);
});

test('interest registration stores a rural tour and rejects a city tour id', async () => {
  const rejected = TourInterest.validate({
    name: 'Ada Guest',
    email: 'ada@example.com',
    country: 'sweden',
    tour: 'stockholm-vasa',
    partySize: '2',
    month: '',
    message: ''
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.code, 'tour');

  const accepted = TourInterest.validate({
    name: 'Ada Guest',
    email: 'Ada@Example.com',
    country: 'sweden',
    tour: 'sweden-abisko',
    partySize: '2',
    month: '03',
    message: 'Birch forest and the river village.'
  });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.value.email, 'ada@example.com');
  assert.equal(accepted.value.place, 'Abisko');
  assert.equal(accepted.value.countryName, 'Sweden');

  const missing = await fetch(base + '/api/tour-interest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ada Guest',
      email: 'not-an-email',
      country: 'sweden',
      tour: 'sweden-abisko',
      partySize: '2'
    })
  });
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).code, 'email');

  const created = await fetch(base + '/api/tour-interest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accepted.value)
  });
  assert.equal(created.status, 201);
  const payload = await created.json();
  assert.equal(payload.ok, true);
  assert.match(payload.id, /^[0-9a-f-]{36}$/);

  const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'tour-interest.json'), 'utf8'));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].tour, 'sweden-abisko');
  assert.equal(stored[0].tourName, 'Abisko national park walk');
  assert.equal(stored[0].email, 'ada@example.com');
});
