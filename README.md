# Fragmento — statická šablona (náhled)

Vygenerovaný náhled webu. **Zdroj tady není** — tenhle repozitář obsahuje
jen výstup, ne projekt.

## Jak to rozchodit

Settings → Pages → Source: **Deploy from a branch**, větev `main`,
složka `/ (root)`. Za chvíli běží na:

    https://<účet>.github.io/fragmento-sablona/

**Repozitář se musí jmenovat `fragmento-sablona`.** Šablona drží fotky
ve vlastních CSS proměnných a `url()` uvnitř vlastní proměnné se řeší
proti dokumentu, ne proti stylopisu — 51 cest má proto v sobě zapečené
`/fragmento-sablona`. Při jiném jménu repozitáře se musí balíček
přegenerovat.

## Pozor: veřejné

GitHub Pages na veřejném repozitáři je veřejný web. Stránky posílají
`noindex`, takže by se neměly objevit ve vyhledávačích, ale kdo zná
adresu, dostane se tam bez přihlášení.

## Co tu není

Dočasné mockupy se zamítnutými návrhy, interní protokol o prohlídce
a vývojová dokumentace. Do náhledu nepatří.
