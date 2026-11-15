const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { getCityPage, hotelsFor } = require('../lib/city-pages');
const { openSearchDatabase, search } = require('../lib/search-db');

const root = path.join(__dirname, '..');

function loadCatalog() {
  const source = fs.readFileSync(path.join(root, 'assets/search-catalog.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SEARCH_CATALOG;
}

const DESTINATIONS = [
  {
    city: 'Windermere',
    query: 'windermere',
    url: 'html/cities/northwest-england/windermere.html',
    hotels: ['Lakeside Hotel Windermere', 'The Old England Hotel', 'Burnside Hotel']
  },
  {
    city: 'Keswick',
    query: 'keswick',
    url: 'html/cities/northwest-england/keswick.html',
    hotels: ['Inn on the Square', 'Skiddaw Hotel', 'The Keswick Country House Hotel']
  },
  {
    city: 'Lake District National Park',
    query: 'lake district',
    url: 'html/cities/northwest-england/lake-district-national-park.html',
    hotels: ['Langdale Chase Hotel', 'The Borrowdale Hotel', 'Wasdale Head Inn']
  },
  {
    city: 'Lancaster',
    query: 'lancaster',
    url: 'html/cities/northwest-england/lancaster.html',
    hotels: ['Lancaster House Hotel', 'The Borough', 'Premier Inn Lancaster Central']
  },
  {
    city: 'Forest of Bowland',
    query: 'bowland',
    url: 'html/cities/northwest-england/forest-of-bowland.html',
    hotels: ['Inn at Whitewell', 'The Parkers Arms', 'The Assheton Arms']
  }
];

test('Northwest England Lake District and Lancashire places are listing pages and searchable', () => {
  const catalog = loadCatalog();
  const db = openSearchDatabase();

  DESTINATIONS.forEach((destination) => {
    const city = catalog.cities.find((item) => item.city === destination.city);
    assert.ok(city, destination.city);
    assert.equal(city.country, 'Northwest England');
    assert.equal(city.url, destination.url);

    const hotels = catalog.hotels.filter((item) => item.city === destination.city);
    assert.deepEqual(Array.from(hotels, (hotel) => hotel.name), destination.hotels);
    hotels.forEach((hotel) => {
      assert.notEqual(hotel.url, destination.url);
      assert.equal(fs.existsSync(path.join(root, hotel.url)), true, hotel.url);
      const hotelHtml = fs.readFileSync(path.join(root, hotel.url), 'utf8');
      assert.match(hotelHtml, /class="hotel-detail"/);
      assert.match(hotelHtml, /site-preferences\.js/);
      assert.match(hotelHtml, /language-switcher|class="site-nav"/);
      assert.equal(hotel.country, 'Northwest England');
    });

    const html = fs.readFileSync(path.join(root, destination.url), 'utf8');
    const page = getCityPage(destination.url);
    assert.ok(page, destination.url);
    assert.equal(html, page.html);
    assert.equal(page.city_name, destination.city);
    assert.equal(page.country, 'Northwest England');
    assert.match(html, /name=["']viewport["']/);
    assert.match(html, new RegExp('data-city="' + destination.city + '"'));
    assert.match(html, /site-preferences\.js/);

    const stored = hotelsFor(destination.url);
    assert.equal(stored.length, destination.hotels.length);
    destination.hotels.forEach((name) => {
      assert.ok(stored.some((hotel) => hotel.name === name), name);
      assert.match(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });

    const found = search(db, destination.query);
    assert.ok(found.cities.some((item) => item.name === destination.city), destination.query);
    destination.hotels.forEach((name) => {
      assert.ok(found.hotels.some((hotel) => hotel.name === name), name);
    });
  });
});
