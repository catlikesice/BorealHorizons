/**
 * Rural tours grouped by the countries used in tour search.
 * Scotland and Northeast England share the United Kingdom page.
 * Shared by the tour HTML pages and POST /api/tour-interest.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.CountryTours = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var countries = [
    {
      id: 'aland-islands',
      name: 'Åland Islands',
      page: 'html/tours/aland-islands.html',
      summary: 'Castle farms and fortress shores on the inner islands, away from the ferry bustle.',
      intro: 'Åland tours stay on the inland roads and farm shores: castle country at Kastelholm, the ruined fortress at Bomarsund, and the red-granite islands between them.',
      tours: [
        {
          id: 'aland-kastelholm',
          name: 'Kastelholm castle and farm road',
          place: 'Kastelholm',
          rural: true,
          detail: 'Half day · castle and farm lanes',
          description: 'Walk from the castle inn along the inland road, through fields and farmsteads to the medieval castle above the sound.',
          stayUrl: 'html/cities/aland-islands/kastelholm-castle-inn.html',
          stayLabel: 'Stay in Kastelholm'
        },
        {
          id: 'aland-bomarsund',
          name: 'Bomarsund shore walk',
          place: 'Bomarsund',
          rural: true,
          detail: '2 hours · fortress ruins and shore',
          description: 'Follow the shore path around the Bomarsund fortress ruins, with farm meadows behind the water and the outer islands in view.',
          stayUrl: 'html/cities/aland-islands/bomarsund-fortress-house.html',
          stayLabel: 'Stay in Bomarsund'
        },
        {
          id: 'aland-archipelago',
          name: 'Inner archipelago farms',
          place: 'Åland archipelago',
          rural: true,
          detail: 'Full day · ferries and farm jetties',
          description: 'Island-hop among wooden jetties, swimming coves, and red-granite farms in the sheltered inner archipelago. Mariehamn is only the ferry base.',
          stayUrl: 'html/cities/aland-islands/mariehamn.html',
          stayLabel: 'Ferry base in Mariehamn'
        }
      ]
    },
    {
      id: 'denmark',
      name: 'Denmark',
      page: 'html/tours/denmark.html',
      summary: 'Dune country at Skagen and the open mudflats of the Wadden Sea.',
      intro: 'Denmark’s rural tours leave the city harbours for the dune spit at Skagen and the UNESCO mudflats of the Wadden Sea.',
      tours: [
        {
          id: 'denmark-skagen',
          name: 'Skagen dune country',
          place: 'Skagen',
          rural: true,
          detail: 'Half day · dunes and the meeting of the seas',
          description: 'Walk the dune heath and the sand spit where the Kattegat meets the Skagerrak, starting from the fishing town at Denmark’s northern tip.',
          stayUrl: 'html/cities/denmark/skagen.html',
          stayLabel: 'Stays in Skagen'
        },
        {
          id: 'denmark-wadden',
          name: 'Wadden Sea mudflat walk',
          place: 'Wadden Sea',
          rural: true,
          detail: '3 hours · local nature guide',
          description: 'A guided walk on the rural Wadden Sea mudflats near Esbjerg, across open tidal land with a local nature guide.',
          stayUrl: 'html/cities/denmark/esbjerg.html',
          stayLabel: 'Stays near Esbjerg'
        }
      ]
    },
    {
      id: 'estonia',
      name: 'Estonia',
      page: 'html/tours/estonia.html',
      summary: 'Lake country around Viljandi and the pine coast south of Pärnu.',
      intro: 'Estonia’s rural tours use small-town bases for lake, manor, and pine-coast country, with Viljandi and the Pärnu shore as the starting points.',
      tours: [
        {
          id: 'estonia-viljandi',
          name: 'Viljandi lake and manor country',
          place: 'Viljandi',
          rural: true,
          detail: 'Half day · lake path and manor lanes',
          description: 'Walk the lake path under the castle hills, then out along manor lanes into the countryside around Viljandi.',
          stayUrl: 'html/cities/estonia/viljandi.html',
          stayLabel: 'Stays in Viljandi'
        },
        {
          id: 'estonia-parnu-coast',
          name: 'Pärnu coastal pine forest',
          place: 'Pärnu coast',
          rural: true,
          detail: 'Half day · beach forest and dunes',
          description: 'Leave the resort streets for the pine forest and dune path along the Pärnu coast, with the beach on one side and farmland behind the trees.',
          stayUrl: 'html/cities/estonia/pärnu.html',
          stayLabel: 'Stays in Pärnu'
        }
      ]
    },
    {
      id: 'faroe-islands',
      name: 'Faroe Islands',
      page: 'html/tours/faroe-islands.html',
      summary: 'Turf-roof villages on the northern islands and the bird cliffs of Mykines.',
      intro: 'Faroe tours are village tours: gorge hamlets, lagoon farms, and cliff settlements reached by boat or a single road.',
      tours: [
        {
          id: 'faroe-gjogv',
          name: 'Gjógv gorge village',
          place: 'Gjógv',
          rural: true,
          detail: 'Half day · village and sea gorge',
          description: 'Walk the turf-roof village of Gjógv and the natural harbour cut into the north coast of Eysturoy.',
          stayUrl: 'html/cities/faroe-islands/gjogv-guesthouse.html',
          stayLabel: 'Stay in Gjógv'
        },
        {
          id: 'faroe-saksun',
          name: 'Saksun lagoon',
          place: 'Saksun',
          rural: true,
          detail: 'Half day · lagoon and turf roofs',
          description: 'Follow the stream into Saksun, where turf-roof farms sit above the tidal lagoon on Streymoy’s quiet north shore.',
          stayUrl: 'html/cities/faroe-islands/saksun-turf-house.html',
          stayLabel: 'Stay in Saksun'
        },
        {
          id: 'faroe-mykines',
          name: 'Mykines cliff settlement',
          place: 'Mykines',
          rural: true,
          detail: 'Full day · boat and lighthouse path',
          description: 'Cross to the island village of Mykines and walk the puffin slopes toward the lighthouse, weather permitting.',
          stayUrl: 'html/cities/faroe-islands/mykines-puffin-lodge.html',
          stayLabel: 'Stay on Mykines'
        },
        {
          id: 'faroe-nolsoy',
          name: 'Nólsoy island village',
          place: 'Nólsoy',
          rural: true,
          detail: 'Half day · harbour village',
          description: 'Ferry to the single village on Nólsoy and walk the island lane above the sound, facing Tórshavn from the rural side of the water.',
          stayUrl: 'html/cities/faroe-islands/nolsoy-harbour-house.html',
          stayLabel: 'Stay on Nólsoy'
        }
      ]
    },
    {
      id: 'finland',
      name: 'Finland',
      page: 'html/tours/finland.html',
      summary: 'Fell villages in Lapland: Levi, Ylläsjärvi, and the Kuusamo hills.',
      intro: 'Finland’s rural tours start in fell villages rather than Helsinki: ski-side hamlets, gondola hills, and forest tracks above the tree line.',
      tours: [
        {
          id: 'finland-levi',
          name: 'Levi village fells',
          place: 'Levi',
          rural: true,
          detail: 'Half day · village and lower fell',
          description: 'Walk from the centre of Levi village onto the lower fell, with reindeer fences and forest tracks above the gondola base.',
          stayUrl: 'html/cities/finland/levi.html',
          stayLabel: 'Stays in Levi'
        },
        {
          id: 'finland-yllas',
          name: 'Ylläsjärvi village tracks',
          place: 'Ylläs',
          rural: true,
          detail: 'Half day · village and fell edge',
          description: 'Start in Ylläsjärvi, the village under the fell, and follow the forest track toward the gondola and the open hillside.',
          stayUrl: 'html/cities/finland/yllas.html',
          stayLabel: 'Stays in Ylläs'
        },
        {
          id: 'finland-ruka',
          name: 'Ruka and the Kuusamo fells',
          place: 'Ruka-Kuusamo',
          rural: true,
          detail: 'Full day · fell village and forest',
          description: 'Use the Ruka ski village as a base for the Kuusamo fells: hilltop views, forest lakes, and the quiet roads east of the slopes.',
          stayUrl: 'html/cities/finland/ruka-kuusamo.html',
          stayLabel: 'Stays in Ruka-Kuusamo'
        }
      ]
    },
    {
      id: 'greenland',
      name: 'Greenland',
      page: 'html/tours/greenland.html',
      summary: 'The icefjord and the settlement edge at Ilulissat, on Disko Bay.',
      intro: 'Greenland’s rural tour stays with the icefjord at Ilulissat: boardwalks, the settlement edge, and boat time among ice on Disko Bay.',
      tours: [
        {
          id: 'greenland-ilulissat-icefjord',
          name: 'Ilulissat icefjord walk',
          place: 'Ilulissat',
          rural: true,
          detail: 'Half day · boardwalk and settlement edge',
          description: 'Walk the icefjord boardwalk from the edge of Ilulissat, where sled dogs, rock, and the Sermeq Kujalleq glacier meet the bay.',
          stayUrl: 'html/cities/greenland/ilulissat.html',
          stayLabel: 'Stays in Ilulissat'
        },
        {
          id: 'greenland-disko-bay',
          name: 'Disko Bay ice route',
          place: 'Disko Bay',
          rural: true,
          detail: 'Half day · small boat among ice',
          description: 'A small-boat route from Ilulissat among icebergs on Disko Bay, with the settlement left behind on the shore.',
          stayUrl: 'html/cities/greenland/ilulissat.html',
          stayLabel: 'Stays in Ilulissat'
        }
      ]
    },
    {
      id: 'iceland',
      name: 'Iceland',
      page: 'html/tours/iceland.html',
      summary: 'Westfjord harbours, Skagafjörður horse country, and the Vestmannaeyjar settlements.',
      intro: 'Iceland’s rural tours use harbour villages and farm valleys: the Westfjords, the horse country of Skagafjörður, and the islands off the south coast.',
      tours: [
        {
          id: 'iceland-isafjordur',
          name: 'Ísafjörður and the Westfjords',
          place: 'Ísafjörður',
          rural: true,
          detail: 'Full day · fjord villages and bird cliffs',
          description: 'Use Ísafjörður as the base for quiet fishing villages and bird cliffs along the Westfjords roads.',
          stayUrl: 'html/cities/iceland/ísafjörður.html',
          stayLabel: 'Stays in Ísafjörður'
        },
        {
          id: 'iceland-saudarkrokur',
          name: 'Skagafjörður horse country',
          place: 'Sauðárkrókur',
          rural: true,
          detail: 'Half day · valley farms and the sandspit',
          description: 'Ride or walk the horse farms of Skagafjörður, then follow the valley from Sauðárkrókur back toward the long sandspit.',
          stayUrl: 'html/cities/iceland/sauðárkrókur.html',
          stayLabel: 'Stays in Sauðárkrókur'
        },
        {
          id: 'iceland-vestmannaeyjar',
          name: 'Vestmannaeyjar island settlements',
          place: 'Vestmannaeyjar',
          rural: true,
          detail: 'Full day · island paths and puffin cliffs',
          description: 'Ferry to the Westman Islands and walk the settlement edge, lava fields, and puffin cliffs above the harbour.',
          stayUrl: 'html/cities/iceland/vestmannaeyjar.html',
          stayLabel: 'Stays in Vestmannaeyjar'
        }
      ]
    },
    {
      id: 'latvia',
      name: 'Latvia',
      page: 'html/tours/latvia.html',
      summary: 'The castle hill and river meadows of rural Zemgale, based in Bauska.',
      intro: 'Latvia’s rural tour stays in Zemgale, where the castle at Bauska looks over the Mūsa and Mēmele and the meadows downstream.',
      tours: [
        {
          id: 'latvia-bauska-castle',
          name: 'Bauska castle and river confluence',
          place: 'Bauska',
          rural: true,
          detail: 'Guided visit · castle and tower',
          description: 'A guided visit to Bauska Castle and the tower above the meeting of the Mūsa and Mēmele, on the edge of the town and the fields.',
          stayUrl: 'html/cities/latvia/bauska.html',
          stayLabel: 'Stays in Bauska'
        },
        {
          id: 'latvia-zemgale-meadows',
          name: 'Zemgale river meadows',
          place: 'Zemgale',
          rural: true,
          detail: 'Half day · meadows downstream of Bauska',
          description: 'Walk the river meadows downstream of Bauska through farmland and willow banks in the Zemgale countryside.',
          stayUrl: 'html/cities/latvia/bauska.html',
          stayLabel: 'Stays in Bauska'
        }
      ]
    },
    {
      id: 'lithuania',
      name: 'Lithuania',
      page: 'html/tours/lithuania.html',
      summary: 'The Curonian village of Nida, the lakes at Trakai, and the forest springs of Druskininkai.',
      intro: 'Lithuania’s rural tours are village and lakeside walks: Nida on the Curonian Spit, Trakai among the lakes, and the forest town of Druskininkai.',
      tours: [
        {
          id: 'lithuania-nida',
          name: 'Nida and the Curonian dunes',
          place: 'Nida',
          rural: true,
          detail: 'Half day · village and the Great Dune',
          description: 'Walk the fishing village of Nida, then climb the Great Dune for views over the lagoon, the pine forest, and the Baltic shore.',
          stayUrl: 'html/cities/lithuania/hotel-nida-marina.html',
          stayLabel: 'Stay in Nida'
        },
        {
          id: 'lithuania-trakai',
          name: 'Trakai lakeside paths',
          place: 'Trakai',
          rural: true,
          detail: 'Half day · lakes and castle approaches',
          description: 'Follow the lake paths into Trakai, through wooden houses and reed beds, toward the island castle.',
          stayUrl: 'html/cities/lithuania/trakai-lake-house.html',
          stayLabel: 'Stay in Trakai'
        },
        {
          id: 'lithuania-druskininkai',
          name: 'Druskininkai forest and the Nemunas',
          place: 'Druskininkai',
          rural: true,
          detail: 'Half day · pine forest and river',
          description: 'Walk the pine forest and the Nemunas bank around Druskininkai, the spa village set in the woods of southern Lithuania.',
          stayUrl: 'html/cities/lithuania/druskininkai-spa-house.html',
          stayLabel: 'Stay in Druskininkai'
        }
      ]
    },
    {
      id: 'norway',
      name: 'Norway',
      page: 'html/tours/norway.html',
      summary: 'Mountain villages on the Hardangervidda and the valleys of Hemsedal and Voss.',
      intro: 'Norway’s rural tours start in mountain villages: Geilo on the Hardangervidda, the valley farms of Hemsedal, and the countryside around Voss.',
      tours: [
        {
          id: 'norway-geilo',
          name: 'Geilo and the Hardangervidda',
          place: 'Geilo',
          rural: true,
          detail: 'Full day · village and plateau edge',
          description: 'Walk from the mountain village of Geilo onto the edge of the Hardangervidda, with the railway and the plateau both in reach.',
          stayUrl: 'html/cities/norway/geilo.html',
          stayLabel: 'Stays in Geilo'
        },
        {
          id: 'norway-hemsedal',
          name: 'Hemsedal valley farms',
          place: 'Hemsedal',
          rural: true,
          detail: 'Half day · valley paths',
          description: 'Follow valley paths and farm hamlets through Hemsedal, below the ski hills and along the river.',
          stayUrl: 'html/cities/norway/hemsedal.html',
          stayLabel: 'Stays in Hemsedal'
        },
        {
          id: 'norway-voss',
          name: 'Voss valley countryside',
          place: 'Voss',
          rural: true,
          detail: 'Half day · lake shore and farm roads',
          description: 'Leave the station for the farm roads and lake shore around Voss, in the valley between the fjord routes.',
          stayUrl: 'html/cities/norway/voss.html',
          stayLabel: 'Stays in Voss'
        }
      ]
    },
    {
      id: 'svalbard',
      name: 'Svalbard',
      page: 'html/tours/svalbard.html',
      summary: 'Outlying Arctic settlements: Ny-Ålesund, Pyramiden, and Barentsburg.',
      intro: 'Svalbard’s rural tours leave the main street of Longyearbyen for the smaller settlements on the fjords: a research village, a preserved mining town, and a hillside harbour.',
      tours: [
        {
          id: 'svalbard-ny-alesund',
          name: 'Ny-Ålesund settlement walk',
          place: 'Ny-Ålesund',
          rural: true,
          detail: 'Half day · research village on Kongsfjorden',
          description: 'Walk the wooden research settlement of Ny-Ålesund on Kongsfjorden, with glacier ice at the head of the fjord.',
          stayUrl: 'html/cities/svalbard/ny-alesund-polar-lodge.html',
          stayLabel: 'Stay in Ny-Ålesund'
        },
        {
          id: 'svalbard-pyramiden',
          name: 'Pyramiden harbour visit',
          place: 'Pyramiden',
          rural: true,
          detail: 'Half day · guided settlement visit',
          description: 'A guided visit to Pyramiden, the preserved mining settlement on Billefjorden, reached by boat from the main fjord.',
          stayUrl: 'html/cities/svalbard/pyramiden-harbour-house.html',
          stayLabel: 'Stay in Pyramiden'
        },
        {
          id: 'svalbard-barentsburg',
          name: 'Barentsburg hillside',
          place: 'Barentsburg',
          rural: true,
          detail: 'Half day · harbour and hillside lanes',
          description: 'Walk the harbour and hillside lanes of Barentsburg, the mining settlement on Grønfjorden.',
          stayUrl: 'html/cities/svalbard/barentsburg-guesthouse.html',
          stayLabel: 'Stay in Barentsburg'
        }
      ]
    },
    {
      id: 'sweden',
      name: 'Sweden',
      page: 'html/tours/sweden.html',
      summary: 'Abisko’s birch forest, the river village of Jukkasjärvi, and the mountain village of Sälen.',
      intro: 'Sweden’s rural tours stay in the north and the mountains: national-park forest at Abisko, the Torne river village of Jukkasjärvi, and the slopes above Sälen.',
      tours: [
        {
          id: 'sweden-abisko',
          name: 'Abisko national park walk',
          place: 'Abisko',
          rural: true,
          detail: 'Half day · birch forest and the Kungsleden',
          description: 'Walk from Abisko through birch forest toward the start of the Kungsleden, with Torneträsk and the open fell above the trees.',
          stayUrl: 'html/cities/sweden/abisko.html',
          stayLabel: 'Stays in Abisko'
        },
        {
          id: 'sweden-jukkasjarvi',
          name: 'Jukkasjärvi river village',
          place: 'Jukkasjärvi',
          rural: true,
          detail: 'Half day · riverbank and village',
          description: 'Walk the Torne riverbank in Jukkasjärvi, the village north of Kiruna, past the wooden church and the ice-hotel meadows.',
          stayUrl: 'html/cities/sweden/icehotel-jukkasjarvi.html',
          stayLabel: 'Stay in Jukkasjärvi'
        },
        {
          id: 'sweden-salen',
          name: 'Sälen mountain village',
          place: 'Sälen',
          rural: true,
          detail: 'Half day · village trails',
          description: 'Follow trails from the mountain village of Sälen into the forested slopes of the Transtrandsfjällen.',
          stayUrl: 'html/cities/sweden/salen.html',
          stayLabel: 'Stays in Sälen'
        }
      ]
    },
    {
      id: 'united-kingdom',
      name: 'United Kingdom',
      page: 'html/tours/united-kingdom.html',
      summary: 'Highland forests, loch villages, Kielder, and the Northumberland hills. Scotland and Northeast England are listed together.',
      intro: 'United Kingdom rural tours cover the Scottish Highlands and Northeast England: Cairngorm forest, Loch Lomond’s conservation village, Skye, Ullapool, Kielder Forest, and the Northumberland hills.',
      tours: [
        {
          id: 'uk-aviemore',
          name: 'Cairngorm forest from Aviemore',
          place: 'Aviemore',
          rural: true,
          detail: 'Full day · Rothiemurchus and the Spey',
          description: 'Walk the Rothiemurchus pine forest and the River Spey from Aviemore, at the foot of the Cairngorms.',
          stayUrl: 'html/cities/scotland/aviemore.html',
          stayLabel: 'Stays in Aviemore'
        },
        {
          id: 'uk-loch-lomond',
          name: 'Luss and Loch Lomond',
          place: 'Loch Lomond',
          rural: true,
          detail: 'Half day · conservation village',
          description: 'Walk the conservation village of Luss on the west shore of Loch Lomond, where the water opens toward the hills.',
          stayUrl: 'html/cities/scotland/loch-lomond.html',
          stayLabel: 'Stays at Loch Lomond'
        },
        {
          id: 'uk-skye',
          name: 'Dunvegan and the Skye countryside',
          place: 'Isle of Skye',
          rural: true,
          detail: 'Full day · lochside and crofting country',
          description: 'Start at Dunvegan on the Isle of Skye and follow lochside and crofting roads toward the cliffs, away from the busier harbour towns.',
          stayUrl: 'html/cities/scotland/dunvegan-castle-hotel.html',
          stayLabel: 'Stay in Dunvegan'
        },
        {
          id: 'uk-ullapool',
          name: 'Ullapool and Loch Broom',
          place: 'Ullapool',
          rural: true,
          detail: 'Half day · shore and crofting roads',
          description: 'Walk the shore of Loch Broom from Ullapool into the crofting country of Wester Ross.',
          stayUrl: 'html/cities/scotland/ullapool.html',
          stayLabel: 'Stays in Ullapool'
        },
        {
          id: 'uk-kielder',
          name: 'Kielder Forest village',
          place: 'Kielder Forest',
          rural: true,
          detail: 'Full day · forest and reservoir',
          description: 'Walk from Kielder village along the reservoir and the castle trail, inside the forest of northern England.',
          stayUrl: 'html/cities/northeast-england/kielder-forest.html',
          stayLabel: 'Stays in Kielder Forest'
        },
        {
          id: 'uk-northumberland',
          name: 'Northumberland hill farms',
          place: 'Northumberland National Park',
          rural: true,
          detail: 'Full day · moor and farm valleys',
          description: 'Follow farm valleys and open moor in Northumberland National Park, with Hadrian’s Wall country nearby.',
          stayUrl: 'html/cities/northeast-england/northumberland-national-park.html',
          stayLabel: 'Stays in the national park'
        }
      ]
    }
  ];

  function get(id) {
    var key = String(id || '').trim().toLowerCase();
    for (var i = 0; i < countries.length; i += 1) {
      if (countries[i].id === key) return countries[i];
    }
    return null;
  }

  function ruralTours(country) {
    return (country && country.tours ? country.tours : []).filter(function (tour) {
      return tour.rural;
    });
  }

  return {
    countries: countries,
    get: get,
    ruralTours: ruralTours
  };
});
