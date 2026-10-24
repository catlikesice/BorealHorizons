/**
 * Register interest in a rural tour.
 * Shared by the country tour pages and POST /api/tour-interest.
 */
(function (root, factory) {
  var tours = null;
  if (typeof module === 'object' && module.exports && typeof require === 'function') {
    tours = require('./country-tours');
  } else {
    tours = root.CountryTours;
  }
  var api = factory(tours);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.TourInterest = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CountryTours) {
  'use strict';

  var STORAGE_KEY = 'bh_tour_interest';
  var MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  var COPY = {
    en: {
      formTitle: 'Register your interest',
      formLead: 'Tell us which rural tour you want to hear about. We will write when a date is open.',
      name: 'Name',
      email: 'Email',
      country: 'Country',
      tour: 'Rural tour',
      tourPlaceholder: 'Choose a rural tour',
      tourAny: 'Any rural tour in this country',
      party: 'Travellers',
      month: 'Preferred month',
      monthNone: 'No preference',
      months: {
        '01': 'January', '02': 'February', '03': 'March', '04': 'April',
        '05': 'May', '06': 'June', '07': 'July', '08': 'August',
        '09': 'September', '10': 'October', '11': 'November', '12': 'December'
      },
      message: 'Rural places you care about',
      messagePlaceholder: 'Villages, forests, or coasts you want included',
      send: 'Register interest',
      sending: 'Sending...',
      success: 'Your interest is registered. We will write to the email you provided.',
      savedLocally: 'We could not reach the server. Your interest is saved in this browser — try again when you are connected.',
      errors: {
        name: 'Please enter your name.',
        email: 'Please enter a valid email address.',
        country: 'Choose a country.',
        tour: 'Choose a rural tour.',
        party: 'Enter how many people are travelling, from 1 to 20.',
        month: 'Choose a month or leave the preference blank.',
        message: 'That note is too long.',
        rate: 'Please wait a moment before registering again.',
        send: 'Your interest could not be registered. Please try again.'
      }
    },
    ru: {
      formTitle: 'Заявить об интересе',
      formLead: 'Напишите, о каком сельском туре хотите услышать. Мы напишем, когда откроется дата.',
      name: 'Имя',
      email: 'Эл. почта',
      country: 'Страна',
      tour: 'Сельский тур',
      tourPlaceholder: 'Выберите сельский тур',
      tourAny: 'Любой сельский тур в этой стране',
      party: 'Путешественники',
      month: 'Предпочтительный месяц',
      monthNone: 'Без предпочтения',
      months: {
        '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
        '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
        '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь'
      },
      message: 'Сельские места, которые вам важны',
      messagePlaceholder: 'Деревни, леса или побережья, которые хотите включить',
      send: 'Заявить об интересе',
      sending: 'Отправка...',
      success: 'Интерес зарегистрирован. Мы напишем на указанный адрес.',
      savedLocally: 'Не удалось связаться с сервером. Заявка сохранена в этом браузере — повторите, когда появится соединение.',
      errors: {
        name: 'Введите ваше имя.',
        email: 'Введите действительный адрес электронной почты.',
        country: 'Выберите страну.',
        tour: 'Выберите сельский тур.',
        party: 'Укажите число путешественников от 1 до 20.',
        month: 'Выберите месяц или оставьте поле без предпочтения.',
        message: 'Заметка слишком длинная.',
        rate: 'Подождите немного, прежде чем отправлять ещё одну заявку.',
        send: 'Не удалось зарегистрировать интерес. Попробуйте ещё раз.'
      }
    },
    sv: {
      formTitle: 'Anmäl intresse',
      formLead: 'Berätta vilken landsbygdstur du vill höra om. Vi skriver när ett datum är öppet.',
      name: 'Namn',
      email: 'E-post',
      country: 'Land',
      tour: 'Landsbygdstur',
      tourPlaceholder: 'Välj en landsbygdstur',
      tourAny: 'Vilken landsbygdstur som helst i det här landet',
      party: 'Resenärer',
      month: 'Önskad månad',
      monthNone: 'Ingen preferens',
      months: {
        '01': 'Januari', '02': 'Februari', '03': 'Mars', '04': 'April',
        '05': 'Maj', '06': 'Juni', '07': 'Juli', '08': 'Augusti',
        '09': 'September', '10': 'Oktober', '11': 'November', '12': 'December'
      },
      message: 'Landsbygdsplatser du bryr dig om',
      messagePlaceholder: 'Byar, skogar eller kuster du vill ha med',
      send: 'Anmäl intresse',
      sending: 'Skickar...',
      success: 'Ditt intresse är registrerat. Vi skriver till den e-postadress du angav.',
      savedLocally: 'Servern gick inte att nå. Intresset sparades i den här webbläsaren — försök igen när du är ansluten.',
      errors: {
        name: 'Ange ditt namn.',
        email: 'Ange en giltig e-postadress.',
        country: 'Välj ett land.',
        tour: 'Välj en landsbygdstur.',
        party: 'Ange hur många som reser, från 1 till 20.',
        month: 'Välj en månad eller lämna preferensen tom.',
        message: 'Anteckningen är för lång.',
        rate: 'Vänta en stund innan du anmäler intresse igen.',
        send: 'Intresset kunde inte registreras. Försök igen.'
      }
    },
    de: {
      formTitle: 'Interesse anmelden',
      formLead: 'Sagen Sie uns, von welcher ländlichen Tour Sie hören möchten. Wir schreiben, wenn ein Termin offen ist.',
      name: 'Name',
      email: 'E-Mail',
      country: 'Land',
      tour: 'Ländliche Tour',
      tourPlaceholder: 'Wählen Sie eine ländliche Tour',
      tourAny: 'Jede ländliche Tour in diesem Land',
      party: 'Reisende',
      month: 'Bevorzugter Monat',
      monthNone: 'Keine Präferenz',
      months: {
        '01': 'Januar', '02': 'Februar', '03': 'März', '04': 'April',
        '05': 'Mai', '06': 'Juni', '07': 'Juli', '08': 'August',
        '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Dezember'
      },
      message: 'Ländliche Orte, die Ihnen wichtig sind',
      messagePlaceholder: 'Dörfer, Wälder oder Küsten, die dabei sein sollen',
      send: 'Interesse anmelden',
      sending: 'Wird gesendet...',
      success: 'Ihr Interesse ist registriert. Wir schreiben an die angegebene E-Mail-Adresse.',
      savedLocally: 'Der Server war nicht erreichbar. Ihr Interesse wurde in diesem Browser gespeichert — versuchen Sie es erneut, sobald Sie verbunden sind.',
      errors: {
        name: 'Bitte geben Sie Ihren Namen ein.',
        email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        country: 'Wählen Sie ein Land.',
        tour: 'Wählen Sie eine ländliche Tour.',
        party: 'Geben Sie die Zahl der Reisenden von 1 bis 20 ein.',
        month: 'Wählen Sie einen Monat oder lassen Sie die Angabe leer.',
        message: 'Die Notiz ist zu lang.',
        rate: 'Bitte warten Sie einen Moment, bevor Sie sich erneut anmelden.',
        send: 'Ihr Interesse konnte nicht registriert werden. Bitte versuchen Sie es erneut.'
      }
    }
  };

  function text(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function packFor(lang) {
    return COPY[lang] || COPY.en;
  }

  function messageFor(code, lang) {
    var pack = packFor(lang);
    return (pack.errors && pack.errors[code]) || COPY.en.errors[code] || COPY.en.errors.send;
  }

  function findTour(country, tourId) {
    var tours = CountryTours.ruralTours(country);
    for (var i = 0; i < tours.length; i += 1) {
      if (tours[i].id === tourId) return tours[i];
    }
    return null;
  }

  function validate(input) {
    var body = input && typeof input === 'object' ? input : {};
    var name = text(body.name);
    var email = text(body.email).toLowerCase();
    var countryId = text(body.country).toLowerCase();
    var tourId = text(body.tour);
    var message = text(body.message);
    var month = text(body.month);
    var partyRaw = text(body.partySize);
    var country = CountryTours.get(countryId);

    if (name.length < 2 || name.length > 120) {
      return { ok: false, code: 'name' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      return { ok: false, code: 'email' };
    }
    if (!country) {
      return { ok: false, code: 'country' };
    }
    var tour = null;
    if (tourId === 'any') {
      tour = { id: 'any', name: 'Any rural tour in ' + country.name, place: '' };
    } else {
      tour = findTour(country, tourId);
    }
    if (!tour) {
      return { ok: false, code: 'tour' };
    }
    if (!/^\d+$/.test(partyRaw)) {
      return { ok: false, code: 'party' };
    }
    var partySize = parseInt(partyRaw, 10);
    if (partySize < 1 || partySize > 20) {
      return { ok: false, code: 'party' };
    }
    if (month && MONTHS.indexOf(month) === -1) {
      return { ok: false, code: 'month' };
    }
    if (message.length > 2000) {
      return { ok: false, code: 'message' };
    }

    return {
      ok: true,
      value: {
        name: name,
        email: email,
        country: country.id,
        countryName: country.name,
        tour: tour.id,
        tourName: tour.name,
        place: tour.place || '',
        partySize: partySize,
        month: month,
        message: message
      }
    };
  }

  function lookup(pack, key) {
    if (!key) return '';
    var parts = key.split('.');
    var cursor = pack;
    for (var i = 0; i < parts.length; i += 1) {
      if (!cursor || typeof cursor !== 'object') return '';
      cursor = cursor[parts[i]];
    }
    return typeof cursor === 'string' ? cursor : '';
  }

  function currentLang() {
    var lang = '';
    if (typeof document !== 'undefined' && document.documentElement) {
      lang = document.documentElement.lang || '';
    }
    if (COPY[lang]) return lang;
    if (typeof window !== 'undefined' && window.LanguagePreferences && typeof window.LanguagePreferences.getPreferredLanguage === 'function') {
      var preferred = window.LanguagePreferences.getPreferredLanguage();
      if (COPY[preferred]) return preferred;
    }
    return 'en';
  }

  function applyCopy(lang) {
    if (typeof document === 'undefined') return;
    var pack = packFor(COPY[lang] ? lang : 'en');
    var nodes = document.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.closest && node.closest('.site-nav')) return;
      var value = lookup(pack, node.getAttribute('data-i18n'));
      if (value) node.textContent = value;
    });
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    Array.prototype.forEach.call(placeholders, function (node) {
      var value = lookup(pack, node.getAttribute('data-i18n-placeholder'));
      if (value) node.setAttribute('placeholder', value);
    });
  }

  function fieldFor(form, code) {
    if (code === 'name') return form.elements.name;
    if (code === 'email') return form.elements.email;
    if (code === 'country') return form.elements.country;
    if (code === 'tour') return form.elements.tour;
    if (code === 'party') return form.elements.partySize;
    if (code === 'month') return form.elements.month;
    if (code === 'message') return form.elements.message;
    return null;
  }

  function setStatus(status, message, kind) {
    if (!status) return;
    status.textContent = message || '';
    status.classList.remove('auth-status--error', 'auth-status--success');
    if (kind === 'error') status.classList.add('auth-status--error');
    if (kind === 'success') status.classList.add('auth-status--success');
    if (message && typeof status.scrollIntoView === 'function') {
      status.scrollIntoView({ block: 'center' });
    }
  }

  function clearInvalid(form) {
    Array.prototype.forEach.call(form.elements, function (element) {
      if (element && element.removeAttribute) element.removeAttribute('aria-invalid');
    });
  }

  function prefill(form) {
    var user = null;
    if (typeof window !== 'undefined' && window.AuthClient && typeof window.AuthClient.getUser === 'function') {
      user = window.AuthClient.getUser();
    }
    if (!user) return;
    if (form.elements.name && !form.elements.name.value && user.name) {
      form.elements.name.value = user.name;
    }
    if (form.elements.email && !form.elements.email.value && user.email) {
      form.elements.email.value = user.email;
    }
  }

  function rememberLocally(value) {
    try {
      var existing = [];
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
      existing.push({
        name: value.name,
        email: value.email,
        country: value.country,
        tour: value.tour,
        partySize: value.partySize,
        month: value.month,
        message: value.message,
        savedAt: new Date().toISOString()
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-20)));
    } catch (error) {
      // Private mode should not block the status message.
    }
  }

  function syncTourOptions(form) {
    var countryField = form.elements.country;
    var tourField = form.elements.tour;
    if (!countryField || !tourField || countryField.tagName !== 'SELECT') return;
    var country = text(countryField.value);
    var selectedStillVisible = false;
    Array.prototype.forEach.call(tourField.options, function (option) {
      if (!option.value) return;
      var show = !country || option.getAttribute('data-country') === country;
      option.hidden = !show;
      option.disabled = !show;
      if (show && option.value === tourField.value) selectedStillVisible = true;
    });
    if (tourField.value && !selectedStillVisible) tourField.value = '';
    Array.prototype.forEach.call(tourField.querySelectorAll('optgroup'), function (group) {
      var visible = false;
      Array.prototype.forEach.call(group.querySelectorAll('option'), function (option) {
        if (!option.hidden && !option.disabled) visible = true;
      });
      group.hidden = Boolean(country) && !visible;
    });
  }

  function bind(form) {
    if (!form || form.dataset.tourInterestBound === 'true') return;
    form.dataset.tourInterestBound = 'true';

    var status = document.getElementById('tour-interest-status');
    var submitBtn = form.querySelector('[type="submit"]');

    prefill(form);
    syncTourOptions(form);
    if (form.elements.country && form.elements.country.tagName === 'SELECT') {
      form.elements.country.addEventListener('change', function () {
        syncTourOptions(form);
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var lang = currentLang();
      var pack = packFor(lang);
      clearInvalid(form);

      var result = validate({
        name: form.elements.name && form.elements.name.value,
        email: form.elements.email && form.elements.email.value,
        country: form.elements.country && form.elements.country.value,
        tour: form.elements.tour && form.elements.tour.value,
        partySize: form.elements.partySize && form.elements.partySize.value,
        month: form.elements.month && form.elements.month.value,
        message: form.elements.message && form.elements.message.value
      });

      if (!result.ok) {
        setStatus(status, messageFor(result.code, lang), 'error');
        var field = fieldFor(form, result.code);
        if (field && !field.disabled) {
          field.setAttribute('aria-invalid', 'true');
          if (typeof field.focus === 'function') field.focus();
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = pack.sending;
      }

      fetch('/api/tour-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.value)
      }).then(function (response) {
        return response.json().catch(function () { return null; }).then(function (payload) {
          return { ok: response.ok, status: response.status, payload: payload };
        });
      }).then(function (response) {
        if (!response.ok) {
          var code = (response.payload && response.payload.code) || 'send';
          setStatus(status, messageFor(code, currentLang()), 'error');
          return;
        }
        var countryValue = form.elements.country && form.elements.country.type === 'hidden'
          ? form.elements.country.value
          : '';
        form.reset();
        if (countryValue && form.elements.country) form.elements.country.value = countryValue;
        if (form.elements.partySize) form.elements.partySize.value = '2';
        syncTourOptions(form);
        prefill(form);
        applyCopy(currentLang());
        setStatus(status, packFor(currentLang()).success, 'success');
      }).catch(function () {
        rememberLocally(result.value);
        setStatus(status, packFor(currentLang()).savedLocally, 'error');
      }).then(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = packFor(currentLang()).send;
        }
      });
    });
  }

  function init() {
    applyCopy(currentLang());
    var form = document.getElementById('tour-interest-form');
    if (form) bind(form);
  }

  if (typeof document !== 'undefined') {
    var languageEventName = (typeof window !== 'undefined' && window.LanguagePreferences && window.LanguagePreferences.CHANGE_EVENT) || 'preferredLanguageChange';
    document.addEventListener(languageEventName, function (event) {
      var lang = event && event.detail && event.detail.lang;
      applyCopy(lang || currentLang());
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  }

  return {
    COPY: COPY,
    MONTHS: MONTHS,
    validate: validate,
    messageFor: messageFor,
    applyCopy: applyCopy,
    bind: bind
  };
});
