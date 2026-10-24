'use strict';

// Fictional multi-day itineraries for tour search.
// These are sample packages, not hotel add-ons. The room is chosen separately.

const PACKAGES = [
  {
    id: 'pkg-iceland-golden-circle',
    name: 'Golden Circle three-day package',
    city: 'Reykjavík',
    country: 'Iceland',
    pageUrl: 'html/cities/iceland/reykjavík.html',
    detail: '3 days · 2 nights · per person',
    priceEth: 0.24,
    includes: ['Þingvellir rift', 'Geysir field', 'Gullfoss waterfall', 'Lagoon soak'],
    description: 'Sample itinerary from Reykjavík: a full day around the Golden Circle and a lagoon soak before departure. The room is booked separately.'
  },
  {
    id: 'pkg-norway-hardangerfjord',
    name: 'Hardangerfjord week',
    city: 'Bergen',
    country: 'Norway',
    pageUrl: 'html/cities/norway/bergen.html',
    detail: '7 days · 6 nights · per person',
    priceEth: 0.62,
    includes: ['Orchard boat day', 'Waterfall stop', 'Funicular afternoon', 'Harbour evening'],
    description: 'Sample week based in Bergen, with boat days on the Hardangerfjord and an afternoon above the city. The room is booked separately.'
  },
  {
    id: 'pkg-sweden-aurora-cabin',
    name: 'Aurora cabin package',
    city: 'Abisko',
    country: 'Sweden',
    pageUrl: 'html/cities/sweden/abisko.html',
    detail: '4 days · 3 nights · per person',
    priceEth: 0.41,
    includes: ['Clear-night sky watch', 'Mountain railway', 'Frozen-lake picnic', 'Cabin base'],
    description: 'Sample Arctic itinerary in Abisko for clear nights, a railway ride, and a picnic on the frozen lake. The room is booked separately.'
  },
  {
    id: 'pkg-scotland-highland-rail',
    name: 'Highland rail package',
    city: 'Edinburgh',
    country: 'Scotland',
    pageUrl: 'html/cities/scotland/edinburgh.html',
    detail: '5 days · 4 nights · per person',
    priceEth: 0.48,
    includes: ['Edinburgh departure', 'Highland rail day', 'Loch afternoon', 'Distillery visit'],
    description: 'Sample rail itinerary from Edinburgh into the Highlands, with a loch afternoon and a distillery visit. The room is booked separately.'
  },
  {
    id: 'pkg-england-northumberland',
    name: 'Northumberland coast package',
    city: 'Alnwick',
    country: 'Northeast England',
    pageUrl: 'html/cities/northeast-england/alnwick.html',
    detail: '3 days · 2 nights · per person',
    priceEth: 0.27,
    includes: ['Alnwick garden', 'Coastal village', 'Seafood supper', 'Market morning'],
    description: 'Sample coast itinerary from Alnwick, with a garden morning, a coastal village, and supper by the harbour. The room is booked separately.'
  },
  {
    id: 'pkg-denmark-skagen-light',
    name: 'Skagen light package',
    city: 'Skagen',
    country: 'Denmark',
    pageUrl: 'html/cities/denmark/skagen.html',
    detail: '3 days · 2 nights · per person',
    priceEth: 0.22,
    includes: ['Dune heath', 'Meeting of the seas', 'Painter’s house', 'Beach evening'],
    description: 'Sample itinerary at Denmark’s northern tip: dune heath, the meeting of the seas, and a beach evening. The room is booked separately.'
  },
  {
    id: 'pkg-finland-arctic-circle',
    name: 'Arctic circle lights package',
    city: 'Rovaniemi',
    country: 'Finland',
    pageUrl: 'html/cities/finland/rovaniemi.html',
    detail: '4 days · 3 nights · per person',
    priceEth: 0.45,
    includes: ['Arctic circle crossing', 'Reindeer forest', 'Glass-igloo night', 'River sauna'],
    description: 'Sample Lapland itinerary from Rovaniemi, with a forest day, one glass-igloo night, and a river sauna. The room is booked separately.'
  },
  {
    id: 'pkg-greenland-iceberg',
    name: 'Iceberg harbour package',
    city: 'Ilulissat',
    country: 'Greenland',
    pageUrl: 'html/cities/greenland/ilulissat.html',
    detail: '5 days · 4 nights · per person',
    priceEth: 0.71,
    includes: ['Icefjord lookout', 'Boat among icebergs', 'Settlement visit', 'Harbour evening'],
    description: 'Sample itinerary in Ilulissat: evenings on the icefjord, a boat among icebergs, and a settlement visit. The room is booked separately.'
  },
  {
    id: 'pkg-estonia-pine-coast',
    name: 'Pine-coast package',
    city: 'Pärnu',
    country: 'Estonia',
    pageUrl: 'html/cities/estonia/pärnu.html',
    detail: '3 days · 2 nights · per person',
    priceEth: 0.19,
    includes: ['Pine forest', 'Dune path', 'Beach afternoon', 'Resort evening'],
    description: 'Sample coast itinerary from Pärnu, through the pine forest and dunes, with a beach afternoon. The room is booked separately.'
  },
  {
    id: 'pkg-latvia-gauja',
    name: 'Gauja valley package',
    city: 'Riga',
    country: 'Latvia',
    pageUrl: 'html/cities/latvia/riga.html',
    detail: '3 days · 2 nights · per person',
    priceEth: 0.23,
    includes: ['Valley viewpoint', 'Sandstone cliffs', 'River picnic', 'Old-town evening'],
    description: 'Sample itinerary based in Riga, with a day in the Gauja valley and an old-town evening. The room is booked separately.'
  },
  {
    id: 'pkg-lithuania-curonian',
    name: 'Curonian spit package',
    city: 'Klaipėda',
    country: 'Lithuania',
    pageUrl: 'html/cities/lithuania/klaipeda.html',
    detail: '4 days · 3 nights · per person',
    priceEth: 0.29,
    includes: ['Spit dunes', 'Lagoon shore', 'Amber stop', 'Harbour evening'],
    description: 'Sample itinerary from Klaipėda onto the Curonian spit, with dunes, a lagoon shore, and an amber stop. The room is booked separately.'
  },
  {
    id: 'pkg-faroe-grass-roof',
    name: 'Grass-roof islands package',
    city: 'Tórshavn',
    country: 'Faroe Islands',
    pageUrl: 'html/cities/faroe-islands/tórshavn.html',
    detail: '5 days · 4 nights · per person',
    priceEth: 0.58,
    includes: ['Grass-roof villages', 'Cliff lookout', 'Boat day', 'Harbour supper'],
    description: 'Sample island itinerary from Tórshavn, visiting grass-roof villages and a cliff lookout. The room is booked separately.'
  },
  {
    id: 'pkg-aland-island-farm',
    name: 'Island farm package',
    city: 'Mariehamn',
    country: 'Åland Islands',
    pageUrl: 'html/cities/aland-islands/mariehamn.html',
    detail: '3 days · 2 nights · per person',
    priceEth: 0.26,
    includes: ['Farm lanes', 'Kastelholm countryside', 'Shore picnic', 'Archipelago ferry'],
    description: 'Sample itinerary from Mariehamn through farm lanes and Kastelholm countryside, with a shore picnic. The room is booked separately.'
  }
];

function listPackages() {
  return PACKAGES.map((pkg) => Object.assign({}, pkg, { includes: pkg.includes.slice() }));
}

module.exports = {
  listPackages
};
