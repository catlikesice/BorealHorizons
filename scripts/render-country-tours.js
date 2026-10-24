'use strict';

const fs = require('fs');
const path = require('path');
const CountryTours = require('../assets/country-tours');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'html', 'tours');

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function navbar(currentHref) {
  const ruralCurrent = currentHref === 'html/tours/index.html' ? ' aria-current="page"' : '';
  return [
    '  <header>',
    '    <nav class="site-nav" aria-label="Primary navigation">',
    '      <div class="nav-inner">',
    '        <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav-links">',
    '          <span class="sr-only">Menu</span>',
    '          <span class="nav-toggle__bars" aria-hidden="true"></span>',
    '        </button>',
    '        <div class="nav-containers" id="site-nav-links" role="menubar" aria-label="Site quick links">',
    '          <details class="nav-dropdown nav-dropdown-home" role="none">',
    '            <summary class="nav-box nav-box-home" role="menuitem" aria-haspopup="true" aria-label="Home">Home</summary>',
    '            <div class="nav-dropdown-menu" role="menu">',
    '              <a href="index.html" role="menuitem" class="nav-home-link">Home</a>',
    '              <a href="about-us-and-partners.html" role="menuitem" class="nav-about-partners">About Us and Partners</a>',
    '              <a href="hotel-chains.html" role="menuitem" class="nav-hotel-chains">Tailored for Hotel Chains</a>',
    '            </div>',
    '          </details>',
    '          <a class="nav-box nav-box-blog" href="culture-blog.html" role="menuitem" aria-label="Blog">Blog</a>',
    '          <details class="nav-dropdown nav-dropdown-environment" role="none">',
    '            <summary class="nav-box nav-box-environment" role="menuitem" aria-haspopup="true" aria-label="Environmental Mission">Environmental Mission</summary>',
    '            <div class="nav-dropdown-menu" role="menu">',
    '              <a href="crypto-environment.html" role="menuitem" class="nav-environment-link">Environmental Mission</a>',
    '              <a href="about-ecotourism.html" role="menuitem" class="nav-about-ecotourism">About EcoTourism</a>',
    '              <a href="html/tours/index.html" role="menuitem" class="nav-rural-tours"' + ruralCurrent + '>Rural tours</a>',
    '            </div>',
    '          </details>',
    '          <a class="nav-box nav-box-reliability" href="crypto-reliability.html" role="menuitem" aria-label="Reliable Blockchain">Reliable Blockchain</a>',
    '          <a class="nav-box nav-box-right" href="contact.html" role="menuitem" aria-label="Contact us">Contact</a>',
    '        </div>',
    '        <div class="nav-tools">',
    '          <details class="nav-dropdown nav-dropdown-account">',
    '            <summary class="nav-account-btn nav-box-account" data-login-open aria-haspopup="true" aria-expanded="false">Login</summary>',
    '            <div class="nav-dropdown-menu" role="menu" aria-label="Account">',
    '              <a href="login.html" role="menuitem" class="nav-account-login">Login</a>',
    '              <a href="register.html" role="menuitem" class="nav-account-register">Register</a>',
    '            </div>',
    '          </details>',
    '          <div class="language-switcher" aria-label="Language selector">',
    '            <label for="lang-select">Language</label>',
    '            <div class="language-switcher__select">',
    '              <select id="lang-select" aria-label="Select language">',
    '                <option value="en">English</option>',
    '                <option value="ru">Русский</option>',
    '                <option value="sv">Svenska</option>',
    '                <option value="de">Deutsch</option>',
    '              </select>',
    '            </div>',
    '          </div>',
    '        </div>',
    '        <ul class="nav-links" aria-hidden="true">',
    '          <li><a href="index.html">Home</a></li>',
    '          <li><a href="about-us-and-partners.html">About Us and Partners</a></li>',
    '          <li><a href="hotel-chains.html">Tailored for Hotel Chains</a></li>',
    '          <li><a href="culture-blog.html">Blog</a></li>',
    '          <li><a href="crypto-environment.html">Environmental Mission</a></li>',
    '          <li><a href="about-ecotourism.html">About EcoTourism</a></li>',
    '          <li><a href="html/tours/index.html"' + ruralCurrent + '>Rural tours</a></li>',
    '          <li><a href="crypto-reliability.html">Reliable Blockchain</a></li>',
    '          <li><a href="contact.html">Contact</a></li>',
    '          <li><a href="login.html">Login</a></li>',
    '          <li><a href="register.html">Register</a></li>',
    '        </ul>',
    '      </div>',
    '    </nav>',
    '  </header>'
  ].join('\n');
}

function scripts() {
  return [
    '  <script src="site-preferences.js"></script>',
    '  <script src="assets/nav-translations.js"></script>',
    '  <script src="assets/nav-rail.js"></script>',
    '  <script src="assets/local-auth.js"></script>',
    '  <script src="assets/auth-client.js"></script>',
    '  <script src="assets/country-tours.js"></script>',
    '  <script src="assets/tour-interest.js"></script>'
  ].join('\n');
}

function countryLinks(currentId) {
  const items = CountryTours.countries.map(function (country) {
    const current = country.id === currentId ? ' aria-current="page"' : '';
    return '        <li><a href="' + escapeHtml(country.page) + '"' + current + '>' + escapeHtml(country.name) + '</a></li>';
  });
  return [
    '      <nav class="tour-switcher-wrap" aria-label="Tours by country">',
    '        <ul class="tour-switcher">',
    items.join('\n'),
    '        </ul>',
    '      </nav>'
  ].join('\n');
}

function monthOptions() {
  const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return labels.map(function (label, index) {
    const value = String(index + 1).padStart(2, '0');
    return '              <option value="' + value + '" data-i18n="months.' + value + '">' + label + '</option>';
  }).join('\n');
}

function tourOptions(countries) {
  return countries.map(function (country) {
    const any = '              <option value="any" data-country="' + escapeHtml(country.id) + '" data-i18n="tourAny">Any rural tour in this country</option>';
    const tours = CountryTours.ruralTours(country).map(function (tour) {
      return '              <option value="' + escapeHtml(tour.id) + '" data-country="' + escapeHtml(country.id) + '">' + escapeHtml(tour.place + ' — ' + tour.name) + '</option>';
    });
    return [
      '            <optgroup label="' + escapeHtml(country.name) + '">',
      any,
      tours.join('\n'),
      '            </optgroup>'
    ].join('\n');
  }).join('\n');
}

function interestForm(country) {
  const countryField = country
    ? [
      '          <p class="tour-interest__country"><span data-i18n="country">Country</span>: ' + escapeHtml(country.name) + '</p>',
      '          <input id="tour-interest-country" name="country" type="hidden" value="' + escapeHtml(country.id) + '">'
    ].join('\n')
    : [
      '          <div class="form-group">',
      '            <label for="tour-interest-country"><span data-i18n="country">Country</span> <span class="required" aria-hidden="true">*</span></label>',
      '            <select id="tour-interest-country" name="country" required>',
      '              <option value="" selected disabled>Choose a country</option>',
      CountryTours.countries.map(function (item) {
        return '              <option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + '</option>';
      }).join('\n'),
      '            </select>',
      '          </div>'
    ].join('\n');

  const listed = country ? [country] : CountryTours.countries;

  return [
    '      <section class="auth-panel tour-interest" id="register-interest" aria-labelledby="tour-interest-title">',
    '        <h2 id="tour-interest-title" data-i18n="formTitle">Register your interest</h2>',
    '        <p class="auth-lead" data-i18n="formLead">Tell us which rural tour you want to hear about. We will write when a date is open.</p>',
    '        <form id="tour-interest-form" class="auth-form" novalidate>',
    '          <div class="form-row">',
    '            <div class="form-group">',
    '              <label for="tour-interest-name"><span data-i18n="name">Name</span> <span class="required" aria-hidden="true">*</span></label>',
    '              <input id="tour-interest-name" name="name" type="text" required autocomplete="name" maxlength="120" placeholder="Ada Guest">',
    '            </div>',
    '            <div class="form-group">',
    '              <label for="tour-interest-email"><span data-i18n="email">Email</span> <span class="required" aria-hidden="true">*</span></label>',
    '              <input id="tour-interest-email" name="email" type="email" required autocomplete="email" maxlength="160" placeholder="you@example.com">',
    '            </div>',
    '          </div>',
    countryField,
    '          <div class="form-group">',
    '            <label for="tour-interest-tour"><span data-i18n="tour">Rural tour</span> <span class="required" aria-hidden="true">*</span></label>',
    '            <select id="tour-interest-tour" name="tour" required>',
    '              <option value="" selected disabled data-i18n="tourPlaceholder">Choose a rural tour</option>',
    tourOptions(listed),
    '            </select>',
    '          </div>',
    '          <div class="form-row">',
    '            <div class="form-group">',
    '              <label for="tour-interest-party"><span data-i18n="party">Travellers</span> <span class="required" aria-hidden="true">*</span></label>',
    '              <input id="tour-interest-party" name="partySize" type="number" required min="1" max="20" value="2" inputmode="numeric">',
    '            </div>',
    '            <div class="form-group">',
    '              <label for="tour-interest-month"><span data-i18n="month">Preferred month</span></label>',
    '              <select id="tour-interest-month" name="month">',
    '                <option value="" data-i18n="monthNone">No preference</option>',
    monthOptions(),
    '              </select>',
    '            </div>',
    '          </div>',
    '          <div class="form-group">',
    '            <label for="tour-interest-message"><span data-i18n="message">Rural places you care about</span></label>',
    '            <textarea id="tour-interest-message" name="message" rows="4" maxlength="2000" data-i18n-placeholder="messagePlaceholder" placeholder="Villages, forests, or coasts you want included"></textarea>',
    '          </div>',
    '          <p class="auth-status" id="tour-interest-status" role="status" aria-live="polite"></p>',
    '          <div class="auth-actions">',
    '            <button class="btn" id="tour-interest-send" type="submit" data-i18n="send">Register interest</button>',
    '          </div>',
    '        </form>',
    '      </section>'
  ].join('\n');
}

function tourCard(tour) {
  return [
    '          <li class="tour-card tour-card--rural">',
    '            <p class="tour-card__badge">Rural location</p>',
    '            <h3>' + escapeHtml(tour.name) + '</h3>',
    '            <p class="tour-card__meta">' + escapeHtml(tour.place) + ' · ' + escapeHtml(tour.detail) + '</p>',
    '            <p>' + escapeHtml(tour.description) + '</p>',
    '            <a href="' + escapeHtml(tour.stayUrl) + '">' + escapeHtml(tour.stayLabel) + '</a>',
    '          </li>'
  ].join('\n');
}

function pageShell(options) {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <base href="/">',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>' + escapeHtml(options.title) + '</title>',
    '  <meta name="description" content="' + escapeHtml(options.description) + '">',
    '  <link rel="stylesheet" href="styles.css">',
    '</head>',
    '<body>',
    navbar(options.currentHref),
    '  <section class="hero">',
    '    <h2>' + escapeHtml(options.heading) + '</h2>',
    '    <p>' + escapeHtml(options.lead) + '</p>',
    '    <a class="btn" href="' + escapeHtml(options.currentHref) + '#register-interest">Register interest</a>',
    '  </section>',
    '  <main class="content">',
    options.main,
    '  </main>',
    '  <footer>',
    '    <p>&copy; 2026 Boreal Horizons. Blockchain solutions for the hospitality industry.</p>',
    '  </footer>',
    scripts(),
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

function renderIndex() {
  const cards = CountryTours.countries.map(function (country) {
    const places = CountryTours.ruralTours(country).map(function (tour) {
      return tour.place;
    });
    const uniquePlaces = places.filter(function (place, index) {
      return places.indexOf(place) === index;
    });
    return [
      '          <li class="tour-country-card">',
      '            <h3><a href="' + escapeHtml(country.page) + '">' + escapeHtml(country.name) + '</a></h3>',
      '            <p>' + escapeHtml(country.summary) + '</p>',
      '            <p class="tour-places">Rural locations: ' + escapeHtml(uniquePlaces.join(', ')) + '</p>',
      '            <a class="btn" href="' + escapeHtml(country.page) + '#register-interest">Register interest</a>',
      '          </li>'
    ].join('\n');
  }).join('\n');

  const main = [
    countryLinks(''),
    '      <section aria-labelledby="rural-index-title">',
    '        <h2 id="rural-index-title">Rural locations by country</h2>',
    '        <p>Each country page lists tours in villages, forests, fells, island settlements, and quiet coasts. Register your interest and the team will write when a date is open.</p>',
    '        <ul class="tour-country-grid">',
    cards,
    '        </ul>',
    '      </section>',
    interestForm(null)
  ].join('\n');

  return pageShell({
    title: 'Rural tours by country – Boreal Horizons',
    description: 'Register interest in rural tours across Northern Europe, grouped by country. Villages, forests, fells, and quiet coasts come first.',
    heading: 'Rural tours by country',
    lead: 'Choose a country and register your interest in a village, forest, fell, or coastal tour.',
    currentHref: 'html/tours/index.html',
    main: main
  });
}

function renderCountry(country) {
  const cards = CountryTours.ruralTours(country).map(tourCard).join('\n');
  const main = [
    countryLinks(country.id),
    '      <section aria-labelledby="rural-tours-title">',
    '        <h2 id="rural-tours-title">Rural locations</h2>',
    '        <p>' + escapeHtml(country.intro) + '</p>',
    '        <ul class="tour-list">',
    cards,
    '        </ul>',
    '      </section>',
    interestForm(country)
  ].join('\n');

  return pageShell({
    title: 'Rural tours in ' + country.name + ' – Boreal Horizons',
    description: country.summary,
    heading: 'Rural tours in ' + country.name,
    lead: country.summary,
    currentHref: country.page,
    main: main
  });
}

function writePages() {
  fs.mkdirSync(outDir, { recursive: true });
  const indexPath = path.join(outDir, 'index.html');
  fs.writeFileSync(indexPath, renderIndex(), 'utf8');
  const written = ['html/tours/index.html'];
  CountryTours.countries.forEach(function (country) {
    const fileName = path.posix.basename(country.page);
    fs.writeFileSync(path.join(outDir, fileName), renderCountry(country), 'utf8');
    written.push(country.page);
  });
  return written;
}

if (require.main === module) {
  const written = writePages();
  written.forEach(function (file) {
    process.stdout.write(file + '\n');
  });
}

module.exports = { writePages };
