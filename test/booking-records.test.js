const { test } = require('node:test');
const assert = require('node:assert/strict');
const BookingRecords = require('../assets/booking-records');
const LocalBookings = require('../assets/local-bookings');

const farClock = { now: new Date(2099, 0, 1) };

function memoryStorage() {
  const store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    }
  };
}

test('creates a stay record with a generated confirmation code', () => {
  const record = BookingRecords.createRecord('user-1', {
    kind: 'stay',
    propertyName: 'Wellton Riverside Riga',
    city: 'Riga',
    country: 'Latvia',
    checkInDate: '2099-05-10',
    checkOutDate: '2099-05-13',
    guests: { adults: 2, children: 0 },
    roomLabel: 'Riverside Deluxe Room',
    amount: 0.18,
    currency: 'ETH'
  }, farClock);

  assert.equal(record.userId, 'user-1');
  assert.equal(record.kind, 'stay');
  assert.equal(record.nights, 3);
  assert.equal(record.propertyName, 'Wellton Riverside Riga');
  assert.match(record.confirmationCode, /^BH-[A-Z0-9]{6}$/);
  assert.notEqual(record.confirmationCode, 'BH-4821');
  assert.equal(BookingRecords.publicBooking(record).userId, undefined);
  assert.equal(record.paymentMethod, 'crypto');
});

test('records a fiat payment when the guest pays in a government currency', () => {
  const record = BookingRecords.createRecord('user-1', {
    kind: 'stay',
    propertyName: 'Scandic Copenhagen',
    city: 'Copenhagen',
    country: 'Denmark',
    checkInDate: '2099-08-01',
    checkOutDate: '2099-08-03',
    amount: 368,
    currency: 'eur',
    paymentMethod: 'fiat'
  }, farClock);

  assert.equal(record.currency, 'EUR');
  assert.equal(record.paymentMethod, 'fiat');
  assert.equal(record.nights, 2);
  assert.equal(BookingRecords.publicBooking(record).paymentMethod, 'fiat');
});

test('requires at least one adult on a stay', () => {
  assert.throws(
    () => BookingRecords.createRecord('user-1', {
      kind: 'stay',
      propertyName: 'Wellton Riverside Riga',
      city: 'Riga',
      checkInDate: '2099-05-10',
      checkOutDate: '2099-05-13',
      guests: { adults: 0, children: 2 },
      amount: 0.1,
      currency: 'ETH'
    }),
    (error) => error.status === 400 && /at least one adult/.test(error.message)
  );

  const singleAdult = BookingRecords.createRecord('user-1', {
    kind: 'stay',
    propertyName: 'Wellton Riverside Riga',
    city: 'Riga',
    checkInDate: '2099-05-10',
    checkOutDate: '2099-05-12',
    guests: { adults: 1, children: 3 },
    amount: 0.12,
    currency: 'ETH'
  }, farClock);
  assert.deepEqual(singleAdult.guests, { adults: 1, children: 3 });

  const omitted = BookingRecords.createRecord('user-1', {
    kind: 'stay',
    propertyName: 'Wellton Riverside Riga',
    city: 'Riga',
    checkInDate: '2099-05-10',
    checkOutDate: '2099-05-12',
    amount: 0.12,
    currency: 'ETH'
  }, farClock);
  assert.deepEqual(omitted.guests, { adults: 1, children: 0 });
});

test('rejects incomplete stays and accepts booked event tickets', () => {
  assert.throws(
    () => BookingRecords.createRecord('user-1', {
      kind: 'stay',
      propertyName: 'Wellton Riverside Riga',
      city: 'Riga',
      checkInDate: '2099-05-13',
      checkOutDate: '2099-05-10',
      amount: 0.1,
      currency: 'ETH'
    }),
    { status: 400 }
  );

  const eventRecord = BookingRecords.createRecord('user-1', {
    kind: 'event',
    eventName: 'Riga Jazz Night',
    eventDate: '2099-05-11',
    city: 'Riga',
    country: 'Latvia',
    amount: 0.01,
    currency: 'ETH'
  }, farClock);
  assert.equal(eventRecord.kind, 'event');
  assert.equal(eventRecord.eventName, 'Riga Jazz Night');
});

test('local bookings store only returns trips for the signed-in user', () => {
  const store = LocalBookings.create({ storage: memoryStorage() });
  store.create('user-a', {
    kind: 'stay',
    propertyName: 'Scandic Copenhagen',
    city: 'Copenhagen',
    country: 'Denmark',
    checkInDate: '2099-06-01',
    checkOutDate: '2099-06-03',
    amount: 0.14,
    currency: 'ETH'
  }, farClock);
  store.create('user-b', {
    kind: 'stay',
    propertyName: 'Grand Hotel Kempinski Riga',
    city: 'Riga',
    country: 'Latvia',
    checkInDate: '2099-07-01',
    checkOutDate: '2099-07-04',
    amount: 0.27,
    currency: 'ETH'
  }, farClock);

  const mine = store.list('user-a');
  assert.equal(mine.length, 1);
  assert.equal(mine[0].propertyName, 'Scandic Copenhagen');
  assert.equal(store.list('user-b')[0].propertyName, 'Grand Hotel Kempinski Riga');
});

test('refuses stays and events more than a year ahead', () => {
  const now = new Date(2026, 9, 24);
  const stay = {
    kind: 'stay',
    propertyName: 'Wellton Riverside Riga',
    city: 'Riga',
    amount: 0.1,
    currency: 'ETH'
  };

  assert.throws(
    () => BookingRecords.createRecord('user-1', Object.assign({}, stay, {
      checkInDate: '2027-10-25',
      checkOutDate: '2027-10-27'
    }), { now }),
    (error) => error.status === 400 && /Check-in cannot be more than a year ahead/.test(error.message)
  );

  assert.throws(
    () => BookingRecords.createRecord('user-1', Object.assign({}, stay, {
      checkInDate: '2027-10-23',
      checkOutDate: '2027-10-25'
    }), { now }),
    (error) => error.status === 400 && /Check-out cannot be more than a year ahead/.test(error.message)
  );

  const allowed = BookingRecords.createRecord('user-1', Object.assign({}, stay, {
    checkInDate: '2027-10-23',
    checkOutDate: '2027-10-24'
  }), { now });
  assert.equal(allowed.nights, 1);

  assert.throws(
    () => BookingRecords.createRecord('user-1', {
      kind: 'event',
      eventName: 'Riga Jazz Night',
      eventDate: '2027-10-25',
      city: 'Riga',
      amount: 0.01,
      currency: 'ETH'
    }, { now }),
    (error) => error.status === 400 && /Event date cannot be more than a year ahead/.test(error.message)
  );

  const eventRecord = BookingRecords.createRecord('user-1', {
    kind: 'event',
    eventName: 'Riga Jazz Night',
    eventDate: '2027-10-24',
    city: 'Riga',
    amount: 0.01,
    currency: 'ETH'
  }, { now });
  assert.equal(eventRecord.eventDate, '2027-10-24');
});

test('a leap-day booking window ends on 28 February the next year', () => {
  const now = new Date(2024, 1, 29);
  assert.throws(
    () => BookingRecords.createRecord('user-1', {
      kind: 'event',
      eventName: 'Harbour lights',
      eventDate: '2025-03-01',
      city: 'Riga',
      amount: 0.01,
      currency: 'ETH'
    }, { now }),
    (error) => error.status === 400 && /year ahead/.test(error.message)
  );

  const eventRecord = BookingRecords.createRecord('user-1', {
    kind: 'event',
    eventName: 'Harbour lights',
    eventDate: '2025-02-28',
    city: 'Riga',
    amount: 0.01,
    currency: 'ETH'
  }, { now });
  assert.equal(eventRecord.eventDate, '2025-02-28');
});
