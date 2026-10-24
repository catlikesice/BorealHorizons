/**
 * Dropdown calendar for booking dates.
 * Clicking the date field or the calendar button opens a month grid.
 * Typed values stay in European day/month/year form.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BookingCalendar = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var bound = [];

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function toISO(year, month, day) {
    return String(year) + '-' + pad(month) + '-' + pad(day);
  }

  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function mondayIndex(year, month) {
    var jsDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return (jsDay + 6) % 7;
  }

  function shiftISO(iso, days) {
    var parts = String(iso || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(function (part) { return !Number.isFinite(part); })) {
      return '';
    }
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
    return toISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  function monthIndex(year, month) {
    return year * 12 + (month - 1);
  }

  function clampView(year, month, range) {
    var minYear = Number(range.min.slice(0, 4));
    var minMonth = Number(range.min.slice(5, 7));
    var maxYear = Number(range.max.slice(0, 4));
    var maxMonth = Number(range.max.slice(5, 7));
    var current = monthIndex(year, month);
    if (current < monthIndex(minYear, minMonth)) {
      return { year: minYear, month: minMonth };
    }
    if (current > monthIndex(maxYear, maxMonth)) {
      return { year: maxYear, month: maxMonth };
    }
    return { year: year, month: month };
  }

  function shiftMonth(year, month, delta, range) {
    var nextMonth = month + delta;
    var nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    return clampView(nextYear, nextMonth, range);
  }

  function defaultView(range, selectedISO) {
    if (selectedISO && selectedISO >= range.min && selectedISO <= range.max) {
      return clampView(Number(selectedISO.slice(0, 4)), Number(selectedISO.slice(5, 7)), range);
    }
    return clampView(Number(range.min.slice(0, 4)), Number(range.min.slice(5, 7)), range);
  }

  function monthIsOpen(year, month, range) {
    var start = toISO(year, month, 1);
    var end = toISO(year, month, daysInMonth(year, month));
    return end >= range.min && start <= range.max;
  }

  function buildMonth(year, month, range, selectedISO) {
    var cells = [];
    var lead = mondayIndex(year, month);
    var count = daysInMonth(year, month);
    var i;
    for (i = 0; i < lead; i += 1) {
      cells.push({ type: 'pad' });
    }
    for (i = 1; i <= count; i += 1) {
      var iso = toISO(year, month, i);
      cells.push({
        type: 'day',
        day: i,
        iso: iso,
        disabled: iso < range.min || iso > range.max,
        selected: iso === selectedISO
      });
    }
    return {
      year: year,
      month: month,
      label: MONTHS[month - 1] + ' ' + year,
      cells: cells
    };
  }

  function datesApi() {
    if (typeof globalThis !== 'undefined' && globalThis.BookingDates) {
      return globalThis.BookingDates;
    }
    return null;
  }

  function readISO(value) {
    var api = datesApi();
    if (api && typeof api.toISO === 'function') {
      return api.toISO(value);
    }
    var text = String(value || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
  }

  function toEuropean(iso) {
    var api = datesApi();
    if (api && typeof api.toEuropean === 'function') {
      return api.toEuropean(iso) || '';
    }
    if (!iso || iso.length < 10) {
      return '';
    }
    return iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
  }

  function bind(options) {
    var input = options && options.input;
    var field = (options && options.field) || (input && input.closest ? input.closest('[data-booking-calendar]') : null);
    var button = (options && options.button) || (field && field.querySelector('[data-booking-calendar-open]'));
    var dialog = (options && options.dialog) || (field && field.querySelector('[data-booking-calendar-dialog]'));
    var rangeFor = options && options.range;
    if (!input || !field || !button || !dialog || typeof document === 'undefined' || typeof rangeFor !== 'function') {
      return null;
    }
    if (field.getAttribute('data-booking-calendar-ready') === 'true') {
      return null;
    }

    var range = { min: '1970-01-01', max: '1970-01-01' };
    var view = { year: 1970, month: 1 };
    var selectedISO = '';
    var open = false;
    var suppressFocusOpen = false;
    var api = null;

    function readRange() {
      var next = rangeFor() || {};
      var min = readISO(next.min) || readISO(next.max);
      var max = readISO(next.max) || min;
      if (!min || !max) {
        return;
      }
      if (min > max) {
        min = max;
      }
      range = { min: min, max: max };
    }

    function readSelection() {
      readRange();
      var iso = readISO(input.value);
      if (iso && iso >= range.min && iso <= range.max) {
        selectedISO = iso;
        view = defaultView(range, iso);
        return;
      }
      selectedISO = '';
      view = clampView(view.year, view.month, range);
    }

    function setOpen(next) {
      open = Boolean(next);
      dialog.hidden = !open;
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function placeDialog() {
      if (!open) {
        return;
      }
      dialog.style.left = '0px';
      dialog.style.right = 'auto';
      dialog.style.top = 'calc(100% + 0.35rem)';
      dialog.style.bottom = 'auto';
      var rect = dialog.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      if (rect.right > window.innerWidth - 12) {
        dialog.style.left = 'auto';
        dialog.style.right = '0px';
      }
      var fieldRect = field.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 8 && fieldRect.top > rect.height + 8) {
        dialog.style.top = 'auto';
        dialog.style.bottom = 'calc(100% + 0.35rem)';
      }
    }

    function optionList(items, selectedValue, isDisabled) {
      return items.map(function (item) {
        var disabled = isDisabled ? isDisabled(item) : false;
        return '<option value="' + item.value + '"' +
          (Number(item.value) === Number(selectedValue) ? ' selected' : '') +
          (disabled ? ' disabled' : '') + '>' + item.label + '</option>';
      }).join('');
    }

    function render(moveFocus) {
      var month = buildMonth(view.year, view.month, range, selectedISO);
      var canPrev = !(view.year === Number(range.min.slice(0, 4)) && view.month === Number(range.min.slice(5, 7)));
      var canNext = !(view.year === Number(range.max.slice(0, 4)) && view.month === Number(range.max.slice(5, 7)));
      var monthOptions = MONTHS.map(function (name, index) {
        return { value: index + 1, label: name };
      });
      var yearOptions = [];
      var minYear = Number(range.min.slice(0, 4));
      var maxYear = Number(range.max.slice(0, 4));
      var year;
      for (year = minYear; year <= maxYear; year += 1) {
        yearOptions.push({ value: year, label: String(year) });
      }
      var html = '';
      html += '<div class="birth-calendar__header">';
      html += '<button type="button" class="birth-calendar__nav" data-cal-nav="-1"' +
        (canPrev ? '' : ' disabled') + ' aria-label="Previous month">&#8249;</button>';
      html += '<div class="birth-calendar__selects">';
      html += '<select data-cal-month aria-label="Month">';
      html += optionList(monthOptions, view.month, function (item) {
        return !monthIsOpen(view.year, item.value, range);
      });
      html += '</select>';
      html += '<select data-cal-year aria-label="Year">';
      html += optionList(yearOptions, view.year);
      html += '</select></div>';
      html += '<button type="button" class="birth-calendar__nav" data-cal-nav="1"' +
        (canNext ? '' : ' disabled') + ' aria-label="Next month">&#8250;</button>';
      html += '</div>';
      html += '<div class="birth-calendar__weekdays" aria-hidden="true">';
      WEEKDAYS.forEach(function (label) {
        html += '<span>' + label + '</span>';
      });
      html += '</div>';
      html += '<div class="birth-calendar__days" role="grid" aria-label="' + month.label + '">';
      month.cells.forEach(function (cell) {
        if (cell.type !== 'day') {
          html += '<span class="birth-calendar__pad"></span>';
          return;
        }
        html += '<button type="button" class="birth-calendar__day' +
          (cell.selected ? ' is-selected' : '') + '" role="gridcell" data-cal-day="' + cell.iso + '"' +
          ' aria-label="' + cell.day + ' ' + MONTHS[view.month - 1] + ' ' + view.year + '"' +
          (cell.disabled ? ' disabled' : '') +
          (cell.selected ? ' aria-selected="true"' : ' aria-selected="false"') +
          '>' + cell.day + '</button>';
      });
      html += '</div>';
      dialog.innerHTML = html;
      placeDialog();
      if (!moveFocus) {
        return;
      }
      var focusTarget = dialog.querySelector('[data-cal-day][aria-selected="true"]:not([disabled])') ||
        dialog.querySelector('[data-cal-day]:not([disabled])');
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
      }
    }

    function openCalendar(moveFocus) {
      if (input.disabled || (field.closest && field.closest('[hidden]'))) {
        return;
      }
      bound.forEach(function (other) {
        if (other !== api && other.isOpen()) {
          other.close(false);
        }
      });
      readSelection();
      if (!selectedISO) {
        view = defaultView(range, '');
      }
      setOpen(true);
      render(Boolean(moveFocus));
    }

    function closeCalendar(restoreFocus) {
      if (!open && !restoreFocus) {
        setOpen(false);
        return;
      }
      setOpen(false);
      if (restoreFocus && typeof input.focus === 'function') {
        suppressFocusOpen = true;
        input.focus();
        suppressFocusOpen = false;
      }
    }

    function refresh() {
      var was = view;
      readSelection();
      if (!selectedISO) {
        view = clampView(was.year, was.month, range);
      }
      if (open) {
        render(false);
      }
    }

    function insideLabel(node) {
      if (!node || !input.labels) {
        return false;
      }
      var i;
      for (i = 0; i < input.labels.length; i += 1) {
        if (input.labels[i].contains(node)) {
          return true;
        }
      }
      return false;
    }

    function applyDate(iso) {
      var european = toEuropean(iso);
      input.value = european || iso;
      selectedISO = iso;
      closeCalendar(false);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (options.onPick) {
        options.onPick(iso);
      }
      var active = document.activeElement;
      if (!active || active === document.body || active === button || dialog.contains(active)) {
        suppressFocusOpen = true;
        input.focus();
        suppressFocusOpen = false;
      }
    }

    field.classList.add('date-field--dropdown');
    field.setAttribute('data-booking-calendar-ready', 'true');
    var picker = field.querySelector('.date-field__picker');
    if (picker) {
      picker.setAttribute('aria-hidden', 'true');
      picker.tabIndex = -1;
    }

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (open) {
        closeCalendar(false);
      } else {
        openCalendar(true);
      }
    });

    input.addEventListener('pointerdown', function () {
      if (input.disabled || open) {
        return;
      }
      openCalendar(false);
    });

    input.addEventListener('focus', function () {
      if (suppressFocusOpen || open || input.disabled) {
        return;
      }
      openCalendar(false);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown') {
        return;
      }
      event.preventDefault();
      openCalendar(true);
    });

    Array.prototype.forEach.call(input.labels || [], function (label) {
      label.addEventListener('click', function () {
        if (!open && !input.disabled) {
          openCalendar(false);
        }
      });
    });

    dialog.addEventListener('pointerdown', function (event) {
      var pressed = event.target.closest ? event.target.closest('button') : null;
      if (pressed && dialog.contains(pressed)) {
        event.preventDefault();
      }
    });

    dialog.addEventListener('click', function (event) {
      var nav = event.target.closest('[data-cal-nav]');
      if (nav && !nav.disabled) {
        var delta = Number(nav.getAttribute('data-cal-nav'));
        view = shiftMonth(view.year, view.month, delta, range);
        render(false);
        return;
      }
      var day = event.target.closest('[data-cal-day]');
      if (day && !day.disabled) {
        applyDate(day.getAttribute('data-cal-day'));
      }
    });

    dialog.addEventListener('change', function (event) {
      var target = event.target;
      if (target.matches('[data-cal-month]')) {
        view = clampView(view.year, Number(target.value), range);
        render(false);
        return;
      }
      if (target.matches('[data-cal-year]')) {
        view = clampView(Number(target.value), view.month, range);
        render(false);
      }
    });

    input.addEventListener('input', function () {
      if (!open) {
        return;
      }
      readSelection();
      render(false);
    });

    document.addEventListener('pointerdown', function (event) {
      if (!open) {
        return;
      }
      var target = event.target;
      if (field.contains(target) || insideLabel(target)) {
        return;
      }
      closeCalendar(false);
    });

    field.addEventListener('focusout', function (event) {
      if (!open) {
        return;
      }
      var next = event.relatedTarget;
      if (!next || field.contains(next) || insideLabel(next)) {
        return;
      }
      closeCalendar(false);
    });

    document.addEventListener('keydown', function (event) {
      if (!open || event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      closeCalendar(true);
    });

    window.addEventListener('resize', function () {
      if (open) {
        placeDialog();
      }
    });

    api = {
      open: openCalendar,
      close: closeCalendar,
      refresh: refresh,
      isOpen: function () { return open; }
    };
    bound.push(api);
    return api;
  }

  return {
    MONTHS: MONTHS,
    WEEKDAYS: WEEKDAYS,
    shiftISO: shiftISO,
    buildMonth: buildMonth,
    shiftMonth: shiftMonth,
    clampView: clampView,
    defaultView: defaultView,
    monthIsOpen: monthIsOpen,
    bind: bind
  };
});
