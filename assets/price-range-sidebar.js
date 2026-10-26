/**
 * price-range-sidebar.js
 *
 * Sidebar for city hotel listings. Guests narrow the list by nightly price,
 * amenities, stay features, and hotel group, and they choose the order the
 * remaining stays appear in. Tiers follow the currency already chosen on
 * the page.
 *
 * Ecolodge addresses stay aligned with assets/ecolodges.js.
 */
(function () {
  const RANGE_KEYS = ["cheap", "midrange", "luxury"];
  const EPSILON = 1e-6;
  const ECOLODGE_URLS = [
    "html/cities/sweden/abisko-mountain-lodge.html",
    "html/cities/sweden/bjorkliden-mountain-lodge.html",
    "html/cities/sweden/stf-abisko-turiststation.html",
    "html/cities/scotland/rothiemurchus-lodge.html",
    "html/cities/scotland/ben-nevis-lodge.html",
    "html/cities/scotland/lews-castle-lodge.html",
    "html/cities/northeast-england/kielder-lodges.html",
    "html/cities/faroe-islands/mykines-puffin-lodge.html",
    "html/cities/norway/ny-alesund-polar-lodge.html",
  ];
  const STAY_FACTORS = [
    { key: "waterfront", pattern: /\b(sea|beach|waterfront|riverside|river|lake|harbour|harbor|ocean|fjord|coast|coastal)\b/i },
    { key: "centre", pattern: /\b(city centre|city center|old town|downtown|in the cent(?:re|er)|heart of)\b/i },
    { key: "historic", pattern: /\b(historic|historical|heritage)\b/i },
    { key: "boutique", pattern: /\bboutique\b/i },
    { key: "ski", pattern: /\b(ski|skiing|slope|piste|gondola)\b/i },
    { key: "business", pattern: /\bbusiness\b/i },
    { key: "family", pattern: /\bfamily\b/i },
    { key: "eco", pattern: /\b(eco-friendly|ecolodge|sustainable|organic)\b/i },
    { key: "airport", pattern: /\bairport\b/i },
    { key: "mountain", pattern: /\bmountain\b/i },
    { key: "conference", pattern: /\bconference\b/i },
  ];
  const AMENITIES = [
    { key: "spa", pattern: /\bspa\b/i },
    { key: "pool", pattern: /\b(pool|swimming)\b/i },
    { key: "restaurant", pattern: /\b(restaurant|dining)\b/i },
    { key: "breakfast", pattern: /\bbreakfast\b/i },
    { key: "wellness", pattern: /\bwellness\b/i },
    { key: "gym", pattern: /\b(gym|fitness)\b/i },
    { key: "bar", pattern: /\bbar\b/i },
    { key: "sauna", pattern: /\bsauna\b/i },
    { key: "terrace", pattern: /\b(terrace|rooftop|balcony)\b/i },
    { key: "garden", pattern: /\bgardens?\b/i },
    { key: "golf", pattern: /\bgolf\b/i },
    { key: "view", pattern: /\bviews?\b/i },
  ];
  const SORT_OPTIONS = [
    { value: "", key: "recommended" },
    { value: "little", key: "little" },
    { value: "much", key: "much" },
    { value: "name-asc", key: "nameAsc" },
    { value: "name-desc", key: "nameDesc" },
  ];
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const DEFAULT_TRANSLATIONS = {
    en: {
      badge: "Stay filters",
      heading: "Choose your stay",
      description: "Select price ranges, amenities, and stay details. Other stays leave the list.",
      ariaLabel: "Select hotels by nightly rate",
      noteDefault: "Add a price range, an amenity, or a stay feature to narrow the list.",
      boundsLabel: "Nightly budget",
      minLabel: "From",
      maxLabel: "Up to",
      searchLabel: "Find a stay",
      searchPlaceholder: "Name or word",
      searchAria: "Find a stay by name or description",
      sortLabel: "Arrange stays",
      sortAria: "Choose how the stays are ordered",
      amenitiesHeading: "Amenities",
      amenitiesAria: "Filter by amenities",
      factorsHeading: "Stay features",
      factorsAria: "Filter by stay features",
      chainsHeading: "Hotel group",
      chainsAria: "Filter by hotel group",
      clearLabel: "Clear filters",
      countAll: "Showing all {total} stays",
      countSome: "{shown} of {total} stays",
      empty: "No stays match these choices.",
      factors: {
        spa: "Spa",
        pool: "Pool",
        waterfront: "Waterfront",
        centre: "City centre",
        historic: "Historic",
        restaurant: "Restaurant",
        boutique: "Boutique",
        ski: "Ski",
        business: "Business",
        breakfast: "Breakfast",
        family: "Family",
        eco: "Eco-friendly",
        airport: "Airport",
        wellness: "Wellness",
        mountain: "Mountain",
        conference: "Conference",
        ecolodge: "Ecolodge",
      },
      amenities: {
        spa: "Spa",
        pool: "Pool",
        restaurant: "Restaurant",
        breakfast: "Breakfast",
        wellness: "Wellness",
        gym: "Gym",
        bar: "Bar",
        sauna: "Sauna",
        terrace: "Terrace",
        garden: "Garden",
        golf: "Golf",
        view: "View",
      },
      sortOptions: {
        recommended: "Recommended",
        little: "Price: low to high",
        much: "Price: high to low",
        nameAsc: "Name: A to Z",
        nameDesc: "Name: Z to A",
      },
      noteUniform:
        "All listed rooms share a similar nightly rate. Compare amenities to find your fit.",
      noteDynamic:
        "Ranges update automatically from the prices shown for this city.",
      options: {
        cheap: "Cheap",
        midrange: "Midrange",
        luxury: "Luxury",
      },
      hints: {
        cheap: "Up to {amount} {unit}",
        midrange: "{min} - {max} {unit}",
        luxury: "Above {amount} {unit}",
        uniform: "{amount} {unit}",
      },
      orderDescription: "Choose the order the stays appear in.",
      combinationSeparator: " • ",
    },
    ru: {
      badge: "Фильтры",
      heading: "Выберите проживание",
      description: "Выберите ценовые диапазоны, удобства и особенности. Остальные варианты скрываются.",
      ariaLabel: "Выбрать отели по ночной цене",
      noteDefault: "Добавьте ценовой диапазон, удобство или особенность, чтобы сократить список.",
      boundsLabel: "Бюджет за ночь",
      minLabel: "От",
      maxLabel: "До",
      searchLabel: "Найти вариант",
      searchPlaceholder: "Название или слово",
      searchAria: "Найти вариант по названию или описанию",
      sortLabel: "Порядок",
      sortAria: "Выберите порядок вариантов",
      amenitiesHeading: "Удобства",
      amenitiesAria: "Фильтр по удобствам",
      factorsHeading: "Тип проживания",
      factorsAria: "Фильтр по типу проживания",
      chainsHeading: "Сеть отелей",
      chainsAria: "Фильтр по сети отелей",
      clearLabel: "Сбросить фильтры",
      countAll: "Показаны все варианты: {total}",
      countSome: "{shown} из {total}",
      empty: "Нет вариантов с такими условиями.",
      factors: {
        spa: "Спа",
        pool: "Бассейн",
        waterfront: "У воды",
        centre: "Центр города",
        historic: "Исторический",
        restaurant: "Ресторан",
        boutique: "Бутик",
        ski: "Лыжи",
        business: "Для бизнеса",
        breakfast: "Завтрак",
        family: "Для семьи",
        eco: "Эко",
        airport: "Аэропорт",
        wellness: "Велнес",
        mountain: "Горы",
        conference: "Конференц-зал",
        ecolodge: "Эко-лодж",
      },
      amenities: {
        spa: "Спа",
        pool: "Бассейн",
        restaurant: "Ресторан",
        breakfast: "Завтрак",
        wellness: "Велнес",
        gym: "Тренажёрный зал",
        bar: "Бар",
        sauna: "Сауна",
        terrace: "Терраса",
        garden: "Сад",
        golf: "Гольф",
        view: "Вид",
      },
      sortOptions: {
        recommended: "Рекомендуемые",
        little: "Цена: по возрастанию",
        much: "Цена: по убыванию",
        nameAsc: "Название: А–Я",
        nameDesc: "Название: Я–А",
      },
      noteUniform:
        "Все номера имеют схожую стоимость за ночь. Сравните удобства, чтобы выбрать свой вариант.",
      noteDynamic:
        "Диапазоны рассчитываются автоматически на основе цен для этого города.",
      options: {
        cheap: "Эконом",
        midrange: "Стандарт",
        luxury: "Премиум",
      },
      hints: {
        cheap: "До {amount} {unit}",
        midrange: "{min} — {max} {unit}",
        luxury: "Выше {amount} {unit}",
        uniform: "{amount} {unit}",
      },
      orderDescription: "Выберите, в каком порядке показывать варианты.",
    },
    sv: {
      badge: "Filter",
      heading: "Välj boende",
      description: "Välj prisintervall, bekvämligheter och boendefaktorer. Övriga boenden lämnar listan.",
      ariaLabel: "Välj hotell efter nattpris",
      noteDefault: "Lägg till ett prisintervall, en bekvämlighet eller en boendefaktor för att korta listan.",
      boundsLabel: "Nattbudget",
      minLabel: "Från",
      maxLabel: "Upp till",
      searchLabel: "Hitta ett boende",
      searchPlaceholder: "Namn eller ord",
      searchAria: "Hitta ett boende efter namn eller beskrivning",
      sortLabel: "Ordna boenden",
      sortAria: "Välj i vilken ordning boendena visas",
      amenitiesHeading: "Bekvämligheter",
      amenitiesAria: "Filtrera efter bekvämligheter",
      factorsHeading: "Boendefaktorer",
      factorsAria: "Filtrera efter boendefaktorer",
      chainsHeading: "Hotellkedja",
      chainsAria: "Filtrera efter hotellkedja",
      clearLabel: "Rensa filter",
      countAll: "Visar alla {total} boenden",
      countSome: "{shown} av {total} boenden",
      empty: "Inget boende matchar dessa val.",
      factors: {
        spa: "Spa",
        pool: "Pool",
        waterfront: "Vid vatten",
        centre: "Centrum",
        historic: "Historiskt",
        restaurant: "Restaurang",
        boutique: "Boutique",
        ski: "Skidor",
        business: "Affärer",
        breakfast: "Frukost",
        family: "Familj",
        eco: "Miljövänligt",
        airport: "Flygplats",
        wellness: "Wellness",
        mountain: "Berg",
        conference: "Konferens",
        ecolodge: "Ekolodge",
      },
      amenities: {
        spa: "Spa",
        pool: "Pool",
        restaurant: "Restaurang",
        breakfast: "Frukost",
        wellness: "Wellness",
        gym: "Gym",
        bar: "Bar",
        sauna: "Bastu",
        terrace: "Terrass",
        garden: "Trädgård",
        golf: "Golf",
        view: "Utsikt",
      },
      sortOptions: {
        recommended: "Rekommenderat",
        little: "Pris: lägst först",
        much: "Pris: högst först",
        nameAsc: "Namn: A till Ö",
        nameDesc: "Namn: Ö till A",
      },
      noteUniform:
        "Alla listade rum har ett liknande nattpris. Jämför bekvämligheter för att hitta rätt.",
      noteDynamic:
        "Intervallen uppdateras automatiskt utifrån priserna som visas för den här staden.",
      options: {
        cheap: "Budget",
        midrange: "Mellanklass",
        luxury: "Lyx",
      },
      hints: {
        cheap: "Upp till {amount} {unit}",
        midrange: "{min} - {max} {unit}",
        luxury: "Över {amount} {unit}",
        uniform: "{amount} {unit}",
      },
      orderDescription: "Välj i vilken ordning boendena visas.",
      combinationSeparator: " • ",
    },
    de: {
      badge: "Filter",
      heading: "Aufenthalt wählen",
      description:
        "Wählen Sie Preisspannen, Ausstattung und Aufenthaltsart. Andere Angebote verlassen die Liste.",
      ariaLabel: "Hotels nach Übernachtungspreis auswählen",
      noteDefault: "Wählen Sie eine Preisspanne, eine Ausstattung oder eine Aufenthaltsart, um die Liste einzugrenzen.",
      boundsLabel: "Nachtbudget",
      minLabel: "Von",
      maxLabel: "Bis",
      searchLabel: "Aufenthalt finden",
      searchPlaceholder: "Name oder Wort",
      searchAria: "Aufenthalt nach Name oder Beschreibung finden",
      sortLabel: "Reihenfolge",
      sortAria: "Wählen Sie die Reihenfolge der Aufenthalte",
      amenitiesHeading: "Ausstattung",
      amenitiesAria: "Nach Ausstattung filtern",
      factorsHeading: "Art des Aufenthalts",
      factorsAria: "Nach Art des Aufenthalts filtern",
      chainsHeading: "Hotelgruppe",
      chainsAria: "Nach Hotelgruppe filtern",
      clearLabel: "Filter löschen",
      countAll: "Alle {total} Aufenthalte",
      countSome: "{shown} von {total} Aufenthalten",
      empty: "Kein Aufenthalt passt zu dieser Auswahl.",
      factors: {
        spa: "Spa",
        pool: "Pool",
        waterfront: "Am Wasser",
        centre: "Stadtzentrum",
        historic: "Historisch",
        restaurant: "Restaurant",
        boutique: "Boutique",
        ski: "Ski",
        business: "Geschäftlich",
        breakfast: "Frühstück",
        family: "Familie",
        eco: "Umweltfreundlich",
        airport: "Flughafen",
        wellness: "Wellness",
        mountain: "Berg",
        conference: "Konferenz",
        ecolodge: "Ökolodge",
      },
      amenities: {
        spa: "Spa",
        pool: "Pool",
        restaurant: "Restaurant",
        breakfast: "Frühstück",
        wellness: "Wellness",
        gym: "Fitnessraum",
        bar: "Bar",
        sauna: "Sauna",
        terrace: "Terrasse",
        garden: "Garten",
        golf: "Golf",
        view: "Aussicht",
      },
      sortOptions: {
        recommended: "Empfohlen",
        little: "Preis: aufsteigend",
        much: "Preis: absteigend",
        nameAsc: "Name: A bis Z",
        nameDesc: "Name: Z bis A",
      },
      noteUniform:
        "Alle Zimmer haben einen ähnlichen Übernachtungspreis. Vergleichen Sie die Ausstattung, um das Richtige zu finden.",
      noteDynamic:
        "Die Bereiche aktualisieren sich automatisch anhand der Preise dieser Stadt.",
      options: {
        cheap: "Preiswert",
        midrange: "Mittelklasse",
        luxury: "Premium",
      },
      hints: {
        cheap: "Bis {amount} {unit}",
        midrange: "{min}–{max} {unit}",
        luxury: "Über {amount} {unit}",
        uniform: "{amount} {unit}",
      },
      orderDescription: "Wählen Sie die Reihenfolge der Aufenthalte.",
    },
  };

  const contexts = [];
  const customTranslations = {};
  let currentLanguage = "en";
  let languageHooksBound = false;

  function mergeDeep(target, source) {
    if (!source) {
      return target;
    }
    Object.keys(source).forEach(function (key) {
      var value = source[key];
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        if (
          !target[key] ||
          typeof target[key] !== "object" ||
          Array.isArray(target[key])
        ) {
          target[key] = {};
        }
        mergeDeep(target[key], value);
      } else {
        target[key] = value;
      }
    });
    return target;
  }

  function composeTranslation(lang) {
    var normalized = typeof lang === "string" ? lang.toLowerCase() : "en";
    var merged = mergeDeep({}, DEFAULT_TRANSLATIONS.en);
    if (customTranslations.en) {
      mergeDeep(merged, customTranslations.en);
    }
    if (normalized !== "en") {
      if (DEFAULT_TRANSLATIONS[normalized]) {
        mergeDeep(merged, DEFAULT_TRANSLATIONS[normalized]);
      }
      if (customTranslations[normalized]) {
        mergeDeep(merged, customTranslations[normalized]);
      }
    }
    return merged;
  }

  function formatEth(value) {
    if (!Number.isFinite(value)) return null;
    return value.toFixed(3).replace(/\.?0+$/, "");
  }

  function formatUsdt(value) {
    if (!Number.isFinite(value)) return null;
    return currencyFormatter.format(Math.round(value));
  }

  function getFormatter(unit) {
    if (unit === "ETH") {
      return formatEth;
    }
    if (unit === "USDT") {
      return formatUsdt;
    }
    return null;
  }

  const FALLBACK_RATES = {
    ETH: 0.00035,
    BTC: 0.0000058,
    USDT: 1,
    LTC: 0.0105,
    BCH: 0.00235,
    DOGE: 9.5,
    XRP: 1.9,
    XMR: 0.006,
    XNO: 0.95,
    DASH: 0.0335,
    VET: 28,
    UNI: 0.14,
    SOL: 0.0065,
    ADA: 1.3,
    TRN: 5.5,
    EUR: 0.92,
    USD: 1,
    GBP: 0.76,
    SEK: 10.5,
    NOK: 10.7,
    DKK: 6.86,
    ISK: 137,
  };

  function activeRates() {
    if (window.PaymentCurrencies && window.PaymentCurrencies.rates) {
      return window.PaymentCurrencies.rates;
    }
    return FALLBACK_RATES;
  }

  function isFiatCurrency(currency) {
    if (
      window.PaymentCurrencies &&
      typeof window.PaymentCurrencies.isFiat === "function"
    ) {
      return window.PaymentCurrencies.isFiat(currency);
    }
    return (
      currency === "EUR" ||
      currency === "USD" ||
      currency === "GBP" ||
      currency === "SEK" ||
      currency === "NOK" ||
      currency === "DKK" ||
      currency === "ISK"
    );
  }

  function decimalPlacesFromValue(value) {
    if (value === undefined || value === null) {
      return 2;
    }
    const stringValue = String(value);
    const dotIndex = stringValue.indexOf(".");
    if (dotIndex === -1) {
      return 0;
    }
    return stringValue.length - dotIndex - 1;
  }

  function clampDecimals(decimals) {
    if (!Number.isFinite(decimals)) {
      return 2;
    }
    return Math.max(0, Math.min(6, Math.round(decimals)));
  }

  function decimalsForCurrency(currency, rate) {
    if (
      window.PaymentCurrencies &&
      typeof window.PaymentCurrencies.decimalsFor === "function" &&
      window.PaymentCurrencies.find &&
      window.PaymentCurrencies.find(currency)
    ) {
      return window.PaymentCurrencies.decimalsFor(currency);
    }
    if (!Number.isFinite(rate)) {
      return 2;
    }
    if (isFiatCurrency(currency)) {
      return rate >= 50 ? 0 : 2;
    }
    if (rate < 0.001) {
      return 6;
    }
    if (rate < 0.1) {
      return 4;
    }
    return 2;
  }

  function quoteFromText(priceEl, currency) {
    const text = String((priceEl && priceEl.textContent) || "");
    if (!text) {
      return null;
    }
    if (currency && text.toUpperCase().indexOf(currency) === -1) {
      return null;
    }
    const nightly = text.match(
      /\(([-+]?\d[\d,]*(?:\.\d+)?)\s+[A-Za-z]{2,5}\s*\/\s*night\)/
    );
    const source = nightly ? nightly[1] : text;
    const match = String(source)
      .replace(/,/g, "")
      .match(/-?\d+(?:\.\d+)?/);
    if (!match) {
      return null;
    }
    const parsed = parseFloat(match[0]);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return { value: parsed, decimals: decimalPlacesFromValue(match[0]) };
  }

  function directQuote(dataset, key) {
    if (!dataset || dataset[key] === undefined || dataset[key] === "") {
      return null;
    }
    const value = parseFloat(dataset[key]);
    if (!Number.isFinite(value)) {
      return null;
    }
    return { value: value, decimals: decimalPlacesFromValue(dataset[key]) };
  }

  function quoteNightly(priceEl, currency) {
    if (!priceEl) {
      return null;
    }
    const code = String(currency || "ETH")
      .trim()
      .toUpperCase();
    const dataset = priceEl.dataset || {};
    const direct =
      code === "ETH"
        ? directQuote(dataset, "eth")
        : code === "BTC"
        ? directQuote(dataset, "btc")
        : code === "USDT"
        ? directQuote(dataset, "usdt")
        : null;
    if (direct) {
      return direct;
    }

    const usdtQuote = directQuote(dataset, "usdt");
    const rate = activeRates()[code];
    if (usdtQuote && Number.isFinite(rate)) {
      const decimals = decimalsForCurrency(code, rate);
      let perNight = usdtQuote.value * rate;
      if (isFiatCurrency(code)) {
        const factor = Math.pow(10, decimals);
        perNight = Math.round((perNight + Number.EPSILON) * factor) / factor;
      }
      return { value: perNight, decimals: decimals };
    }

    return quoteFromText(priceEl, code);
  }

  function formatterFor(currency, decimals) {
    const code = String(currency || "ETH")
      .trim()
      .toUpperCase();
    const places = clampDecimals(decimals);
    return function (value) {
      if (!Number.isFinite(value)) {
        return null;
      }
      if (code === "ETH") {
        return formatEth(value);
      }
      if (code === "USDT") {
        return formatUsdt(value);
      }
      return value.toFixed(places);
    };
  }

  function categoryFor(amount, thresholds) {
    if (!thresholds || !Number.isFinite(amount) || thresholds.spread < EPSILON) {
      return "midrange";
    }
    if (amount <= thresholds.cheap + EPSILON) {
      return "cheap";
    }
    if (amount > thresholds.luxury + EPSILON) {
      return "luxury";
    }
    return "midrange";
  }

  function selectedKeys(map) {
    if (!map) {
      return [];
    }
    return Object.keys(map).filter(function (key) {
      return map[key];
    });
  }

  function readBound(input) {
    if (!input) {
      return null;
    }
    const raw = String(input.value == null ? "" : input.value).trim();
    if (!raw) {
      return null;
    }
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : null;
  }

  function convertBound(value, from, to) {
    if (!Number.isFinite(value) || !from || from === to) {
      return value;
    }
    const rates = activeRates();
    const fromRate = rates[from];
    const toRate = rates[to];
    if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate === 0) {
      return value;
    }
    return (value / fromRate) * toRate;
  }

  function formatBound(value, currency) {
    if (!Number.isFinite(value)) {
      return "";
    }
    const rate = activeRates()[currency];
    const decimals = decimalsForCurrency(
      currency,
      Number.isFinite(rate) ? rate : 1
    );
    return value
      .toFixed(clampDecimals(decimals))
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");
  }

  function rescaleBounds(context) {
    const next = activeCurrency();
    const previous = context.boundCurrency;
    if (previous && previous !== next) {
      const min = readBound(context.minInput);
      const max = readBound(context.maxInput);
      if (min != null && context.minInput) {
        context.minInput.value = formatBound(
          convertBound(min, previous, next),
          next
        );
      }
      if (max != null && context.maxInput) {
        context.maxInput.value = formatBound(
          convertBound(max, previous, next),
          next
        );
      }
    }
    context.boundCurrency = next;
  }

  function cardBlob(card) {
    if (!card || typeof card.querySelector !== "function") {
      return "";
    }
    const parts = [];
    const heading = card.querySelector("h3");
    if (heading && heading.textContent) {
      parts.push(heading.textContent);
    }
    const paragraphs =
      typeof card.querySelectorAll === "function"
        ? card.querySelectorAll("p")
        : [];
    Array.prototype.forEach.call(paragraphs, function (paragraph) {
      if (paragraph && paragraph.textContent) {
        parts.push(paragraph.textContent);
      }
    });
    return parts.join(" ");
  }

  function bookHref(card) {
    if (!card || typeof card.querySelector !== "function") {
      return "";
    }
    const link = card.querySelector(".book-link") || card.querySelector("a");
    if (!link || typeof link.getAttribute !== "function") {
      return "";
    }
    return link.getAttribute("href") || "";
  }

  function isEcolodgeHref(href) {
    const value = String(href || "")
      .split("#")[0]
      .split("?")[0]
      .replace(/^\/+/, "");
    for (let i = 0; i < ECOLODGE_URLS.length; i += 1) {
      const url = ECOLODGE_URLS[i];
      if (
        value === url ||
        (value.length >= url.length && value.slice(-url.length) === url)
      ) {
        return true;
      }
    }
    return false;
  }

  function matchesCatalog(catalog, text) {
    const found = [];
    catalog.forEach(function (item) {
      if (item.pattern.test(text || "")) {
        found.push(item.key);
      }
    });
    return found;
  }

  function factorsForText(text, href) {
    const found = matchesCatalog(STAY_FACTORS, text);
    if (isEcolodgeHref(href)) {
      found.push("ecolodge");
    }
    return found;
  }

  function amenitiesForText(text) {
    return matchesCatalog(AMENITIES, text);
  }

  function keysFromAttribute(card, name) {
    return String((card && card.getAttribute && card.getAttribute(name)) || "")
      .split(/\s+/)
      .filter(Boolean);
  }

  function clearChildren(node) {
    if (!node || !node.children) {
      return;
    }
    while (node.children.length) {
      const child = node.children[0];
      node.children.splice(0, 1);
      if (child) {
        child.parentNode = null;
      }
    }
  }

  function fillSortOptions(select, strings) {
    if (!select || typeof document === "undefined") {
      return;
    }
    const current = select.value || "";
    clearChildren(select);
    SORT_OPTIONS.forEach(function (option) {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent =
        (strings && strings.sortOptions && strings.sortOptions[option.key]) ||
        option.key;
      select.appendChild(node);
    });
    select.value = current;
  }

  function chainName(card) {
    if (!card || typeof card.querySelector !== "function") {
      return "";
    }
    const node =
      card.querySelector(".hotel-chain") || card.querySelector(".hotel-group");
    if (!node || !node.textContent) {
      return "";
    }
    return String(node.textContent).replace(/\s+/g, " ").trim();
  }

  function annotateCard(card) {
    if (!card || typeof card.setAttribute !== "function") {
      return;
    }
    const blob = cardBlob(card);
    const amenities = amenitiesForText(blob);
    card.setAttribute(
      "data-stay-factors",
      factorsForText(blob, bookHref(card)).join(" ")
    );
    card.setAttribute("data-stay-amenities", amenities.join(" "));
    renderAmenityChips(card, amenities, composeTranslation(currentLanguage));
    const chain = chainName(card);
    if (chain) {
      card.setAttribute("data-stay-chain", chain);
    } else if (typeof card.removeAttribute === "function") {
      card.removeAttribute("data-stay-chain");
    }
  }

  function factorLabel(strings, key) {
    if (strings && strings.factors && strings.factors[key]) {
      return strings.factors[key];
    }
    return key;
  }

  function amenityLabel(strings, key) {
    if (strings && strings.amenities && strings.amenities[key]) {
      return strings.amenities[key];
    }
    return factorLabel(strings, key);
  }

  function renderAmenityChips(card, keys, strings) {
    if (!card || typeof card.querySelector !== "function" || typeof document === "undefined") {
      return;
    }
    let list = card.querySelector(".hotel-amenities");
    if (!keys.length) {
      if (list && list.parentNode && list.parentNode.children) {
        const index = list.parentNode.children.indexOf(list);
        if (index >= 0) {
          list.parentNode.children.splice(index, 1);
        }
        list.parentNode = null;
      }
      return;
    }
    if (!list) {
      list = document.createElement("ul");
      list.className = "hotel-amenities";
      const link = card.querySelector(".book-link");
      if (link && typeof card.insertBefore === "function") {
        card.insertBefore(list, link);
      } else if (typeof card.appendChild === "function") {
        card.appendChild(list);
      }
    }
    if (!list) {
      return;
    }
    if (strings && strings.amenitiesHeading) {
      list.setAttribute("aria-label", strings.amenitiesHeading);
    }
    clearChildren(list);
    keys.forEach(function (key) {
      const item = document.createElement("li");
      item.setAttribute("data-amenity-chip", key);
      item.textContent = amenityLabel(strings, key);
      list.appendChild(item);
    });
  }

  function relabelAmenityChips(cards, strings) {
    (cards || []).forEach(function (card) {
      if (!card || typeof card.querySelectorAll !== "function") {
        return;
      }
      const list = typeof card.querySelector === "function"
        ? card.querySelector(".hotel-amenities")
        : null;
      if (list && strings && strings.amenitiesHeading) {
        list.setAttribute("aria-label", strings.amenitiesHeading);
      }
      Array.prototype.forEach.call(
        card.querySelectorAll("[data-amenity-chip]"),
        function (chip) {
          const key = chip.getAttribute("data-amenity-chip");
          if (key) {
            chip.textContent = amenityLabel(strings, key);
          }
        }
      );
    });
  }

  function foldText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function cardTitle(card) {
    if (!card || typeof card.querySelector !== "function") {
      return "";
    }
    const heading = card.querySelector("h3");
    return heading && heading.textContent
      ? String(heading.textContent).replace(/\s+/g, " ").trim()
      : "";
  }

  function cardSearchText(card) {
    return foldText([cardTitle(card), cardBlob(card), chainName(card)].join(" "));
  }

  function setBlockHidden(block, hidden) {
    if (!block || !block.classList) {
      return;
    }
    block.classList.toggle("is-hidden", !!hidden);
  }

  function measureContext(context) {
    if (!context || !context.sidebar) {
      return;
    }
    rescaleBounds(context);
    const hotelCards = context.hotelCards || [];
    const currency = activeCurrency();
    const quotes = [];

    hotelCards.forEach(function (card) {
      if (card.classList) {
        card.classList.remove("is-highlighted", "is-dimmed");
      }
      if (typeof card.removeAttribute === "function") {
        card.removeAttribute("data-price-range");
      }
      const priceEl = card.querySelector ? card.querySelector(".price") : null;
      const quote = quoteNightly(priceEl, currency);
      if (quote) {
        quotes.push({ card: card, quote: quote });
      }
    });

    const thresholds = computeThresholds(
      quotes.map(function (entry) {
        return entry.quote.value;
      })
    );

    quotes.forEach(function (entry) {
      entry.card.setAttribute(
        "data-price-range",
        categoryFor(entry.quote.value, thresholds)
      );
    });

    if (!thresholds) {
      context.metrics = null;
    } else {
      let decimals = quotes.length ? quotes[0].quote.decimals : 2;
      quotes.forEach(function (entry) {
        if (Number.isFinite(entry.quote.decimals)) {
          decimals = Math.max(decimals, entry.quote.decimals);
        }
      });
      context.metrics = {
        primary: {
          unit: currency,
          thresholds: thresholds,
          formatter: formatterFor(currency, decimals),
        },
        secondary: null,
      };
    }

    setBlockHidden(
      context.sidebar.querySelector("[data-price-bounds]"),
      !context.metrics
    );

    renderSidebar(context, composeTranslation(currentLanguage));
    if (typeof context.applyFilter === "function") {
      context.applyFilter();
    }
  }

  function computeThresholds(values) {
    if (!values.length) return null;
    const sorted = values
      .slice()
      .sort(function (a, b) {
        return a - b;
      });
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const spread = max - min;
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null;
    }
    if (spread < EPSILON) {
      return { min, max, cheap: min, luxury: max, spread: 0 };
    }
    return {
      min,
      max,
      cheap: min + spread / 3,
      luxury: min + (2 * spread) / 3,
      spread,
    };
  }

  function formatTemplate(template, values) {
    if (!template) {
      return "";
    }
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        var value = values[key];
        if (value !== undefined && value !== null) {
          return value;
        }
      }
      return "";
    });
  }

  function buildHintText(thresholds, type, unit, formatter, hintTemplates) {
    if (!thresholds) {
      return "";
    }
    const templates = hintTemplates || {};
    const formatValue =
      typeof formatter === "function"
        ? function (value) {
            if (!Number.isFinite(value)) {
              return null;
            }
            return formatter(value);
          }
        : function (value) {
            if (!Number.isFinite(value)) {
              return null;
            }
            return String(value);
          };

    if (thresholds.spread < EPSILON) {
      const uniformValue = formatValue(thresholds.min);
      if (uniformValue == null) {
        return "";
      }
      const template = templates.uniform || templates[type];
      if (!template) {
        return uniformValue + " " + unit;
      }
      return formatTemplate(template, {
        amount: uniformValue,
        unit: unit,
      });
    }

    if (type === "cheap") {
      const upTo = formatValue(thresholds.cheap);
      if (upTo == null) {
        return "";
      }
      const template = templates.cheap;
      if (!template) {
        return "Up to " + upTo + " " + unit;
      }
      return formatTemplate(template, {
        amount: upTo,
        unit: unit,
      });
    }

    if (type === "midrange") {
      const low = formatValue(thresholds.cheap);
      const high = formatValue(thresholds.luxury);
      if (low == null || high == null) {
        return "";
      }
      const template = templates.midrange;
      if (!template) {
        return low + " - " + high + " " + unit;
      }
      return formatTemplate(template, {
        min: low,
        max: high,
        unit: unit,
      });
    }

    if (type === "luxury") {
      const over = formatValue(thresholds.luxury);
      if (over == null) {
        return "";
      }
      const template = templates.luxury;
      if (!template) {
        return "Above " + over + " " + unit;
      }
      return formatTemplate(template, {
        amount: over,
        unit: unit,
      });
    }

    return "";
  }

  function applyStaticTranslations(sidebar, strings) {
    if (!sidebar || !strings) {
      return;
    }

    const badge = sidebar.querySelector(".price-range-tag");
    if (badge && strings.badge) {
      badge.textContent = strings.badge;
    }

    const heading = sidebar.querySelector("h3");
    if (heading && strings.heading) {
      heading.textContent = strings.heading;
    }

    const desc = sidebar.querySelector("[data-sidebar-desc]");
    if (desc && strings.description) {
      desc.textContent = strings.description;
    }

    const optionsGroup = sidebar.querySelector(".price-range-options");
    if (optionsGroup && strings.ariaLabel) {
      optionsGroup.setAttribute("aria-label", strings.ariaLabel);
    }

    RANGE_KEYS.forEach(function (key) {
      const button = sidebar.querySelector(
        '.price-range-option[data-filter="' + key + '"]'
      );
      if (!button) {
        return;
      }
      const label = button.querySelector(".range-label");
      if (label && strings.options && strings.options[key]) {
        label.textContent = strings.options[key];
      }
    });

    const orderDesc = sidebar.querySelector("[data-order-desc]");
    if (orderDesc && strings.orderDescription) {
      orderDesc.textContent = strings.orderDescription;
    }

    const sortLabel = sidebar.querySelector("[data-sort-label]");
    if (sortLabel && strings.sortLabel) {
      sortLabel.textContent = strings.sortLabel;
    }
    const sortSelect = sidebar.querySelector("[data-stay-sort]");
    if (sortSelect) {
      if (strings.sortAria) {
        sortSelect.setAttribute("aria-label", strings.sortAria);
      }
      fillSortOptions(sortSelect, strings);
    }
    const searchLabel = sidebar.querySelector("[data-search-label]");
    if (searchLabel && strings.searchLabel) {
      searchLabel.textContent = strings.searchLabel;
    }
    const searchInput = sidebar.querySelector("[data-stay-search]");
    if (searchInput) {
      if (strings.searchPlaceholder) {
        searchInput.setAttribute("placeholder", strings.searchPlaceholder);
      }
      if (strings.searchAria) {
        searchInput.setAttribute("aria-label", strings.searchAria);
      }
    }
    const amenitiesHeading = sidebar.querySelector("[data-amenities-heading]");
    if (amenitiesHeading && strings.amenitiesHeading) {
      amenitiesHeading.textContent = strings.amenitiesHeading;
    }
    const amenitiesGroup = sidebar.querySelector("[data-stay-amenities]");
    if (amenitiesGroup && strings.amenitiesAria) {
      amenitiesGroup.setAttribute("aria-label", strings.amenitiesAria);
    }

    const boundsLabel = sidebar.querySelector("[data-bounds-label]");
    if (boundsLabel && strings.boundsLabel) {
      boundsLabel.textContent = strings.boundsLabel;
    }
    const minLabel = sidebar.querySelector("[data-min-label]");
    if (minLabel && strings.minLabel) {
      minLabel.textContent = strings.minLabel;
    }
    const maxLabel = sidebar.querySelector("[data-max-label]");
    if (maxLabel && strings.maxLabel) {
      maxLabel.textContent = strings.maxLabel;
    }
    const factorsHeading = sidebar.querySelector("[data-factors-heading]");
    if (factorsHeading && strings.factorsHeading) {
      factorsHeading.textContent = strings.factorsHeading;
    }
    const factorsGroup = sidebar.querySelector("[data-stay-factors]");
    if (factorsGroup && strings.factorsAria) {
      factorsGroup.setAttribute("aria-label", strings.factorsAria);
    }
    const chainsHeading = sidebar.querySelector("[data-chains-heading]");
    if (chainsHeading && strings.chainsHeading) {
      chainsHeading.textContent = strings.chainsHeading;
    }
    const chainsGroup = sidebar.querySelector("[data-stay-chains]");
    if (chainsGroup && strings.chainsAria) {
      chainsGroup.setAttribute("aria-label", strings.chainsAria);
    }
    const clearButton = sidebar.querySelector("[data-stay-clear]");
    if (clearButton && strings.clearLabel) {
      clearButton.textContent = strings.clearLabel;
    }
    Array.prototype.forEach.call(
      sidebar.querySelectorAll("[data-factor]"),
      function (button) {
        const label = button.querySelector(".range-label");
        const key = button.getAttribute("data-factor");
        if (label && key) {
          label.textContent = factorLabel(strings, key);
        }
      }
    );
    Array.prototype.forEach.call(
      sidebar.querySelectorAll("[data-amenity]"),
      function (button) {
        const label = button.querySelector(".range-label");
        const key = button.getAttribute("data-amenity");
        if (label && key) {
          label.textContent = amenityLabel(strings, key);
        }
      }
    );

    const note = sidebar.querySelector("[data-range-note]");
    if (note && strings.noteDefault) {
      note.textContent = strings.noteDefault;
    }
  }

  function updateHintValues(context, strings) {
    const sidebar = context && context.sidebar;
    if (!sidebar) {
      return;
    }

    const metrics = context.metrics;
    const separator =
      (strings && strings.combinationSeparator) || " • ";
    const note = sidebar.querySelector("[data-range-note]");

    if (!metrics || !metrics.primary) {
      RANGE_KEYS.forEach(function (key) {
        const hintEl = sidebar.querySelector(
          '[data-range-hint="' + key + '"]'
        );
        if (hintEl) {
          hintEl.textContent = "";
        }
      });
      if (note && strings && strings.noteDefault) {
        note.textContent = strings.noteDefault;
      }
      return;
    }

    const primary = metrics.primary;
    const secondary = metrics.secondary || null;

    RANGE_KEYS.forEach(function (key) {
      const hintEl = sidebar.querySelector(
        '[data-range-hint="' + key + '"]'
      );
      if (!hintEl) {
        return;
      }
      const segments = [];
      const primaryText = buildHintText(
        primary.thresholds,
        key,
        primary.unit,
        primary.formatter,
        strings && strings.hints
      );
      if (primaryText) {
        segments.push(primaryText);
      }
      if (secondary) {
        const secondaryText = buildHintText(
          secondary.thresholds,
          key,
          secondary.unit,
          secondary.formatter,
          strings && strings.hints
        );
        if (secondaryText) {
          segments.push(secondaryText);
        }
      }
      hintEl.textContent = segments.join(separator);
    });

    if (note) {
      if (primary.thresholds && primary.thresholds.spread < EPSILON) {
        note.textContent =
          (strings && strings.noteUniform) ||
          (strings && strings.noteDefault) ||
          "";
      } else {
        note.textContent =
          (strings && strings.noteDynamic) ||
          (strings && strings.noteDefault) ||
          "";
      }
    }
  }

  function renderSidebar(context, strings) {
    if (!context || !context.sidebar) {
      return;
    }
    applyStaticTranslations(context.sidebar, strings);
    updateHintValues(context, strings);
  }

  function refreshSidebars() {
    const strings = composeTranslation(currentLanguage);
    contexts.forEach(function (context) {
      renderSidebar(context, strings);
      relabelAmenityChips(context.hotelCards, strings);
      if (typeof context.applyFilter === "function") {
        context.applyFilter();
      }
    });
  }

  function setLanguage(lang) {
    var normalized = typeof lang === "string" ? lang.toLowerCase() : "en";
    if (
      !DEFAULT_TRANSLATIONS[normalized] &&
      !customTranslations[normalized]
    ) {
      normalized = "en";
    }
    if (normalized !== currentLanguage) {
      currentLanguage = normalized;
    }
    refreshSidebars();
    return currentLanguage;
  }

  function registerTranslations(map) {
    if (!map) {
      return;
    }
    Object.keys(map).forEach(function (langKey) {
      const normalized = langKey.toLowerCase();
      if (!customTranslations[normalized]) {
        customTranslations[normalized] = {};
      }
      mergeDeep(customTranslations[normalized], map[langKey]);
    });
    refreshSidebars();
  }

  function detectLanguage() {
    const select = document.getElementById("lang-select");
    if (select && select.value) {
      return select.value.toLowerCase();
    }
    if (document.documentElement && document.documentElement.lang) {
      return document.documentElement.lang.toLowerCase();
    }
    return currentLanguage || "en";
  }

  function bindLanguageHooks() {
    if (languageHooksBound) {
      return;
    }
    languageHooksBound = true;

    const languageEventName =
      (window.LanguagePreferences &&
        window.LanguagePreferences.CHANGE_EVENT) ||
      "preferredLanguageChange";

    document.addEventListener(languageEventName, function (event) {
      const nextLang =
        (event && event.detail && event.detail.lang) || detectLanguage();
      setLanguage(nextLang);
    });

    const select = document.getElementById("lang-select");
    if (select) {
      select.addEventListener("change", function () {
        setLanguage(this.value || "en");
      });
    }
  }

  function nightlyAmount(card, currency) {
    if (!card || typeof card.querySelector !== "function") {
      return null;
    }
    const priceEl = card.querySelector(".price");
    if (!priceEl) {
      return null;
    }
    const dataset = priceEl.dataset || {};
    const key = String(currency || "ETH").toLowerCase();
    const raw = dataset[key];
    if (raw !== undefined && raw !== null && raw !== "") {
      const direct = parseFloat(raw);
      if (Number.isFinite(direct)) {
        return direct;
      }
    }
    const text = String(priceEl.textContent || "").replace(/,/g, "");
    const match = text.match(/-?\d+(?:\.\d+)?/);
    if (!match) {
      return null;
    }
    const parsed = parseFloat(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function orderStayCards(cards, direction, currency) {
    const list = Array.prototype.slice.call(cards || []);
    const decorated = list.map(function (card, index) {
      return {
        card: card,
        index: index,
        amount: nightlyAmount(card, currency),
        title: cardTitle(card),
      };
    });
    const normalized =
      direction === "little" ||
      direction === "much" ||
      direction === "name-asc" ||
      direction === "name-desc"
        ? direction
        : null;
    decorated.sort(function (a, b) {
      if (!normalized) {
        return a.index - b.index;
      }
      if (normalized === "name-asc" || normalized === "name-desc") {
        const aMissing = !a.title;
        const bMissing = !b.title;
        if (aMissing || bMissing) {
          if (aMissing && bMissing) {
            return a.index - b.index;
          }
          return aMissing ? 1 : -1;
        }
        const compared = a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
          numeric: true,
        });
        if (compared === 0) {
          return a.index - b.index;
        }
        return normalized === "name-asc" ? compared : -compared;
      }
      const aMissing = !Number.isFinite(a.amount);
      const bMissing = !Number.isFinite(b.amount);
      if (aMissing || bMissing) {
        if (aMissing && bMissing) {
          return a.index - b.index;
        }
        return aMissing ? 1 : -1;
      }
      if (a.amount === b.amount) {
        return a.index - b.index;
      }
      return normalized === "little" ? a.amount - b.amount : b.amount - a.amount;
    });
    return decorated.map(function (item) {
      return item.card;
    });
  }

  function activeCurrency() {
    const currencySelect = document.getElementById("currency");
    if (currencySelect && currencySelect.value) {
      return String(currencySelect.value).trim().toUpperCase();
    }
    if (
      window.PaymentCurrencies &&
      typeof window.PaymentCurrencies.readPreference === "function"
    ) {
      const saved = window.PaymentCurrencies.readPreference();
      if (saved) {
        return saved;
      }
    }
    return "ETH";
  }

  function wireStaySort(context, sidebar, hotelCards) {
    const select = sidebar.querySelector("[data-stay-sort]");
    context.sortSelect = select;
    if (!select || !hotelCards.length) {
      return;
    }

    const hotelList = hotelCards[0].parentNode;

    function applyOrder() {
      if (!hotelList) {
        return;
      }
      const ordered = orderStayCards(
        hotelCards,
        select.value || null,
        activeCurrency()
      );
      ordered.forEach(function (card) {
        hotelList.appendChild(card);
      });
    }

    context.applyOrder = applyOrder;
    select.addEventListener("change", applyOrder);
  }

  let currencyHookBound = false;

  function refreshCurrencyRanges() {
    contexts.forEach(function (context) {
      measureContext(context);
      if (typeof context.applyOrder === "function") {
        context.applyOrder();
      }
    });
  }

  function bindCurrencyHook() {
    if (currencyHookBound) {
      return;
    }
    currencyHookBound = true;
    document.addEventListener("change", function (event) {
      const target = event.target;
      if (!target || target.id !== "currency") {
        return;
      }
      refreshCurrencyRanges();
    });

    if (
      typeof window.updatePrices === "function" &&
      !window.updatePrices.__priceRangeWrapped
    ) {
      const original = window.updatePrices;
      const wrapped = function () {
        const result = original.apply(this, arguments);
        refreshCurrencyRanges();
        return result;
      };
      wrapped.__priceRangeWrapped = true;
      window.updatePrices = wrapped;
    }
  }

  function createSidebar(index) {
    const strings = DEFAULT_TRANSLATIONS.en;
    const aside = document.createElement("aside");
    const headingId = "price-range-heading-" + index;
    aside.className = "price-range-sidebar";
    aside.setAttribute("aria-labelledby", headingId);

    const badge = document.createElement("span");
    badge.className = "price-range-tag";
    badge.textContent = strings.badge;
    aside.appendChild(badge);

    const heading = document.createElement("h3");
    heading.id = headingId;
    heading.textContent = strings.heading;
    aside.appendChild(heading);

    const desc = document.createElement("p");
    desc.className = "price-range-desc";
    desc.setAttribute("data-sidebar-desc", "");
    desc.textContent = strings.description;
    aside.appendChild(desc);

    const sortWrap = document.createElement("label");
    sortWrap.className = "stay-sort";
    const sortCaption = document.createElement("span");
    sortCaption.className = "stay-filter-heading";
    sortCaption.setAttribute("data-sort-label", "");
    sortCaption.textContent = strings.sortLabel || "Arrange stays";
    const sortSelect = document.createElement("select");
    sortSelect.setAttribute("data-stay-sort", "");
    sortSelect.setAttribute(
      "aria-label",
      strings.sortAria || "Choose how the stays are ordered"
    );
    sortWrap.appendChild(sortCaption);
    sortWrap.appendChild(sortSelect);
    aside.appendChild(sortWrap);
    fillSortOptions(sortSelect, strings);

    const searchWrap = document.createElement("label");
    searchWrap.className = "stay-search";
    const searchCaption = document.createElement("span");
    searchCaption.className = "stay-filter-heading";
    searchCaption.setAttribute("data-search-label", "");
    searchCaption.textContent = strings.searchLabel || "Find a stay";
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.setAttribute("data-stay-search", "");
    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute(
      "placeholder",
      strings.searchPlaceholder || "Name or word"
    );
    searchInput.setAttribute(
      "aria-label",
      strings.searchAria || "Find a stay by name or description"
    );
    searchWrap.appendChild(searchCaption);
    searchWrap.appendChild(searchInput);
    aside.appendChild(searchWrap);

    const amenityBlock = document.createElement("div");
    amenityBlock.className = "stay-filter-block is-hidden";
    amenityBlock.setAttribute("data-amenities-block", "");
    const amenityHeading = document.createElement("p");
    amenityHeading.className = "stay-filter-heading";
    amenityHeading.setAttribute("data-amenities-heading", "");
    amenityHeading.textContent = strings.amenitiesHeading || "Amenities";
    const amenityHost = document.createElement("div");
    amenityHost.className = "stay-factor-options";
    amenityHost.setAttribute("data-stay-amenities", "");
    amenityHost.setAttribute("role", "group");
    amenityHost.setAttribute(
      "aria-label",
      strings.amenitiesAria || "Filter by amenities"
    );
    amenityBlock.appendChild(amenityHeading);
    amenityBlock.appendChild(amenityHost);
    aside.appendChild(amenityBlock);

    const factorBlock = document.createElement("div");
    factorBlock.className = "stay-filter-block is-hidden";
    factorBlock.setAttribute("data-factors-block", "");
    const factorHeading = document.createElement("p");
    factorHeading.className = "stay-filter-heading";
    factorHeading.setAttribute("data-factors-heading", "");
    factorHeading.textContent = strings.factorsHeading || "Stay features";
    const factorHost = document.createElement("div");
    factorHost.className = "stay-factor-options";
    factorHost.setAttribute("data-stay-factors", "");
    factorHost.setAttribute("role", "group");
    factorHost.setAttribute("aria-label", strings.factorsAria || "Filter by stay features");
    factorBlock.appendChild(factorHeading);
    factorBlock.appendChild(factorHost);
    aside.appendChild(factorBlock);

    const options = document.createElement("div");
    options.className = "price-range-options";
    options.setAttribute("role", "group");
    options.setAttribute(
      "aria-label",
      strings.ariaLabel || "Highlight hotels by nightly rate"
    );

    RANGE_KEYS.forEach(function (key) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "price-range-option";
      button.dataset.filter = key;

      const label = document.createElement("span");
      label.className = "range-label";
      label.textContent =
        (strings.options && strings.options[key]) || key;

      const value = document.createElement("span");
      value.className = "range-value";
      value.setAttribute("data-range-hint", key);
      value.textContent = "";

      button.appendChild(label);
      button.appendChild(value);
      options.appendChild(button);
    });

    aside.appendChild(options);

    const bounds = document.createElement("div");
    bounds.className = "price-bounds";
    bounds.setAttribute("data-price-bounds", "");
    const boundsLabel = document.createElement("p");
    boundsLabel.className = "price-range-desc";
    boundsLabel.setAttribute("data-bounds-label", "");
    boundsLabel.textContent = strings.boundsLabel || "Nightly budget";
    const boundsRow = document.createElement("div");
    boundsRow.className = "price-bounds__row";
    [
      ["min", strings.minLabel || "From", "data-price-min", "data-min-label"],
      ["max", strings.maxLabel || "Up to", "data-price-max", "data-max-label"],
    ].forEach(function (field) {
      const label = document.createElement("label");
      label.className = "price-bound";
      const caption = document.createElement("span");
      caption.className = "range-label";
      caption.setAttribute(field[3], "");
      caption.textContent = field[1];
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "any";
      input.setAttribute("inputmode", "decimal");
      input.setAttribute("autocomplete", "off");
      input.setAttribute(field[2], "");
      label.appendChild(caption);
      label.appendChild(input);
      boundsRow.appendChild(label);
    });
    const unit = document.createElement("p");
    unit.className = "price-range-footnote";
    unit.setAttribute("data-price-unit", "");
    unit.textContent = "ETH";
    bounds.appendChild(boundsLabel);
    bounds.appendChild(boundsRow);
    bounds.appendChild(unit);
    aside.appendChild(bounds);

    const chainBlock = document.createElement("div");
    chainBlock.className = "stay-filter-block is-hidden";
    chainBlock.setAttribute("data-chains-block", "");
    const chainHeading = document.createElement("p");
    chainHeading.className = "stay-filter-heading";
    chainHeading.setAttribute("data-chains-heading", "");
    chainHeading.textContent = strings.chainsHeading || "Hotel group";
    const chainHost = document.createElement("div");
    chainHost.className = "stay-factor-options";
    chainHost.setAttribute("data-stay-chains", "");
    chainHost.setAttribute("role", "group");
    chainHost.setAttribute("aria-label", strings.chainsAria || "Filter by hotel group");
    chainBlock.appendChild(chainHeading);
    chainBlock.appendChild(chainHost);
    aside.appendChild(chainBlock);

    const note = document.createElement("p");
    note.className = "price-range-footnote";
    note.setAttribute("data-range-note", "");
    note.textContent = strings.noteDefault;
    aside.appendChild(note);

    const count = document.createElement("p");
    count.className = "stay-filter-count";
    count.setAttribute("data-stay-count", "");
    count.textContent = "";
    aside.appendChild(count);

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "stay-filter-clear";
    clearButton.setAttribute("data-stay-clear", "");
    clearButton.textContent = strings.clearLabel || "Clear filters";
    aside.appendChild(clearButton);

    return aside;
  }

  function findStayList(container) {
    if (!container || typeof container.querySelector !== "function") {
      return null;
    }
    return (
      container.querySelector(".hotel-list") ||
      container.querySelector(".hotel-grid")
    );
  }

  function ensureLayout(container, index) {
    const hotelList = findStayList(container);
    if (!hotelList) {
      return null;
    }

    let layout = container.querySelector(".booking-layout");
    if (!layout) {
      layout = document.createElement("div");
      layout.className = "booking-layout";
      hotelList.parentNode.insertBefore(layout, hotelList);
    }

    let sidebar = layout.querySelector(".price-range-sidebar");
    if (!sidebar) {
      sidebar = createSidebar(index + 1);
      layout.insertBefore(sidebar, layout.firstChild);
    }

    let content = layout.querySelector(".booking-content");
    if (!content) {
      content = document.createElement("div");
      content.className = "booking-content";
      layout.appendChild(content);
    }

    if (hotelList.parentNode !== content) {
      content.appendChild(hotelList);
    }

    return sidebar;
  }

  function buildStayControls(context, cards) {
    const sidebar = context.sidebar;
    const strings = composeTranslation(currentLanguage);
    const factorHost = sidebar.querySelector("[data-stay-factors]");
    const chainHost = sidebar.querySelector("[data-stay-chains]");
    const amenityHost = sidebar.querySelector("[data-stay-amenities]");
    const factorBlock = sidebar.querySelector("[data-factors-block]");
    const chainBlock = sidebar.querySelector("[data-chains-block]");
    const amenityBlock = sidebar.querySelector("[data-amenities-block]");
    if (!factorHost || !chainHost || !amenityHost) {
      return;
    }

    const present = {};
    const amenitiesPresent = {};
    const chains = {};
    let labeled = 0;
    cards.forEach(function (card) {
      annotateCard(card);
      keysFromAttribute(card, "data-stay-factors").forEach(function (key) {
        present[key] = true;
      });
      keysFromAttribute(card, "data-stay-amenities").forEach(function (key) {
        amenitiesPresent[key] = true;
      });
      const chain = card.getAttribute("data-stay-chain") || "";
      if (chain) {
        chains[chain] = true;
        labeled += 1;
      }
    });

    AMENITIES.forEach(function (amenity) {
      if (!amenitiesPresent[amenity.key]) {
        return;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stay-factor-option";
      button.setAttribute("data-amenity", amenity.key);
      button.setAttribute("aria-pressed", "false");
      const label = document.createElement("span");
      label.className = "range-label";
      label.textContent = amenityLabel(strings, amenity.key);
      button.appendChild(label);
      amenityHost.appendChild(button);
    });
    setBlockHidden(amenityBlock, !amenityHost.querySelector("[data-amenity]"));

    const factorKeys = STAY_FACTORS.map(function (factor) {
      return factor.key;
    }).concat(["ecolodge"]);
    factorKeys.forEach(function (key) {
      if (!present[key]) {
        return;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stay-factor-option";
      button.setAttribute("data-factor", key);
      button.setAttribute("aria-pressed", "false");
      const label = document.createElement("span");
      label.className = "range-label";
      label.textContent = factorLabel(strings, key);
      button.appendChild(label);
      factorHost.appendChild(button);
    });
    setBlockHidden(factorBlock, !factorHost.querySelector("[data-factor]"));

    const names = Object.keys(chains).sort(function (a, b) {
      return a.localeCompare(b);
    });
    const showChains =
      names.length >= 2 || (names.length === 1 && labeled < cards.length);
    if (showChains) {
      names.forEach(function (name) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "stay-factor-option";
        button.setAttribute("data-chain", name);
        button.setAttribute("aria-pressed", "false");
        const label = document.createElement("span");
        label.className = "range-label";
        label.textContent = name;
        button.appendChild(label);
        chainHost.appendChild(button);
      });
    }
    setBlockHidden(chainBlock, !showChains);
  }

  function initSidebar(context, container) {
    const sidebar = context.sidebar;
    const list = findStayList(container);
    const hotelCards = list
      ? Array.prototype.slice.call(list.querySelectorAll(".hotel-card"))
      : [];
    context.hotelCards = hotelCards;
    context.stayList = list;
    context.selectedRanges = {};
    context.selectedFactors = {};
    context.selectedAmenities = {};
    context.selectedChains = {};
    context.minInput = sidebar.querySelector("[data-price-min]");
    context.maxInput = sidebar.querySelector("[data-price-max]");
    context.searchInput = sidebar.querySelector("[data-stay-search]");
    if (list && list.parentNode && !context.emptyNote) {
      const note = document.createElement("p");
      note.className = "stay-filter-empty";
      note.setAttribute("data-stay-empty", "");
      list.parentNode.insertBefore(note, list);
      context.emptyNote = note;
    }
    buildStayControls(context, hotelCards);
    wireStaySort(context, sidebar, hotelCards);

    const rangeButtons = Array.prototype.slice.call(
      sidebar.querySelectorAll('.price-range-option[data-filter]')
    );
    const factorButtons = Array.prototype.slice.call(
      sidebar.querySelectorAll("[data-factor]")
    );
    const amenityButtons = Array.prototype.slice.call(
      sidebar.querySelectorAll("[data-amenity]")
    );
    const chainButtons = Array.prototype.slice.call(
      sidebar.querySelectorAll("[data-chain]")
    );

    function toggleMap(map, key) {
      if (!key) {
        return;
      }
      if (map[key]) {
        delete map[key];
      } else {
        map[key] = true;
      }
    }

    function applyFilter() {
      const strings = composeTranslation(currentLanguage);
      const ranges = selectedKeys(context.selectedRanges);
      const factors = selectedKeys(context.selectedFactors);
      const amenities = selectedKeys(context.selectedAmenities);
      const chains = selectedKeys(context.selectedChains);
      const query = foldText(context.searchInput && context.searchInput.value);
      let low = readBound(context.minInput);
      let high = readBound(context.maxInput);
      if (low != null && high != null && low > high) {
        const swap = low;
        low = high;
        high = swap;
      }
      const currency = activeCurrency();
      const filtering =
        ranges.length > 0 ||
        factors.length > 0 ||
        amenities.length > 0 ||
        chains.length > 0 ||
        !!query ||
        low != null ||
        high != null;
      let shown = 0;

      hotelCards.forEach(function (card) {
        const range = card.getAttribute("data-price-range");
        const rangeOk = !ranges.length || ranges.indexOf(range) !== -1;
        let boundsOk = true;
        if (low != null || high != null) {
          const quote = quoteNightly(
            typeof card.querySelector === "function"
              ? card.querySelector(".price")
              : null,
            currency
          );
          const amount = quote ? quote.value : null;
          if (!Number.isFinite(amount)) {
            boundsOk = false;
          } else {
            if (low != null && amount + EPSILON < low) {
              boundsOk = false;
            }
            if (high != null && amount - EPSILON > high) {
              boundsOk = false;
            }
          }
        }
        const cardFactors = keysFromAttribute(card, "data-stay-factors");
        const factorsOk = factors.every(function (key) {
          return cardFactors.indexOf(key) !== -1;
        });
        const cardAmenities = keysFromAttribute(card, "data-stay-amenities");
        const amenitiesOk = amenities.every(function (key) {
          return cardAmenities.indexOf(key) !== -1;
        });
        const chain = card.getAttribute("data-stay-chain") || "";
        const chainOk = !chains.length || chains.indexOf(chain) !== -1;
        const searchOk = !query || cardSearchText(card).indexOf(query) !== -1;
        const matches =
          rangeOk && boundsOk && factorsOk && amenitiesOk && chainOk && searchOk;
        if (matches) {
          shown += 1;
        }
        if (card.classList) {
          card.classList.toggle("is-filtered-out", !matches);
          card.classList.toggle(
            "is-highlighted",
            !!(ranges.length && matches && rangeOk)
          );
          card.classList.toggle("is-dimmed", false);
        }
      });

      rangeButtons.forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          context.selectedRanges[button.dataset.filter] ? "true" : "false"
        );
      });
      factorButtons.forEach(function (button) {
        const key = button.getAttribute("data-factor");
        button.setAttribute(
          "aria-pressed",
          context.selectedFactors[key] ? "true" : "false"
        );
      });
      amenityButtons.forEach(function (button) {
        const key = button.getAttribute("data-amenity");
        button.setAttribute(
          "aria-pressed",
          context.selectedAmenities[key] ? "true" : "false"
        );
      });
      chainButtons.forEach(function (button) {
        const key = button.getAttribute("data-chain");
        button.setAttribute(
          "aria-pressed",
          context.selectedChains[key] ? "true" : "false"
        );
      });

      const count = sidebar.querySelector("[data-stay-count]");
      if (count) {
        count.textContent = formatTemplate(
          (filtering ? strings.countSome : strings.countAll) || "",
          { shown: shown, total: hotelCards.length }
        );
      }
      if (context.emptyNote && context.emptyNote.classList) {
        context.emptyNote.textContent = strings.empty || "";
        context.emptyNote.classList.toggle("is-shown", filtering && shown === 0);
      }
      const clearButton = sidebar.querySelector("[data-stay-clear]");
      if (clearButton) {
        clearButton.disabled = !filtering;
      }
      const unit = sidebar.querySelector("[data-price-unit]");
      if (unit) {
        unit.textContent = currency;
      }
    }

    context.applyFilter = applyFilter;

    rangeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        toggleMap(context.selectedRanges, button.dataset.filter);
        applyFilter();
      });
    });
    factorButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        toggleMap(context.selectedFactors, button.getAttribute("data-factor"));
        applyFilter();
      });
    });
    amenityButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        toggleMap(context.selectedAmenities, button.getAttribute("data-amenity"));
        applyFilter();
      });
    });
    chainButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        toggleMap(context.selectedChains, button.getAttribute("data-chain"));
        applyFilter();
      });
    });
    [context.minInput, context.maxInput, context.searchInput].forEach(function (input) {
      if (!input || typeof input.addEventListener !== "function") {
        return;
      }
      input.addEventListener("input", function () {
        applyFilter();
      });
    });
    const clearButton = sidebar.querySelector("[data-stay-clear]");
    if (clearButton && typeof clearButton.addEventListener === "function") {
      clearButton.addEventListener("click", function () {
        context.selectedRanges = {};
        context.selectedFactors = {};
        context.selectedAmenities = {};
        context.selectedChains = {};
        if (context.minInput) {
          context.minInput.value = "";
        }
        if (context.maxInput) {
          context.maxInput.value = "";
        }
        if (context.searchInput) {
          context.searchInput.value = "";
        }
        applyFilter();
      });
    }

    measureContext(context);
  }

  function boot() {
    const containers = document.querySelectorAll(".booking-container");
    containers.forEach(function (container, index) {
      const sidebar = ensureLayout(container, index);
      if (!sidebar) {
        return;
      }
      const context = { sidebar: sidebar, metrics: null };
      contexts.push(context);
      initSidebar(context, container);
    });

    bindLanguageHooks();
    bindCurrencyHook();
    setLanguage(detectLanguage());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  var api = window.PriceRangeSidebar || {};
  api.setLanguage = setLanguage;
  api.registerTranslations = registerTranslations;
  api.orderStayCards = orderStayCards;
  api.nightlyAmount = nightlyAmount;
  api.factorsForCard = function (card) {
    return factorsForText(cardBlob(card), bookHref(card));
  };
  api.amenitiesForCard = function (card) {
    return amenitiesForText(cardBlob(card));
  };
  api.chainForCard = chainName;
  api.isEcolodgeHref = isEcolodgeHref;
  window.PriceRangeSidebar = api;
})();
