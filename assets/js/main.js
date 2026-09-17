/* Fragmento — chování rozhraní.
   Mega menu, mobilní zásuvka, akordeon otázek, přepínač mřížka/mapa
   a zvýraznění aktivní kapitoly v průvodci. Bez závislostí. */
(function () {
  function scrimSync() {
    /* Domovská stránka má hlavičku položenou na videu a průhlednou.
       Bílý panel pod ní pak nemá na čem stát, tak si na dobu otevření
       vyžádá pevnou podobu obou lišt — viz `s86`. Třída sedí na `<body>`,
       protože horní lišta je sourozenec **před** hlavičkou a na
       předchozího sourozence se v sazbě ukázat nedá. */
    /* `s122`: pevnou podobu lišt si vyžádá i otevřené mobilní menu —
       jinak nad bílým panelem zůstane bílé písmo se stínem na krému. */
    var sirka = document.querySelector('.drawer.open');
    var otevreno = !!document.querySelector('.mega.open') || !!sirka;
    document.body.classList.toggle('mega-otevreno', otevreno);
    document.body.classList.toggle('drawer-otevreno', !!sirka);
    if (sirka) {
      /* Odsazení shora z dolní hrany hlavičky. Pevné číslo by neplatilo:
         horní lišta se při rolování schovává a hlavička mění výšku. */
      var hl = document.querySelector('.head');
      var dole = hl ? Math.max(0, Math.round(hl.getBoundingClientRect().bottom)) : 71;
      document.documentElement.style.setProperty('--dr-top', dole + 'px');
    }
    var scrim = document.querySelector('.scrim');
    if (!scrim) return;
    if (otevreno) {
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add('on'); });
    } else {
      scrim.classList.remove('on');
      scrim.hidden = true;
    }
  }

  function closeAll() {
    document.querySelectorAll('.mega.open').forEach(function (m) { m.classList.remove('open'); });
    document.querySelectorAll('.mega-btn[aria-expanded="true"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    document.querySelectorAll('.drawer.open').forEach(function (d) { d.classList.remove('open'); });
    document.querySelectorAll('.burger[aria-expanded="true"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    scrimSync();
  }

  document.addEventListener('click', function (e) {
    var mb = e.target.closest('.mega-btn');
    if (mb) {
      // Desktop s myší: panel řídí hover, klik prostě odnaviguje na výpis.
      // Dotyk a klávesnice: klik panel přepne.
      if (matchMedia('(hover: hover) and (min-width: 1040px)').matches && e.detail !== 0) return;
      e.preventDefault();
      var mega = document.querySelector('.mega');
      var open = mb.getAttribute('aria-expanded') === 'true';
      closeAll();
      if (!open) { mega.classList.add('open'); mb.setAttribute('aria-expanded', 'true'); scrimSync(); }
      return;
    }
    var bg = e.target.closest('.burger');
    if (bg) {
      var dr = document.querySelector('.drawer');
      var op = bg.getAttribute('aria-expanded') === 'true';
      closeAll();
      if (!op) { dr.classList.add('open'); bg.setAttribute('aria-expanded', 'true'); }
      scrimSync();   /* s122: bez tohohle se lišty nepřepnou a menu se nezamkne */
      return;
    }
    var ah = e.target.closest('.acc-head');
    if (ah) {
      var acc = ah.parentElement;
      acc.setAttribute('data-open', acc.getAttribute('data-open') === '1' ? '0' : '1');
      ah.setAttribute('aria-expanded', acc.getAttribute('data-open') === '1' ? 'true' : 'false');   /* s196 */
      return;
    }
    var vb = e.target.closest('[data-view] button');
    if (vb) {
      vb.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === vb); b.setAttribute('aria-pressed', b === vb ? 'true' : 'false'); });
      document.querySelector('#view-grid').hidden = vb.dataset.v !== 'grid';
      document.querySelector('#view-map').hidden = vb.dataset.v !== 'map';
      return;
    }
    /* s195: dlaždice skládačky obsluhuje modul „Skládačka balíčků“ na konci souboru. */
    var gt = e.target.closest('.geo-tabs button');
    if (gt) { gt.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === gt); }); return; }
    if (!e.target.closest('.mega') && !e.target.closest('.drawer')) closeAll();
  });

  /* ── pohyb ──────────────────────────────────────────────────────────
     Třída `motion` zapíná skryté výchozí stavy. Bez JS nebo s vypnutými
     animacemi se nenasadí a stránka je celá vidět. */
  (function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ko = document.documentElement;
    ko.classList.add('motion');

    // Pojistka: kdyby cokoliv níž selhalo, po 2,5 s je zase všechno vidět.
    var pojistka = setTimeout(function () { ko.classList.remove('motion'); }, 2500);

    // Karty dostanou pořadí, aby se poskládaly po sobě.
    document.querySelectorAll('.grid, .mood-grid, .pkg-grid').forEach(function (m) {
      [].slice.call(m.children).forEach(function (d, i) {
        d.classList.add('arrive'); d.style.setProperty('--i', i % 6);
      });
    });

    if (!('IntersectionObserver' in window)) { clearTimeout(pojistka); return; }

    // Rok: zlaté dny se rozsvítí v pořadí, jak jdou po sobě.
    var rok = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        var dny = z.target.querySelectorAll('i.mine');
        [].slice.call(dny).forEach(function (d, i) { d.style.transitionDelay = (i * 14) + 'ms'; });
        z.target.classList.add('lit');
        rok.unobserve(z.target);
      });
    }, { threshold: .35 });
    document.querySelectorAll('.year').forEach(function (r) { r.classList.add('arm'); rok.observe(r); });

    // Nadpis sekce vyjede zpod linky, popisek nad ním a věta pod ním jdou
    // po něm. Sekce jako plocha se nehýbe — hýbe se jen text v ní.
    var hlavy = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        z.target.classList.add('prijezd');
        hlavy.unobserve(z.target);
      });
    }, { threshold: .2, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.h2, .quiet-h').forEach(function (n) {
      var skupina = [n];
      // Popisek stojí před nadpisem, věta za ním; jinde ani jedno být nemusí.
      var pred = n.previousElementSibling, za = n.nextElementSibling;
      if (pred && pred.classList.contains('lab')) skupina.unshift(pred);
      if (za && za.classList.contains('lead')) skupina.push(za);
      skupina.forEach(function (e, i) {
        e.style.setProperty('--i', i);
        hlavy.observe(e);
      });
    });

    // Velká čísla. Nepočítají se od nuly — vyjedou stejně jako nadpisy,
    // jen s větším odstupem mezi sebou.
    document.querySelectorAll('.ci .v, .nums .n').forEach(function (c, i) {
      c.style.setProperty('--i', i % 4);
      hlavy.observe(c);
    });

    // Fotky se odkryjí clonou shora, po řadě zleva.
    var fotky = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        z.target.classList.add('odkryv');
        fotky.unobserve(z.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.nal-ph').forEach(function (d, i) {
      d.style.setProperty('--i', i % 5);
      fotky.observe(d);
    });

    // Karty se rozjedou, až když na ně dojde řada.
    var mrizka = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        z.target.classList.add('arrive');
        mrizka.unobserve(z.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.arrive').forEach(function (d) {
      d.classList.remove('arrive'); mrizka.observe(d);
    });
  })();

  /* ── Filtr povahy místa ────────────────────────────────────────────
     Pilulky nesou `data-povaha` (token ze své vlastní ikony), karty
     `data-povaha` se seznamem tokenů. „Kdekoliv“ má token prázdný.
     Chová se to jako přepínač: jedna volba, ne zaškrtávátka — kdyby
     jich šlo držet víc, „u moře + v horách“ nedává žádnou odpověď. */
  document.querySelectorAll('[data-filtr]').forEach(function (rada) {
    var sekce = rada.closest('.sec');
    var mrizka = sekce && sekce.querySelector('[data-mrizka]');
    if (!mrizka) return;

    var pilulky = [].slice.call(rada.querySelectorAll('.chip'));
    var karty = [].slice.call(mrizka.querySelectorAll('.card'));
    var stav = document.createElement('p');
    stav.className = 'filtr-stav';
    stav.setAttribute('aria-live', 'polite');
    rada.parentNode.insertBefore(stav, rada.nextSibling);

    function tvar(n) {
      if (n === 1) return 'nemovitost';
      if (n >= 2 && n <= 4) return 'nemovitosti';
      return 'nemovitostí';
    }

    function pouzij(volba) {
      var vidno = 0;
      karty.forEach(function (k) {
        var promo = k.hasAttribute('data-promo');
        var tokeny = (k.getAttribute('data-povaha') || '').split(' ');
        var ven = volba
          ? (promo || tokeny.indexOf(volba) === -1)
          : false;
        k.classList.toggle('odfiltrovano', ven);
        if (!ven && !promo) vidno++;
      });

      pilulky.forEach(function (p) {
        var je = (p.getAttribute('data-povaha') || '') === volba;
        p.classList.toggle('on', je);
        p.setAttribute('aria-pressed', je ? 'true' : 'false');
      });

      if (!volba) {
        stav.textContent = '';
      } else if (vidno) {
        stav.innerHTML = 'Zobrazeno <b>' + vidno + '</b> ' + tvar(vidno) + '.';
        stav.appendChild(document.createTextNode(' '));
        stav.appendChild(zpatky());
      } else {
        stav.textContent = 'Pro tenhle filtr tu zatím nic není. ';
        stav.appendChild(zpatky());
      }

      /* Karty, které zůstaly, přijedou znovu — bez toho se filtr
         přepne skokem a není poznat, že se něco stalo. Stagger je
         stejný jako při prvním příjezdu, aby to nebyl jiný pohyb. */
      if (document.documentElement.classList.contains('motion')) {
        var i = 0;
        karty.forEach(function (k) {
          if (k.classList.contains('odfiltrovano')) return;
          k.classList.remove('arrive');
          void k.offsetWidth;
          k.style.setProperty('--i', (i++) % 6);
          k.classList.add('arrive');
        });
      }
    }

    function zpatky() {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Zrušit filtr';
      b.addEventListener('click', function () { pouzij(''); });
      return b;
    }

    rada.addEventListener('click', function (e) {
      var p = e.target.closest('.chip');
      if (!p) return;
      pouzij(p.getAttribute('data-povaha') || '');
    });
  });

  /* ── Fotky pod ohybem (s140) ────────────────────────────────────────
     Fotky jsou v CSS proměnných, takže `loading="lazy"` nejde. Prvky
     v sekcích za první sekcí nesou `data-bg="--img-x"` a styl dostanou
     900 px před viewportem. Bez IntersectionObserver hned. */
  (function () {
    var prvky = document.querySelectorAll('[data-bg]');
    if (!prvky.length) return;
    function nacti(e) {
      e.style.backgroundImage = 'var(' + e.getAttribute('data-bg') + ')';
      e.removeAttribute('data-bg');
    }
    if (!('IntersectionObserver' in window)) { prvky.forEach(nacti); return; }
    var io = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        nacti(z.target); io.unobserve(z.target);
      });
    }, { rootMargin: '900px 0px' });
    /* Skryté vrstvy karty (tři ze čtyř fotek) se načtou až při prvním
       najetí, dotyku nebo fokusu karty, na všech zařízeních (s143).
       Než dorazí, prosvítá první fotka: vrstva bez obrázku je průhledná. */
    prvky.forEach(function (e) {
      if (e.classList.contains('lay') && !e.classList.contains('first')) return;
      io.observe(e);
    });
    document.querySelectorAll('.card').forEach(function (k) {
      if (!k.querySelector('.lay[data-bg]')) return;
      function dobrat() {
        k.querySelectorAll('.lay[data-bg]').forEach(nacti);
        ['pointerenter', 'touchstart', 'focusin'].forEach(function (u) { k.removeEventListener(u, dobrat); });
      }
      ['pointerenter', 'touchstart', 'focusin'].forEach(function (u) { k.addEventListener(u, dobrat, { passive: true }); });
    });
  })();

  /* ── Video v heru jen tam, kde má smysl (s140) ─────────────────────
     Zdroj se doplní až tady: na mobilu (< 785 px) a při vyžádaném klidu
     zůstane fotka pod videem a 450 kB se nestáhne. */
  (function () {
    var chce = matchMedia('(min-width: 785px)').matches
      && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('video.vid').forEach(function (v) {
      var zdroj = v.querySelector('source[data-src]');
      if (!zdroj) return;
      if (chce) {
        zdroj.src = zdroj.getAttribute('data-src');
        zdroj.removeAttribute('data-src');
        v.load();
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else {
        v.removeAttribute('autoplay');
        var hero = v.closest('.hero') || v.parentNode;
        var ctl = hero && hero.querySelector('[data-vid-ctl]');
        if (ctl) ctl.hidden = true;
      }
    });
  })();


  /* ── Kalkulačka splátek (s152) ──────────────────────────────────────
     Anuita z orientační sazby. Není to nabídka úvěru, tu dá Essox. */
  document.querySelectorAll('[data-kalk]').forEach(function (k) {
    var vst = {};
    k.querySelectorAll('[data-in]').forEach(function (i) { vst[i.getAttribute('data-in')] = i; });
    function kc(x) { return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
    function lety(n) { return n === 1 ? '1 rok' : (n < 5 ? n + ' roky' : n + ' let'); }
    function penize(x) { return window.fragmentoMena ? fragmentoMena.format(x, true) : kc(x) + ' Kč'; }   /* s177 */
    function ven(j, t) { k.querySelectorAll('[data-out="' + j + '"]').forEach(function (e) { e.textContent = t; }); }
    function prepocti() {
      var cena = +vst.cena.value, vl = +vst.vl.value, let_ = +vst['let'].value, urok = +vst.urok.value;
      var fin = Math.round(cena * (100 - vl) / 100), vlastni = cena - fin;
      var n = let_ * 12, r = urok / 100 / 12;
      var splatka = r > 0 ? fin * r / (1 - Math.pow(1 + r, -n)) : fin / n;
      ven('cena', penize(cena)); ven('vl', vl + ' %'); ven('let', lety(let_)); ven('let2', lety(let_));
      ven('urok', 'cca ' + String(urok).replace('.', ',') + ' % p.a.');   /* pevná sazba (s163) */
      ven('splatka', window.fragmentoMena ? fragmentoMena.cislo(splatka, true) : kc(splatka)); ven('vlastni', penize(vlastni)); ven('fin', penize(fin));
      ven('celkem', penize(splatka * n + vlastni));
      k.style.setProperty('--vl', vl + '%');   /* poměr vlastních zdrojů v pruhu (s194) */
      /* Vybarvená část dráhy posuvníku (s165). */
      [vst.cena, vst.vl, vst['let']].forEach(function (i) {
        if (i) i.style.setProperty('--pct', (i.value - i.min) / (i.max - i.min) * 100 + '%');
      });
    }
    /* Cena z karty (s180): `splatky/?cena=2083000` předvyplní posuvník. */
    var zKarty = +new URLSearchParams(location.search).get('cena');
    if (zKarty && vst.cena && zKarty >= +vst.cena.min && zKarty <= +vst.cena.max) {
      if ((zKarty - vst.cena.min) % vst.cena.step) vst.cena.step = 500;
      vst.cena.value = zKarty;
      requestAnimationFrame(function () { k.scrollIntoView({ block: 'center' }); });
    }
    Object.keys(vst).forEach(function (j) { vst[j].addEventListener('input', prepocti); });
    window.addEventListener('mena:zmena', prepocti);   /* s177 */
    prepocti();
  });

  /* ── Zastavení hero videa ──────────────────────────────────────────
     `autoplay loop` běží pořád dokola. WCAG 2.2.2 chce u pohybu nad 5 s
     způsob, jak ho zastavit; tenhle klip má 6 s. Pilulka s popiskem je
     jediné místo v heru, kam se takové ovládání vejde. */
  document.querySelectorAll('[data-vid-ctl]').forEach(function (b) {
    var hero = b.closest('.hero');
    var v = hero && hero.querySelector('video.vid');
    if (!v) { b.hidden = true; return; }
    var popis = b.querySelector('.txt');
    var puvodni = popis ? popis.textContent : '';

    function stav(stoji) {
      b.setAttribute('aria-pressed', stoji ? 'true' : 'false');
      b.setAttribute('aria-label', stoji ? 'Spustit video' : 'Pozastavit video');
      if (popis) popis.textContent = stoji ? 'Video pozastaveno' : puvodni;
    }

    /* Vyžádaný klid platí i tady — jinak by hero jelo dál. */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); stav(true); }
    else stav(false);

    b.addEventListener('click', function () {
      if (v.paused) { v.play(); stav(false); } else { v.pause(); stav(true); }
    });
  });

  /* Video v hero má nést klid, ne spád. */
  document.querySelectorAll('.hero .vid').forEach(function (v) { v.playbackRate = 0.9; });

  /* Hlavička mizí při scrollu dolů, vrací se při scrollu nahoru.
     PRAH drží klid při drobném doskrolování, ZACATEK nechá první
     obrazovku být, aby hlavička nemizela hned na začátku stránky. */
  (function () {
    var head = document.querySelector('.head');
    if (!head) return;
    var PRAH = 8, ZACATEK = 260, minule = scrollY, ceka = false;
    function krok() {
      ceka = false;
      var ted = scrollY, rozdil = ted - minule;
      if (Math.abs(rozdil) < PRAH) return;
      minule = ted;
      // Otevřené menu se pod prstem schovávat nemá.
      if (document.querySelector('.mega.open, .drawer.open')) { head.classList.remove('away'); return; }
      head.classList.toggle('away', rozdil > 0 && ted > ZACATEK);
    }
    addEventListener('scroll', function () {
      if (ceka) return;
      ceka = true; requestAnimationFrame(krok);
    }, { passive: true });
  })();

  /* Poptávkový formulář. Kontrola je vlastní, aby hlášky byly česky
     a v grafice webu — proto má `<form>` atribut `novalidate`. */
  (function () {
    var f = document.querySelector('[data-poptavka]');
    if (!f) return;
    var karta = f.closest('.formcard');

    // Pilulky rozsahu: chovají se jako přepínače, ne jako tlačítka.
    var skupina = f.querySelector('[role="radiogroup"]');
    if (skupina) {
      var pilulky = [].slice.call(skupina.querySelectorAll('[role="radio"]'));
      var skryte = f.querySelector('input[name="rozsah"]');
      function vyber(p) {
        pilulky.forEach(function (x) {
          var je = x === p;
          x.setAttribute('aria-checked', je ? 'true' : 'false');
          /* Třída `on` musí jít s tím: zlatou výplň drží `.formcard .chip.on`,
             takže bez tohohle by první pilulka zůstala vybraná napořád,
             i když se `aria-checked` správně přepnulo. */
          x.classList.toggle('on', je);
          x.tabIndex = je ? 0 : -1;
        });
        skryte.value = p.dataset.hodnota;
      }
      pilulky.forEach(function (p, i) {
        p.addEventListener('click', function () { vyber(p); });
        p.addEventListener('keydown', function (e) {
          var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!k) return;
          e.preventDefault();
          var c = pilulky[(i + k + pilulky.length) % pilulky.length];
          vyber(c); c.focus();
        });
      });
    }

    function chyba(pole, text) {
      var obal = pole.closest('.pole');
      obal.classList.toggle('pole-chyba', !!text);
      obal.querySelector('.chyba').textContent = text || '';
      pole.setAttribute('aria-invalid', text ? 'true' : 'false');
    }

    function zkontroluj(pole) {
      var v = pole.value.trim();
      if (pole.name === 'jmeno')
        return v.length >= 2 ? '' : 'Napište prosím jméno, ať víme, koho oslovit.';
      if (pole.name === 'email')
        return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? '' : 'Tenhle e-mail nevypadá úplně, zkontrolujte ho prosím.';
      if (pole.name === 'telefon')
        return v.replace(/[\s()+-]/g, '').length >= 9 ? '' : 'Telefon potřebujeme celý, ať se dovoláme.';
      return '';
    }

    var povinna = [].slice.call(f.querySelectorAll('[data-povinne]'));
    povinna.forEach(function (pole) {
      // Za běhu se hlídá až to pole, které už jednou chybu ukázalo.
      pole.addEventListener('input', function () {
        if (pole.closest('.pole').classList.contains('pole-chyba')) chyba(pole, zkontroluj(pole));
      });
    });

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var prvni = null;
      povinna.forEach(function (pole) {
        var t = zkontroluj(pole);
        chyba(pole, t);
        if (t && !prvni) prvni = pole;
      });
      if (prvni) { prvni.focus(); return; }

      var cil = f.dataset.endpoint;
      if (!cil) {
        /* Šablona nemá backend. Ukáže se potvrzení, ale nic se neodeslalo —
           tohle varování je tu proto, aby to integrátor nepřehlédl. */
        console.warn('Formulář poptávky: chybí data-endpoint, nic se neodeslalo.');
        karta.classList.add('odeslano');
        karta.querySelector('.hotovo').focus();
        return;
      }
      var tl = f.querySelector('button[type="submit"]');
      tl.disabled = true;
      fetch(cil, { method: 'POST', body: new FormData(f) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); karta.classList.add('odeslano'); })
        .catch(function () {
          tl.disabled = false;
          chyba(f.querySelector('[name="email"]'), 'Odeslání se nepovedlo. Zkuste to prosím znovu, nebo zavolejte.');
        });
    });
  })();

  /* ── Poptávka: průvodce na tři kroky — viz _build/s91_poptavka.py ───
     Kontrolu polí a odeslání řeší blok `[data-poptavka]` výš; tohle jen
     přepíná kroky a sbírá odpovědi do skrytých polí, aby dorazily
     ve `FormData`. */
  (function () {
    var f = document.querySelector('[data-pruvodce]');
    if (!f) return;
    var kroky = [].slice.call(f.querySelectorAll('.krok'));
    var zpet = f.querySelector('[data-zpet]');
    var dal = f.querySelector('[data-dal]');
    var odeslat = f.querySelector('[data-odeslat]');
    var kde = 1, poradit = false;
    var stav = {};

    function zapis() {
      Object.keys(stav).forEach(function (osa) {
        var pole = f.querySelector('input[name="q-' + osa + '"]');
        if (!pole) return;
        var v = stav[osa];
        pole.value = Array.isArray(v) ? v.join(', ') : (v || '');
      });
      var p = f.querySelector('input[name="q-poradit"]');
      if (p) p.value = poradit ? 'ano' : '';
    }

    f.addEventListener('click', function (e) {
      var t = e.target.closest('[data-osa]');
      if (!t) return;
      var osa = t.getAttribute('data-osa'), hod = t.getAttribute('data-hod');
      var vic = t.hasAttribute('data-vic');
      if (vic) {
        var pole = stav[osa] || (stav[osa] = []);
        var i = pole.indexOf(hod);
        if (i >= 0) pole.splice(i, 1); else pole.push(hod);
      } else {
        stav[osa] = stav[osa] === hod ? '' : hod;
      }
      f.querySelectorAll('[data-osa="' + osa + '"]').forEach(function (b) {
        var h = b.getAttribute('data-hod');
        var je = vic ? stav[osa].indexOf(h) >= 0 : stav[osa] === h;
        b.setAttribute('aria-pressed', je ? 'true' : 'false');
      });
      zapis();
    });

    function ukaz(posun) {
      kroky.forEach(function (k) { k.hidden = +k.getAttribute('data-k') !== kde; });
      f.querySelectorAll('.kroky li').forEach(function (li) {
        var n = +li.getAttribute('data-k');
        li.classList.toggle('je', n === kde);
        /* Ne `hotovo` — tu třídu má potvrzení po odeslání a
           `karta.querySelector('.hotovo')` výš by pak sáhlo sem. */
        li.classList.toggle('splneno', n < kde && !(poradit && n === 2));
        li.classList.toggle('preskoceno', poradit && n === 2 && kde === 3);
      });
      f.querySelector('.prubeh i').style.width = (kde / kroky.length * 100) + '%';
      zpet.hidden = kde === 1;
      dal.hidden = kde === kroky.length;
      odeslat.hidden = kde !== kroky.length;
      if (kde === kroky.length) rekap();
      if (posun) {
        /* Krok se mění nad ohybem i pod ním; bez posunu zůstane oko dole
           u tlačítek a nová otázka je mimo obrazovku. */
        var y = f.getBoundingClientRect().top + window.pageYOffset - 110;
        window.scrollTo({ top: y, behavior:
          matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }

    function rekap() {
      var r = f.querySelector('[data-rekap]');
      if (poradit) {
        r.innerHTML = 'Chcete <b>poradit</b> — projdeme to spolu, klidně po telefonu. '
          + 'Stačí kontakt níž.';
        return;
      }
      var kus = [];
      [['místo', 'povaha'], ['země', 'zeme'], ['rozsah', 'dny'],
       ['investice', 'rozpocet'], ['záměr', 'zamer'], ['termín', 'kdy']
      ].forEach(function (p) {
        var v = stav[p[1]];
        v = Array.isArray(v) ? v.join(', ') : v;
        if (v) kus.push(p[0] + ': <b>' + v + '</b>');
      });
      r.innerHTML = kus.length ? 'Zatím máme: ' + kus.join(' · ')
        : 'Zatím jste nic nevybrali — to nevadí, projdeme to spolu.';
    }

    dal.addEventListener('click', function () { if (kde < kroky.length) { kde++; ukaz(true); } });
    zpet.addEventListener('click', function () {
      if (kde === 3 && poradit) { poradit = false; kde = 1; zapis(); ukaz(true); return; }
      if (kde > 1) { kde--; ukaz(true); }
    });
    f.querySelectorAll('[data-poradit]').forEach(function (b) {
      b.addEventListener('click', function () {
        poradit = true; kde = kroky.length; zapis(); ukaz(true);
      });
    });
    ukaz(false);
  })();

  /* ── Galerie na detailu — viz _build/s97_detail_galerie.py ──────────
     Fotka se bere z podkladu dlaždice, na kterou se kliklo; druhý
     seznam adres v JavaScriptu by se s markupem dřív nebo později
     rozešel. */
  (function () {
    var okno = document.querySelector('[data-galerie]');
    if (!okno || !okno.showModal) return;
    var pas = okno.querySelector('.fgal-pas');
    var fotka = okno.querySelector('.fgal-fotka');
    var kde = okno.querySelector('[data-kde]');
    var nahledy = [].slice.call(pas.querySelectorAll('button'));
    var i = 0;

    function ukaz(n) {
      i = (n + nahledy.length) % nahledy.length;
      var b = nahledy[i];
      fotka.style.backgroundImage = getComputedStyle(b).backgroundImage;
      fotka.setAttribute('aria-label', b.getAttribute('aria-label') || '');
      kde.textContent = i + 1;
      nahledy.forEach(function (x, j) { x.setAttribute('aria-current', j === i ? 'true' : 'false'); });
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    document.querySelectorAll('[data-otevri]').forEach(function (t) {
      t.addEventListener('click', function () {
        ukaz(+t.getAttribute('data-otevri') || 0);
        okno.showModal();
      });
    });
    okno.querySelector('.fgal-x').addEventListener('click', function () { okno.close(); });
    okno.querySelector('.fgal-sip.zpet').addEventListener('click', function () { ukaz(i - 1); });
    okno.querySelector('.fgal-sip.vpred').addEventListener('click', function () { ukaz(i + 1); });
    nahledy.forEach(function (b, j) { b.addEventListener('click', function () { ukaz(j); }); });
    okno.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); ukaz(i - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); ukaz(i + 1); }
    });
    /* Klik vedle fotky zavírá. `<dialog>` roztažený přes celou obrazovku
       nemá „vedle“ podle souřadnic — pozná se to podle toho, že cíl je
       samo okno, ne nic uvnitř. */
    okno.addEventListener('click', function (e) { if (e.target === okno) okno.close(); });
  })();

  /* ── Lišta na detailu — viz _build/s101_detail_zaver.py ─────────────
     Ukáže se, až odjede galerie, a schová se u poptávky — tam už
     tlačítko na obrazovce je a druhé by jen překáželo. */
  (function () {
    var lista = document.querySelector('[data-lista]');
    /* **Ne podle cenového panelu**: ten je `position: sticky`, takže
       z obrazovky nikdy neodjede a podmínka by neplatila nikdy. */
    var hero = document.querySelector('.gal');
    var zajem = document.querySelector('#zajem');
    if (!lista || !hero) return;
    lista.hidden = false;
    function stav() {
      var podHerem = hero.getBoundingClientRect().bottom < 0;
      var uPoptavky = zajem && zajem.getBoundingClientRect().top < innerHeight * .85;
      lista.classList.toggle('je', podHerem && !uPoptavky);
    }
    addEventListener('scroll', stav, { passive: true });
    addEventListener('resize', stav);
    stav();
  })();

  /* ── Pilulky v poptávce na detailu — viz s102 ───────────────────────
     Zapisují se do skrytého pole, takže odpověď dorazí ve `FormData`
     i bez toho, aby byla pilulka `<input>`. */
  (function () {
    var f = document.querySelector('.kp-form');
    if (!f) return;
    f.addEventListener('click', function (e) {
      var t = e.target.closest('.chip[data-osa]');
      if (!t) return;
      var osa = t.getAttribute('data-osa'), hod = t.getAttribute('data-hod');
      var pole = f.querySelector('input[name="' + osa + '"]');
      var vybrano = pole.value === hod ? '' : hod;
      pole.value = vybrano;
      f.querySelectorAll('.chip[data-osa="' + osa + '"]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-hod') === vybrano ? 'true' : 'false');
      });
    });
  })();

  /* ── Poptávka na detailu (s165) ──────────────────────────────────────
     Formulář měl `novalidate`, ale žádnou obsluhu: odeslal se GETem na
     stejnou adresu a jméno, e-mail i telefon skončily v URL. Kontrola
     a hlášky jsou stejné jako u poptávky na homepage (s31); hláška visí
     na poli přes `aria-describedby`, takže ji čtečka řekne i po návratu. */
  (function () {
    var f = document.querySelector('[data-poptavka-detail]');
    if (!f) return;
    var hotovo = f.parentNode.querySelector('.kp-hotovo');

    function chyba(pole, text) {
      var ch = document.getElementById(pole.getAttribute('aria-describedby'));
      if (ch) ch.textContent = text || '';
      (pole.closest('.fpole') || pole.closest('.souhlas')).classList.toggle('pole-chyba', !!text);
      pole.setAttribute('aria-invalid', text ? 'true' : 'false');
    }

    function zkontroluj(pole) {
      var v = (pole.value || '').trim();
      if (pole.name === 'jmeno')
        return v.length >= 2 ? '' : 'Napište prosím jméno, ať víme, koho oslovit.';
      if (pole.name === 'email')
        return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? '' : 'Tenhle e-mail nevypadá úplně, zkontrolujte ho prosím.';
      if (pole.name === 'telefon')
        return v.replace(/[\s()+-]/g, '').length >= 9 ? '' : 'Telefon potřebujeme celý, ať se dovoláme.';
      if (pole.name === 'souhlas')
        return pole.checked ? '' : 'Bez souhlasu se zpracováním údajů se vám nemůžeme ozvat.';
      return '';
    }

    var povinna = [].slice.call(f.querySelectorAll('[data-povinne]'));
    povinna.forEach(function (pole) {
      // Za běhu se hlídá až to pole, které už jednou chybu ukázalo.
      pole.addEventListener(pole.type === 'checkbox' ? 'change' : 'input', function () {
        if (pole.getAttribute('aria-invalid') === 'true') chyba(pole, zkontroluj(pole));
      });
    });

    /* Po skrytí dlouhého formuláře by fokus nechal potvrzení pod lepivou
       hlavičkou (1440 px: horní hrana 0, hlavička do 71). Proto doprostřed. */
    function hotovoUkaz() {
      f.hidden = true;
      if (!hotovo) return;
      hotovo.hidden = false;
      hotovo.focus({ preventScroll: true });
      hotovo.scrollIntoView({ block: 'center' });
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var prvni = null;
      povinna.forEach(function (pole) {
        var t = zkontroluj(pole);
        chyba(pole, t);
        if (t && !prvni) prvni = pole;
      });
      if (prvni) { prvni.focus(); return; }

      var cil = f.dataset.endpoint;
      if (!cil) {
        /* Šablona nemá backend: potvrzení se ukáže, ale nic se neodeslalo. */
        console.warn('Poptávka na detailu: chybí data-endpoint, nic se neodeslalo.');
        hotovoUkaz();
        return;
      }
      var tl = f.querySelector('button[type="submit"]');
      tl.disabled = true;
      fetch(cil, { method: 'POST', body: new FormData(f) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); hotovoUkaz(); })
        .catch(function () {
          tl.disabled = false;
          chyba(f.querySelector('[name="email"]'), 'Odeslání se nepovedlo. Zkuste to prosím znovu, nebo zavolejte.');
        });
    });
  })();

  /* ── Chybějící loga portálů — viz _build/s109_pronajem_loga.py ──────
     Soubory s logy Booking a Airbnb v šabloně zatím nejsou. Dokud
     nebudou, obrázek se odstraní, aby se neukázala ikona rozbitého
     obrázku; název portálu stojí vedle něj textem, takže se nic
     neztratí. */
  document.querySelectorAll('img.pr-logo').forEach(function (o) {
    o.addEventListener('error', function () { o.remove(); });
    if (o.complete && !o.naturalWidth) o.remove();
  });

  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  var scrim = document.querySelector('.scrim');
  if (scrim) scrim.addEventListener('click', closeAll);
  document.querySelectorAll('.mega-btn').forEach(function (b) {
    if (!matchMedia('(hover: hover) and (min-width: 1040px)').matches) return;
    var mega = document.querySelector('.mega'), head = b.closest('.head'), t;
    function open() { clearTimeout(t); closeAll(); mega.classList.add('open'); b.setAttribute('aria-expanded', 'true'); scrimSync(); }
    function close() {
      // Zavírá se se zpožděním, ne hned. Kdyby se hlídalo jen tlačítko,
      // menu by zmizelo v mezeře mezi ním a panelem — a odkaz by nešel kliknout.
      if (t) return;   // jeden časovač; jinak by ho každý pohyb odsouval (s145)
      t = setTimeout(function () { t = null; mega.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); scrimSync(); }, 260);
    }
    function drz() { clearTimeout(t); t = null; }
    /* Přejezd na jinou položku, logo nebo tlačítko panel zavře (s145).
       Dřív se zavíral jen při opuštění celé hlavičky, takže nad ostatními
       položkami visel dál. */
    head.addEventListener('mousemove', function (e) {
      if (!mega.classList.contains('open')) return;
      if (e.target.closest('.mega, .mega-btn')) drz(); else close();
    });
    /* Otevřít až po 200 ms skutečného setrvání (s144). Chrome po scrollu
       posílá syntetický `mouseenter`/`mousemove` s nulovým `movement`,
       takže lepivá hlavička vyjetá pod stojící kurzor panel neotevře;
       projetí lišty ho nestihne. */
    var zamer;
    b.addEventListener('mousemove', function (e) {
      if (zamer || mega.classList.contains('open')) return;
      if (!e.movementX && !e.movementY) return;
      zamer = setTimeout(function () { zamer = null; open(); }, 200);
    });
    b.addEventListener('mouseleave', function () { clearTimeout(zamer); zamer = null; });
    head.addEventListener('mouseenter', drz);
    head.addEventListener('mouseleave', close);
  });
  // zvýraznění aktivní kapitoly v průvodci
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        /* `s93` zrušil rozcestník vlevo a nahradil ho řádkem pilulek nad
           kapitolami. Párujeme přes `href`, ne přes `data-ch` — pilulky
           jsou obyčejné kotvy a druhý atribut s toutéž informací by byl
           jen další místo, kde se to může rozejít. */
        document.querySelectorAll('.rozcestnik a, .kap-lista a').forEach(function (a) {   /* s212: i lišta kapitol */
          var je = a.getAttribute('href') === '#' + en.target.id;   /* s196: i aria-current */
          a.classList.toggle('on', je);
          if (je) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-96px 0px -60% 0px' });
    document.querySelectorAll('.chapter').forEach(function (c) { io.observe(c); });
  }
})();

  /* ── Hero přes celou obrazovku — viz _build/s70_hero.py ─────────────
     Hlavička leží na videu a po odjetí hera se vrací na bílou. Logo je
     `<img>`, takže se nepřebarvuje sazbou, ale výměnou souboru. */
  (function () {
    var hlava = document.querySelector('.head');
    var hero = document.querySelector('.hero');
    if (!hlava || !hero) return;
    var logo = hlava.querySelector('.logo img');
    var tmave = logo && logo.getAttribute('src');
    var svetle = tmave && tmave.replace('logo-fragmento.svg', 'logo-fragmento-light.svg');
    if (!svetle || svetle === tmave) svetle = tmave;

    function stav() {
      /* Stačí, aby se stránka hnula. Plynulost dělá `transition` v sazbě,
         ne velký práh — ten by jen oddálil okamžik, kdy se to přepne. */
      var pevna = window.scrollY > 10;
      hlava.classList.toggle('pevna', pevna);
      hlava.classList.toggle('u-hera', hero.getBoundingClientRect().bottom > 72);
    }

    window.addEventListener('scroll', stav, { passive: true });
    window.addEventListener('resize', stav);
    stav();
  })();

  /* ── Filtr výpisu: jeden řádek, výběr s počty, panel na mobilu (s162) ──
     Varianta A z plátna 10. 9. Uvnitř osy se volby sčítají (Bali nebo
     Thajsko), mezi osami zužují. Stav je v adrese: jediná hodnota země nebo
     povahy jde do cesty, ostatní do parametrů. Na filtrované stránce karty
     ostatních míst nejsou, proto se tam při změně naviguje na výpis.

     Mobilní panel je `<dialog>` a volby se do něj stěhují, nekopírují —
     jinak by existovaly dvakrát a jednou by se rozešly. */
  (function () {
    var ft = document.querySelector('[data-filtr3]');
    var mrizka = document.querySelector('[data-mrizka]');
    if (!ft || !mrizka) return;
    var plny = mrizka.hasAttribute('data-plny');
    var OSY = ['zeme', 'povaha', 'cena'];
    var karty = [].slice.call(mrizka.querySelectorAll('.card'));
    var celkem = parseInt(ft.getAttribute('data-celkem'), 10) || karty.length;
    /* s189: volby zemí stojí v pásu pod nadpisem, mimo lištu filtru. */
    var volby = [].slice.call(document.querySelectorAll('[data-filtr3] .ft-opt, [data-ft-mimo] .ft-opt'));
    var pops = [].slice.call(ft.querySelectorAll('.ft-pop'));
    var obalPops = ft.querySelector('.ft-pops');
    var rada = ft.querySelector('.ft-rada');
    var sw = ft.querySelector('[data-volne]');
    var swLabel = sw ? sw.closest('.ft-sw') : null;
    var sheet = document.querySelector('[data-sheet]');
    var telo = sheet ? sheet.querySelector('[data-telo]') : null;
    var mob = ft.querySelector('.ft-mob');
    var pocet = ft.querySelector('[data-ft-pocet]');
    var aktivni = ft.querySelector('[data-aktivni]');
    var prazdno = ft.querySelector('[data-prazdno]');

    /* Slug ↔ hodnota se čte z odkazů voleb, ne z druhé tabulky. */
    var slug = {}, zeSlugu = {};
    volby.forEach(function (a) {
      var m = (a.getAttribute('href') || '').match(/([a-z0-9-]+)\/$/);
      if (!m) return;
      slug[a.getAttribute('data-os') + ':' + a.getAttribute('data-hod')] = m[1];
      zeSlugu[m[1]] = [a.getAttribute('data-os'), a.getAttribute('data-hod')];
    });
    var cesta = location.pathname;
    var konec = cesta.replace(/\/+$/, '').split('/').pop();
    var koren = zeSlugu[konec] ? cesta.replace(/[^/]+\/?$/, '') : cesta.replace(/index\.html$/, '');
    var vlastniOs = zeSlugu[konec] ? zeSlugu[konec][0] : null;   /* s198 */

    function prazdny() { return { zeme: [], povaha: [], cena: [], volne: false }; }
    function zeURL() {
      var st = prazdny(), q = new URLSearchParams(location.search);
      OSY.forEach(function (o) { if (q.get(o)) st[o] = q.get(o).split(',').filter(Boolean); });
      st.volne = q.get('volne') === '1' || q.get('dostupnost') === 'volna';
      var z = zeSlugu[location.pathname.replace(/\/+$/, '').split('/').pop()];
      if (z && st[z[0]].indexOf(z[1]) < 0) st[z[0]].push(z[1]);
      return st;
    }
    var stav = zeURL();

    function voleb(st) { return st.zeme.length + st.povaha.length + st.cena.length + (st.volne ? 1 : 0); }
    function jedina(st) {
      if (voleb(st) !== 1) return null;
      if (st.zeme.length && slug['zeme:' + st.zeme[0]]) return ['zeme', st.zeme[0]];
      if (st.povaha.length && slug['povaha:' + st.povaha[0]]) return ['povaha', st.povaha[0]];
      return null;
    }
    function adresa(st) {
      /* s198: na výpisu (plny) se adresa nesmí přesunout do jiné složky —
         dokument zůstává a jeho relativní odkazy by se složily špatně. */
      var j = plny ? null : jedina(st);
      if (j) return koren + slug[j[0] + ':' + j[1]] + '/';
      var q = [];
      OSY.forEach(function (o) { if (st[o].length) q.push(o + '=' + st[o].map(encodeURIComponent).join(',')); });
      if (st.volne) q.push('volne=1');
      return koren + (q.length ? '?' + q.join('&') : '');
    }
    function hodnoty(k, o) { return (k.getAttribute('data-' + o) || '').split(' '); }
    function sedi(k, st, bez) {
      for (var i = 0; i < OSY.length; i++) {
        var o = OSY[i];
        if (o === bez || !st[o].length) continue;
        var v = hodnoty(k, o);
        if (!st[o].some(function (x) { return v.indexOf(x) >= 0; })) return false;
      }
      return !(st.volne && k.getAttribute('data-dostupnost') !== 'volna');
    }
    function tvar(n) { return n === 1 ? 'nemovitost' : (n >= 2 && n <= 4 ? 'nemovitosti' : 'nemovitostí'); }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function volba(o, h) { return volby.filter(function (x) { return x.getAttribute('data-os') === o && x.getAttribute('data-hod') === h; })[0]; }

    function pouzij() {
      var vidno = 0;
      karty.forEach(function (k) {
        var ven = plny && !sedi(k, stav);
        k.classList.toggle('odfiltrovano', ven);
        if (!ven) vidno++;
      });
      volby.forEach(function (a) {
        var o = a.getAttribute('data-os'), h = a.getAttribute('data-hod');
        var vyb = stav[o].indexOf(h) >= 0;
        a.classList.toggle('on', vyb);
        a.setAttribute('aria-checked', vyb ? 'true' : 'false');
        /* s198: na filtrované stránce jsou v mřížce právě karty jejího výběru,
           takže počty ostatních os se spočítají z nich. Vlastní osa stránky
           (země na stránce země) zůstává ze sestavení, protože se v ní volby
           sčítají. Volba s nulou by vedla na prázdný výpis: zašedlá, nejde vybrat. */
        var c = a.querySelector('.c');
        if (!c) return;
        var n;
        if (plny || o !== vlastniOs) {
          n = karty.filter(function (k) { return sedi(k, stav, o) && hodnoty(k, o).indexOf(h) >= 0; }).length;
          c.textContent = n;
        } else {
          n = parseInt(c.textContent, 10) || 0;
        }
        var mrtva = n === 0 && !vyb;
        a.classList.toggle('prazdna', mrtva);
        if (mrtva) a.setAttribute('aria-disabled', 'true'); else a.removeAttribute('aria-disabled');
      });
      /* s199: dostupné země dopředu. Na mobilu je pás posuvný a první viditelné
         chipy mají být ty, které něco najdou. Přesouvají se uzly, ne CSS `order`,
         aby pořadí tabulátoru odpovídalo obrazovce; uvnitř skupin platí pořadí
         z katalogu. */
      [].forEach.call(document.querySelectorAll('.ft-zeme-pas'), function (pas) {
        var chipy = [].slice.call(pas.children).filter(function (x) { return x.classList.contains('ft-zc'); });
        if (chipy.length < 2) return;
        chipy.forEach(function (x, i) { if (!x.hasAttribute('data-poradi')) x.setAttribute('data-poradi', i); });
        var serazene = chipy.slice().sort(function (x, y) {
          var px = x.classList.contains('prazdna') ? 1 : 0, py = y.classList.contains('prazdna') ? 1 : 0;
          return px - py || (+x.getAttribute('data-poradi')) - (+y.getAttribute('data-poradi'));
        });
        if (serazene.every(function (x, i) { return x === chipy[i]; })) return;
        var fokus = document.activeElement;
        var mel = fokus && pas.contains(fokus);
        serazene.forEach(function (x) { pas.appendChild(x); });
        if (mel && document.activeElement !== fokus) fokus.focus({ preventScroll: true });
        var ukaz = mel ? fokus : pas.querySelector('.ft-zc.on');
        if (pas.scrollWidth > pas.clientWidth) {
          if (ukaz) {
            var r = ukaz.getBoundingClientRect(), p = pas.getBoundingClientRect();
            if (r.left < p.left || r.right > p.right) pas.scrollLeft += r.left - p.left - 20;
          } else {
            pas.scrollLeft = 0;
          }
        }
      });
      [].forEach.call(ft.querySelectorAll('.ft-btn[data-os]'), function (b) {
        var n = stav[b.getAttribute('data-os')].length, c = b.querySelector('.ft-n');
        c.textContent = n; c.hidden = !n; b.classList.toggle('on', n > 0);
      });
      var vse = voleb(stav);
      /* s189: země mají vlastní pás, „Filtry“ počítá jen to, co je v panelu. */
      if (mob) { var mc = mob.querySelector('.ft-n'), vm = vse - stav.zeme.length; mc.textContent = vm; mc.hidden = !vm; }
      if (sw) sw.checked = stav.volne;
      if (pocet) pocet.innerHTML = '<b>' + vidno + '</b> z ' + celkem + ' ' + (celkem === 1 ? 'nemovitosti' : 'nemovitostí');
      /* s189: počet pod lepivou lištou na mobilu a „Zrušit filtry“ podle stavu. */
      [].forEach.call(document.querySelectorAll('[data-ft-pocet-m]'), function (s) { s.innerHTML = '<b>' + vidno + '</b> z ' + celkem + ' ' + (celkem === 1 ? 'nemovitosti' : 'nemovitostí'); });
      [].forEach.call(document.querySelectorAll('[data-zrus-vse]'), function (z) { z.hidden = !vse; });
      [].forEach.call(document.querySelectorAll('[data-cta]'), function (s) { s.textContent = vidno + ' ' + tvar(vidno); });
      if (prazdno) prazdno.hidden = vidno > 0;
      if (aktivni) {
        var html = '';
        OSY.forEach(function (o) {
          stav[o].forEach(function (h) {
            var a = volba(o, h);
            if (!a) return;
            var lb = a.getAttribute('data-lb');
            html += '<button type="button" class="ft-pill" data-os="' + o + '" data-hod="' + esc(h) + '" aria-label="Zrušit filtr ' + esc(lb) + '">' + esc(lb) + '<b aria-hidden="true">×</b></button>';
          });
        });
        if (stav.volne) html += '<button type="button" class="ft-pill" data-os="volne" aria-label="Zrušit filtr jen volné podíly">jen volné podíly<b aria-hidden="true">×</b></button>';
        if (vse > 1) html += '<button type="button" class="ft-zrus" data-zrus="">Zrušit vše</button>';
        aktivni.innerHTML = html;
        aktivni.hidden = !vse;
      }
    }

    function nazvy() {
      var j = jedina(stav), d = { zeme: '', povaha: '' };
      if (j) d[j[0]] = j[1];
      return d;
    }
    function zmena() {
      if (!plny) { location.href = adresa(stav); return; }
      /* s221: jediná země nebo povaha na výpisu → skutečná stránka filtru
         s čistou adresou (vlastní H1, title a canonical). Přepis adresy na
         místě rozbíjel relativní odkazy (s198), proto přechod. */
      if (jedina(stav)) {
        var j1 = jedina(stav);
        location.href = koren + slug[j1[0] + ':' + j1[1]] + '/';
        return;
      }
      pouzij();
      history.pushState({ f: 1 }, '', adresa(stav));
      window.dispatchEvent(new CustomEvent('filtr:zmena', { detail: nazvy() }));
    }

    /* ── výběr pod tlačítkem (desktop) ── */
    var otevrena = null;
    function zavriPop(vratit) {
      if (!otevrena) return;
      var b = ft.querySelector('.ft-btn[data-os="' + otevrena.getAttribute('data-pop') + '"]');
      otevrena.hidden = true;
      if (b) { b.setAttribute('aria-expanded', 'false'); if (vratit) b.focus(); }
      otevrena = null;
    }
    function otevriPop(b, klavesnice) {
      var p = ft.querySelector('.ft-pop[data-pop="' + b.getAttribute('data-os') + '"]');
      if (!p) return;
      var byla = otevrena === p;
      zavriPop(false);
      if (byla) return;
      p.hidden = false;
      var r = b.getBoundingClientRect(), f = obalPops.getBoundingClientRect();
      p.style.left = Math.max(0, Math.min(r.left - f.left, f.width - p.offsetWidth)) + 'px';
      b.setAttribute('aria-expanded', 'true');
      otevrena = p;
      if (klavesnice) { var prvni = p.querySelector('.ft-opt'); if (prvni) prvni.focus(); }
    }

    /* ── spodní panel (mobil) ── */
    function otevriPanel() {
      if (!sheet || !telo || typeof sheet.showModal !== 'function') return;
      zavriPop(false);
      pops.forEach(function (p) { p.hidden = false; p.style.left = ''; telo.appendChild(p); });
      if (swLabel) telo.appendChild(swLabel);
      sheet.showModal();
      if (mob) mob.setAttribute('aria-expanded', 'true');
    }
    if (sheet) {
      sheet.addEventListener('close', function () {
        pops.forEach(function (p) { p.hidden = true; obalPops.appendChild(p); });
        if (swLabel) rada.insertBefore(swLabel, rada.querySelector('[data-zrus-vse]') || rada.querySelector('.sp'));
        if (mob) { mob.setAttribute('aria-expanded', 'false'); mob.focus(); }
      });
      /* Klik na clonu míří na samotný dialog. */
      sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    }
    var uzko = matchMedia('(max-width: 699px)');
    if (uzko.addEventListener) uzko.addEventListener('change', function () { if (sheet && sheet.open) sheet.close(); zavriPop(false); });

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.closest || !(t.closest('[data-filtr3]') || t.closest('[data-sheet]') || t.closest('[data-ft-mimo]'))) { zavriPop(false); return; }
      var a = t.closest('.ft-opt');
      if (a) {
        e.preventDefault();
        if (a.getAttribute('aria-disabled') === 'true') return;
        var o = a.getAttribute('data-os'), h = a.getAttribute('data-hod'), i = stav[o].indexOf(h);
        if (i >= 0) stav[o].splice(i, 1); else stav[o].push(h);
        zmena();
        return;
      }
      var b = t.closest('.ft-btn[data-os]');
      if (b) { otevriPop(b, e.detail === 0); return; }
      if (t.closest('.ft-mob')) { otevriPanel(); return; }
      var pill = t.closest('.ft-pill');
      if (pill) {
        var po = pill.getAttribute('data-os');
        if (po === 'volne') stav.volne = false;
        else { var j = stav[po].indexOf(pill.getAttribute('data-hod')); if (j >= 0) stav[po].splice(j, 1); }
        zmena();
        return;
      }
      var z = t.closest('[data-zrus]');
      if (z) {
        var zo = z.getAttribute('data-zrus');
        if (zo) stav[zo] = []; else stav = prazdny();
        zmena();
        return;
      }
      if (t.closest('[data-zavri]')) {
        if (sheet && sheet.open) sheet.close(); else zavriPop(true);
        return;
      }
      if (!t.closest('.ft-pop')) zavriPop(false);
    });
    if (sw) sw.addEventListener('change', function () { stav.volne = sw.checked; zmena(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && otevrena) { zavriPop(true); return; }
      /* Volba je odkaz s rolí zaškrtávátka: mezerník ji má přepnout, ne rolovat stránkou. */
      if (e.key === ' ' && e.target.classList && e.target.classList.contains('ft-opt') && e.target.tagName === 'A') {
        e.preventDefault();
        e.target.click();
      }
    });
    window.addEventListener('popstate', function () {
      if (!plny) return;
      stav = zeURL();
      pouzij();
      window.dispatchEvent(new CustomEvent('filtr:zmena', { detail: nazvy() }));
    });

    pouzij();
    /* Příchod s parametry: nadpis podle stavu hned. Posluchač z s84 se
       registruje až za tímhle blokem, proto až v dalším tahu. */
    if (plny && voleb(stav)) setTimeout(function () { window.dispatchEvent(new CustomEvent('filtr:zmena', { detail: nazvy() })); }, 0);
  })();

  /* ── Nadpis a title při filtrování na místě — viz s84 ───────────────
     Texty se čtou z bloku, který vysázel generátor ze skutečných
     filtrovaných stránek. Psát je sem podruhé by znamenalo, že se
     jednou rozejdou s tím, co vidí robot. */
  (function () {
    var zdroj = document.getElementById('filtr-nazvy');
    var h1 = document.querySelector('.phead h1');
    if (!zdroj || !h1) return;
    var nazvy = JSON.parse(zdroj.textContent);
    var kanon = document.querySelector('link[rel="canonical"]');
    var posledni = document.querySelector('.crumb > span:last-child');
    var puvodni = {
      h1: h1.textContent, title: document.title,
      kanon: kanon ? kanon.getAttribute('href') : null,
      crumb: posledni ? posledni.textContent : null
    };

    window.addEventListener('filtr:zmena', function (e) {
      var st = e.detail || {};
      /* Do cesty jde jen jedna osa a přednost má země — stejné pravidlo
         jako v `s82`, jinak by nadpis ukazoval jinam než adresa. */
      var osa = st.zeme ? 'zeme' : (st.povaha ? 'povaha' : null);
      var z = osa && nazvy[osa] ? nazvy[osa][st[osa]] : null;
      h1.textContent = z ? z.h1 : puvodni.h1;
      document.title = z ? z.title : puvodni.title;
      if (kanon) kanon.setAttribute('href', z ? z.url : puvodni.kanon);
      if (posledni) posledni.textContent = z ? z.crumb : puvodni.crumb;
    });
  })();

  /* ── Otevřít odpověď, na kterou míří adresa — viz s118 ───────────────
     Odkaz „CZK · EUR“ z horní lišty vede na konkrétní otázku. Bez tohohle
     by stránka jen odrolovala k zavřené rozbalovačce a odpověď by zůstala
     schovaná. */
  (function () {
    var otevri = function () {
      var id = location.hash.slice(1);
      if (!id) return;
      var cil = document.getElementById(id);
      if (!cil || !cil.classList.contains('acc')) return;
      /* Rozbalovačka se řídí `data-open` na `.acc`, ne `aria-expanded` na
         hlavičce. Nastavit rovnou, ne klikat — kliknutí přepíná, takže by
         druhý příchod na tutéž adresu odpověď zase zavřel. */
      cil.setAttribute('data-open', '1');
      var hlava = cil.querySelector('.acc-head');   /* s196 */
      if (hlava) hlava.setAttribute('aria-expanded', 'true');
      cil.scrollIntoView({ block: 'center' });
    };
    otevri();
    window.addEventListener('hashchange', otevri);
  })();

  /* ── Měna cen CZK / EUR (s177) ────────────────────────────────────────
     Ceny v textu nesou `data-czk` (a u cen nemovitostí přesné `data-eur`
     z fragmento.cz). Ostatní částky se přepočítají kurzem a zaokrouhlí.
     Volba se pamatuje; kalkulačka splátek poslouchá `mena:zmena`. */
  (function () {
    var KURZ = 24.164;               /* CZK za 1 EUR, medián poměru cen z fragmento.cz; při integraci z API */
    var KLIC = 'fragmento-mena';
    function cislo(x, nb) { return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, nb ? '\u00a0' : ' '); }
    function eur(czk) {
      var e = czk / KURZ;
      return e < 1000 ? Math.round(e / 10) * 10 : (e < 100000 ? Math.round(e / 50) * 50 : Math.round(e / 100) * 100);
    }
    var mena = 'czk';
    try { if (localStorage.getItem(KLIC) === 'eur') mena = 'eur'; } catch (e) {}
    /* Pro kalkulačku a další JS: částka v Kč → text ve zvolené měně. */
    window.fragmentoMena = {
      get: function () { return mena; },
      format: function (czk, nb) { return mena === 'eur' ? cislo(eur(czk), nb) + (nb ? '\u00a0' : ' ') + '€' : cislo(czk, nb) + (nb ? '\u00a0' : ' ') + 'Kč'; },
      cislo: function (czk, nb) { return mena === 'eur' ? cislo(eur(czk), nb) : cislo(czk, nb); },
      jednotka: function () { return mena === 'eur' ? '€' : 'Kč'; }
    };
    function prekresli() {
      document.documentElement.setAttribute('data-mena', mena);
      document.querySelectorAll('.cena-m[data-czk]').forEach(function (el) {
        if (el.dataset.puvodni === undefined) el.dataset.puvodni = el.textContent;
        if (mena === 'czk') { el.textContent = el.dataset.puvodni; return; }
        var nb = el.dataset.puvodni.indexOf('\u00a0') >= 0;
        var e = el.dataset.eur ? +el.dataset.eur : eur(+el.dataset.czk);
        el.textContent = el.dataset.fmt === 'tis'
          ? Math.round(e / 1000) + (nb ? '\u00a0' : ' ') + 'tis.' + (nb ? '\u00a0' : ' ') + '€'
          : cislo(e, nb) + (nb ? '\u00a0' : ' ') + '€';
      });
      document.querySelectorAll('[data-mena-jednotka]').forEach(function (el) {
        el.textContent = el.getAttribute('data-mena-jednotka').replace('{m}', mena === 'eur' ? '€' : 'Kč');
      });
      document.querySelectorAll('[data-mena]').forEach(function (b) {
        if (b.tagName !== 'BUTTON') return;
        b.setAttribute('aria-pressed', mena === 'eur' ? 'true' : 'false');
      });
      window.dispatchEvent(new CustomEvent('mena:zmena', { detail: mena }));
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-mena]');
      if (!b) return;
      mena = mena === 'eur' ? 'czk' : 'eur';
      try { localStorage.setItem(KLIC, mena); } catch (err) {}
      prekresli();
    });
    /* Jiný panel téhož webu přepnul měnu: srovnat i tady. */
    window.addEventListener('storage', function (e) {
      if (e.key !== KLIC) return;
      mena = e.newValue === 'eur' ? 'eur' : 'czk';
      prekresli();
    });
    prekresli();
  })();

  /* ── Newsletter (s179) ───────────────────────────────────────────────
     Stejná kontrola e-mailu jako u poptávky; hláška visí na poli přes
     `aria-describedby`. Bez `data-endpoint` se ukáže potvrzení a varování. */
  document.querySelectorAll('[data-newsletter]').forEach(function (f) {
    var pole = f.querySelector('input[name="email"]');
    var chyba = f.querySelector('.nl-chyba');
    var hotovo = f.parentNode.querySelector('.nl-hotovo');
    function zkontroluj() { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(pole.value.trim()) ? '' : 'Tenhle e-mail nevypadá úplně, zkontrolujte ho prosím.'; }
    function ukaz(t) { chyba.textContent = t; f.classList.toggle('nl-chybne', !!t); pole.setAttribute('aria-invalid', t ? 'true' : 'false'); }
    pole.addEventListener('input', function () { if (f.classList.contains('nl-chybne')) ukaz(zkontroluj()); });
    function uspech() { f.hidden = true; if (hotovo) { hotovo.hidden = false; hotovo.focus({ preventScroll: true }); } }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = zkontroluj(); ukaz(t);
      if (t) { pole.focus(); return; }
      var cil = f.dataset.endpoint;
      if (!cil) { console.warn('Newsletter: chybí data-endpoint, nic se neodeslalo.'); uspech(); return; }
      var tl = f.querySelector('button[type="submit"]'); tl.disabled = true;
      fetch(cil, { method: 'POST', body: new FormData(f) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); uspech(); })
        .catch(function () { tl.disabled = false; ukaz('Přihlášení se nepovedlo. Zkuste to prosím znovu.'); });
    });
  });

/* ── Patička: sbalovací skupiny na mobilu (s181) ─────────────────────
   „Jak koupit“ a „Fragmento“ se pod 700 px sbalí. Tlačítko vzniká tady,
   ne v markupu: na desktopu je nadpis jen nadpis a bez JS je vše otevřené.
   Při přechodu přes hranici (otočení tabletu) se stav vrátí. */
(function () {
  var skupiny = document.querySelectorAll('.pata-sl[data-sbal]');
  if (!skupiny.length) return;
  var mq = matchMedia('(max-width: 699px)');
  var IKONA = '<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
    + '<path d="M4 10h12"/><path class="svisla" d="M10 4v12"/></svg>';
  function nastav() {
    skupiny.forEach(function (s) {
      var h = s.querySelector('.pata-nad'), panel = s.querySelector('.pata-panel');
      if (!h || !panel) return;
      var b = h.querySelector('.pata-prep');
      if (mq.matches && !b) {
        b = document.createElement('button');
        b.type = 'button';
        b.className = 'pata-prep';
        b.setAttribute('aria-expanded', 'false');
        b.setAttribute('aria-controls', panel.id);
        b.innerHTML = '<span></span>' + IKONA;
        b.firstChild.textContent = h.textContent;
        h.textContent = '';
        h.appendChild(b);
        panel.hidden = true;
        b.addEventListener('click', function () {
          var otevrit = b.getAttribute('aria-expanded') !== 'true';
          b.setAttribute('aria-expanded', otevrit ? 'true' : 'false');
          panel.hidden = !otevrit;
        });
      } else if (!mq.matches && b) {
        h.textContent = b.firstChild.textContent;
        panel.hidden = false;
      }
    });
  }
  nastav();
  if (mq.addEventListener) mq.addEventListener('change', nastav); else mq.addListener(nastav);
})();
/* ── konec sbalovací patičky (s181) ── */

/* ── Menu „Místa v menu“ (s182) ────────────────────────────────────
   Kontinenty v zásuvce se rozbalují tlačítkem s `aria-expanded`. Tlačítko
   menu po otevření čte „Zavřít menu“. Segment měny: klepnutí na už zvolenou
   měnu nic nepřepne (s177 jinak přepíná při každém kliku). */
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.dr-kont-b') : null;
    if (!b) return;
    var panel = document.getElementById(b.getAttribute('aria-controls'));
    var otevrit = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', otevrit ? 'true' : 'false');
    if (panel) panel.hidden = !otevrit;
  });
  document.addEventListener('click', function (e) {
    var m = e.target.closest ? e.target.closest('.dr-mena [data-m]') : null;
    if (!m) return;
    if (m.getAttribute('data-m') === (document.documentElement.getAttribute('data-mena') || 'czk')) {
      e.stopPropagation(); e.preventDefault();
    }
  }, true);
  var burger = document.querySelector('.burger');
  if (burger && 'MutationObserver' in window) {
    new MutationObserver(function () {
      burger.setAttribute('aria-label', burger.getAttribute('aria-expanded') === 'true' ? 'Zavřít menu' : 'Menu');
    }).observe(burger, { attributes: true, attributeFilter: ['aria-expanded'] });
  }
})();
/* ── konec menu Místa v menu (s182) ── */

/* ── Splátky na kartě (s184) ──────────────────────────────────────────
   „Až 80 % na splátky“ je uvnitř karty-odkazu, odkazem být nemůže. Klik
   zachytí obsluha ve fázi capture a pošle na kalkulačku s cenou podílu. */
(function () {
  document.addEventListener('click', function (e) {
    var s = e.target.closest ? e.target.closest('.card .karta-spl[data-splatky]') : null;
    if (!s || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); e.stopPropagation();
    location.href = s.getAttribute('data-splatky');
  }, true);
})();
/* ── konec splátek na kartě (s184) ── */

/* ── Kalkulačka: lepivá splátka pod hlavičkou (s194) ──────────────────────
   Pod 1040 px je pruh se splátkou `position: sticky`. Hlavička se při
   scrollu dolů schová a nahoru vrátí (transform), takže pevné `top` by
   pruh buď nechalo pod hlavičkou, nebo s mezerou nad sebou. Odsazení
   se proto bere z dolní hrany hlavičky. */
(function () {
  var k = document.querySelector('[data-kalk]');
  var hlava = document.querySelector('.head');
  if (!k || !hlava) return;
  var ceka = false;
  function nastav() {
    ceka = false;
    k.style.setProperty('--kalk-top', Math.max(0, Math.round(hlava.getBoundingClientRect().bottom)) + 'px');
  }
  function plan() { if (!ceka) { ceka = true; requestAnimationFrame(nastav); } }
  addEventListener('scroll', plan, { passive: true });
  addEventListener('resize', plan);
  hlava.addEventListener('transitionend', plan);
  hlava.addEventListener('transitionrun', function () { setTimeout(plan, 140); });
  nastav();
})();
/* ── konec lepivé splátky (s194) ── */

/* ── Skládačka balíčků: předvolby a výběr míst (s195) ──────────────────
   Předvolba vybere místa a panel ukáže název, popis, dny a zamčenou cenu
   balíčku. Výběr, který se s žádnou předvolbou nekryje, je „Vlastní
   sestava“: dny 44 × počet míst, cena jako součet `data-cena` dlaždic
   (nejlevnější volný podíl 1/8 v zemi, z katalogu). Místo bez `data-cena`
   cenu nemá. Ceny jdou přes `fragmentoMena`, takže drží přepínač CZK/EUR. */
(function () {
  var sk = document.querySelector('[data-skladacka]');
  if (!sk) return;
  var pres = [].slice.call(sk.querySelectorAll('.pre'));
  var mista = [].slice.call(sk.querySelectorAll('.pick'));
  var PODILY = ['', 'Jeden podíl', 'Dva podíly', 'Tři podíly', 'Čtyři podíly', 'Pět podílů', 'Šest podílů'];
  var ZEMICH = ['', 'v jedné zemi', 've dvou zemích', 've třech zemích', 've čtyřech zemích', 'v pěti zemích', 'v šesti zemích'];
  var STARTY = [[], [2], [2, 27], [2, 19, 36], [2, 15, 28, 41], [2, 12, 22, 32, 42], [1, 9, 18, 27, 36, 45]];
  function vse(sel) { return [].slice.call(sk.querySelectorAll(sel)); }
  function text(sel, t) { vse(sel).forEach(function (e) { e.textContent = t; }); }
  function skryj(sel, ano) { vse(sel).forEach(function (e) { e.hidden = ano; }); }
  function kc(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Kč'; }
  function klic(a) { return a.slice().sort().join(' '); }
  function zapnute(m) { return m.getAttribute('aria-pressed') === 'true'; }

  function vykresli(ohlasit) {
    var sel = mista.filter(zapnute), n = sel.length;
    var k = klic(sel.map(function (m) { return m.dataset.misto; }));
    var p = pres.filter(function (b) { return klic(b.dataset.mista.split(' ')) === k; })[0] || null;
    pres.forEach(function (b) { b.setAttribute('aria-pressed', b === p ? 'true' : 'false'); });
    var nazev = p ? p.querySelector('.pre-t').textContent : 'Vlastní sestava';
    var cena = null;
    if (p) cena = +p.dataset.cena;
    else if (n && sel.every(function (m) { return m.dataset.cena; })) {
      cena = sel.reduce(function (s, m) { return s + +m.dataset.cena; }, 0);
    }
    text('.skl-nazev', nazev);
    text('.skl-lista-t', n ? nazev : 'Vyberte aspoň jedno místo.');
    var popis = sk.querySelector('.skl-popis');
    popis.textContent = p ? p.dataset.popis : '';
    popis.hidden = !p;

    var ul = sk.querySelector('.skl-mista');
    ul.textContent = '';
    sel.forEach(function (m) {
      var li = document.createElement('li'), f = m.querySelector('.flag');
      if (f) li.appendChild(f.cloneNode(true));
      li.appendChild(document.createTextNode(m.querySelector('.nm').textContent));
      ul.appendChild(li);
    });
    var tydny = {};
    (STARTY[n] || []).forEach(function (s) { tydny[s] = tydny[s + 1] = tydny[s + 2] = true; });
    vse('.skl-rok .year i').forEach(function (d, i) { d.classList.toggle('mine', !!tydny[i]); });

    text('.skl-dny', String(44 * n));
    text('.skl-leg', 'vaše dny ' + (ZEMICH[n] || ''));
    text('.skl-kde', ZEMICH[n] || '');
    text('.skl-podily', (PODILY[n] || n + ' podílů') + ' 1/8 od');
    if (cena !== null) {
      vse('.skl-cena').forEach(function (e) {
        e.dataset.czk = cena;
        e.dataset.puvodni = kc(cena);
        e.textContent = window.fragmentoMena ? window.fragmentoMena.format(cena, true) : kc(cena);
      });
    }
    skryj('.skl-mista, .skl-rok, .skl-fakta, .skl-lista-r', !n);
    skryj('.skl-prazdne', n > 0);
    skryj('.skl-cena-bunka, .skl-lista .skl-cena', cena === null);
    skryj('.skl-chybi', !n || cena !== null);
    if (ohlasit) {
      text('.skl-stav', n ? nazev + ': ' + 44 * n + ' dní ročně'
        + (cena !== null ? ', ' + sk.querySelector('.skl-cena').textContent : '') : 'Vyberte aspoň jedno místo.');
    }
  }

  sk.addEventListener('click', function (e) {
    var b = e.target.closest('.pre');
    if (b) {
      var chci = b.dataset.mista.split(' ');
      mista.forEach(function (m) { m.setAttribute('aria-pressed', chci.indexOf(m.dataset.misto) >= 0 ? 'true' : 'false'); });
      vykresli(true);
      return;
    }
    var m = e.target.closest('.pick');
    if (m) {
      m.setAttribute('aria-pressed', zapnute(m) ? 'false' : 'true');
      vykresli(true);
    }
  });
  vykresli(false);
})();
/* ── konec skládačky balíčků (s195) ── */

/* ── Bublina splátek s Essoxem (s202) ─────────────────────────────────────
   „Až 80 % na splátky“ na kartě: bublina s logem Essoxu pod řádkem. Myš:
   najetí. Klávesnice: fokus karty. Dotyk: první klepnutí otevře, druhé
   pustí klik dál k obsluze s184 (kalkulačka s cenou). */
(function () {
  var SEL = '.card .karta-spl[data-splatky]';
  var bub = null, kotva = null, dotyk = false, mysi = false, zavri_t = 0, mys = null;

  function vytvor() {
    if (bub) return bub;
    bub = document.createElement('div');
    bub.className = 'spl-bublina';
    bub.id = 'spl-bublina';
    bub.setAttribute('role', 'tooltip');
    bub.innerHTML = '<img alt="Essox" width="52" height="20"><span class="spl-bublina-v">Až 80\u00a0% na splátky.</span>' +
      '<span class="spl-bublina-c"><span class="spl-bublina-t"></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    document.body.appendChild(bub);
    return bub;
  }

  function umisti() {
    if (!bub || !kotva) return;
    var r = kotva.getBoundingClientRect();
    var sirka = document.documentElement.clientWidth;
    var w = bub.offsetWidth;
    var x = Math.max(8, Math.min(r.left - 8, sirka - w - 8));
    bub.style.left = (x + window.scrollX) + 'px';
    bub.style.top = (r.bottom + window.scrollY + 12) + 'px';
    /* špička míří na ikonu „i“ (8 px od levé hrany řádku) */
    bub.style.setProperty('--sipka', Math.max(10, Math.min(r.left + 2 - x, w - 22)) + 'px');
  }

  function otevri(s, naDotyk, mysi_) {
    clearTimeout(zavri_t);
    vytvor();
    if (kotva && kotva !== s) zavri(true);
    kotva = s;
    dotyk = !!naDotyk;
    mysi = !!mysi_;
    var pre = s.getAttribute('data-splatky').replace(/splatky\/\?cena=\d*$/, '');
    var img = bub.querySelector('img');
    if (img.getAttribute('src') !== pre + 'assets/brand/logo-essox.svg') img.setAttribute('src', pre + 'assets/brand/logo-essox.svg');
    bub.querySelector('.spl-bublina-t').textContent = (naDotyk ? 'Klepnutím' : 'Kliknutím') + ' spočítáte měsíční splátku';
    s.classList.add('s202-aktivni');
    var karta = s.closest('.card');
    if (karta) karta.setAttribute('aria-describedby', 'spl-bublina');
    umisti();
    bub.classList.add('je-otevrena');
    /* karta se při najetí zvedne o 3 px (přechod .2 s) */
    setTimeout(umisti, 220);
  }

  function zavri(hned) {
    clearTimeout(zavri_t);
    if (!kotva) return;
    var s = kotva;
    kotva = null; dotyk = false; mysi = false;
    s.classList.remove('s202-aktivni');
    var karta = s.closest('.card');
    if (karta && karta.getAttribute('aria-describedby') === 'spl-bublina') karta.removeAttribute('aria-describedby');
    if (bub) bub.classList.remove('je-otevrena');
  }

  function splZ(t) { return t && t.closest ? t.closest(SEL) : null; }

  var posledniUkazatel = 'mouse';
  window.addEventListener('pointerdown', function (e) {
    posledniUkazatel = e.pointerType || 'mouse';
    if (kotva && dotyk && splZ(e.target) !== kotva) zavri(true);
  }, true);

  /* myš: najetí a odjetí. Karta se při najetí zvedne o 3 px a řádek může
     ujet zpod ukazatele, proto se zavírá až mimo řádek s rezervou 6 px. */
  function uvnitr() {
    if (!kotva || !mys) return false;
    var r = kotva.getBoundingClientRect();
    return mys[0] >= r.left - 6 && mys[0] <= r.right + 6 && mys[1] >= r.top - 6 && mys[1] <= r.bottom + 6;
  }
  function mozna_zavri() {
    clearTimeout(zavri_t);
    zavri_t = setTimeout(function () { if (kotva && mysi && !uvnitr()) zavri(); }, 80);
  }
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    mys = [e.clientX, e.clientY];
    var s = splZ(e.target);
    if (s && s !== kotva) otevri(s, false, true);
    else if (s) clearTimeout(zavri_t);
  });
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mys = [e.clientX, e.clientY];
    if (kotva && mysi && !uvnitr()) mozna_zavri();
  }, { passive: true });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType === 'touch' || !kotva || !mysi) return;
    mys = [e.clientX, e.clientY];
    if (splZ(e.target) === kotva && splZ(e.relatedTarget) !== kotva) mozna_zavri();
  });

  /* dotyk: první klepnutí jen otevře; window ve fázi capture je dřív než
     obsluha s184 na document */
  window.addEventListener('click', function (e) {
    var s = splZ(e.target);
    if (!s) return;
    var typ = e.pointerType || posledniUkazatel;
    if (typ !== 'touch' && typ !== 'pen') return;
    if (kotva === s && dotyk) return;          /* druhé klepnutí: na kalkulačku */
    e.preventDefault(); e.stopPropagation();
    otevri(s, true);
  }, true);

  /* klávesnice: fokus karty ukáže bublinu u jejích splátek */
  document.addEventListener('focusin', function (e) {
    var karta = e.target.closest ? e.target.closest('.card') : null;
    var s = karta ? karta.querySelector(SEL) : null;
    if (!s) return;
    var fv = true;
    try { fv = karta.matches(':focus-visible'); } catch (_) {}
    if (fv) otevri(s, false);
  });
  document.addEventListener('focusout', function (e) {
    if (kotva && e.target.contains(kotva) && !dotyk) zavri(true);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && kotva) zavri(true);
  });
  window.addEventListener('resize', function () { if (kotva) zavri(true); });
  window.addEventListener('scroll', function () { if (kotva) umisti(); }, { passive: true });
})();
/* ── konec bubliny splátek (s202) ── */

/* ── Video u kapitoly: lite embed a řádky pod cenou (s205) ── */
(function () {
  /* Náhled s tlačítkem; přehrávač YouTube (bez cookies) se vloží až po kliknutí,
     dostane fokus a stejný název. Enter i mezerník obslouží <button> sám. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.lvid-hraj');
    if (b) {
      var id = b.getAttribute('data-yt') || '';
      if (!/^[\w-]{11}$/.test(id)) return;
      var ram = b.parentElement, f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
      f.title = (b.getAttribute('aria-label') || '').replace(/^Přehrát video: /, 'Video: ');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.setAttribute('allowfullscreen', '');
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      var img = ram.querySelector('img');
      if (img) img.remove();
      b.replaceWith(f);
      ram.classList.add('hraje');
      f.focus();
      return;
    }
    var h = e.target.closest('.cr-hlava');
    if (h) {
      var otevrit = h.getAttribute('aria-expanded') !== 'true';
      var telo = document.getElementById(h.getAttribute('aria-controls'));
      h.setAttribute('aria-expanded', otevrit ? 'true' : 'false');
      if (telo) telo.hidden = !otevrit;
      h.parentElement.classList.toggle('otevreny', otevrit);
    }
  });
})();
/* ── konec videa u kapitoly (s205) ── */

/* ── Mapa a trasa na detailu (s206) ──────────────────────────────────
   Odkaz „Mapa a trasa“ otevře <dialog id="d-mapa">. Leaflet se načte až
   tady (detail ho jinak nepotřebuje), podklad je stejný jako na výpisu.
   Poloha jen po kliknutí na „Trasa z mé polohy“; zůstává v prohlížeči
   a jde jen do odkazů na mapové aplikace, které si člověk sám otevře.
   Dobu jízdy z polohy nepočítáme: bez směrovací služby by byla vymyšlená. */
(function () {
  var dlg = document.getElementById('d-mapa');
  var otevri = document.querySelector('[data-d-mapa]');
  if (!dlg || !otevri) return;
  if (typeof dlg.showModal !== 'function') { otevri.hidden = true; return; }
  var lat = +dlg.getAttribute('data-lat'), lng = +dlg.getAttribute('data-lng');
  var plocha = dlg.querySelector('[data-d-mapa-plocha]');
  var hlaska = dlg.querySelector('[data-d-mapa-hlaska]');
  var tlac = dlg.querySelector('[data-d-mapa-poloha]');
  var lb = dlg.querySelector('[data-d-mapa-lb]');
  var nadpis = dlg.querySelector('#d-mapa-h');
  var vlajka = dlg.querySelector('.d-mapa-hl .flag');
  var klid = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mapa = null, ja = null, nacitani = null, poloha = null;
  var INFO = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="7.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 9v4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="6.3" r="1.05" fill="currentColor"/></svg>';
  var TEXT = {
    hleda: 'Zjišťujeme vaši polohu…',
    ok: '<b>Vaše poloha je na mapě.</b> Trasu otevřete ve vybrané aplikaci.',
    ne: '<b>Polohu jste nepovolili.</b> Dobu jízdy odsud proto nespočítáme. Trasu naplánujete i tak, mapová aplikace se zeptá, odkud jedete. Povolit polohu jde v nastavení prohlížeče.',
    chyba: '<b>Polohu se nepodařilo zjistit.</b> Trasu naplánujete i tak, mapová aplikace se zeptá, odkud jedete.'
  };

  function esc(t) { return String(t).replace(/[&<>"]/g, function (z) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[z]; }); }
  function ukaz(klic) { hlaska.innerHTML = klic ? (klic === 'hleda' ? '' : INFO) + '<span>' + TEXT[klic] + '</span>' : ''; }

  function nactiLeaflet() {
    if (typeof L !== 'undefined') return Promise.resolve();
    if (nacitani) return nacitani;
    var zaklad = dlg.getAttribute('data-leaflet');
    nacitani = new Promise(function (hotovo, chyba) {
      var css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = zaklad + '.css';
      /* Před style.css, jako na výpisu: jinak by Leaflet přebil opravy
         z s143/s144 (švy dlaždic, autorství) jen tím, že přišel později. */
      var sazba = document.querySelector('link[rel="stylesheet"][href*="style.css"]');
      document.head.insertBefore(css, sazba || null);
      var js = document.createElement('script');
      js.src = zaklad + '.js'; js.onload = hotovo; js.onerror = chyba;
      document.head.appendChild(js);
    });
    return nacitani;
  }

  function postav() {
    if (mapa) { mapa.invalidateSize(); return; }
    mapa = L.map(plocha, { zoomControl: false, zoomAnimation: !klid, fadeAnimation: !klid, markerZoomAnimation: !klid });
    mapa.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    var DLAZDICE = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_{styl}/MapServer/tile/{z}/{y}/{x}';
    var ZDROJ = { attribution: 'Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxNativeZoom: 16, maxZoom: 19 };
    L.tileLayer(DLAZDICE.replace('{styl}', 'Base'), ZDROJ).addTo(mapa);
    mapa.createPane('popisky');
    mapa.getPane('popisky').style.zIndex = 350;
    mapa.getPane('popisky').style.pointerEvents = 'none';
    L.tileLayer(DLAZDICE.replace('{styl}', 'Reference'), L.extend({ pane: 'popisky' }, ZDROJ)).addTo(mapa);
    L.control.zoom({ position: 'topright', zoomInTitle: 'Přiblížit', zoomOutTitle: 'Oddálit' }).addTo(mapa);
    var jmeno = nadpis.textContent.replace(/ na mapě$/, '');
    var vl = vlajka ? vlajka.outerHTML.replace(/ role="img" aria-label="[^"]*"/, ' aria-hidden="true"') : '';
    L.marker([lat, lng], { interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'd-mapa-bod', iconSize: null, html: '<span class="d-mapa-cil">' + vl + esc(jmeno) + '</span>' })
    }).addTo(mapa);
    mapa.setView([lat, lng], 9, { animate: false });
    if (poloha) naMape();
  }

  function naMape() {
    if (!mapa || !poloha) return;
    var bod = [poloha.latitude, poloha.longitude];
    if (ja) ja.setLatLng(bod);
    else ja = L.marker(bod, { interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'd-mapa-bod', iconSize: null, html: '<span class="d-mapa-ja"></span><span class="d-mapa-vy">Vy</span>' })
    }).addTo(mapa);
    mapa.fitBounds(L.latLngBounds([bod, [lat, lng]]), { padding: [70, 70], maxZoom: 12, animate: !klid });
  }

  function odkazy() {
    var s = poloha ? poloha.latitude.toFixed(5) + ',' + poloha.longitude.toFixed(5) : '';
    var sm = poloha ? poloha.longitude.toFixed(5) + ',' + poloha.latitude.toFixed(5) : '';
    var cil = lat + ',' + lng;
    dlg.querySelectorAll('[data-app]').forEach(function (a) {
      var app = a.getAttribute('data-app');
      if (app === 'google') a.href = 'https://www.google.com/maps/dir/?api=1' + (s ? '&origin=' + s : '') + '&destination=' + cil;
      if (app === 'mapy') a.href = 'https://mapy.com/fnc/v1/route?' + (sm ? 'start=' + sm + '&' : '') + 'end=' + lng + ',' + lat;
      if (app === 'apple') a.href = 'https://maps.apple.com/?' + (s ? 'saddr=' + s + '&' : '') + 'daddr=' + cil;
    });
  }

  otevri.addEventListener('click', function () {
    dlg.showModal();
    nactiLeaflet().then(postav).catch(function () { plocha.classList.add('bez-mapy'); });
  });
  dlg.querySelector('.d-mapa-x').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  tlac.addEventListener('click', function () {
    if (!navigator.geolocation) { ukaz('chyba'); return; }
    tlac.disabled = true;
    tlac.setAttribute('aria-busy', 'true');
    ukaz('hleda');
    navigator.geolocation.getCurrentPosition(function (p) {
      tlac.disabled = false;
      tlac.removeAttribute('aria-busy');
      poloha = p.coords;
      odkazy();
      naMape();
      ukaz('ok');
    }, function (e) {
      tlac.disabled = false;
      tlac.removeAttribute('aria-busy');
      if (e && e.code === 1) {
        ukaz('ne');
        tlac.hidden = true;
        lb.textContent = 'Trasa v aplikaci';
        (dlg.querySelector('[data-app]') || dlg).focus();
      } else {
        ukaz('chyba');
      }
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  });
})();
/* ── konec mapy a trasy na detailu (s206) ── */

/* ── Lepivý panel jen u svého bloku (s209) ───────────────────────────
   Panel vyšší než okno pod hlavičkou by při přilnutí na 86 px schoval spodek.
   Takový panel dostane `top` tak, aby přilnul až spodní hranou: 16 px nad
   dolní lištou (s101, je vidět právě tehdy, když galerie odjede, tedy když
   panel přilne), bez lišty nad okrajem okna. Nízký panel: vlastnost se
   odebere, platí 86 px z CSS. */
(function () {
  var pan = document.querySelector('[data-page="detail"] .two > .panel');
  if (!pan) return;
  var lista = document.querySelector('[data-lista]');
  var mq = window.matchMedia('(min-width: 900px)');
  var HORE = 86, DOLE = 16;
  function srovnej() {
    var dole = DOLE + (lista && getComputedStyle(lista).display !== 'none' ? lista.offsetHeight : 0);
    var t = window.innerHeight - pan.offsetHeight - dole;
    if (mq.matches && t < HORE) pan.style.setProperty('--panel-top', Math.round(t) + 'px');
    else pan.style.removeProperty('--panel-top');
  }
  srovnej();
  window.addEventListener('resize', srovnej);
  if (mq.addEventListener) mq.addEventListener('change', srovnej);
  if ('ResizeObserver' in window) new ResizeObserver(srovnej).observe(pan);
})();
/* ── konec lepivého panelu (s209) ── */

/* ── Mapa a trasa z lokality (s211) ──────────────────────────────────
   Karta místa v Lokalitě otevírá tentýž dialog jako odkaz pod nadpisem:
   klik se přepošle na [data-d-mapa] z s206, žádná druhá logika. */
(function () {
  var karty = document.querySelectorAll('[data-lok-mapa]');
  if (!karty.length) return;
  var odkaz = document.querySelector('[data-d-mapa]');
  karty.forEach(function (k) {
    if (!odkaz || odkaz.hidden) { k.hidden = true; return; }
    k.addEventListener('click', function () { odkaz.click(); });
  });
})();
/* ── konec mapy z lokality (s211) ── */

/* ── Kotva po načtení písem (s214) ──────────────────────────────────
   Plynulý posun ke kotvě z adresy si cíl spočítá hned při prvním vykreslení;
   když se pak načtou písma, sekce se posune a posun skončí vedle. Po načtení
   stránky a písem se cíl jednou srovná bez animace, pokud člověk mezitím sám
   neroloval. Otázky FAQ (`.acc`) staví na střed s118, ty se nechávají. */
(function () {
  var id = location.hash.slice(1);
  if (!id) return;
  var cil;
  try { cil = document.getElementById(decodeURIComponent(id)); } catch (e) { return; }
  if (!cil || cil.classList.contains('acc')) return;
  var sahl = false;
  var zastav = function () { sahl = true; };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) {
    window.addEventListener(t, zastav, { passive: true, once: true });
  });
  var srovnej = function () {
    if (sahl || location.hash.slice(1) !== id) return;
    var okraj = parseFloat(getComputedStyle(cil).scrollMarginTop) || 0;
    if (Math.abs(cil.getBoundingClientRect().top - okraj) <= 2) return;
    var h = document.documentElement, puv = h.style.scrollBehavior;
    h.style.scrollBehavior = 'auto';
    cil.scrollIntoView({ block: 'start' });
    h.style.scrollBehavior = puv;
  };
  var poKlidu = function () {
    /* počkat, až doběhne rozjetý plynulý posun (150 ms bez scrollu) */
    var casovac;
    var klid = function () { clearTimeout(casovac); casovac = setTimeout(function () { window.removeEventListener('scroll', klid); srovnej(); }, 150); };
    window.addEventListener('scroll', klid, { passive: true });
    klid();
  };
  var poNacteni = function () {
    var pisma = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    pisma.then(poKlidu, poKlidu);
  };
  if (document.readyState === 'complete') poNacteni();
  else window.addEventListener('load', poNacteni, { once: true });
})();
/* ── konec kotvy po načtení (s214) ── */

/* ── Swipe fotek na kartě (s222) ─────────────────────────────────────
   Na dotyku přepíná fotky karty vodorovný posun prstem. Svislý pohyb
   roluje stránku, klepnutí otevře detail, klik těsně po posunu se zahodí. */
(function () {
  if (!matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.card .ph').forEach(function (ph) {
    var vrstvy = [].slice.call(ph.querySelectorAll('.lay'));
    var tecky = [].slice.call(ph.querySelectorAll('.dots i'));
    if (vrstvy.length < 2) return;
    var karta = ph.closest('.card');
    var i = 0, x0 = null, y0 = 0, vodorovne = false, posunuto = 0;
    function ukaz(n) {
      i = Math.max(0, Math.min(vrstvy.length - 1, n));
      vrstvy.forEach(function (v, j) { v.classList.toggle('s222-vid', j === i); });
      tecky.forEach(function (t, j) { t.classList.toggle('s222-on', j === i); });
      ph.classList.add('s222-posun');
    }
    tecky.forEach(function (t, j) { t.classList.toggle('s222-on', j === 0); });
    ph.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; vodorovne = false;
    }, { passive: true });
    ph.addEventListener('touchmove', function (e) {
      if (x0 === null) return;
      var dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
      if (!vodorovne && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) vodorovne = true;
    }, { passive: true });
    ph.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (vodorovne && Math.abs(dx) > 40) {
        ukaz(i + (dx < 0 ? 1 : -1));
        posunuto = Date.now();
      }
      x0 = null;
    }, { passive: true });
    if (karta) karta.addEventListener('click', function (e) {
      if (Date.now() - posunuto < 450) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });
})();
/* ── konec swipe fotek (s222) ── */

/* ── Jak to funguje: Podrobněji v kapitole (s223) ──────────────────────
   Vedlejší bloky kapitoly schová CSS až tehdy, když tady JS nastaví
   `data-kap-vice` — bez JS zůstane vidět všechno. */
(function () {
  var tl = document.querySelectorAll('.kap-vice');
  if (!tl.length) return;
  var obal = document.querySelector('.kapitoly');
  if (obal) obal.setAttribute('data-kap-vice', '');
  tl.forEach(function (b) {
    var kap = b.closest('.chapter');
    b.addEventListener('click', function () {
      var otevri = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', otevri ? 'true' : 'false');
      b.querySelector('span').textContent = otevri ? 'Méně' : 'Podrobněji';
      if (kap) kap.classList.toggle('kap-otevrena', otevri);
    });
  });
  /* Odkaz na kotvu uvnitř schovaného bloku (např. #video-pronajem) kapitolu otevře. */
  function otevriKotvu() {
    var id = location.hash.slice(1);
    var cil = id && document.getElementById(id);
    var kap = cil && cil.closest ? cil.closest('.chapter') : null;
    var b = kap && kap.querySelector('.kap-vice');
    if (b && b.getAttribute('aria-expanded') !== 'true' && getComputedStyle(cil).display === 'none') b.click();
  }
  otevriKotvu();
  window.addEventListener('hashchange', otevriKotvu);
})();
/* ── konec Podrobněji (s223) ── */

/* ── Sub-menu detailu (s225) ─────────────────────────────────────────
   Lepí se pod hlavičku (ta při posunu dolů ujede, pak pod horní hranu)
   a zvýrazní sekci, ve které člověk je. */
(function () {
  var nav = document.querySelector('.dnav');
  if (!nav) return;
  var head = document.querySelector('.head');
  var odkazy = [].slice.call(nav.querySelectorAll('.dnav-odk a'));
  var sekce = odkazy.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var rada = nav.querySelector('.dnav-odk');
  var ceka = false, posledni = null;
  function krok() {
    ceka = false;
    var h = head && !head.classList.contains('away') ? head.getBoundingClientRect().bottom : 0;
    nav.style.top = Math.max(0, Math.round(h)) + 'px';
    var hranice = Math.max(0, h) + nav.offsetHeight + 24, akt = 0;
    sekce.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= hranice) akt = i; });
    if (akt !== posledni) {
      posledni = akt;
      odkazy.forEach(function (a, i) { if (i === akt) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      var a = odkazy[akt];
      if (rada.scrollWidth > rada.clientWidth) rada.scrollLeft = a.offsetLeft - rada.clientWidth / 2 + a.offsetWidth / 2;
    }
    document.documentElement.style.setProperty('--dnav-h', nav.offsetHeight + 'px');
  }
  function naplanuj() { if (!ceka) { ceka = true; requestAnimationFrame(krok); } }
  addEventListener('scroll', naplanuj, { passive: true });
  addEventListener('resize', naplanuj);
  if (head) head.addEventListener('transitionend', naplanuj);
  krok();
})();
/* ── konec sub-menu detailu (s225) ── */

/* ── Balíčky: ukázka roku a aktivity (s227) ─────────────────────────
   Záložky ukázkového roku; aktivity vyberou místa ve skládačce (s195) —
   nastaví dlaždice a poslední přepnou klikem, ať se přepočte obvyklou cestou. */
(function () {
  var taby = [].slice.call(document.querySelectorAll('.rok-tab'));
  taby.forEach(function (t) {
    t.addEventListener('click', function () {
      taby.forEach(function (o) {
        var ano = o === t;
        o.setAttribute('aria-selected', ano ? 'true' : 'false');
        var p = document.getElementById('rok-' + o.getAttribute('data-rok'));
        if (p) p.hidden = !ano;
      });
    });
  });
  var sk = document.querySelector('[data-skladacka]');
  var akt = sk ? [].slice.call(sk.querySelectorAll('.akt')) : [];
  if (!akt.length) return;
  var picks = [].slice.call(sk.querySelectorAll('.pick'));
  akt.forEach(function (a) {
    a.addEventListener('click', function () {
      a.setAttribute('aria-pressed', a.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      var chci = [];
      akt.forEach(function (x) { if (x.getAttribute('aria-pressed') === 'true') chci = chci.concat(x.getAttribute('data-mista').split(' ')); });
      if (!chci.length) return;
      var cil = picks.filter(function (p) { return chci.indexOf(p.getAttribute('data-misto')) >= 0; });
      if (!cil.length) return;
      picks.forEach(function (p) { p.setAttribute('aria-pressed', cil.indexOf(p) >= 0 ? 'true' : 'false'); });
      cil[0].setAttribute('aria-pressed', 'false');
      cil[0].click();
    });
  });
  /* Ruční změna dlaždic nebo předvolby zruší označení aktivit. */
  sk.addEventListener('click', function (e) {
    if (!e.isTrusted) return;
    if (e.target.closest('.pick') || e.target.closest('.pre')) akt.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
  });
})();
/* ── konec ukázky roku (s227) ── */
