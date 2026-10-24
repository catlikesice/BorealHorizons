/**
 * Search results page logic.
 *
 * Prefer GET /api/search, which reads the SQL catalog and also returns places
 * that have no HTML page (url is null). If the API cannot be reached, fall
 * back to window.SEARCH_CATALOG. Tour search falls back to window.TourPackages
 * when that request fails, including a 404, so sample packages still appear.
 * Schema: docs/sql/hotel-search.md.
 * ecolodges=1 limits accommodation results to nature lodges and mountain stations.
 * A blank q with that flag lists every ecolodge. Tours ignore the flag.
 */
(function () {
  'use strict';

  var SQL_SEARCH_ENDPOINT = '/api/search';
  var BOOKING_STORAGE_KEY = 'balticComfortBooking';

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/ø/g, 'o')
      .replace(/æ/g, 'ae')
      .replace(/ð/g, 'd')
      .replace(/þ/g, 'th')
      .replace(/['’ʼ]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function getQueryFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('q') || '').trim();
  }

  function getKindFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('what') === 'tours' ? 'tours' : 'accommodation';
  }

  function ecolodgeFlag(value) {
    var text = String(value || '').trim().toLowerCase();
    return text === '1' || text === 'true' || text === 'yes' || text === 'on';
  }

  function selectedKind(form) {
    var checked = form ? form.querySelector('input[name="what"]:checked') : null;
    return checked && checked.value === 'tours' ? 'tours' : 'accommodation';
  }

  function parseGuestCount(value, min, max, fallback) {
    var parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, parsed));
  }

  function readStoredBooking() {
    try {
      if (!window.sessionStorage) {
        return null;
      }
      var raw = window.sessionStorage.getItem(BOOKING_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Unable to read stored booking details', error);
      return null;
    }
  }

  function persistBookingSelection(details) {
    if (!details) {
      return;
    }

    try {
      var stored = readStoredBooking() || {};
      var payload = Object.assign({}, stored, details, { updatedAt: new Date().toISOString() });
      if (window.sessionStorage) {
        window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (error) {
      console.warn('Unable to persist booking selection details', error);
    }
  }

  function formatGuestSummary(adults, children) {
    var parts = [];
    if (Number.isFinite(adults) && adults > 0) {
      parts.push(adults === 1 ? '1 adult' : adults + ' adults');
    }
    if (Number.isFinite(children) && children > 0) {
      parts.push(children === 1 ? '1 child' : children + ' children');
    } else if (Number.isFinite(children) && children === 0 && parts.length) {
      parts.push('no children');
    }
    return parts.join(', ');
  }

  function canonicalDate(value) {
    var text = String(value || '').trim();
    if (!text) {
      return '';
    }
    if (window.BookingDates && typeof window.BookingDates.toISO === 'function') {
      return window.BookingDates.toISO(text) || text;
    }
    return text;
  }

  function displayDate(value) {
    if (window.BookingDates && typeof window.BookingDates.toEuropean === 'function') {
      return window.BookingDates.toEuropean(value) || value;
    }
    return value;
  }

  function horizonNote(stay) {
    var api = window.BookingDates;
    if (!api || typeof api.exceedsBookingHorizon !== 'function' || typeof api.bookingHorizonError !== 'function' || !stay) {
      return '';
    }
    if (stay.tours && api.exceedsBookingHorizon(stay.startDate)) {
      return api.bookingHorizonError('start');
    }
    if (!stay.tours && api.exceedsBookingHorizon(stay.checkIn)) {
      return api.bookingHorizonError('check-in');
    }
    if (!stay.tours && api.exceedsBookingHorizon(stay.checkOut)) {
      return api.bookingHorizonError('check-out');
    }
    return '';
  }

  function getStayFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var stored = readStoredBooking() || {};
    var tours = params.get('what') === 'tours';
    var checkIn = tours ? '' : canonicalDate(params.get('checkIn') || stored.checkInDate || '');
    var checkOut = tours ? '' : canonicalDate(params.get('checkOut') || stored.checkOutDate || '');
    var adults = parseGuestCount(params.get('adults') != null ? params.get('adults') : stored.adults, 1, 20, NaN);
    var children = parseGuestCount(params.get('children') != null ? params.get('children') : stored.children, 0, 10, NaN);

    return {
      tours: tours,
      ecolodgesOnly: !tours && ecolodgeFlag(params.get('ecolodges')),
      checkIn: checkIn,
      checkOut: checkOut,
      startDate: tours ? canonicalDate(params.get('startDate') || '') : '',
      countrySpecified: tours && params.has('country'),
      tourCountry: tours && params.has('country') ? String(params.get('country') || '').trim() : '',
      adults: adults,
      children: children
    };
  }

  function syncStayFields(stay) {
    var checkInEl = document.getElementById('search-checkin');
    var checkOutEl = document.getElementById('search-checkout');
    var startEl = document.getElementById('search-start');
    var countryEl = document.getElementById('search-country');
    var adultsEl = document.getElementById('search-adults');
    var childrenEl = document.getElementById('search-children');
    var stayEl = document.getElementById('search-stay');
    var tours = Boolean(stay.tours);

    if (checkInEl) {
      checkInEl.disabled = tours;
      checkInEl.value = tours ? '' : (stay.checkIn || '');
    }
    if (checkOutEl) {
      checkOutEl.disabled = tours;
      checkOutEl.value = tours ? '' : (stay.checkOut || '');
    }
    if (startEl) {
      startEl.disabled = !tours;
      startEl.value = tours ? (stay.startDate || '') : '';
    }
    if (countryEl) {
      countryEl.disabled = !tours || !stay.countrySpecified;
      countryEl.value = tours ? (stay.tourCountry || '') : '';
    }
    if (adultsEl && Number.isFinite(stay.adults)) adultsEl.value = String(stay.adults);
    if (childrenEl && Number.isFinite(stay.children)) childrenEl.value = String(stay.children);

    var parts = [];
    if (tours && stay.startDate) {
      parts.push('Start date: ' + displayDate(stay.startDate));
    } else if (stay.checkIn && stay.checkOut) {
      parts.push('Stay: ' + displayDate(stay.checkIn) + ' – ' + displayDate(stay.checkOut));
    }
    var tooFar = horizonNote(stay);
    if (tooFar) {
      parts.push(tooFar);
    }
    if (tours && stay.tourCountry) {
      parts.push('Country: ' + stay.tourCountry);
    }
    if (stay.ecolodgesOnly) {
      parts.push('Ecolodges only');
    }
    var guestLabel = formatGuestSummary(stay.adults, stay.children);
    if (guestLabel) {
      parts.push('Guests: ' + guestLabel);
    }

    if (stayEl) {
      if (parts.length) {
        stayEl.hidden = false;
        stayEl.textContent = parts.join(' · ');
      } else {
        stayEl.hidden = true;
        stayEl.textContent = '';
      }
    }

    if (stay.startDate || stay.countrySpecified || stay.tourCountry || stay.checkIn || stay.checkOut || Number.isFinite(stay.adults) || Number.isFinite(stay.children)) {
      var payload = {};
      if (tours && stay.startDate) payload.startDate = stay.startDate;
      if (tours && stay.countrySpecified) payload.tourCountry = stay.tourCountry || '';
      if (!tours && stay.checkIn) payload.checkInDate = stay.checkIn;
      if (!tours && stay.checkOut) payload.checkOutDate = stay.checkOut;
      if (Number.isFinite(stay.adults)) payload.adults = stay.adults;
      if (Number.isFinite(stay.children)) payload.children = stay.children;
      if (Number.isFinite(stay.adults) && Number.isFinite(stay.children)) {
        payload.guests = stay.adults + stay.children;
      }
      persistBookingSelection(payload);
    }
  }

  function queryTokens(query) {
    return normalize(query).replace(/[—–]/g, ' ').split(/\s+/).filter(Boolean);
  }

  function matchesQuery(item, query) {
    if (!query) return false;
    var haystack = normalize([
      item.name,
      item.city,
      item.country,
      item.description,
      item.price,
      item.type
    ].join(' '));
    var tokens = queryTokens(query);
    if (!tokens.length) return false;
    return tokens.every(function (token) {
      return haystack.indexOf(token) !== -1;
    });
  }

  function filterCatalog(query, options) {
    var catalog = window.SEARCH_CATALOG || { cities: [], hotels: [] };
    var onlyEco = Boolean(options && options.ecolodgesOnly);
    var hotels = catalog.hotels || [];
    if (onlyEco) {
      hotels = hotels.filter(function (item) {
        return window.Ecolodges && window.Ecolodges.isEcolodge(item);
      });
    }
    if (!query) {
      return {
        cities: [],
        hotels: onlyEco ? hotels : []
      };
    }
    return {
      cities: onlyEco ? [] : (catalog.cities || []).filter(function (item) {
        return matchesQuery(item, query);
      }),
      hotels: hotels.filter(function (item) {
        return matchesQuery(item, query);
      })
    };
  }

  function fetchSearchResults(query, kind) {
    var params = new URLSearchParams(window.location.search);
    params.set('q', query);
    params.set('what', kind === 'tours' ? 'tours' : 'accommodation');
    if (kind === 'tours') {
      params.delete('ecolodges');
    }
    var onlyEco = kind !== 'tours' && ecolodgeFlag(params.get('ecolodges'));
    return fetch(SQL_SEARCH_ENDPOINT + '?' + params.toString(), {
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('Search request failed (' + res.status + ')');
      }
      var contentType = res.headers && typeof res.headers.get === 'function'
        ? res.headers.get('content-type') || ''
        : '';
      if (contentType && contentType.indexOf('json') === -1) {
        throw new Error('Search request failed (' + res.status + ')');
      }
      return res.json();
    }).catch(function (err) {
      // A static host has no /api/search and answers 404. Sample packages
      // still come from the page script.
      if (kind === 'tours' && window.TourPackages && typeof window.TourPackages.search === 'function') {
        var searchParams = new URLSearchParams(window.location.search);
        var country = searchParams.has('country') ? searchParams.get('country') : undefined;
        return { tours: window.TourPackages.search(query, country) };
      }
      // The static catalog has no SQL-only places. Use it for accommodation
      // when the API cannot be reached.
      if (kind !== 'tours' && err && err.name === 'TypeError' && window.SEARCH_CATALOG) {
        return filterCatalog(query, { ecolodgesOnly: onlyEco });
      }
      throw err;
    });
  }

  function pageNote() {
    return '<p class="search-card__note">No separate page. This place is included in search.</p>';
  }

  function pageLink(url, label) {
    if (!url) {
      return pageNote();
    }
    return '<a class="search-card__link" href="' + escapeHtml(url) + '">' + label + '</a>';
  }

  function hotelHasOwnPage(hotel) {
    if (!hotel || !hotel.url || hotel.url === hotel.cityUrl) {
      return false;
    }
    return Boolean(window.BorealPropertyPages && window.BorealPropertyPages.isPropertyPage(hotel.url));
  }

  function hotelSelectHref(hotel) {
    var params = new URLSearchParams();
    params.set('hotel', hotel.name || '');
    if (hotel.city) params.set('city', hotel.city);
    if (hotel.country) params.set('country', hotel.country);
    var page = hotel.cityUrl || hotel.url || '';
    if (page) params.set('page', page);
    var stay = getStayFromUrl();
    if (stay.checkIn) params.set('checkIn', stay.checkIn);
    if (stay.checkOut) params.set('checkOut', stay.checkOut);
    if (Number.isFinite(stay.adults)) params.set('adults', String(stay.adults));
    if (Number.isFinite(stay.children)) params.set('children', String(stay.children));
    return 'trip.html?' + params.toString();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderCityCard(city) {
    var location = [city.city, city.country].filter(Boolean).join(', ');
    return (
      '<article class="search-card search-card--city">' +
        '<div class="search-card__body">' +
          '<p class="search-card__eyebrow">City</p>' +
          '<h3 class="search-card__title">' + escapeHtml(city.name) + '</h3>' +
          (location ? '<p class="search-card__meta">' + escapeHtml(location) + '</p>' : '') +
          (city.description ? '<p class="search-card__desc">' + escapeHtml(city.description) + '</p>' : '') +
          pageLink(city.url, 'View hotels') +
        '</div>' +
      '</article>'
    );
  }

  function tourSelectHref(tour) {
    var params = new URLSearchParams();
    if (tour.hotel) params.set('hotel', tour.hotel);
    if (tour.city) params.set('city', tour.city);
    if (tour.country) params.set('country', tour.country);
    if (tour.pageUrl) params.set('page', tour.pageUrl);
    if (tour.addonId) params.set('addon', tour.addonId);
    var stay = getStayFromUrl();
    if (stay.startDate) params.set('startDate', stay.startDate);
    if (stay.checkIn) params.set('checkIn', stay.checkIn);
    if (stay.checkOut) params.set('checkOut', stay.checkOut);
    if (Number.isFinite(stay.adults)) params.set('adults', String(stay.adults));
    if (Number.isFinite(stay.children)) params.set('children', String(stay.children));
    return 'trip.html?' + params.toString();
  }

  function tourCountryLabel(country) {
    var folded = normalize(country).replace(/\s+/g, ' ').trim();
    if (folded === 'scotland' || folded === 'northeast england') {
      return 'United Kingdom';
    }
    return country || '';
  }

  function renderTourCard(tour) {
    var isPackage = tour.type === 'package';
    var place = [tour.city, tourCountryLabel(tour.country)].filter(Boolean).join(', ');
    var location = tour.hotel ? tour.hotel + (place ? ' · ' + place : '') : place;
    var includes = isPackage && Array.isArray(tour.includes) && tour.includes.length
      ? '<ul class="search-card__includes">' + tour.includes.map(function (item) {
          return '<li>' + escapeHtml(item) + '</li>';
        }).join('') + '</ul>'
      : '';
    return (
      '<article class="search-card search-card--' + (isPackage ? 'package' : 'tour') + '">' +
        '<div class="search-card__body">' +
          '<p class="search-card__eyebrow">' + (isPackage ? 'Sample package' : 'Tour') + '</p>' +
          '<h3 class="search-card__title">' + escapeHtml(tour.name) + '</h3>' +
          (location ? '<p class="search-card__meta">' + escapeHtml(location) + '</p>' : '') +
          (tour.detail ? '<p class="search-card__meta">' + escapeHtml(tour.detail) + '</p>' : '') +
          (tour.price ? '<p class="search-card__price">' + escapeHtml(tour.price) + '</p>' : '') +
          (tour.description ? '<p class="search-card__desc">' + escapeHtml(tour.description) + '</p>' : '') +
          includes +
          pageLink(tourSelectHref(tour), isPackage ? 'Choose a stay' : 'Add to stay') +
        '</div>' +
      '</article>'
    );
  }

  function renderHotelCard(hotel) {
    var location = [hotel.city, hotel.country].filter(Boolean).join(', ');
    var image = hotel.image
      ? '<img class="search-card__image" src="' + escapeHtml(hotel.image) + '" alt="' + escapeHtml(hotel.name) + '">'
      : '<div class="search-card__image search-card__image--placeholder" aria-hidden="true"></div>';

    var eyebrow = window.Ecolodges && window.Ecolodges.isEcolodge(hotel) ? 'Ecolodge' : 'Hotel';
    return (
      '<article class="search-card search-card--hotel">' +
        image +
        '<div class="search-card__body">' +
          '<p class="search-card__eyebrow">' + eyebrow + '</p>' +
          '<h3 class="search-card__title">' + escapeHtml(hotel.name) + '</h3>' +
          (location ? '<p class="search-card__meta">' + escapeHtml(location) + '</p>' : '') +
          (hotel.price ? '<p class="search-card__price">' + escapeHtml(hotel.price) + '</p>' : '') +
          (hotel.description ? '<p class="search-card__desc">' + escapeHtml(hotel.description) + '</p>' : '') +
          (hotelHasOwnPage(hotel)
            ? pageLink(hotel.url, 'View &amp; Book')
            : pageLink(hotelSelectHref(hotel), 'Select stay')) +
        '</div>' +
      '</article>'
    );
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function applyKindCopy(kind) {
    var tours = kind === 'tours';
    var ecoBox = document.getElementById('search-ecolodges');
    var onlyEco = !tours && ecoBox && ecoBox.checked && !ecoBox.disabled;
    var input = document.getElementById('site-search-input');
    var emptyCopy = document.getElementById('search-empty-copy');
    var note = document.getElementById('search-catalog-note');
    var intro = document.getElementById('search-intro');
    setText('site-search-label', tours ? 'Search tours' : 'Search hotels and cities');
    if (input) {
      input.placeholder = tours
        ? 'Try whale watching, Golden Circle, or Riga'
        : (onlyEco ? 'Ecolodge or place, e.g. Abisko' : 'Try Riga, Tallinn, or Kempinski');
    }
    if (intro) {
      intro.textContent = tours
        ? 'Find a guided tour, boat trip, museum visit, or a sample package such as the Golden Circle or an aurora cabin.'
        : 'Find a destination or stay across Denmark, Estonia, Finland, Iceland, Latvia, Lithuania, Norway, Scotland, Sweden, Northeast England, the Åland Islands, Greenland, and the Faroe Islands.';
    }
    if (emptyCopy) {
      emptyCopy.innerHTML = tours
        ? 'No tours match that search. Try a city, a tour name, or a package such as Golden Circle.'
        : 'No matches for that search. Try another city or hotel name, or <a href="index.html">start a booking</a>.';
    }
    if (note) {
      note.textContent = tours
        ? 'Tours are experiences you add to a stay. Sample packages are made-up itineraries. Open one to choose a hotel in that city.'
        : 'Search includes places that do not have their own page. Those stays are listed here from the hotel database.';
    }
  }

  function renderResults(query, results, kind, stay) {
    var toursMode = kind === 'tours';
    var ecolodgesOnly = Boolean(!toursMode && stay && stay.ecolodgesOnly);
    var countryBrowse = Boolean(toursMode && stay && stay.countrySpecified && !query);
    var cities = toursMode ? [] : (results.cities || []);
    var hotels = toursMode ? [] : (results.hotels || []);
    var tours = toursMode ? (results.tours || []) : [];
    var total = cities.length + hotels.length + tours.length;
    var citiesEl = document.getElementById('city-results');
    var hotelsEl = document.getElementById('hotel-results');
    var toursEl = document.getElementById('tour-results');
    var emptyEl = document.getElementById('search-empty');
    var statusEl = document.getElementById('search-status');

    applyKindCopy(kind);
    setText('hotel-results-heading', ecolodgesOnly ? 'Ecolodges' : 'Hotels');
    if (ecolodgesOnly) {
      var emptyCopy = document.getElementById('search-empty-copy');
      var intro = document.getElementById('search-intro');
      if (emptyCopy) {
        emptyCopy.textContent = 'No ecolodges match that search. Try a place such as Abisko, Aviemore, or Kielder.';
      }
      if (intro) {
        intro.textContent = 'Showing nature lodges and mountain stations. Leave the search empty to see every ecolodge.';
      }
    }

    if (!query && !countryBrowse && !ecolodgesOnly) {
      setText('search-heading', toursMode ? 'Search tours' : 'Search hotels and cities');
      setText('search-status', toursMode
        ? 'Enter a tour name or a city to see tours.'
        : 'Enter a city, country, or hotel name to see results.');
      if (citiesEl) citiesEl.innerHTML = '';
      if (hotelsEl) hotelsEl.innerHTML = '';
      if (toursEl) toursEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = true;
      var citiesSectionEmpty = document.getElementById('city-results-section');
      var hotelsSectionEmpty = document.getElementById('hotel-results-section');
      var toursSectionEmpty = document.getElementById('tour-results-section');
      if (citiesSectionEmpty) citiesSectionEmpty.hidden = true;
      if (hotelsSectionEmpty) hotelsSectionEmpty.hidden = true;
      if (toursSectionEmpty) toursSectionEmpty.hidden = true;
      return;
    }

    if (countryBrowse) {
      setText('search-heading', stay.tourCountry ? 'Tours in ' + stay.tourCountry : 'Tours');
    } else if (ecolodgesOnly && !query) {
      setText('search-heading', 'Ecolodges');
    } else {
      setText('search-heading', 'Results for “' + query + '”');
    }

    if (statusEl) {
      if (toursMode) {
        var packageCount = tours.filter(function (tour) { return tour.type === 'package'; }).length;
        if (packageCount === total && total > 0) {
          statusEl.textContent = total === 1 ? '1 package found.' : total + ' packages found.';
        } else {
          statusEl.textContent = total === 1 ? '1 tour found.' : total + ' tours found.';
        }
      } else if (ecolodgesOnly) {
        statusEl.textContent = total === 1 ? '1 ecolodge found.' : total + ' ecolodges found.';
      } else {
        statusEl.textContent = total === 1 ? '1 match found.' : total + ' matches found.';
      }
    }

    if (citiesEl) {
      citiesEl.innerHTML = cities.map(renderCityCard).join('');
    }
    if (hotelsEl) {
      hotelsEl.innerHTML = hotels.map(renderHotelCard).join('');
    }
    if (toursEl) {
      toursEl.innerHTML = tours.map(renderTourCard).join('');
    }
    var tourHeading = document.getElementById('tour-results-heading');
    if (tourHeading) {
      var packagesOnly = tours.length > 0 && tours.every(function (tour) { return tour.type === 'package'; });
      var mixed = tours.some(function (tour) { return tour.type === 'package'; })
        && tours.some(function (tour) { return tour.type !== 'package'; });
      tourHeading.textContent = packagesOnly ? 'Packages' : (mixed ? 'Tours and packages' : 'Tours');
    }

    var citiesSection = document.getElementById('city-results-section');
    var hotelsSection = document.getElementById('hotel-results-section');
    var toursSection = document.getElementById('tour-results-section');
    if (citiesSection) citiesSection.hidden = cities.length === 0;
    if (hotelsSection) hotelsSection.hidden = hotels.length === 0;
    if (toursSection) toursSection.hidden = tours.length === 0;
    if (emptyEl) emptyEl.hidden = total > 0;
  }

  function showError(message) {
    setText('search-heading', 'Search unavailable');
    setText('search-status', message);
    var emptyEl = document.getElementById('search-empty');
    if (emptyEl) emptyEl.hidden = true;
  }

  function syncEcolodgeField(kind) {
    var field = document.getElementById('search-ecolodge-field');
    var box = document.getElementById('search-ecolodges');
    var tours = kind === 'tours';
    if (field) {
      field.hidden = tours;
    }
    if (box) {
      box.disabled = tours;
    }
  }

  function syncKindFields(form, kind) {
    if (!form) {
      return;
    }
    var radios = form.querySelectorAll('input[name="what"]');
    Array.prototype.forEach.call(radios, function (radio) {
      radio.checked = radio.value === kind;
    });
  }

  function init() {
    var form = document.getElementById('site-search-form');
    var input = document.getElementById('site-search-input');
    var query = getQueryFromUrl();
    var kind = getKindFromUrl();
    var stay = getStayFromUrl();

    if (input) {
      input.value = query;
    }

    var ecolodgeBox = document.getElementById('search-ecolodges');
    if (ecolodgeBox && kind !== 'tours' && stay.ecolodgesOnly) {
      ecolodgeBox.checked = true;
    }
    syncEcolodgeField(kind);
    syncKindFields(form, kind);
    syncStayFields(stay);
    applyKindCopy(kind);

    if (form) {
      form.addEventListener('submit', function (event) {
        // Allow normal GET navigation to search.html?q=...&what=...
        // A tour search that already chose a country can omit the text query.
        // Ecolodges only can omit the text query and list every ecolodge.
        var value = input ? input.value.trim() : '';
        var tours = selectedKind(form) === 'tours';
        var countryEl = document.getElementById('search-country');
        var hasCountry = tours && countryEl && !countryEl.disabled;
        var eco = !tours && ecolodgeBox && ecolodgeBox.checked && !ecolodgeBox.disabled;
        if (!value && !hasCountry && !eco) {
          event.preventDefault();
          input && input.focus();
        }
      });
      if (ecolodgeBox) {
        ecolodgeBox.addEventListener('change', function () {
          applyKindCopy(selectedKind(form));
          var value = input ? input.value.trim() : '';
          if (!ecolodgeBox.checked && !value) {
            var cleared = getStayFromUrl();
            cleared.ecolodgesOnly = false;
            cleared.tours = false;
            if (window.history && typeof window.history.replaceState === 'function') {
              var params = new URLSearchParams(window.location.search);
              params.delete('ecolodges');
              params.delete('q');
              var nextUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
              window.history.replaceState(null, '', nextUrl);
            }
            renderResults('', { cities: [], hotels: [], tours: [] }, 'accommodation', cleared);
            return;
          }
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.submit();
          }
        });
      }
      Array.prototype.forEach.call(form.querySelectorAll('input[name="what"]'), function (radio) {
        radio.addEventListener('change', function () {
          var nextKind = selectedKind(form);
          syncEcolodgeField(nextKind);
          applyKindCopy(nextKind);
          var nextStay = getStayFromUrl();
          nextStay.tours = nextKind === 'tours';
          if (nextKind === 'tours') {
            nextStay.ecolodgesOnly = false;
          } else {
            nextStay.startDate = '';
            nextStay.tourCountry = '';
            nextStay.ecolodgesOnly = Boolean(ecolodgeBox && ecolodgeBox.checked && !ecolodgeBox.disabled);
          }
          syncStayFields(nextStay);
          if (query || (nextKind === 'tours' && stay.countrySpecified) || (nextKind !== 'tours' && nextStay.ecolodgesOnly)) {
            form.submit();
          } else {
            renderResults('', { cities: [], hotels: [], tours: [] }, nextKind, nextStay);
          }
        });
      });
    }

    if (!query && !(kind === 'tours' && stay.countrySpecified) && !stay.ecolodgesOnly) {
      renderResults('', { cities: [], hotels: [], tours: [] }, kind, stay);
      return;
    }

    setText('search-status', 'Searching…');
    fetchSearchResults(query, kind)
      .then(function (results) {
        renderResults(query, results || { cities: [], hotels: [], tours: [] }, kind, stay);
      })
      .catch(function (err) {
        showError(err && err.message ? err.message : 'Unable to load search results.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
