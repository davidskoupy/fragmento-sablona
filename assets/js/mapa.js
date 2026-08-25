/* Mapa lokalit.

   Nahrazuje schematickou SVG mapu skutečnou, se zoomem a posunem.
   Podklad kreslí Leaflet 1.9.4 (assets/vendor/), dlaždice jdou z CARTO
   Positron — světlý, odbarvený podklad, který se nepere s fotkami ani
   se značkou. Bez klíče a bez cookies, takže mapa jde vidět i před
   souhlasem s analytikou.

   **Mapa nezná nemovitosti, zná lokality.** Dvě jednotky v Apartině i dvě
   vily v Uluwatu stojí na jedné adrese — na mapě je to jedno místo, ne dvě
   cedulky přes sebe. Nemovitosti k lokalitě visí v `ne` a vypíšou se
   v bublině po kliknutí.

   Cedulka nese vlajku a název místa, ne cenu. Cena je údaj o nemovitosti
   a těch je na některých místech víc; název je údaj o tom bodu.

   Data se čtou z `<script type="application/json" id="mapa-data">` v HTML.
   Je to schválně: až se šablona překlopí do repa, ten blok vyplní server
   z API a v tomhle souboru se nemění ani řádek.

   Shlukování si mapa dělá sama a v pixelech, ne v zeměpisných stupních.
   Čtyři evropské lokality se v pohledu na celý svět vejdou do plochy asi
   115 × 70 px a jejich cedulky by se překryly. */
(function () {
  var uzel = document.querySelector('[data-mapa]');
  var zdroj = document.getElementById('mapa-data');
  if (!uzel || !zdroj || typeof L === 'undefined') return;

  var data = JSON.parse(zdroj.textContent);
  var mista = data.mista || [];
  if (!mista.length) return;

  var klid = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var mapa = L.map(uzel, {
    zoomControl: false,          /* ovládání je v HTML, aby drželo vzhled webu */
    scrollWheelZoom: false,      /* kolečko patří stránce, dokud do mapy nekliknete */
    attributionControl: true,
    zoomAnimation: !klid,
    fadeAnimation: !klid,
    worldCopyJump: true,
    /* Lokality jsou rozprostřené přes 207 stupňů délky (Kostarika až
       Filipíny). Na mobilu je mapa 348 px široká a svět se do celého
       stupně přiblížení nevejde ani v tom nejmenším — krajní cedulky
       vypadnou ven. `zoomSnap: 0` pustí zlomkové přiblížení, takže si
       `fitBounds` dopočítá přesnou hodnotu podle šířky kontejneru.
       Tlačítka + a − přesto skáčou po celých stupních (`zoomDelta`). */
    minZoom: 0,
    zoomSnap: 0,
    zoomDelta: 1,
  });

  /* Výchozí popisek Leafletu nese vlajku Ukrajiny. Autorství knihovny
     zůstává, ta vlajka na klientský web nepatří — není to naše sdělení. */
  mapa.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');

  var DLAZDICE = 'https://{s}.basemaps.cartocdn.com/{styl}/{z}/{x}/{y}{r}.png';
  var ZDROJ = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  };

  L.tileLayer(DLAZDICE.replace('{styl}', 'light_nolabels'), ZDROJ).addTo(mapa);

  /* Popisky až od pátého přiblížení.
     V oddáleném pohledu je tahle mapa tvrzení („sedm zemí na třech
     kontinentech"), ne nástroj — a jména světadílů v místních jazycích
     (亚洲, أفريقيا) na českém webu jenom ruší. Jakmile ale někdo přiblíží
     ke konkrétní lokalitě, chce vědět, na co se dívá.

     Vlastní hladina, ne `shadowPane`: popisky patří nad podklad (200),
     ale pod cedulky (600), a nesmí brát kliknutí. */
  mapa.createPane('popisky');
  mapa.getPane('popisky').style.zIndex = 350;
  mapa.getPane('popisky').style.pointerEvents = 'none';
  var popisky = L.tileLayer(DLAZDICE.replace('{styl}', 'light_only_labels'),
    L.extend({ pane: 'popisky' }, ZDROJ));
  function popiskyPodleZoomu() {
    var ma = mapa.hasLayer(popisky);
    if (mapa.getZoom() >= 5 && !ma) mapa.addLayer(popisky);
    else if (mapa.getZoom() < 5 && ma) mapa.removeLayer(popisky);
  }
  mapa.on('zoomend', popiskyPodleZoomu);

  /* Kolečko se zapne, až když uživatel dá mapě najevo, že s ní pracuje.
     Bez toho se při scrollování stránky nechtěně přibližuje. */
  mapa.once('click', function () { mapa.scrollWheelZoom.enable(); });
  mapa.on('focus', function () { mapa.scrollWheelZoom.enable(); });
  mapa.on('blur', function () { mapa.scrollWheelZoom.disable(); });

  var body = mista.map(function (m) {
    return { ll: L.latLng(m.po[0], m.po[1]), m: m, brzy: m.brzy === true };
  });

  var vrstva = L.layerGroup().addTo(mapa);
  var znacky = [];
  var hranice = L.latLngBounds(body.map(function (b) { return b.ll; }));

  /* `fitBounds` počítá se souřadnicemi, ne s cedulkami. Cedulka je ale
     vycentrovaná na svůj bod, takže jí polovina šířky přečnívá — a ta
     nejzápadnější (Puerto Viejo) by lezla z mapy ven. Odsazení proto
     roste s šířkou kontejneru; dolní je větší kvůli liště s autorstvím.
     Názvy míst jsou širší než bývaly ceny, proto vyšší strop než dřív. */
  function usad() {
    /* Spodní hranice drží nejširší cedulka na kraji: „Puerto Viejo"
       s vlajkou měří kolem 128 px, takže jí přečnívá 64. */
    var v = Math.max(74, Math.min(104, Math.round(uzel.clientWidth * 0.14)));
    mapa.fitBounds(hranice, { paddingTopLeft: [v, 32], paddingBottomRight: [v, 44] });
  }
  usad();

  function ok(s) {
    return String(s).replace(/[&<>"]/g, function (z) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[z];
    });
  }

  function tvarMist(n) {
    return n + (n < 5 ? ' místa' : ' míst');
  }

  function vlajka(m) {
    return m.vl ? '<svg class="flag" aria-hidden="true"><use href="#fl-' + ok(m.vl) + '"/></svg>' : '';
  }

  /* Obal je bod bez rozměru, cedulka se na něj centruje sama. Leaflet si
     na obal sahá vlastním `transform`, takže posun musí být až na dítěti. */
  function cedulka(trida, obsah, popis) {
    return L.divIcon({
      className: 'mk-obal',
      iconSize: null,
      iconAnchor: [0, 0],
      html: '<span class="mk-pil ' + trida + '" title="' + ok(popis) + '">' + obsah + '</span>',
    });
  }

  function karta(n) {
    return '<b class="mp-t">' + ok(n.jm) + '</b>' +
      '<span class="mp-m">' + ok(n.ad) + '</span>' +
      '<span class="mp-c">' + ok(n.ce) + '</span>' +
      (n.od ? '<a class="mp-a" href="' + ok(n.od) + '">Detail nemovitosti &rarr;</a>' : '');
  }

  function bublina(sk) {
    var ven = [];
    sk.forEach(function (b) { (b.m.ne || []).forEach(function (n) { ven.push(karta(n)); }); });
    return ven.length ? '<div class="mp">' + ven.join('<hr>') + '</div>' : null;
  }

  function prekresli() {
    vrstva.clearLayers();
    znacky.length = 0;
    var p = body.map(function (b) { return { b: b, xy: mapa.latLngToLayerPoint(b.ll) }; });
    var hotovo = [], skupiny = [];
    p.forEach(function (x, i) {
      if (hotovo[i]) return;
      hotovo[i] = 1;
      var sk = [x.b];
      p.forEach(function (y, j) {
        if (i === j || hotovo[j] || x.b.brzy !== y.b.brzy) return;
        if (x.xy.distanceTo(y.xy) < 74) { sk.push(y.b); hotovo[j] = 1; }
      });
      skupiny.push(sk);
    });

    skupiny.forEach(function (sk) {
      var stred = L.latLngBounds(sk.map(function (b) { return b.ll; })).getCenter();
      var brzy = sk[0].brzy;
      var jedno = sk.length === 1;

      /* Jedna lokalita nese vlajku a název. Když se jich na sebe navrší
         víc, žádná vlajka je nezastoupí — proto počet míst. */
      var obsah = jedno
        ? vlajka(sk[0].m) + '<span>' + ok(sk[0].m.mi) + '</span>'
        : '<span>' + tvarMist(sk.length) + '</span>';
      var popis = sk.map(function (b) { return b.m.mi + ', ' + b.m.ze; }).join(' · ') +
        (brzy ? ' — v přípravě' : '');

      var zn = L.marker(stred, {
        icon: cedulka(brzy ? 'brzy' : (jedno ? '' : 'shluk'), obsah, popis),
        riseOnHover: true,
      }).addTo(vrstva);

      /* Zapsat dřív než případný `return` níž — i země bez
         nemovitosti má cedulku a musí jít rozsvítit. */
      znacky.push({ zn: zn, mista: sk.map(function (b) { return b.m.mi; }) });

      var obsahBubliny = bublina(sk);
      if (!obsahBubliny) return;          /* země bez konkrétní nemovitosti */

      if (jedno) {
        zn.bindPopup(obsahBubliny);
      } else {
        zn.on('click', function () {
          var h = L.latLngBounds(sk.map(function (b) { return b.ll; }));
          /* Když jsou všechny na jednom bodě, přibližování nic nevyřeší. */
          if (h.getNorthEast().equals(h.getSouthWest()) || mapa.getZoom() >= 14) {
            L.popup().setLatLng(stred).setContent(obsahBubliny).openOn(mapa);
          } else {
            mapa.flyToBounds(h, { padding: [80, 80], animate: !klid });
          }
        });
      }
    });
  }

  mapa.on('zoomend', function () { prekresli(); nasadZvyrazneni(); });
  prekresli();
  popiskyPodleZoomu();

  /* ── Rozsvícení lokality ───────────────────────────────────────────
     Drží se **názvy lokalit**, ne odkazy na značky: `prekresli` cedulky
     při každém přiblížení zahodí a postaví znovu, takže odkaz na značku
     vydrží do prvního zoomu. Po každém překreslení se zvýraznění nasadí
     podle názvů. */
  var zvyraznene = [];

  function pilulka(zn) {
    var el = zn.getElement();
    return el ? el.querySelector('.mk-pil') : null;
  }

  function nasadZvyrazneni() {
    znacky.forEach(function (z) {
      var p = pilulka(z.zn);
      if (!p) return;
      var sviti = z.mista.some(function (mi) { return zvyraznene.indexOf(mi) >= 0; });
      p.classList.toggle('zvyr', sviti);
      /* Rozsvícená cedulka musí být nad ostatními, jinak ji zakryje
         soused. Přes Leaflet, ne přes CSS — obal si Leaflet přepisuje. */
      if (z.zn.setZIndexOffset) z.zn.setZIndexOffset(sviti ? 1000 : 0);
    });
    document.querySelectorAll('[data-misto]').forEach(function (k) {
      k.classList.toggle('zvyr', zvyraznene.indexOf(k.getAttribute('data-misto')) >= 0);
    });
  }

  function sviti(mista) {
    zvyraznene = mista || [];
    nasadZvyrazneni();
  }

  /* ── Karta v panelu → cedulka ──────────────────────────────────────
     `mouseenter` i `focusin`: panel se dá projít tabulátorem a bez
     druhého páru by klávesnice mapu neovládala vůbec. */
  document.querySelectorAll('[data-misto]').forEach(function (k) {
    var mi = k.getAttribute('data-misto');
    ['mouseenter', 'focusin'].forEach(function (u) {
      k.addEventListener(u, function () { sviti([mi]); });
    });
    ['mouseleave', 'focusout'].forEach(function (u) {
      k.addEventListener(u, function () { sviti([]); });
    });
  });

  /* ── Štítky zemí ───────────────────────────────────────────────────
     Kliknutí přiletí na lokality té země. Druhé kliknutí na tentýž
     štítek se vrátí na celý svět — bez toho je to jednosměrka a člověk
     musí odzoomovat ručně. */
  var vybranaZeme = null, pojistka = null;
  var legenda = document.querySelector('.maplegend');

  function zemeLokality(ze) {
    return body.filter(function (b) { return b.m.ze === ze; });
  }

  function vyberZemi(ze) {
    var stejna = vybranaZeme === ze;
    vybranaZeme = stejna ? null : ze;

    if (legenda) legenda.querySelectorAll('.it').forEach(function (t) {
      t.setAttribute('aria-pressed', t.getAttribute('data-ze') === vybranaZeme ? 'true' : 'false');
    });

    if (!vybranaZeme) { sviti([]); usad(); return; }

    var sk = zemeLokality(ze);
    if (!sk.length) return;
    sviti(sk.map(function (b) { return b.m.mi; }));

    /* Jedna lokalita nemá hranice, na které by se dalo doletět —
       `fitBounds` na bod by přiblížil na maximum a člověk by ztratil,
       kde na světě je. Proto pevné, mírné přiblížení. */
    var h = L.latLngBounds(sk.map(function (b) { return b.ll; }));
    var kam, naJak;
    if (sk.length === 1) { kam = sk[0].ll; naJak = 6; }
    else { kam = h.getCenter(); naJak = Math.min(7, mapa.getBoundsZoom(h, false, L.point(90, 90))); }

    /* Pojistka proti uspané animaci.

       `flyTo` běží na `requestAnimationFrame`. Prohlížeč ho umí utlumit
       nebo zastavit — na skryté kartě, v úsporném režimu, ve WebView bez
       viditelného okna. Když netiká, `flyTo` se **nikdy nerozjede a taky
       nikdy neskončí**: mapa zůstane stát a zvenčí to vypadá, že tlačítko
       nic nedělá. Změřeno ve WKWebView: rAF tikl jednou za sekundu,
       zvýraznění naskočilo, ale mapa se nehnula.

       Proto se po 900 ms zkontroluje, jestli se střed opravdu posunul.
       Když ne, skočí se natvrdo — radši bez animace než nikam. */
    var stredPred = mapa.getCenter(), zoomPred = mapa.getZoom();
    mapa.flyTo(kam, naJak, { animate: !klid });
    clearTimeout(pojistka);
    pojistka = setTimeout(function () {
      if (mapa.getZoom() === zoomPred && mapa.getCenter().equals(stredPred)) {
        mapa.setView(kam, naJak, { animate: false });
      }
    }, 900);
  }

  /* Cíl kliknutí se hledá výstupem po `parentNode`, ne přes `closest`.
     Ve štítku je `<svg><use>`; klik na vlajku udělá cílem SVG prvek
     a `closest` z něj není napříč prohlížeči spolehlivý. Vlajka a počet
     navíc kliknutí vůbec neberou (`pointer-events: none` v sazbě), takže
     tohle je druhá pojistka, ne jediná. */
  function stitek(uzel) {
    while (uzel && uzel !== legenda) {
      if (uzel.classList && uzel.classList.contains('it')) return uzel;
      uzel = uzel.parentNode;
    }
    return null;
  }

  if (legenda) legenda.addEventListener('click', function (e) {
    var t = stitek(e.target);
    if (!t || !t.getAttribute('data-ze')) return;
    vyberZemi(t.getAttribute('data-ze'));
  });

  /* Ovládání přiblížení zůstává v HTML, aby vypadalo jako zbytek webu. */
  var ovl = uzel.closest('.mapwrap');
  if (ovl) ovl.querySelectorAll('.map-ctl button').forEach(function (b, i) {
    b.addEventListener('click', function () { i === 0 ? mapa.zoomIn() : mapa.zoomOut(); });
  });

  /* Na výpisu nemovitostí mapa startuje ve skrytém panelu, tedy s nulovou
     výškou — Leaflet si ji spočítá špatně a zůstane šedý čtverec. Tohle ho
     přeměří, jakmile panel dostane rozměr. */
  if ('ResizeObserver' in window) {
    var posledni = 0;
    new ResizeObserver(function () {
      var v = uzel.clientHeight;
      if (v > 0 && v !== posledni) { posledni = v; mapa.invalidateSize(); usad(); }
    }).observe(uzel);
  }
})();
