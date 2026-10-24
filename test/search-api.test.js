const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');

const searchRouter = require('../routes/search');
const { loadStaticCatalog } = require('../lib/search-db');
const { getCityPage, hotelsFor } = require('../lib/city-pages');
const { listAddons } = require('../lib/hotel-addons');
const { listPackages, search: searchPackages } = require('../assets/tour-packages');

const root = path.join(__dirname, '..');
let server;
let base;

before(() => new Promise((resolve, reject) => {
  const app = express();
  app.use('/api/search', searchRouter);
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    base = 'http://127.0.0.1:' + server.address().port;
    resolve();
  });
  server.on('error', reject);
}));

after(() => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
}));

async function searchFor(query) {
  const response = await fetch(base + '/api/search?q=' + encodeURIComponent(query) + '&checkIn=2099-01-01&checkOut=2099-01-03&adults=2&children=0');
  assert.equal(response.status, 200);
  return response.json();
}

test('a blank query returns no rows', async () => {
  const body = await searchFor('   ');
  assert.deepEqual(body, { cities: [], hotels: [] });
});

test('every catalog hotel opens its own page', async () => {
  const body = await searchFor('CABINN City');
  assert.equal(body.hotels.length, 1);
  assert.equal(body.hotels[0].name, 'CABINN City');
  assert.equal(body.hotels[0].city, 'Copenhagen');
  assert.equal(body.hotels[0].cityUrl, 'html/cities/denmark/copenhagen.html');
  assert.notEqual(body.hotels[0].url, 'html/cities/denmark/copenhagen.html');
  assert.equal(fs.existsSync(path.join(root, body.hotels[0].url)), true);
  assert.equal(fs.existsSync(path.join(root, 'html/cities/denmark/copenhagen.html')), true);
  const page = fs.readFileSync(path.join(root, body.hotels[0].url), 'utf8');
  assert.match(page, /class="hotel-detail"/);
  assert.match(page, /site-preferences\.js/);
  assert.match(page, /language-switcher|class="site-nav"/);
  const copenhagen = getCityPage('html/cities/denmark/copenhagen.html');
  assert.ok(copenhagen);
  assert.ok(hotelsFor('html/cities/denmark/copenhagen.html').some((hotel) => hotel.name === 'CABINN City' && hotel.book_url === body.hotels[0].url));
});

test('hotels with a dedicated page keep that page', async () => {
  const body = await searchFor('kempinski');
  assert.equal(body.cities.length, 0);
  assert.equal(body.hotels.length, 1);
  assert.equal(body.hotels[0].url, 'html/cities/latvia/grand-hotel-kempinski-riga.html');
  assert.equal(fs.existsSync(path.join(root, body.hotels[0].url)), true);
});

test('places with no HTML page are returned from SQL', async () => {
  const catalog = loadStaticCatalog();
  assert.equal(catalog.cities.some((city) => city.name === 'Nida'), false);
  assert.equal(fs.existsSync(path.join(root, 'nida.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'barentsburg.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'pyramiden.html')), false);

  const nida = await searchFor('nida');
  assert.deepEqual(nida.cities.map((city) => city.name), ['Nida']);
  assert.equal(nida.cities[0].url, null);
  assert.equal(nida.cities[0].country, 'Lithuania');
  assert.equal(nida.hotels.length, 1);
  assert.equal(nida.hotels[0].name, 'Hotel Nida Marina');
  assert.ok(nida.hotels[0].url);
  assert.notEqual(nida.hotels[0].url, 'nida.html');
  assert.equal(fs.existsSync(path.join(root, nida.hotels[0].url)), true);
  assert.equal(nida.hotels[0].cityUrl, null);
  assert.equal(nida.hotels[0].price, '0.07 ETH / night');

  const labelled = await searchFor('Hotel Nida Marina — Nida');
  assert.deepEqual(labelled.hotels.map((hotel) => hotel.name), ['Hotel Nida Marina']);

  const barentsburg = await searchFor('Barentsburg');
  assert.equal(barentsburg.cities[0].url, null);
  assert.equal(barentsburg.hotels[0].name, 'Barentsburg Guesthouse');

  const pyramiden = await searchFor('Pyramiden');
  assert.equal(pyramiden.cities[0].name, 'Pyramiden');
  assert.equal(pyramiden.cities[0].url, null);

});

test('accent-folded city names still match', async () => {
  const body = await searchFor('reykjavik');
  assert.ok(body.cities.some((city) => city.name === 'Reykjavík' && city.url === 'html/cities/iceland/reykjavík.html'));
});

test('plain ASCII queries match letters SQL cannot unaccent on its own', async () => {
  const hafnarfjordur = await searchFor('hafnarfjordur');
  assert.deepEqual(hafnarfjordur.cities.map((city) => city.name), ['Hafnarfjörður']);
  assert.deepEqual(hafnarfjordur.hotels.map((hotel) => hotel.name), [
    'Helguhús Guesthouse',
    'Hótel Hafnarfjörður',
    'Hotel Viking'
  ]);

  const reykjanes = await searchFor('reykjanesbaer');
  assert.deepEqual(reykjanes.cities.map((city) => city.name), ['Reykjanesbær']);
  assert.equal(reykjanes.hotels.length, 3);

  const straight = await searchFor("d'Angleterre");
  const curly = await searchFor('d’Angleterre');
  const stripped = await searchFor('dangleterre');
  for (const body of [straight, curly, stripped]) {
    assert.deepEqual(body.hotels.map((hotel) => hotel.name), ['Hotel d’Angleterre']);
  }

  const kings = await searchFor('The Kings Arms');
  assert.deepEqual(kings.hotels.map((hotel) => hotel.name), ['The King’s Arms Hotel']);
});

test('scotland, lithuania, and finland towns without pages are searchable', async () => {
  const places = [
    { q: 'Kirkwall', city: 'Kirkwall', country: 'Scotland', hotel: 'Kirkwall Harbour Hotel', file: 'kirkwall.html' },
    { q: 'Tobermory', city: 'Tobermory', country: 'Scotland', hotel: 'Tobermory Waterfront Hotel', file: 'tobermory.html' },
    { q: 'Uist', city: 'Uist', country: 'Scotland', hotel: 'Uist Machair House', file: 'uist.html' },
    { q: 'Tarbert (Harris)', city: 'Tarbert (Harris)', country: 'Scotland', hotel: 'Tarbert Harris Hotel', file: 'tarbert-harris.html' },
    { q: 'Uig', city: 'Uig', country: 'Scotland', hotel: 'Uig Bay Hotel', file: 'uig.html' },
    { q: 'Dunvegan', city: 'Dunvegan', country: 'Scotland', hotel: 'Dunvegan Castle Hotel', file: 'dunvegan.html' },
    { q: 'Broadford', city: 'Broadford', country: 'Scotland', hotel: 'Broadford Bay Hotel', file: 'broadford.html' },
    { q: 'Armadale', city: 'Armadale', country: 'Scotland', hotel: 'Armadale Pier Hotel', file: 'armadale.html' },
    { q: 'Lochmaddy', city: 'Lochmaddy', country: 'Scotland', hotel: 'Lochmaddy Harbour Hotel', file: 'lochmaddy.html' },
    { q: 'Brodick', city: 'Brodick', country: 'Scotland', hotel: 'Brodick Ferry Hotel', file: 'brodick.html' },
    { q: 'Palanga', city: 'Palanga', country: 'Lithuania', hotel: 'Palanga Dune Hotel', file: 'palanga.html' },
    { q: 'Druskininkai', city: 'Druskininkai', country: 'Lithuania', hotel: 'Druskininkai Spa House', file: 'druskininkai.html' },
    { q: 'Trakai', city: 'Trakai', country: 'Lithuania', hotel: 'Trakai Lake House', file: 'trakai.html' },
    { q: 'Porvoo', city: 'Porvoo', country: 'Finland', hotel: 'Porvoo Old Town Hotel', file: 'porvoo.html' },
    { q: 'Kuopio', city: 'Kuopio', country: 'Finland', hotel: 'Kuopio Lakefront Hotel', file: 'kuopio.html' },
    { q: 'Savonlinna', city: 'Savonlinna', country: 'Finland', hotel: 'Savonlinna Castle Hotel', file: 'savonlinna.html' }
  ];

  for (const place of places) {
    assert.equal(fs.existsSync(path.join(root, place.file)), false, place.file + ' should not exist');
    const body = await searchFor(place.q);
    const city = body.cities.find((item) => item.name === place.city);
    assert.ok(city, place.city + ' should be returned');
    assert.equal(city.country, place.country);
    assert.equal(city.url, null);
    const hotel = body.hotels.find((item) => item.name === place.hotel);
    assert.ok(hotel, place.hotel + ' should be returned');
    assert.equal(hotel.city, place.city);
    assert.equal(hotel.country, place.country);
    assert.ok(hotel.url);
    assert.notEqual(hotel.url, place.file);
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
  }
});

test('Lochmaddy is returned with a Uist search', async () => {
  const body = await searchFor('Uist');
  assert.ok(body.cities.some((city) => city.name === 'Uist' && city.country === 'Scotland'));
  const hotel = body.hotels.find((item) => item.name === 'Lochmaddy Harbour Hotel');
  assert.ok(hotel, 'Lochmaddy Harbour Hotel should match Uist');
  assert.equal(hotel.city, 'Lochmaddy');
  assert.equal(hotel.country, 'Scotland');
  assert.equal(hotel.url, 'html/cities/scotland/lochmaddy-harbour-hotel.html');
  assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
});

test('Brodick is returned with an Isle of Arran search', async () => {
  const body = await searchFor('Isle of Arran');
  const hotel = body.hotels.find((item) => item.name === 'Brodick Ferry Hotel');
  assert.ok(hotel, 'Brodick Ferry Hotel should match Isle of Arran');
  assert.equal(hotel.city, 'Brodick');
  assert.equal(hotel.country, 'Scotland');
  assert.equal(hotel.url, 'html/cities/scotland/brodick-ferry-hotel.html');
  assert.equal(hotel.cityUrl, null);
  assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
  assert.equal(fs.existsSync(path.join(root, 'brodick.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'isle-of-arran.html')), false);
});

test('other named places without pages are searchable', async () => {
  const places = [
    { q: 'Jukkasjärvi', city: 'Jukkasjärvi', country: 'Sweden', hotel: 'Icehotel Jukkasjärvi', file: 'jukkasjarvi.html' },
    { q: 'Gjogv', city: 'Gjógv', country: 'Faroe Islands', hotel: 'Gjógv Guesthouse', file: 'gjogv.html' },
    { q: 'Saksun', city: 'Saksun', country: 'Faroe Islands', hotel: 'Saksun Turf House', file: 'saksun.html' },
    { q: 'Mykines', city: 'Mykines', country: 'Faroe Islands', hotel: 'Mykines Puffin Lodge', file: 'mykines.html' },
    { q: 'Nolsoy', city: 'Nólsoy', country: 'Faroe Islands', hotel: 'Nólsoy Harbour House', file: 'nolsoy.html' },
    { q: 'Vagar', city: 'Vágar', country: 'Faroe Islands', hotel: 'Vágar Cliff Hotel', file: 'vagar.html' },
    { q: 'Streymoy', city: 'Streymoy', country: 'Faroe Islands', hotel: 'Streymoy Valley Inn', file: 'streymoy.html' },
    { q: 'Eysturoy', city: 'Eysturoy', country: 'Faroe Islands', hotel: 'Eysturoy Sound Hotel', file: 'eysturoy.html' },
    { q: 'Ny-Alesund', city: 'Ny-Ålesund', country: 'Norway', hotel: 'Ny-Ålesund Polar Lodge', file: 'ny-alesund.html' },
    { q: 'Kastelholm', city: 'Kastelholm', country: 'Åland Islands', hotel: 'Kastelholm Castle Inn', file: 'kastelholm.html' },
    { q: 'Bomarsund', city: 'Bomarsund', country: 'Åland Islands', hotel: 'Bomarsund Fortress House', file: 'bomarsund.html' },
    { q: 'Isle of Skye', city: 'Isle of Skye', country: 'Scotland', hotel: 'Skye Cuillin Hotel', file: 'isle-of-skye.html' }
  ];

  for (const place of places) {
    assert.equal(fs.existsSync(path.join(root, place.file)), false, place.file + ' should not exist');
    const body = await searchFor(place.q);
    const city = body.cities.find((item) => item.name === place.city);
    assert.ok(city, place.city + ' should be returned');
    assert.equal(city.country, place.country);
    assert.equal(city.url, null);
    const hotel = body.hotels.find((item) => item.name === place.hotel);
    assert.ok(hotel, place.hotel + ' should be returned');
    assert.equal(hotel.city, place.city);
    assert.equal(hotel.country, place.country);
    assert.ok(hotel.url);
    assert.notEqual(hotel.url, place.file);
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
    assert.equal(hotel.cityUrl, null);
  }
});

test('pages missing from the catalog are returned from SQL', async () => {
  assert.equal(fs.existsSync(path.join(root, 'html/cities/lithuania/šiauliai.htm')), true);
  assert.equal(getCityPage('html/cities/lithuania/šiauliai.htm').city_name, 'Šiauliai');
  const siauliai = await searchFor('Siauliai');
  assert.deepEqual(siauliai.cities.map((city) => city.name), ['Šiauliai']);
  assert.equal(siauliai.cities[0].url, 'html/cities/lithuania/šiauliai.htm');
  assert.equal(siauliai.cities[0].country, 'Lithuania');
  assert.deepEqual(siauliai.hotels.map((hotel) => hotel.name), ['Park Inn Šiauliai', 'Old Town Boutique']);
  siauliai.hotels.forEach((hotel) => {
    assert.notEqual(hotel.url, 'html/cities/lithuania/šiauliai.htm');
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
    assert.equal(hotel.cityUrl, 'html/cities/lithuania/šiauliai.htm');
  });

  const odense = await searchFor('Odense');
  assert.ok(odense.cities.some((city) => city.name === 'Odense' && city.url === 'html/cities/denmark/odense.html'));
  assert.deepEqual(
    odense.hotels.map((hotel) => hotel.name),
    ['Hotel Odeon', 'First Hotel Grand', 'Comwell H.C. Andersen Odense']
  );
  odense.hotels.forEach((hotel) => {
    assert.notEqual(hotel.url, 'html/cities/denmark/odense.html');
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
    assert.equal(hotel.city, 'Odense');
  });

  assert.equal(fs.existsSync(path.join(root, 'html/cities/denmark/hotel-dangleterre-copenhagen.html')), true);
  const angleterre = await searchFor('Angleterre');
  assert.equal(angleterre.hotels.length, 1);
  assert.equal(angleterre.hotels[0].name, 'Hotel d’Angleterre');
  assert.equal(angleterre.hotels[0].city, 'Copenhagen');
  assert.equal(angleterre.hotels[0].url, 'html/cities/denmark/hotel-dangleterre-copenhagen.html');
  assert.equal(angleterre.hotels[0].price, '0.12 ETH / night');
});

test('Bauska, Latvia can be booked from search', async () => {
  assert.equal(fs.existsSync(path.join(root, 'html/cities/latvia/bauska.html')), true);
  const cityHtml = fs.readFileSync(path.join(root, 'html/cities/latvia/bauska.html'), 'utf8');
  assert.equal(cityHtml, getCityPage('html/cities/latvia/bauska.html').html);
  assert.match(cityHtml, /data-city="Bauska"/);
  assert.match(cityHtml, /href="html\/cities\/latvia\/hotel-bauska\.html"/);
  assert.match(cityHtml, /href="html\/cities\/latvia\/bauska-castle-hotel\.html"/);
  assert.deepEqual(
    hotelsFor('html/cities/latvia/bauska.html').map((hotel) => hotel.book_url),
    ['html/cities/latvia/hotel-bauska.html', 'html/cities/latvia/bauska-castle-hotel.html']
  );

  const body = await searchFor('Bauska');
  assert.deepEqual(body.cities.map((city) => city.name), ['Bauska']);
  assert.equal(body.cities[0].country, 'Latvia');
  assert.equal(body.cities[0].url, 'html/cities/latvia/bauska.html');
  assert.deepEqual(body.hotels.map((hotel) => hotel.name), ['Hotel Bauska', 'Bauska Castle Hotel']);

  for (const hotel of body.hotels) {
    assert.equal(hotel.city, 'Bauska');
    assert.equal(hotel.country, 'Latvia');
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
    const html = fs.readFileSync(path.join(root, hotel.url), 'utf8');
    assert.match(html, /data-city="Bauska"/);
    assert.match(html, /data-country="Latvia"/);
    assert.match(html, /checkout\.html/);
    assert.match(html, /assets\/hotel-booking-summary\.js/);
    assert.match(html, /assets\/booking-dates\.js/);
    assert.match(html, new RegExp(hotel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

async function searchForTours(query) {
  const response = await fetch(base + '/api/search?what=tours&q=' + encodeURIComponent(query));
  assert.equal(response.status, 200);
  return response.json();
}

test('tour search is separate from accommodation', async () => {
  const tours = await searchForTours('whale');
  assert.equal(tours.cities, undefined);
  assert.equal(tours.hotels, undefined);
  const whale = tours.tours.find((tour) => tour.name === 'Faxaflói whale watching');
  assert.ok(whale);
  assert.equal(whale.type, 'tour');
  assert.equal(whale.city, 'Reykjavík');
  assert.equal(whale.country, 'Iceland');
  assert.equal(whale.hotel, '');
  assert.equal(whale.scope, 'city');
  assert.equal(whale.addonId, 'whale-watching');
  assert.equal(whale.id, 'reykjavik:city:whale-watching');
  assert.equal(whale.pageUrl, 'html/cities/iceland/reykjavík.html');
  assert.match(whale.price, /ETH/);

  const stays = await searchFor('whale');
  assert.equal(stays.tours, undefined);
  assert.ok(Array.isArray(stays.cities));
  assert.ok(Array.isArray(stays.hotels));

  const explicit = await fetch(base + '/api/search?what=accommodation&q=kempinski');
  assert.equal(explicit.status, 200);
  const kempinskiStay = await explicit.json();
  assert.equal(kempinskiStay.tours, undefined);
  assert.equal(kempinskiStay.hotels[0].name, 'Grand Hotel Kempinski');

  const blank = await searchForTours('   ');
  assert.deepEqual(blank, { tours: [] });

  const kempinskiTours = await searchForTours('kempinski');
  assert.deepEqual(kempinskiTours.tours, []);

  const breakfast = await searchForTours('breakfast');
  assert.deepEqual(breakfast.tours, []);

  const bauska = await searchForTours('Bauska Castle tour');
  assert.deepEqual(bauska.tours.map((tour) => tour.hotel).sort(), ['Bauska Castle Hotel', 'Hotel Bauska']);
  assert.ok(bauska.tours.every((tour) => tour.addonId === 'castle-tour' && tour.city === 'Bauska'));

  const kirkwall = await searchForTours('Kirkwall walking');
  assert.equal(kirkwall.tours.length, 1);
  assert.equal(kirkwall.tours[0].name, 'Kirkwall walking tour');
  assert.equal(kirkwall.tours[0].city, 'Kirkwall');
  assert.equal(kirkwall.tours[0].country, 'Scotland');

  const art = await searchForTours('art nouveau');
  assert.ok(art.tours.some((tour) => tour.addonId === 'art-nouveau' && tour.city === 'Riga' && tour.hotel === ''));
});

test('tour search can be limited to one country', async () => {
  const icelandResponse = await fetch(base + '/api/search?what=tours&q=walking&country=' + encodeURIComponent('Iceland'));
  assert.equal(icelandResponse.status, 200);
  const iceland = await icelandResponse.json();
  assert.ok(iceland.tours.length > 0);
  assert.ok(iceland.tours.every((tour) => tour.country === 'Iceland'));

  const folded = await fetch(base + '/api/search?what=tours&q=walking&country=' + encodeURIComponent('iceland'));
  const foldedBody = await folded.json();
  assert.deepEqual(foldedBody.tours.map((tour) => tour.id), iceland.tours.map((tour) => tour.id));

  const elsewhere = await fetch(base + '/api/search?what=tours&q=' + encodeURIComponent('Kirkwall walking') + '&country=Iceland');
  assert.equal(elsewhere.status, 200);
  assert.deepEqual((await elsewhere.json()).tours, []);

  const scotland = await fetch(base + '/api/search?what=tours&q=' + encodeURIComponent('Kirkwall walking') + '&country=Scotland');
  const scotlandBody = await scotland.json();
  assert.equal(scotlandBody.tours.length, 1);
  assert.equal(scotlandBody.tours[0].country, 'Scotland');

  const labelsResponse = await fetch(base + '/api/search/destinations?what=tours&country=Iceland');
  assert.equal(labelsResponse.status, 200);
  const labels = await labelsResponse.json();
  assert.ok(labels.labels.includes('Faxaflói whale watching — Reykjavík'));
  assert.equal(labels.labels.includes('Kirkwall walking tour — Kirkwall'), false);
});

test('United Kingdom tour search includes Scotland and Northeast England', async () => {
  const response = await fetch(base + '/api/search?what=tours&q=walking&country=' + encodeURIComponent('United Kingdom'));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.tours.some((tour) => tour.city === 'Kirkwall' && tour.country === 'Scotland'));
  assert.ok(body.tours.some((tour) => tour.city === 'Durham' && tour.country === 'Northeast England'));
  assert.ok(body.tours.every((tour) => tour.country === 'Scotland' || tour.country === 'Northeast England'));
  assert.equal(body.tours.some((tour) => tour.country === 'Iceland'), false);

  const labelsResponse = await fetch(base + '/api/search/destinations?what=tours&country=' + encodeURIComponent('United Kingdom'));
  assert.equal(labelsResponse.status, 200);
  const labels = await labelsResponse.json();
  assert.ok(labels.labels.includes('Kirkwall walking tour — Kirkwall'));
  assert.ok(labels.labels.includes('Durham walking tour — Durham'));
  assert.equal(labels.labels.includes('Faxaflói whale watching — Reykjavík'), false);
});

test('homepage tour search puts the country dropdown in Where are you going', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const hero = fs.readFileSync(path.join(root, 'assets/hero-search.js'), 'utf8');
  const destination = html.slice(
    html.indexOf('hero-search__field--destination'),
    html.indexOf('hero-search__field--checkin')
  );
  assert.match(destination, /id="hero-search-destination-label"[^>]*>Where are you going\?</);
  assert.match(destination, /id="hero-search-country"/);
  assert.match(destination, /id="hero-search-country-any"[^>]*>Select Country</);
  assert.match(html, /hero-search-country-any": "Select Country"/);
  assert.doesNotMatch(html, /Any country/);
  assert.doesNotMatch(html, /id="hero-search-country-field"/);
  assert.doesNotMatch(html, /id="hero-search-country-label"/);
  assert.doesNotMatch(html, /hero-search-country-label/);
  assert.match(html, /id="hero-search-start-label"[^>]*>Start Date</);
  assert.match(html, /name="startDate"/);
  assert.match(html, /value="Iceland"/);
  assert.doesNotMatch(html, /value="Svalbard"/);
  assert.match(html, /value="Norway"/);
  assert.match(html, /value="United Kingdom"/);
  assert.doesNotMatch(html, /value="Scotland"/);
  assert.doesNotMatch(html, /value="Northeast England"/);
  assert.match(hero, /Please select a country\./);
  assert.match(hero, /hero-search--tours/);
  assert.match(hero, /setControl\(countrySelect, tours\)/);
  assert.match(hero, /setControl\(destination, !tours\)/);
  assert.match(hero, /Please choose a start date\./);
  assert.match(hero, /latestBookableISO/);
  assert.match(hero, /bookingHorizonError/);
  assert.match(hero, /setSearchField\(checkInField, !tours\)/);
  assert.match(hero, /setSearchField\(checkOutField, !tours\)/);
});

test('a country with no tour text lists that country', async () => {
  const icelandResponse = await fetch(base + '/api/search?what=tours&country=' + encodeURIComponent('Iceland'));
  assert.equal(icelandResponse.status, 200);
  const iceland = await icelandResponse.json();
  assert.ok(iceland.tours.length > 0);
  assert.ok(iceland.tours.every((tour) => tour.country === 'Iceland'));
  assert.ok(iceland.tours.some((tour) => tour.name === 'Faxaflói whale watching'));

  const anywhere = await fetch(base + '/api/search?what=tours&country=');
  assert.equal(anywhere.status, 200);
  const allTours = await anywhere.json();
  assert.ok(allTours.tours.length > iceland.tours.length);
  assert.ok(allTours.tours.some((tour) => tour.country === 'Iceland'));
  assert.ok(allTours.tours.some((tour) => tour.country === 'Scotland'));

  const unitedKingdom = await fetch(base + '/api/search?what=tours&country=' + encodeURIComponent('United Kingdom'));
  assert.equal(unitedKingdom.status, 200);
  const uk = await unitedKingdom.json();
  assert.ok(uk.tours.some((tour) => tour.city === 'Kirkwall' && tour.country === 'Scotland'));
  assert.ok(uk.tours.some((tour) => tour.city === 'Durham' && tour.country === 'Northeast England'));
  assert.equal(uk.tours.some((tour) => tour.country === 'Iceland'), false);
});

test('tour destination labels are experiences, not hotels', async () => {
  const response = await fetch(base + '/api/search/destinations?what=tours');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.labels.includes('Faxaflói whale watching — Reykjavík'));
  assert.ok(body.labels.includes('Bauska Castle tour — Hotel Bauska'));
  assert.ok(body.labels.includes('Bauska Castle tour — Bauska Castle Hotel'));
  assert.ok(body.labels.includes('Kirkwall walking tour — Kirkwall'));
  assert.equal(body.labels.includes('Grand Hotel Kempinski — Riga'), false);
  assert.equal(body.labels.includes('Nida'), false);
  assert.equal(body.labels.includes('Hotel Nida Marina — Nida'), false);
});

test('sample tour packages appear when searching tours', async () => {
  const packages = listPackages();
  assert.equal(packages.length, 13);
  const ids = new Set();
  packages.forEach((pkg) => {
    assert.equal(ids.has(pkg.id), false, pkg.id + ' is used twice');
    ids.add(pkg.id);
    assert.equal(fs.existsSync(path.join(root, pkg.pageUrl)), true, pkg.pageUrl);
    assert.ok(pkg.priceEth > 0);
    assert.ok(pkg.includes.length >= 3);
  });

  const golden = await searchForTours('Golden Circle');
  assert.equal(golden.tours.length, 1);
  const pkg = golden.tours[0];
  assert.equal(pkg.type, 'package');
  assert.equal(pkg.id, 'pkg-iceland-golden-circle');
  assert.equal(pkg.name, 'Golden Circle three-day package');
  assert.equal(pkg.city, 'Reykjavík');
  assert.equal(pkg.country, 'Iceland');
  assert.equal(pkg.hotel, '');
  assert.equal(pkg.addonId, '');
  assert.equal(pkg.scope, 'package');
  assert.deepEqual(pkg.includes, ['Þingvellir rift', 'Geysir field', 'Gullfoss waterfall', 'Lagoon soak']);
  assert.equal(pkg.price, '0.24 ETH');
  assert.equal(pkg.pageUrl, 'html/cities/iceland/reykjavík.html');

  const named = await searchForTours('package');
  assert.equal(named.tours.length, packages.length);
  assert.ok(named.tours.every((tour) => tour.type === 'package'));

  const whale = await searchForTours('whale');
  assert.ok(whale.tours.some((tour) => tour.name === 'Faxaflói whale watching'));
  assert.ok(whale.tours.every((tour) => tour.type === 'tour'));

  const stays = await searchFor('Golden Circle');
  assert.equal(stays.tours, undefined);
  assert.deepEqual(stays.cities, []);
  assert.deepEqual(stays.hotels, []);

  const icelandList = await (await fetch(base + '/api/search?what=tours&country=' + encodeURIComponent('Iceland'))).json();
  const icelandNames = icelandList.tours.map((tour) => tour.name);
  assert.ok(icelandNames.indexOf('Golden Circle three-day package') >= 0);
  assert.ok(icelandNames.indexOf('Golden Circle three-day package') < icelandNames.indexOf('Faxaflói whale watching'));

  const icelandResponse = await fetch(base + '/api/search?what=tours&q=package&country=' + encodeURIComponent('Iceland'));
  assert.equal(icelandResponse.status, 200);
  const iceland = await icelandResponse.json();
  assert.deepEqual(iceland.tours.map((tour) => tour.id), ['pkg-iceland-golden-circle']);

  const ukResponse = await fetch(base + '/api/search?what=tours&q=package&country=' + encodeURIComponent('United Kingdom'));
  assert.equal(ukResponse.status, 200);
  const uk = await ukResponse.json();
  assert.ok(uk.tours.some((tour) => tour.id === 'pkg-scotland-highland-rail' && tour.country === 'Scotland'));
  assert.ok(uk.tours.some((tour) => tour.id === 'pkg-england-northumberland' && tour.country === 'Northeast England'));
  assert.ok(uk.tours.every((tour) => tour.country === 'Scotland' || tour.country === 'Northeast England'));

  const labelsResponse = await fetch(base + '/api/search/destinations?what=tours&country=' + encodeURIComponent('Iceland'));
  const labels = await labelsResponse.json();
  assert.ok(labels.labels.includes('Golden Circle three-day package — Reykjavík'));
  assert.equal(labels.labels.includes('Highland rail package — Edinburgh'), false);

  const allLabels = await (await fetch(base + '/api/search/destinations?what=tours')).json();
  packages.forEach((item) => {
    assert.ok(allLabels.labels.includes(item.name + ' — ' + item.city), item.name);
  });

  const extras = listAddons({ city: 'Reykjavík' });
  assert.equal(extras.addons.some((addon) => /package/i.test(addon.label)), false);

  const script = fs.readFileSync(path.join(root, 'assets/search.js'), 'utf8');
  assert.match(script, /Sample package/);
  assert.match(script, /isPackage \? 'package'/);
  assert.match(script, /Choose a stay/);
  assert.match(script, /TourPackages\.search/);
  const page = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  assert.match(page, /search-card--package/);
  assert.match(page, /id="tour-results-heading"/);
  assert.match(page, /assets\/tour-packages\.js/);
  assert.ok(page.indexOf('assets/tour-packages.js') < page.indexOf('assets/search.js'));

  const offlineNorway = searchPackages('', 'Norway');
  assert.deepEqual(offlineNorway.map((tour) => tour.name), ['Hardangerfjord week']);
  assert.equal(offlineNorway[0].city, 'Bergen');
  assert.equal(offlineNorway[0].type, 'package');
  assert.deepEqual(searchPackages('', undefined), []);
  assert.deepEqual(searchPackages('package', undefined).map((tour) => tour.id), packages.map((tour) => tour.id));

  const norwayResponse = await fetch(base + '/api/search?what=tours&country=' + encodeURIComponent('Norway'));
  const norway = await norwayResponse.json();
  assert.deepEqual(
    norway.tours.filter((tour) => tour.type === 'package'),
    offlineNorway
  );
});

test('destination labels include places that have no page', async () => {
  const response = await fetch(base + '/api/search/destinations');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.labels.includes('Nida'));
  assert.ok(body.labels.includes('Hotel Nida Marina — Nida'));
  assert.ok(body.labels.includes('St Andrews'));
  assert.ok(body.labels.includes('Aviemore'));
  assert.ok(body.labels.includes('Pitlochry'));
  assert.ok(body.labels.includes('Ullapool'));
  assert.ok(body.labels.includes('Loch Lomond National Park'));
  assert.ok(body.labels.includes('The Lodge on Loch Lomond — Loch Lomond National Park'));
  assert.ok(body.labels.includes('Benbecula'));
  assert.ok(body.labels.includes('Dark Island Hotel — Benbecula'));
  assert.ok(body.labels.includes('Palanga'));
  assert.ok(body.labels.includes('Porvoo'));
  assert.ok(body.labels.includes('Savonlinna Castle Hotel — Savonlinna'));
  assert.ok(body.labels.includes('Gjógv'));
  assert.ok(body.labels.includes('Ny-Ålesund'));
  assert.ok(body.labels.includes('Isle of Skye'));
  assert.ok(body.labels.includes('Skye Cuillin Hotel — Isle of Skye'));
  assert.ok(body.labels.includes('Kirkwall'));
  assert.ok(body.labels.includes('Tarbert (Harris)'));
  assert.ok(body.labels.includes('Ullapool Ferry Hotel — Ullapool'));
  assert.ok(body.labels.includes('Armadale Pier Hotel — Armadale'));
  assert.ok(body.labels.includes('Lochmaddy'));
  assert.ok(body.labels.includes('Lochmaddy Harbour Hotel — Lochmaddy'));
  assert.ok(body.labels.includes('Brodick'));
  assert.ok(body.labels.includes('Brodick Ferry Hotel — Brodick'));
  assert.ok(body.labels.includes('Šiauliai'));
  assert.ok(body.labels.includes('Hotel d’Angleterre — Copenhagen'));
  assert.ok(body.labels.includes('Bauska'));
  assert.ok(body.labels.includes('Hotel Bauska — Bauska'));
  assert.ok(body.labels.includes('Aarhus'));
  assert.ok(body.labels.includes('Grand Hotel Kempinski — Riga'));
});

test('ecolodges=1 lists nature lodges and hides other stays', async () => {
  const allResponse = await fetch(base + '/api/search?ecolodges=1');
  assert.equal(allResponse.status, 200);
  const all = await allResponse.json();
  assert.deepEqual(all.cities, []);
  assert.deepEqual(all.hotels.map((hotel) => hotel.name), [
    'Abisko Mountain Lodge',
    'Björkliden Mountain Lodge',
    'STF Abisko Turiststation',
    'Rothiemurchus Lodge',
    'Ben Nevis Lodge',
    'Kielder Lodges',
    'Lews Castle Lodge',
    'Mykines Puffin Lodge',
    'Ny-Ålesund Polar Lodge'
  ]);

  const abiskoResponse = await fetch(base + '/api/search?q=abisko&ecolodges=1');
  assert.equal(abiskoResponse.status, 200);
  const abisko = await abiskoResponse.json();
  assert.deepEqual(abisko.cities, []);
  assert.deepEqual(abisko.hotels.map((hotel) => hotel.name), [
    'Abisko Mountain Lodge',
    'Björkliden Mountain Lodge',
    'STF Abisko Turiststation'
  ]);

  const kielderResponse = await fetch(base + '/api/search?q=kielder&ecolodges=1');
  const kielder = await kielderResponse.json();
  assert.deepEqual(kielder.cities, []);
  assert.deepEqual(kielder.hotels.map((hotel) => hotel.name), ['Kielder Lodges']);

  const rigaResponse = await fetch(base + '/api/search?q=riga&ecolodges=1');
  assert.deepEqual(await rigaResponse.json(), { cities: [], hotels: [] });

  const blankFlag = await fetch(base + '/api/search?ecolodges=');
  assert.deepEqual(await blankFlag.json(), { cities: [], hotels: [] });

  const toursResponse = await fetch(base + '/api/search?what=tours&q=walking&ecolodges=1');
  const tours = await toursResponse.json();
  assert.ok(tours.tours.length > 0);
  assert.equal(tours.hotels, undefined);

  const labelsResponse = await fetch(base + '/api/search/destinations?ecolodges=1');
  assert.equal(labelsResponse.status, 200);
  const labels = await labelsResponse.json();
  assert.ok(labels.labels.includes('Abisko'));
  assert.ok(labels.labels.includes('Abisko Mountain Lodge — Abisko'));
  assert.ok(labels.labels.includes('Ny-Ålesund'));
  assert.ok(labels.labels.includes('Ny-Ålesund Polar Lodge — Ny-Ålesund'));
  assert.equal(labels.labels.includes('Grand Hotel Kempinski — Riga'), false);
  assert.equal(labels.labels.includes('Funken Lodge — Longyearbyen'), false);
  assert.equal(labels.labels.includes('The Lodge on Loch Lomond — Loch Lomond National Park'), false);
  assert.equal(labels.labels.includes('Riga'), false);
});

test('search bars offer an ecolodges-only checkbox beside the query', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const hero = fs.readFileSync(path.join(root, 'assets/hero-search.js'), 'utf8');
  const searchPage = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'assets/search.js'), 'utf8');
  const destinationAt = html.indexOf('hero-search__field--destination');
  const ecoAt = html.indexOf('id="hero-search-ecolodge"');
  const checkInAt = html.indexOf('id="hero-search-checkin-field"');
  assert.ok(destinationAt !== -1 && ecoAt > destinationAt && checkInAt > ecoAt);
  assert.match(html, /id="hero-search-ecolodge" name="ecolodges" value="1"/);
  assert.match(html, /id="hero-search-ecolodge-label"[^>]*>Ecolodges only</);
  assert.match(html, /hero-search-ecolodge-label": "Ecolodges only"/);
  assert.match(html, /hero-search-ecolodge-label": "Только эко-лоджи"/);
  assert.match(html, /hero-search-ecolodge-label": "Endast ekolodger"/);
  assert.match(html, /hero-search-ecolodge-label": "Nur Ökolodges"/);
  assert.match(html, /assets\/ecolodges\.js/);
  assert.match(css, /\.hero-search__ecolodge \{/);
  assert.match(hero, /ecolodges=1/);
  assert.match(hero, /!query && !ecolodgesOnly\(\)/);
  assert.match(hero, /exactEcolodge\(query\)/);
  const inputAt = searchPage.indexOf('id="site-search-input"');
  const pageEcoAt = searchPage.indexOf('id="search-ecolodges"');
  const buttonAt = searchPage.indexOf('<button type="submit">Search</button>');
  assert.ok(inputAt !== -1 && pageEcoAt > inputAt && buttonAt > pageEcoAt);
  assert.match(searchPage, /id="search-ecolodges" name="ecolodges" value="1"/);
  assert.match(searchPage, /assets\/ecolodges\.js/);
  assert.match(searchJs, /ecolodgesOnly/);
  assert.match(searchJs, /Ecolodges only/);
});
