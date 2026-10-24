const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const BookingCalendar = require('../assets/booking-calendar');

const range = { min: '2026-10-24', max: '2027-10-24' };

test('booking calendar starts on Monday and disables days outside the stay window', () => {
  const october = BookingCalendar.buildMonth(2026, 10, range, '2026-10-24');
  assert.equal(october.label, 'October 2026');
  assert.equal(october.cells[0].type, 'pad');
  const days = october.cells.filter((cell) => cell.type === 'day');
  assert.equal(days.length, 31);
  assert.equal(days[0].disabled, true);
  assert.equal(days[22].disabled, true);
  assert.equal(days[23].disabled, false);
  assert.equal(days[23].selected, true);
  assert.equal(days[23].iso, '2026-10-24');
  assert.equal(days[30].disabled, false);

  const nextOctober = BookingCalendar.buildMonth(2027, 10, range, '');
  const nextDays = nextOctober.cells.filter((cell) => cell.type === 'day');
  assert.equal(nextDays[23].disabled, false);
  assert.equal(nextDays[24].disabled, true);
  assert.deepEqual(BookingCalendar.WEEKDAYS, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
});

test('booking calendar navigation stays inside the bookable year', () => {
  assert.deepEqual(BookingCalendar.shiftMonth(2026, 10, -1, range), { year: 2026, month: 10 });
  assert.deepEqual(BookingCalendar.shiftMonth(2027, 10, 1, range), { year: 2027, month: 10 });
  assert.deepEqual(BookingCalendar.shiftMonth(2026, 12, 1, range), { year: 2027, month: 1 });
  assert.deepEqual(BookingCalendar.defaultView(range, ''), { year: 2026, month: 10 });
  assert.deepEqual(BookingCalendar.defaultView(range, '2027-03-02'), { year: 2027, month: 3 });
  assert.equal(BookingCalendar.monthIsOpen(2026, 9, range), false);
  assert.equal(BookingCalendar.monthIsOpen(2026, 10, range), true);
  assert.equal(BookingCalendar.shiftISO('2026-10-24', 1), '2026-10-25');
  assert.equal(BookingCalendar.shiftISO('2024-02-28', 1), '2024-02-29');
  assert.equal(BookingCalendar.shiftISO('2023-02-28', 1), '2023-03-01');
});

test('homepage booking dates open a dropdown calendar from the field', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const hero = fs.readFileSync(path.join(root, 'assets/hero-search.js'), 'utf8');
  const calendar = fs.readFileSync(path.join(root, 'assets/booking-calendar.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

  assert.equal((html.match(/data-booking-calendar/g) || []).length >= 3, true);
  assert.match(html, /id="hero-search-checkin-calendar"/);
  assert.match(html, /id="hero-search-checkout-calendar"/);
  assert.match(html, /id="hero-search-start-calendar"/);
  assert.match(html, /data-booking-calendar-dialog/);
  assert.match(html, /assets\/booking-calendar\.js/);
  assert.ok(html.indexOf('assets/booking-calendar.js') < html.indexOf('assets/hero-search.js'));
  assert.match(hero, /BookingCalendar\.bind/);
  assert.match(hero, /shiftISO\(checkInISO, 1\)/);
  assert.match(calendar, /addEventListener\('pointerdown'/);
  assert.match(calendar, /addEventListener\('focus'/);
  assert.match(css, /\.booking-calendar/);
  assert.match(css, /\.date-field--dropdown/);
});
