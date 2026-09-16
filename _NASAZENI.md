# Nasazení náhledu — frgmt.to/fragmento-sablona

Statická šablona. **Žádný backend, žádná databáze, žádný build na
serveru** — jen soubory a webserver.

## Zadání

Vystavit na `frgmt.to/fragmento-sablona`, **za přihlášením** (kdo je
zalogovaný a zná adresu, uvidí to), a přitom **nezasahovat do
oprávnění ani nikam jinam**. Není to nová aplikace, je to složka
souborů.

## Co o serveru platí

    frgmt.to  →  63.183.36.23   (AWS Lightsail, 3,7 GB RAM, 11 kontejnerů)
    edge       Caddy, konfigurace v /home/ubuntu/little-buddy/Caddyfile
    účet       david, bez sudo, ve skupinách david / ubuntu / docker

## Balíček je udělaný PRO TUHLE CESTU

Šablona drží fotky ve vlastních CSS proměnných a `url()` uvnitř vlastní
proměnné se řeší **proti dokumentu, ne proti stylopisu** (past u s80,
viz README). Cest od kořene je 51 a mají v sobě zapečené
`/fragmento-sablona`.

**Na jiné cestě se balíček musí přegenerovat** — změní se `MOUNT`
v `_build/s123_vydani.py`. Značky ani skript to nepotřebují, tam jsou
všechny cesty relativní (naměřeno: 0 kořenových cest v HTML i v main.js).

## Nahrání

    rsync -av --delete dist/ david@frgmt.to:/home/ubuntu/fragmento-sablona/

`/home/ubuntu` je sdílený produkční strom — je to sousedství ostatních
aplikací, ne jejich vnitřek. Nic z nich se nepřepisuje.

## Konfigurace

`_caddy.txt` má dvě části. **Obsluha souborů** je hotová. **Brána** ne —
jak je v tomhle Caddyfile zapsaná autentizace, jsem neviděl (je to
v `ARCHITECTURE.md`, sekce 3, na serveru) a vymýšlet ji nebudu: je tam
popsaná past s `route { }`, která už jednou tiše rozbila předávání
identity aplikacím.

Postup: zkopírovat tutéž direktivu, jakou má třeba `/collections`, a
vyměnit cestu.

Aplikuje majitel. Caddyfile je na seznamu „nejdřív se zeptej“.

## Ověřeno

`dist/` se pustil na vlastním serveru **pod cestou
`/fragmento-sablona/`** a projelo se sedm stránek: nula chybějících
souborů, nula chyb v konzoli, nula přetoků, všech 54 podkladových
obrázků na homepage se načetlo.

## Co v balíčku není

Šestnáct dočasných mockupů se zamítnutými návrhy, interní protokol
o prohlídce (`_audit.html`) a přehled prvků (`ui-kit.html`).
