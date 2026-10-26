const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/price-range-sidebar.js'), 'utf8');

function loadSidebar() {
  const sandbox = {
    console,
    Intl,
    document: {
      readyState: 'loading',
      addEventListener() {},
      getElementById() {
        return null;
      },
      documentElement: { lang: 'en' },
      querySelectorAll() {
        return [];
      },
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.PriceRangeSidebar;
}

function card(amounts, text) {
  return {
    querySelector(selector) {
      if (selector !== '.price') return null;
      return {
        dataset: amounts,
        textContent: text || '',
      };
    },
  };
}

test('orders stays from much to little, or from little to much', () => {
  const api = loadSidebar();
  const stays = [
    card({ eth: '0.08', btc: '0.0013', usdt: '228' }, '0.08 ETH / night'),
    card({ eth: '0.09', btc: '0.0015', usdt: '256' }, '0.09 ETH / night'),
    card({ eth: '0.07', btc: '0.0012', usdt: '200' }, '0.07 ETH / night'),
  ];

  function amounts(direction) {
    return Array.prototype.map
      .call(api.orderStayCards(stays, direction, 'ETH'), (stay) => stay.querySelector('.price').dataset.eth)
      .join(',');
  }

  assert.equal(amounts('much'), '0.09,0.08,0.07');
  assert.equal(amounts('little'), '0.07,0.08,0.09');
  assert.equal(amounts(null), '0.08,0.09,0.07');
});

test('keeps the original order when nightly rates match', () => {
  const api = loadSidebar();
  const stays = [
    card({ eth: '0.07' }, '0.07 ETH / night'),
    card({ eth: '0.09' }, '0.09 ETH / night'),
    card({ eth: '0.07' }, '0.07 ETH / night'),
  ];

  const much = api.orderStayCards(stays, 'much', 'ETH');
  assert.equal(much[0], stays[1]);
  assert.equal(much[1], stays[0]);
  assert.equal(much[2], stays[2]);
});

test('uses the selected currency, then the price shown on the card', () => {
  const api = loadSidebar();
  const stays = [
    card({ eth: '0.02', btc: '0.003' }, '9.50 SOL total for 2 nights (4.75 SOL/night)'),
    card({ eth: '0.08', btc: '0.001' }, '1.20 SOL / night'),
  ];

  function labels(direction, currency, read) {
    return Array.prototype.map
      .call(api.orderStayCards(stays, direction, currency), read)
      .join('|');
  }

  assert.equal(
    labels('much', 'BTC', (stay) => stay.querySelector('.price').dataset.btc),
    '0.003|0.001'
  );
  assert.equal(
    labels('little', 'SOL', (stay) => stay.querySelector('.price').textContent),
    '1.20 SOL / night|9.50 SOL total for 2 nights (4.75 SOL/night)'
  );
});

test('puts stays without a price after priced stays', () => {
  const api = loadSidebar();
  const priced = card({ eth: '0.04' }, '0.04 ETH / night');
  const unpriced = card({}, 'Ask the hotel');
  const much = api.orderStayCards([unpriced, priced], 'much', 'ETH');
  assert.equal(much[0], priced);
  assert.equal(much[1], unpriced);
});

test('orders stays by name without losing the original order when names match', () => {
  const api = loadSidebar();
  function titled(title, amounts) {
    return {
      querySelector(selector) {
        if (selector === 'h3') return { textContent: title };
        if (selector === '.price') return { dataset: amounts || {}, textContent: '' };
        return null;
      },
    };
  }
  const stays = [
    titled('Cedar House', { eth: '0.04' }),
    titled('cedar house', { eth: '0.09' }),
    titled('Birch Inn', { eth: '0.02' }),
    titled('', { eth: '0.01' }),
  ];

  function titles(direction) {
    return api.orderStayCards(stays, direction, 'ETH').map((stay) => stay.querySelector('h3').textContent).join('|');
  }

  assert.equal(titles('name-asc'), 'Birch Inn|Cedar House|cedar house|');
  assert.equal(titles('name-desc'), 'Cedar House|cedar house|Birch Inn|');
  assert.equal(titles(null) , 'Cedar House|cedar house|Birch Inn|');
});

test('city listings let a guest arrange stays without treating order as a budget tier', () => {
  assert.match(source, /data-stay-sort/);
  assert.match(source, /name-asc/);
  assert.match(source, /name-desc/);
  assert.match(source, /data-amenity/);
  assert.match(source, /data-stay-search/);
  assert.match(source, /querySelectorAll\('\.price-range-option\[data-filter\]'\)/);
  assert.doesNotMatch(source, /data-filter="much"/);
  assert.doesNotMatch(source, /data-filter="little"/);
  assert.doesNotMatch(source, /dataset\.order = key/);
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /\.stay-sort select/);
  assert.match(css, /\.hotel-amenities/);
});
