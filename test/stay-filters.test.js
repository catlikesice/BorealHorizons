const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ecolodges = require('../assets/ecolodges');

function hasClass(node, name) {
  return String(node.className || '').split(/\s+/).includes(name);
}

function createDocument(listClass) {
  function Element(tag) {
    this.tag = tag;
    this.className = '';
    this.id = '';
    this.textContent = '';
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.value = '';
    this.disabled = false;
    this.listeners = {};
    const rawDataset = {};
    const self = this;
    this.dataset = new Proxy(rawDataset, {
      get(target, prop) {
        return target[prop];
      },
      set(target, prop, value) {
        target[prop] = value == null ? '' : String(value);
        const attr = 'data-' + String(prop).replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
        self.attributes[attr] = target[prop];
        return true;
      }
    });
    this.classList = {
      remove() {},
      toggle(name, on) {
        const classes = new Set(self.className.split(/\s+/).filter(Boolean));
        if (on) classes.add(name);
        else classes.delete(name);
        self.className = Array.from(classes).join(' ');
      }
    };
  }

  Element.prototype.setAttribute = function (name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') this.id = String(value);
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = String(value);
    }
  };
  Element.prototype.getAttribute = function (name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  };
  Element.prototype.removeAttribute = function (name) {
    delete this.attributes[name];
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      delete this.dataset[key];
    }
  };
  Element.prototype.addEventListener = function (type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  };
  Element.prototype.appendChild = function (child) {
    if (child.parentNode) {
      const index = child.parentNode.children.indexOf(child);
      if (index >= 0) child.parentNode.children.splice(index, 1);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  };
  Element.prototype.insertBefore = function (child, ref) {
    if (child.parentNode) {
      const index = child.parentNode.children.indexOf(child);
      if (index >= 0) child.parentNode.children.splice(index, 1);
    }
    child.parentNode = this;
    const at = ref ? this.children.indexOf(ref) : -1;
    if (at < 0) this.children.push(child);
    else this.children.splice(at, 0, child);
    return child;
  };
  Object.defineProperty(Element.prototype, 'firstChild', {
    get() {
      return this.children[0] || null;
    }
  });

  function classesOf(node) {
    return String(node.className || '').split(/\s+/).filter(Boolean);
  }

  function matchesSimple(node, selector) {
    const parts = selector.match(/[a-zA-Z][\w-]*|\.[_a-zA-Z][\w-]*|\[[^\]]+\]/g);
    if (!parts) return false;
    return parts.every((part) => {
      if (part.charAt(0) === '.') return classesOf(node).includes(part.slice(1));
      if (part.charAt(0) === '[') {
        const body = part.slice(1, -1);
        const eq = body.indexOf('=');
        if (eq === -1) return Object.prototype.hasOwnProperty.call(node.attributes, body);
        let expected = body.slice(eq + 1);
        if (expected.charAt(0) === '"' && expected.charAt(expected.length - 1) === '"') {
          expected = expected.slice(1, -1);
        }
        return node.attributes[body.slice(0, eq)] === expected;
      }
      return node.tag === part;
    });
  }

  function matches(node, selector) {
    const chain = selector.trim().split(/\s+/);
    let current = node;
    for (let i = chain.length - 1; i >= 0; i -= 1) {
      if (i === chain.length - 1) {
        if (!matchesSimple(current, chain[i])) return false;
      } else {
        let ancestor = current.parentNode;
        let found = false;
        while (ancestor) {
          if (matchesSimple(ancestor, chain[i])) {
            current = ancestor;
            found = true;
            break;
          }
          ancestor = ancestor.parentNode;
        }
        if (!found) return false;
      }
    }
    return true;
  }

  function walk(node, visit) {
    (node.children || []).forEach((child) => {
      visit(child);
      walk(child, visit);
    });
  }

  Element.prototype.querySelector = function (selector) {
    let found = null;
    walk(this, (node) => {
      if (!found && matches(node, selector)) found = node;
    });
    return found;
  };
  Element.prototype.querySelectorAll = function (selector) {
    const found = [];
    walk(this, (node) => {
      if (matches(node, selector)) found.push(node);
    });
    return found;
  };

  const body = new Element('body');
  const currency = new Element('select');
  currency.id = 'currency';
  currency.value = 'ETH';

  const container = new Element('div');
  container.className = 'booking-container';
  const list = new Element('div');
  list.className = listClass;
  container.appendChild(list);
  body.appendChild(container);
  body.appendChild(currency);

  const document = {
    readyState: 'complete',
    documentElement: { lang: 'en' },
    body,
    createElement(tag) {
      return new Element(tag);
    },
    getElementById(id) {
      if (id === 'currency') return currency;
      let found = null;
      walk(body, (node) => {
        if (!found && node.id === id) found = node;
      });
      return found;
    },
    querySelector(selector) {
      return body.querySelector(selector);
    },
    querySelectorAll(selector) {
      return body.querySelectorAll(selector);
    },
    addEventListener() {}
  };

  return { document, body, list, Element };
}

function stayCard(Element, amounts, extra) {
  const card = new Element('div');
  card.className = 'hotel-card';
  const title = new Element('h3');
  title.textContent = extra.title;
  card.appendChild(title);
  const price = new Element('div');
  price.className = 'price';
  if (amounts.eth != null) price.dataset.eth = amounts.eth;
  if (amounts.btc != null) price.dataset.btc = amounts.btc;
  if (amounts.usdt != null) price.dataset.usdt = amounts.usdt;
  price.textContent = extra.priceText || (amounts.eth + ' ETH / night');
  card.appendChild(price);
  if (extra.text) {
    const paragraph = new Element('p');
    paragraph.textContent = extra.text;
    card.appendChild(paragraph);
  }
  if (extra.chain) {
    const chain = new Element('div');
    chain.className = extra.chainClass || 'hotel-chain';
    chain.textContent = extra.chain;
    card.appendChild(chain);
  }
  if (extra.href) {
    const link = new Element('a');
    link.className = 'book-link';
    link.setAttribute('href', extra.href);
    card.appendChild(link);
  }
  return card;
}

function boot(listClass, cards) {
  const { document, body, list, Element } = createDocument(listClass);
  cards.forEach((card) => list.appendChild(card(Element)));
  const context = {
    console,
    Intl,
    document,
    sessionStorage: { getItem() { return null; }, setItem() {} }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/payment-currencies.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/price-range-sidebar.js'), 'utf8'), context);
  return { context, body };
}

function click(el) {
  (el.listeners.click || []).forEach((fn) => fn({ target: el }));
}

function typeIn(el, value) {
  el.value = value;
  (el.listeners.input || []).forEach((fn) => fn({ target: el }));
}

function visibleTitles(body) {
  return body.querySelectorAll('.hotel-card')
    .filter((card) => !hasClass(card, 'is-filtered-out'))
    .map((card) => card.querySelector('h3').textContent);
}

function button(body, selector) {
  const found = body.querySelector(selector);
  assert.ok(found, selector);
  return found;
}

test('stay features come from the description, and ecolodge links stay in step', () => {
  const sandbox = {
    console,
    Intl,
    document: {
      readyState: 'loading',
      addEventListener() {},
      getElementById() { return null; },
      documentElement: { lang: 'en' },
      querySelectorAll() { return []; }
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/price-range-sidebar.js'), 'utf8'), sandbox);
  const api = sandbox.PriceRangeSidebar;

  const card = {
    querySelector(selector) {
      if (selector === 'h3') return { textContent: 'Funken Lodge' };
      if (selector === '.book-link') {
        return { getAttribute() { return 'html/cities/norway/funken-lodge.html'; } };
      }
      if (selector === '.hotel-group') return { textContent: '  Scandic Hotels  ' };
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'p') {
        return [{ textContent: 'Historic mining-era lodge with a spa beside the fjord.' }];
      }
      return [];
    }
  };

  assert.deepEqual([...api.factorsForCard(card)].sort(), ['historic', 'waterfront']);
  assert.deepEqual([...api.amenitiesForCard(card)].sort(), ['spa']);
  assert.equal(api.chainForCard(card), 'Scandic Hotels');
  assert.equal(api.isEcolodgeHref('html/cities/norway/funken-lodge.html'), false);
  ecolodges.urls.forEach((url) => {
    assert.equal(api.isEcolodgeHref(url), true, url);
  });

  const source = fs.readFileSync(path.join(root, 'assets/price-range-sidebar.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(source, /data-price-min/);
  assert.match(source, /data-factor/);
  assert.match(source, /is-filtered-out/);
  assert.match(css, /\.hotel-list \.hotel-card\.is-filtered-out/);
  assert.match(css, /\.hotel-grid \.hotel-card\.is-filtered-out/);
});

test('price ranges, budgets, features, and hotel groups select the stays', () => {
  const { body, context } = boot('hotel-list', [
    (Element) => stayCard(Element, { eth: '0.02', btc: '0.0003', usdt: '57' }, {
      title: 'Sea Spa',
      text: 'A quiet spa by the sea.'
    }),
    (Element) => stayCard(Element, { eth: '0.05', btc: '0.0008', usdt: '143' }, {
      title: 'Old Town Boutique',
      text: 'Boutique rooms in the old town.'
    }),
    (Element) => stayCard(Element, { eth: '0.09', btc: '0.0015', usdt: '257' }, {
      title: 'Slope Lodge',
      text: 'Slope-side ski lodge with a pool.',
      chain: 'Scandic Hotels',
      href: 'html/cities/sweden/abisko-mountain-lodge.html'
    })
  ]);

  assert.deepEqual(visibleTitles(body), ['Sea Spa', 'Old Town Boutique', 'Slope Lodge']);
  assert.equal(button(body, '[data-stay-clear]').disabled, true);
  assert.equal(button(body, '[data-stay-count]').textContent, 'Showing all 3 stays');
  assert.equal(hasClass(button(body, '[data-factors-block]'), 'is-hidden'), false);
  assert.equal(hasClass(button(body, '[data-chains-block]'), 'is-hidden'), false);

  click(button(body, '[data-filter="cheap"]'));
  click(button(body, '[data-filter="luxury"]'));
  assert.deepEqual(visibleTitles(body), ['Sea Spa', 'Slope Lodge']);
  assert.equal(button(body, '[data-filter="cheap"]').getAttribute('aria-pressed'), 'true');
  assert.equal(button(body, '[data-filter="midrange"]').getAttribute('aria-pressed'), 'false');
  assert.equal(button(body, '[data-stay-count]').textContent, '2 of 3 stays');
  assert.equal(hasClass(body.querySelectorAll('.hotel-card')[0], 'is-highlighted'), true);
  assert.equal(hasClass(body.querySelectorAll('.hotel-card')[1], 'is-filtered-out'), true);

  click(button(body, '[data-stay-clear]'));
  assert.deepEqual(visibleTitles(body), ['Sea Spa', 'Old Town Boutique', 'Slope Lodge']);

  click(button(body, '[data-amenity="spa"]'));
  click(button(body, '[data-factor="boutique"]'));
  assert.deepEqual(visibleTitles(body), []);
  assert.equal(hasClass(body.querySelector('[data-stay-empty]'), 'is-shown'), true);
  assert.equal(body.querySelector('[data-stay-empty]').textContent, 'No stays match these choices.');

  click(button(body, '[data-stay-clear]'));
  click(button(body, '[data-factor="ecolodge"]'));
  assert.deepEqual(visibleTitles(body), ['Slope Lodge']);

  click(button(body, '[data-stay-clear]'));
  typeIn(body.querySelector('[data-price-min]'), '0.08');
  typeIn(body.querySelector('[data-price-max]'), '0.03');
  assert.deepEqual(visibleTitles(body), ['Old Town Boutique']);

  click(button(body, '[data-stay-clear]'));
  assert.equal(body.querySelector('[data-price-min]').value, '');
  context.PriceRangeSidebar.setLanguage('sv');
  assert.equal(button(body, '[data-factor="waterfront"]').querySelector('.range-label').textContent, 'Vid vatten');
  assert.equal(button(body, '[data-amenity="spa"]').querySelector('.range-label').textContent, 'Spa');
  assert.equal(button(body, '[data-bounds-label]').textContent, 'Nattbudget');
  assert.equal(button(body, '[data-sort-label]').textContent, 'Ordna boenden');
  assert.equal(button(body, '[data-stay-count]').textContent, 'Visar alla 3 boenden');
  assert.equal(body.querySelector('[data-amenity-chip="spa"]').textContent, 'Spa');
});

function choose(el, value) {
  el.value = value;
  (el.listeners.change || []).forEach((fn) => fn({ target: el }));
}

test('amenities, a word search, and the guest’s chosen order narrow the list', () => {
  const { body, context } = boot('hotel-list', [
    (Element) => stayCard(Element, { eth: '0.05' }, {
      title: 'Waldorf Astoria',
      text: 'Grand landmark hotel with a spa and castle views.'
    }),
    (Element) => stayCard(Element, { eth: '0.12' }, {
      title: 'Hôtel du Vin',
      text: 'Boutique townhouse in the Old Town.'
    }),
    (Element) => stayCard(Element, { eth: '0.08' }, {
      title: 'Elite Academia',
      text: 'Contemporary stay with a restaurant and gym.',
      chain: 'Elite Hotels'
    })
  ]);

  assert.equal(hasClass(button(body, '[data-amenities-block]'), 'is-hidden'), false);
  assert.deepEqual(
    body.querySelector('[data-stay-sort]').children.map((option) => option.textContent),
    ['Recommended', 'Price: low to high', 'Price: high to low', 'Name: A to Z', 'Name: Z to A']
  );
  assert.equal(body.querySelector('[data-amenity-chip="view"]').textContent, 'View');
  assert.equal(body.querySelector('[data-amenity-chip="gym"]').textContent, 'Gym');

  click(button(body, '[data-amenity="view"]'));
  click(button(body, '[data-amenity="spa"]'));
  assert.deepEqual(visibleTitles(body), ['Waldorf Astoria']);
  assert.equal(button(body, '[data-amenity="view"]').getAttribute('aria-pressed'), 'true');

  click(button(body, '[data-stay-clear]'));
  typeIn(body.querySelector('[data-stay-search]'), 'elite hotels');
  assert.deepEqual(visibleTitles(body), ['Elite Academia']);

  click(button(body, '[data-stay-clear]'));
  typeIn(body.querySelector('[data-stay-search]'), 'old town');
  assert.deepEqual(visibleTitles(body), ['Hôtel du Vin']);

  click(button(body, '[data-stay-clear]'));
  choose(body.querySelector('[data-stay-sort]'), 'name-asc');
  assert.deepEqual(visibleTitles(body), ['Elite Academia', 'Hôtel du Vin', 'Waldorf Astoria']);
  choose(body.querySelector('[data-stay-sort]'), 'little');
  assert.deepEqual(visibleTitles(body), ['Waldorf Astoria', 'Elite Academia', 'Hôtel du Vin']);
  choose(body.querySelector('[data-stay-sort]'), 'much');
  assert.deepEqual(visibleTitles(body), ['Hôtel du Vin', 'Elite Academia', 'Waldorf Astoria']);
  choose(body.querySelector('[data-stay-sort]'), '');
  assert.deepEqual(visibleTitles(body), ['Waldorf Astoria', 'Hôtel du Vin', 'Elite Academia']);

  context.PriceRangeSidebar.setLanguage('sv');
  assert.equal(body.querySelector('[data-amenity-chip="view"]').textContent, 'Utsikt');
  assert.equal(button(body, '[data-amenity="gym"]').querySelector('.range-label').textContent, 'Gym');
  assert.equal(
    body.querySelector('[data-stay-sort]').children.map((option) => option.textContent)[1],
    'Pris: lägst först'
  );
  assert.equal(body.querySelector('[data-stay-sort]').value, '');
});

test('a hotel grid can be filtered by hotel group', () => {
  const { body } = boot('hotel-grid', [
    (Element) => stayCard(Element, {}, {
      title: 'Hotel Britannia',
      priceText: '0.035 ETH / night',
      chain: 'Britannia Hotels',
      chainClass: 'hotel-group'
    }),
    (Element) => stayCard(Element, {}, {
      title: 'Scandic Olympic',
      priceText: '0.029 ETH / night',
      chain: 'Scandic Hotels',
      chainClass: 'hotel-group'
    }),
    (Element) => stayCard(Element, {}, {
      title: 'Hotel Ansgar',
      priceText: '0.025 ETH / night',
      chain: 'Ansgar Group',
      chainClass: 'hotel-group'
    })
  ]);

  assert.equal(hasClass(button(body, '[data-chains-block]'), 'is-hidden'), false);
  const scandic = body.querySelectorAll('[data-chain]').find((node) => node.getAttribute('data-chain') === 'Scandic Hotels');
  click(scandic);
  assert.deepEqual(visibleTitles(body), ['Scandic Olympic']);
  click(button(body, '[data-filter="cheap"]'));
  assert.deepEqual(visibleTitles(body), []);
});

test('city listings that show hotel cards load the shared stay sidebar', () => {
  function walk(dir, acc) {
    fs.readdirSync(dir).forEach((name) => {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full, acc);
      else if (/\.(html|htm)$/i.test(name)) acc.push(full);
    });
    return acc;
  }
  const listings = walk(path.join(root, 'html/cities'), []).filter((file) => {
    const html = fs.readFileSync(file, 'utf8');
    return html.includes('class="hotel-card"') &&
      (html.includes('class="hotel-list"') || html.includes('class="hotel-grid"'));
  });
  assert.ok(listings.length >= 80);
  listings.forEach((file) => {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /assets\/price-range-sidebar\.js/, file);
  });
});
