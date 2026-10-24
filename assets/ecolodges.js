/**
 * Nature lodges and mountain stations a guest can filter to.
 * Town hotels that only use "lodge" in the name, such as Funken Lodge
 * and The Lodge on Loch Lomond, stay in the full accommodation catalog.
 *
 * Shared by the homepage, the results page, and GET /api/search?ecolodges=1.
 */
(function (factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.Ecolodges = api;
  }
})(function () {
  var urls = [
    'html/cities/sweden/abisko-mountain-lodge.html',
    'html/cities/sweden/bjorkliden-mountain-lodge.html',
    'html/cities/sweden/stf-abisko-turiststation.html',
    'html/cities/scotland/rothiemurchus-lodge.html',
    'html/cities/scotland/ben-nevis-lodge.html',
    'html/cities/scotland/lews-castle-lodge.html',
    'html/cities/northeast-england/kielder-lodges.html',
    'html/cities/faroe-islands/mykines-puffin-lodge.html',
    'html/cities/svalbard/ny-alesund-polar-lodge.html'
  ];

  var byUrl = {};
  urls.forEach(function (url) {
    byUrl[url] = true;
  });

  function hotelUrl(hotel) {
    return String((hotel && (hotel.url || hotel.page_url)) || '').replace(/^\/+/, '');
  }

  function isEcolodge(hotel) {
    return Boolean(byUrl[hotelUrl(hotel)]);
  }

  function wantsEcolodges(query) {
    var value = String(query && query.ecolodges != null ? query.ecolodges : '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes' || value === 'on';
  }

  return {
    urls: urls,
    isEcolodge: isEcolodge,
    wantsEcolodges: wantsEcolodges
  };
});
