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
      return;
    }
    var vb = e.target.closest('[data-view] button');
    if (vb) {
      vb.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === vb); });
      document.querySelector('#view-grid').hidden = vb.dataset.v !== 'grid';
      document.querySelector('#view-map').hidden = vb.dataset.v !== 'map';
      return;
    }
    var pk = e.target.closest('.pick');
    if (pk) { pk.classList.toggle('on'); return; }
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
    document.querySelectorAll('.emo .cell, .dtile').forEach(function (d, i) {
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

  /* ── Chybějící loga portálů — viz _build/s109_pronajem_loga.py ──────
     Soubory s logy Booking a Airbnb v šabloně zatím nejsou. Dokud
     nebudou, obrázek se odstraní, aby se neukázala ikona rozbitého
     obrázku; název portálu stojí vedle něj textem, takže se nic
     neztratí. */
  document.querySelectorAll('img.pr-logo').forEach(function (o) {
    o.addEventListener('error', function () { o.remove(); });
    if (o.complete && !o.naturalWidth) o.remove();
  });

  /* Pás států se pomalu posouvá a zastaví se, jakmile s ním někdo pracuje
     nebo když není vidět. Swipe funguje sám, tohle přidává jen ten pohyb. */
  (function () {
    var pas = document.querySelector('.dest');
    if (!pas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Klony kvůli nekonečné smyčce. V markupu nejsou schválně — čtečka
    // ani tabulátor je nesmí brát jako dalších sedm zemí.
    var puvodni = [].slice.call(pas.children);
    if (puvodni.length < 3) return;
    puvodni.forEach(function (d) {
      var k = d.cloneNode(true);
      k.setAttribute('aria-hidden', 'true');
      k.setAttribute('tabindex', '-1');
      k.classList.add('klon');
      pas.appendChild(k);
    });

    var jede = true, posledni = 0, vidime = true;
    var RYCHLOST = 26;                       // px za sekundu

    function stop() { jede = false; }
    function jed() { jede = true; }
    ['pointerenter', 'focusin', 'touchstart'].forEach(function (u) {
      pas.addEventListener(u, stop, { passive: true });
    });
    ['pointerleave', 'focusout', 'touchend'].forEach(function (u) {
      pas.addEventListener(u, jed, { passive: true });
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (z) { vidime = z[0].isIntersecting; },
        { threshold: .05 }).observe(pas);
    }

    /* Poloha se drží v proměnné, ne ve `scrollLeft`. Ten se zaokrouhluje
       na celé pixely, takže `scrollLeft += 0.42` se pokaždé zahodí a pás
       by stál. Ověřeno v prohlížeči: po `scrollLeft += 0.42` je tam nula.
       Když uživatel scrolluje sám, poloha se ze `scrollLeft` načte zpátky. */
    var poz = 0;
    pas.addEventListener('scroll', function () {
      if (!jede) poz = pas.scrollLeft;
    }, { passive: true });

    function krok(cas) {
      if (posledni && jede && vidime) {
        var d = Math.min(cas - posledni, 60) / 1000;   // strop kvůli přepnutí karty
        var pul = pas.scrollWidth / 2;
        poz += RYCHLOST * d;
        if (poz >= pul) poz -= pul;
        pas.scrollLeft = poz;
      }
      posledni = cas;
      requestAnimationFrame(krok);
    }
    requestAnimationFrame(krok);
  })();

  /* Plovoucí přepínač mapy na mobilu. Přepínač nahoře zůstává na desktopu,
     tenhle je jen jeho dosažitelná varianta pod palcem. */
  var fab = document.querySelector('[data-mapfab]');
  if (fab) fab.addEventListener('click', function () {
    var mapa = document.querySelector('#view-map'), mrizka = document.querySelector('#view-grid');
    if (!mapa || !mrizka) return;
    var naMape = !mapa.hidden;
    mapa.hidden = naMape; mrizka.hidden = !naMape;
    fab.lastChild.textContent = naMape ? 'Mapa' : 'Seznam';
    document.querySelectorAll('[data-view] button').forEach(function (b) {
      b.classList.toggle('on', (b.dataset.v === 'map') !== naMape);
    });
  });

  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  var scrim = document.querySelector('.scrim');
  if (scrim) scrim.addEventListener('click', closeAll);
  document.querySelectorAll('.mega-btn').forEach(function (b) {
    if (!matchMedia('(hover: hover) and (min-width: 1040px)').matches) return;
    var mega = document.querySelector('.mega'), head = b.closest('.head'), t;
    function open() { clearTimeout(t); closeAll(); mega.classList.add('open'); b.setAttribute('aria-expanded', 'true'); scrimSync(); }
    function close() {
      // Zavírá se až při opuštění celé hlavičky. Kdyby se hlídalo jen tlačítko,
      // menu by zmizelo v mezeře mezi ním a panelem — a odkaz by nešel kliknout.
      t = setTimeout(function () { mega.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); scrimSync(); }, 260);
    }
    b.addEventListener('mouseenter', open);
    head.addEventListener('mouseenter', function () { clearTimeout(t); });
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
        document.querySelectorAll('.rozcestnik a').forEach(function (a) {
          a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id);
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

  /* ── Filtr: pilulky jsou odkazy, stav je v URL — viz s82 ────────────
     Jedno chování na plném výpisu i na filtrovaných stránkách. Odkaz
     funguje i bez JS; s JS se kliknutí odchytí a stránka se nenačítá. */
  (function () {
    var obal = document.querySelector('[data-filtr2]');
    var mrizka = document.querySelector('[data-mrizka]');
    if (!obal || !mrizka) return;
    var plny = mrizka.hasAttribute('data-plny');
    var OSY = ['povaha', 'zeme', 'cena', 'dostupnost'];

    /* Mapování token → slug se čte z odkazů, ne z druhé tabulky —
       ta by se při první změně slugů rozešla. */
    var slug = {};
    obal.querySelectorAll('a.chip[data-os][data-hod]').forEach(function (a) {
      var h = a.getAttribute('href') || '';
      var m = h.match(/([a-z0-9-]+)\/$/);
      if (m) slug[a.getAttribute('data-os') + ':' + a.getAttribute('data-hod')] = m[1];
    });

    /* Opačný směr: ze slugu v cestě zpátky na osu a hodnotu. Bez toho
       tlačítko Zpět vrátí adresu `/bali/`, ale filtr se neobnoví —
       `aria-current` je jen na stránkách vygenerovaných serverem,
       kdežto po `pushState` je slug jenom v cestě. */
    var zeSlugu = {};
    Object.keys(slug).forEach(function (k) { zeSlugu[slug[k]] = k.split(':'); });

    function zeURL() {
      var st = { povaha: '', zeme: '', cena: '', dostupnost: '' };
      var q = new URLSearchParams(location.search);
      OSY.forEach(function (o) { if (q.get(o)) st[o] = q.get(o); });
      var segment = location.pathname.replace(/\/+$/, '').split('/').pop();
      if (zeSlugu[segment]) st[zeSlugu[segment][0]] = zeSlugu[segment][1];
      var akt = obal.querySelector('.chip[aria-current="page"]');
      if (akt) st[akt.getAttribute('data-os')] = akt.getAttribute('data-hod') || '';
      return st;
    }

    var stav = zeURL();

    function adresa() {
      /* Do cesty jde jen jedna osa; přednost má země. Zbytek jsou
         parametry. Na filtrované stránce se cesta nemění vůbec. */
      var zaklad = location.pathname, q = [];
      if (plny) {
        var vCeste = stav.zeme ? 'zeme' : (stav.povaha ? 'povaha' : null);
        var s = vCeste ? slug[vCeste + ':' + stav[vCeste]] : null;
        zaklad = location.pathname.replace(/[^/]*\/?$/, '') + (s ? s + '/' : '');
        OSY.forEach(function (o) { if (stav[o] && o !== vCeste) q.push(o + '=' + encodeURIComponent(stav[o])); });
      } else {
        var akt = obal.querySelector('.chip[aria-current="page"]');
        var vCeste2 = akt ? akt.getAttribute('data-os') : null;
        OSY.forEach(function (o) { if (stav[o] && o !== vCeste2) q.push(o + '=' + encodeURIComponent(stav[o])); });
      }
      return zaklad + (q.length ? '?' + q.join('&') : '');
    }

    function sedi(k, bez) {
      return OSY.every(function (o) {
        if (o === bez || !stav[o]) return true;
        var v = k.getAttribute('data-' + o) || '';
        return o === 'povaha' ? v.split(' ').indexOf(stav[o]) >= 0 : v === stav[o];
      });
    }

    var karty = [].slice.call(mrizka.querySelectorAll('.card'));
    /* Počet leží v liště `.bar`, která je **sourozencem** `.filter`,
       ne jeho potomkem. Hledat ho uvnitř filtru vrací null a číslo
       mlčky zamrzne na hodnotě vysázené při generování. */
    var pocet = document.querySelector('[data-pocet]');

    function tvar(n) {
      if (n === 1) return 'nemovitost';
      if (n >= 2 && n <= 4) return 'nemovitosti';
      return 'nemovitostí';
    }

    function pouzij() {
      var vidno = 0;
      karty.forEach(function (k) {
        var ven = !sedi(k);
        k.classList.toggle('odfiltrovano', ven);
        if (!ven) vidno++;
      });
      obal.querySelectorAll('.chip[data-os]').forEach(function (p) {
        var o = p.getAttribute('data-os'), h = p.getAttribute('data-hod') || '';
        var vyb = stav[o] === h;
        p.classList.toggle('on', vyb);
        if (p.tagName === 'BUTTON') p.setAttribute('aria-pressed', vyb ? 'true' : 'false');
        if (!h) return;
        var moznych = karty.filter(function (k) {
          if (!sedi(k, o)) return false;
          var v = k.getAttribute('data-' + o) || '';
          return o === 'povaha' ? v.split(' ').indexOf(h) >= 0 : v === h;
        }).length;
        /* Na plném výpisu se slepá pilulka schová. Na filtrované stránce
           ne — je to odkaz jinam a tam obsah je. */
        if (plny) p.classList.toggle('skryta', moznych === 0 && !vyb);
      });
      if (pocet) pocet.textContent = vidno + ' ' + tvar(vidno);
    }

    obal.addEventListener('click', function (e) {
      var p = e.target.closest ? e.target.closest('.chip[data-os]') : null;
      if (!p) return;
      var o = p.getAttribute('data-os'), h = p.getAttribute('data-hod') || '';
      /* Zemi na filtrované stránce přepnout na místě nejde — karty
         ostatních zemí tam nejsou. Odkaz ať navigauje. */
      if (!plny && p.tagName === 'A' && o === 'zeme') return;
      e.preventDefault();
      stav[o] = h;
      pouzij();
      history.pushState({ f: stav }, '', adresa());
      window.dispatchEvent(new CustomEvent('filtr:zmena', { detail: stav }));
    });

    window.addEventListener('popstate', function () {
      stav = zeURL(); pouzij();
      window.dispatchEvent(new CustomEvent('filtr:zmena', { detail: stav }));
    });

    var prep = obal.querySelector('.f-prep'), vic = obal.querySelector('.f-vic');
    if (prep && vic) {
      var otevrit = !!(stav.cena || stav.dostupnost);
      vic.hidden = !otevrit;
      prep.setAttribute('aria-expanded', otevrit ? 'true' : 'false');
      prep.addEventListener('click', function () {
        var o = vic.hidden;
        vic.hidden = !o;
        prep.setAttribute('aria-expanded', o ? 'true' : 'false');
      });
    }

    pouzij();
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
      cil.scrollIntoView({ block: 'center' });
    };
    otevri();
    window.addEventListener('hashchange', otevri);
  })();
