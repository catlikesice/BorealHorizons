/**
 * Homepage booking search bar: destination + stay dates + guests.
 * Persists booking dates and guests from the homepage search so hotel pages
 * can price the stay. Destination suggestions come from GET /api/search/destinations
 * when the API is available, including places that have no HTML page.
 * Accommodation is the default. Choosing Tours turns "Where are you going?"
 * into a country dropdown and asks for a start date instead of check-in and
 * check-out, then continues to search.html?what=tours&country=...
 * A match with a page opens that page. A place with no page continues to
 * search.html. Accommodation posts q, checkIn, checkOut, adults, and children.
 * Tours post country, startDate, adults, and children. The dropdown starts on
 * "Select Country" until a country is chosen.
 */
(function () {
  'use strict';

  var BOOKING_STORAGE_KEY = 'balticComfortBooking';
  var MS_PER_DAY = 24 * 60 * 60 * 1000;
  var MIN_ADULTS = 1;
  var MAX_ADULTS = 20;
  var MIN_CHILDREN = 0;
  var MAX_CHILDREN = 10;
  var DEFAULT_ADULTS = 2;
  var DEFAULT_CHILDREN = 0;
  var ACCOMMODATION_PLACEHOLDER = 'City or hotel, e.g. Riga';

  function currentKind() {
    var checked = document.querySelector('#hero-search-form input[name="what"]:checked');
    return checked && checked.value === 'tours' ? 'tours' : 'accommodation';
  }

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/ø/g, 'o')
      .replace(/æ/g, 'ae')
      .replace(/ð/g, 'd')
      .replace(/þ/g, 'th')
      .replace(/['’ʼ]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function maxBookableDate() {
    var api = datesApi();
    if (api && typeof api.latestBookableISO === 'function') {
      return api.latestBookableISO();
    }
    return '';
  }

  function beyondHorizon(value) {
    var api = datesApi();
    return Boolean(value && api && typeof api.exceedsBookingHorizon === 'function' && api.exceedsBookingHorizon(value));
  }

  function horizonStatus(which) {
    var api = datesApi();
    if (api && typeof api.bookingHorizonError === 'function') {
      return api.bookingHorizonError(which);
    }
    return 'You can book up to one year ahead.';
  }

  function datesApi() {
    return window.BookingDates || null;
  }

  function toISODate(value) {
    var api = datesApi();
    return api && typeof api.toISO === 'function' ? api.toISO(value) : '';
  }

  function toEuropeanDate(value) {
    var api = datesApi();
    return api && typeof api.toEuropean === 'function' ? api.toEuropean(value) : '';
  }

  function applyDateMask(input) {
    var api = datesApi();
    if (!input || !api || typeof api.maskInput !== 'function') {
      return;
    }
    var start = input.selectionStart;
    var raw = input.value;
    var digitsBefore = raw.slice(0, start == null ? raw.length : start).replace(/\D/g, '').length;
    var masked = api.maskInput(raw);
    if (input.value === masked) {
      return;
    }
    input.value = masked;
    var pos = 0;
    var seen = 0;
    while (pos < masked.length && seen < digitsBefore) {
      if (/\d/.test(masked.charAt(pos))) {
        seen += 1;
      }
      pos += 1;
    }
    if (typeof input.setSelectionRange === 'function') {
      input.setSelectionRange(pos, pos);
    }
  }

  function calculateNights(checkInValue, checkOutValue) {
    if (!checkInValue || !checkOutValue) {
      return null;
    }

    var checkInParts = checkInValue.split('-').map(Number);
    var checkOutParts = checkOutValue.split('-').map(Number);

    if (
      checkInParts.length !== 3 ||
      checkOutParts.length !== 3 ||
      checkInParts.some(Number.isNaN) ||
      checkOutParts.some(Number.isNaN)
    ) {
      return null;
    }

    var checkInUTC = Date.UTC(checkInParts[0], checkInParts[1] - 1, checkInParts[2]);
    var checkOutUTC = Date.UTC(checkOutParts[0], checkOutParts[1] - 1, checkOutParts[2]);
    var diff = checkOutUTC - checkInUTC;
    if (diff <= 0) {
      return null;
    }

    return Math.round(diff / MS_PER_DAY);
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
      var payload = Object.assign({ updatedAt: new Date().toISOString() }, details);
      if (window.sessionStorage) {
        window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (error) {
      console.warn('Unable to persist booking selection details', error);
    }
  }

  function countryToSlug(country) {
    return normalize(country).replace(/ /g, '-');
  }

  function catalog() {
    return window.SEARCH_CATALOG || { cities: [], hotels: [] };
  }

  function optionHtml(label) {
    return '<option value="' + String(label).replace(/"/g, '&quot;') + '"></option>';
  }

  function writeDestinationLabels(datalist, labels, kind) {
    if (!datalist || currentKind() !== kind || !Array.isArray(labels) || !labels.length) {
      return;
    }
    datalist.innerHTML = labels.map(optionHtml).join('');
  }

  function fillDestinationList(datalist, kind) {
    if (!datalist || kind === 'tours') {
      return;
    }

    var seen = {};
    var options = [];
    var data = catalog();

    (data.cities || []).concat(data.hotels || []).forEach(function (item) {
      var label = item.name;
      if (item.type === 'hotel' && item.city) {
        label = item.name + ' — ' + item.city;
      }
      var key = normalize(label);
      if (!key || seen[key]) {
        return;
      }
      seen[key] = true;
      options.push(label);
    });

    options.sort(function (a, b) {
      return a.localeCompare(b);
    });

    writeDestinationLabels(datalist, options, 'accommodation');

    fetch('/api/search/destinations', { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Destination list failed');
        }
        return res.json();
      })
      .then(function (payload) {
        writeDestinationLabels(datalist, payload && payload.labels, 'accommodation');
      })
      .catch(function () {
        // Keep the static catalog list when SQL search is unavailable.
      });
  }

  function findDestination(query) {
    var needle = normalize(query);
    if (!needle) {
      return null;
    }

    var data = catalog();
    var cities = data.cities || [];
    var hotels = data.hotels || [];
    var i;
    var item;
    var name;

    for (i = 0; i < cities.length; i += 1) {
      if (normalize(cities[i].name) === needle || normalize(cities[i].city) === needle) {
        return { kind: 'city', item: cities[i] };
      }
    }

    for (i = 0; i < hotels.length; i += 1) {
      name = normalize(hotels[i].name);
      if (name === needle || (hotels[i].city && name + ' — ' + normalize(hotels[i].city) === needle)) {
        return { kind: 'hotel', item: hotels[i] };
      }
    }

    for (i = 0; i < cities.length; i += 1) {
      name = normalize(cities[i].name);
      if (name.indexOf(needle) === 0 || needle.indexOf(name) === 0) {
        return { kind: 'city', item: cities[i] };
      }
    }

    for (i = 0; i < hotels.length; i += 1) {
      if (normalize(hotels[i].name).indexOf(needle) !== -1) {
        return { kind: 'hotel', item: hotels[i] };
      }
    }

    return null;
  }

  function setStatus(message) {
    var status = document.getElementById('hero-search-status');
    if (status) {
      status.textContent = message || '';
    }
  }

  function guestPayload(adults, children) {
    return {
      adults: adults,
      children: children,
      guests: adults + children
    };
  }

  function goToMatch(match, checkInDate, checkOutDate, nights, adults, children) {
    var item = match.item;
    var cityName = item.city || item.name;
    persistBookingSelection(Object.assign({
      country: countryToSlug(item.country),
      citySlug: String(item.url || '').replace(/\.html?$/i, ''),
      cityName: cityName,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      nights: nights
    }, guestPayload(adults, children)));
    window.location.href = item.url;
  }

  function restoreGuestFields(adultsInput, childrenInput) {
    var stored = readStoredBooking();
    if (!stored) {
      return;
    }

    if (stored.adults != null) {
      adultsInput.value = String(parseGuestCount(stored.adults, MIN_ADULTS, MAX_ADULTS, DEFAULT_ADULTS));
    }
    if (stored.children != null) {
      childrenInput.value = String(parseGuestCount(stored.children, MIN_CHILDREN, MAX_CHILDREN, DEFAULT_CHILDREN));
    }

    adultsInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function pickerAccepts(picker, iso) {
    if (!picker || !iso) {
      return false;
    }
    if (picker.min && iso < picker.min) {
      return false;
    }
    if (picker.max && iso > picker.max) {
      return false;
    }
    return true;
  }

  function writeDateField(textInput, picker, iso) {
    var european = toEuropeanDate(iso);
    if (!european) {
      return;
    }
    textInput.value = european;
    if (picker) {
      picker.value = pickerAccepts(picker, iso) ? iso : '';
    }
  }

  function syncPicker(textInput, picker) {
    if (!picker) {
      return;
    }
    var iso = toISODate(textInput.value);
    picker.value = pickerAccepts(picker, iso) ? iso : '';
  }

  function bindDateField(textInput, picker, onChange) {
    textInput.addEventListener('input', function () {
      applyDateMask(textInput);
      syncPicker(textInput, picker);
      setStatus('');
      if (onChange) {
        onChange();
      }
    });
    textInput.addEventListener('blur', function () {
      var iso = toISODate(textInput.value);
      if (iso) {
        writeDateField(textInput, picker, iso);
      }
    });
    if (picker) {
      picker.addEventListener('change', function () {
        if (picker.value) {
          writeDateField(textInput, picker, picker.value);
        }
        setStatus('');
        if (onChange) {
          onChange();
        }
      });
    }
  }

  function setSearchField(field, visible) {
    if (!field) {
      return;
    }
    field.hidden = !visible;
    Array.prototype.forEach.call(field.querySelectorAll('input, select'), function (control) {
      control.disabled = !visible;
    });
  }

  function setControl(control, visible) {
    if (!control) {
      return;
    }
    control.hidden = !visible;
    control.disabled = !visible;
  }

  function init() {
    var form = document.getElementById('hero-search-form');
    var destination = document.getElementById('hero-search-destination');
    var destinationLabel = document.getElementById('hero-search-destination-label');
    var countrySelect = document.getElementById('hero-search-country');
    var checkInField = document.getElementById('hero-search-checkin-field');
    var checkOutField = document.getElementById('hero-search-checkout-field');
    var startField = document.getElementById('hero-search-start-field');
    var checkIn = document.getElementById('hero-search-checkin');
    var checkOut = document.getElementById('hero-search-checkout');
    var startInput = document.getElementById('hero-search-start');
    var checkInPicker = document.getElementById('hero-search-checkin-picker');
    var checkOutPicker = document.getElementById('hero-search-checkout-picker');
    var startPicker = document.getElementById('hero-search-start-picker');
    var checkInValue = document.getElementById('hero-search-checkin-value');
    var checkOutValue = document.getElementById('hero-search-checkout-value');
    var startValue = document.getElementById('hero-search-start-value');
    var adultsInput = document.getElementById('hero-search-adults');
    var childrenInput = document.getElementById('hero-search-children');
    var datalist = document.getElementById('hero-search-destinations');

    if (!form || !destination || !checkIn || !checkOut || !startInput || !countrySelect || !adultsInput || !childrenInput) {
      return;
    }

    function applySearchKind(kind) {
      var tours = kind === 'tours';
      form.classList.toggle('hero-search--tours', tours);
      destination.placeholder = ACCOMMODATION_PLACEHOLDER;
      setControl(destination, !tours);
      setControl(countrySelect, tours);
      if (destinationLabel) {
        destinationLabel.htmlFor = tours ? countrySelect.id : destination.id;
      }
      setSearchField(startField, tours);
      setSearchField(checkInField, !tours);
      setSearchField(checkOutField, !tours);
      if (!tours) {
        fillDestinationList(datalist, kind);
      }
      setStatus('');
    }

    var storedDates = readStoredBooking();
    if (storedDates && storedDates.tourCountry) {
      Array.prototype.forEach.call(countrySelect.options, function (option) {
        if (option.value === storedDates.tourCountry) {
          countrySelect.value = storedDates.tourCountry;
        }
      });
    }

    applySearchKind(currentKind());
    restoreGuestFields(adultsInput, childrenInput);

    Array.prototype.forEach.call(form.querySelectorAll('input[name="what"]'), function (radio) {
      radio.addEventListener('change', function () {
        applySearchKind(currentKind());
      });
    });

    countrySelect.addEventListener('change', function () {
      setStatus('');
    });

    var minDate = todayISO();
    var maxDate = maxBookableDate();
    function boundPicker(picker) {
      if (!picker) {
        return;
      }
      picker.min = minDate;
      if (maxDate) {
        picker.max = maxDate;
      }
    }
    boundPicker(checkInPicker);
    boundPicker(checkOutPicker);
    boundPicker(startPicker);

    if (storedDates) {
      if (storedDates.checkInDate) {
        writeDateField(checkIn, checkInPicker, storedDates.checkInDate);
      }
      if (storedDates.checkOutDate) {
        writeDateField(checkOut, checkOutPicker, storedDates.checkOutDate);
      }
      if (storedDates.startDate) {
        writeDateField(startInput, startPicker, storedDates.startDate);
      }
    }

    function refreshCheckoutMin() {
      var checkInISO = toISODate(checkIn.value);
      if (checkOutPicker) {
        checkOutPicker.min = checkInISO || minDate;
      }
      var checkOutISO = toISODate(checkOut.value);
      if (checkInISO && checkOutISO && checkOutISO <= checkInISO) {
        checkOut.value = '';
        if (checkOutPicker) {
          checkOutPicker.value = '';
        }
      }
    }

    bindDateField(checkIn, checkInPicker, refreshCheckoutMin);
    bindDateField(checkOut, checkOutPicker);
    bindDateField(startInput, startPicker);
    refreshCheckoutMin();

    adultsInput.addEventListener('input', function () {
      setStatus('');
    });
    childrenInput.addEventListener('input', function () {
      setStatus('');
    });

    form.addEventListener('submit', function (event) {
      var query = destination.value.trim();
      var kind = currentKind();
      var checkInDate = kind === 'tours' ? '' : toISODate(checkIn.value);
      var checkOutDate = kind === 'tours' ? '' : toISODate(checkOut.value);
      var startDate = kind === 'tours' ? toISODate(startInput.value) : '';
      var adults = parseGuestCount(adultsInput.value, MIN_ADULTS, MAX_ADULTS, NaN);
      var children = parseGuestCount(childrenInput.value, MIN_CHILDREN, MAX_CHILDREN, NaN);
      var nights = null;

      if (kind !== 'tours' && !query) {
        event.preventDefault();
        setStatus('Please enter a city or hotel.');
        destination.focus();
        return;
      }

      if (kind === 'tours') {
        if (!countrySelect.value) {
          event.preventDefault();
          setStatus('Please select a country.');
          countrySelect.focus();
          return;
        }

        if (!startInput.value.trim()) {
          event.preventDefault();
          setStatus('Please choose a start date.');
          startInput.focus();
          return;
        }

        if (!startDate) {
          event.preventDefault();
          setStatus('Enter the start date as dd/mm/yyyy.');
          startInput.focus();
          return;
        }

        if (startDate < minDate) {
          event.preventDefault();
          setStatus('Start date cannot be in the past.');
          startInput.focus();
          return;
        }

        if (beyondHorizon(startDate)) {
          event.preventDefault();
          setStatus(horizonStatus('start'));
          startInput.focus();
          return;
        }
      } else {
        if (!checkIn.value.trim() || !checkOut.value.trim()) {
          event.preventDefault();
          setStatus('Please choose check-in and check-out dates.');
          (checkIn.value.trim() ? checkOut : checkIn).focus();
          return;
        }

        if (!checkInDate || !checkOutDate) {
          event.preventDefault();
          setStatus('Enter dates as dd/mm/yyyy.');
          (checkInDate ? checkOut : checkIn).focus();
          return;
        }

        if (checkInDate < minDate) {
          event.preventDefault();
          setStatus('Check-in cannot be in the past.');
          checkIn.focus();
          return;
        }

        nights = calculateNights(checkInDate, checkOutDate);
        if (!nights) {
          event.preventDefault();
          setStatus('Check-out must be after check-in.');
          checkOut.focus();
          return;
        }

        if (beyondHorizon(checkInDate)) {
          event.preventDefault();
          setStatus(horizonStatus('check-in'));
          checkIn.focus();
          return;
        }

        if (beyondHorizon(checkOutDate)) {
          event.preventDefault();
          setStatus(horizonStatus('check-out'));
          checkOut.focus();
          return;
        }
      }

      if (!Number.isFinite(adults) || adults < MIN_ADULTS) {
        event.preventDefault();
        setStatus('Please add at least one adult guest.');
        if (window.GuestPicker && typeof window.GuestPicker.open === 'function') {
          window.GuestPicker.open(adultsInput.closest('[data-guest-picker]'));
        }
        adultsInput.focus();
        return;
      }

      if (!Number.isFinite(children) || children < MIN_CHILDREN) {
        event.preventDefault();
        setStatus('Please enter how many children are travelling, or 0 if none.');
        if (window.GuestPicker && typeof window.GuestPicker.open === 'function') {
          window.GuestPicker.open(childrenInput.closest('[data-guest-picker]'));
        }
        childrenInput.focus();
        return;
      }

      adultsInput.value = String(adults);
      childrenInput.value = String(children);
      if (kind === 'tours') {
        if (startValue) {
          startValue.value = startDate;
        }
        destination.disabled = true;
        countrySelect.disabled = false;
        persistBookingSelection(Object.assign({
          cityName: countrySelect.value || '',
          startDate: startDate,
          tourCountry: countrySelect.value || ''
        }, guestPayload(adults, children)));
        return;
      }

      if (checkInValue) {
        checkInValue.value = checkInDate;
      }
      if (checkOutValue) {
        checkOutValue.value = checkOutDate;
      }

      var match = findDestination(query);
      if (match && match.item && match.item.url) {
        event.preventDefault();
        goToMatch(match, checkInDate, checkOutDate, nights, adults, children);
        return;
      }

      persistBookingSelection(Object.assign({
        cityName: query,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        nights: nights
      }, guestPayload(adults, children)));
      // Fall through to GET search.html?q=...&checkIn=...&checkOut=...&adults=...&children=...
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
