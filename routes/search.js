'use strict';

const express = require('express');
const { getSearchDatabase, search, destinationLabels } = require('../lib/search-db');
const { searchExperiences, experienceLabels } = require('../lib/hotel-addons');
const { wantsEcolodges } = require('../assets/ecolodges');

const router = express.Router();

function wantsTours(query) {
  return String(query && query.what || '').trim().toLowerCase() === 'tours';
}

// Homepage datalist. Accommodation labels include places with no HTML page.
// what=tours lists experiences instead of cities and hotels.
// country limits that list to one destination. United Kingdom includes Scotland and Northeast England.
// ecolodges=1 limits accommodation labels to nature lodges, mountain stations, and their places.
router.get('/destinations', (req, res) => {
  if (wantsTours(req.query)) {
    res.json({ labels: experienceLabels(req.query.country) });
    return;
  }
  res.json({
    labels: destinationLabels(getSearchDatabase(), {
      ecolodgesOnly: wantsEcolodges(req.query)
    })
  });
});

// Results page. checkIn, checkOut, startDate, adults, and children are accepted and ignored.
// what=tours searches experiences and sample packages. country keeps tours from that country.
// A blank q with country lists that country; country= lists every tour.
// A blank q with no country parameter still returns no tours.
// United Kingdom covers Scotland and Northeast England.
// Any other value of what stays on accommodation.
// ecolodges=1 (also true, yes, or on) keeps hotels that are nature lodges or mountain
// stations and drops cities. A blank q with ecolodges=1 lists every ecolodge.
// ecolodges is ignored when what=tours.
router.get('/', (req, res) => {
  const query = String(req.query.q || '').trim();
  if (wantsTours(req.query)) {
    res.json({ tours: searchExperiences(query, req.query.country) });
    return;
  }
  res.json(search(getSearchDatabase(), query, {
    ecolodgesOnly: wantsEcolodges(req.query)
  }));
});

module.exports = router;
