# Mijn Woning

Een persoonlijk smart-homedashboard in Midnight Gold, ontworpen voor een Android-telefoon en een verticale wandtablet. **Alle apparaten, weergegevens en camerabeelden zijn demo.** Er zijn geen accounts of echte apparaatkoppelingen nodig.

## Openen

De gepubliceerde demo staat op **https://ymatheusen.github.io/Smart-home-dashboard/**. GitHub Pages gebruikt de branch `gh-pages`, map `/ (root)`. De broncode staat op `codex/mijn-woning-demo`; deze branch kan niet rechtstreeks als website worden gepubliceerd.

## Compact dashboard · versie 0.2

- **Home:** zes snelle scènes en standaard vier favoriete tegels: verlichting, klimaat, rolluik en muziek. Aan/uit, temperatuur en eenvoudige muziek- en rolluikbediening zijn direct beschikbaar.
- **Kamers:** alle zes beschikbare apparaatgroepen. Tik op een tegeltitel om de uitgebreide bediening te openen.
- **Klimaat:** thermostaatbediening en voorbeeldketeldruk.
- **Camera:** geïllustreerde voordeur en een gesimuleerde deurbelmelding, die na 45 seconden sluit.
- **Techniek:** demostatus van de integraties en een herstelbare simulatie van lage waterdruk.
- Navigeer met de vaste onderbalk of een horizontale swipe op een vrij gedeelte van het scherm. Swipes op knoppen en sliders wisselen niet van scherm.

### Zelf aanpassen

Open **Indeling** op Home of de instellingenknop rechtsboven. Kies **Ruim**, **Normaal** of **Compact**. Zet Home-tegels aan of uit en verander de volgorde met de pijlen. Instellingen worden direct in de browser opgeslagen.

Telefoon (minder dan 700 CSS-pixels breed) en tablet/groter scherm hebben afzonderlijke profielen. Je kunt beide profielen in de editor bewerken. Deze instellingen blijven op dit apparaat en worden niet automatisch naar een andere telefoon of tablet gesynchroniseerd.

Het aantal tegels per pagina wordt berekend uit de werkelijke beschikbare schermhoogte en de gekozen dichtheid. Extra tegels krijgen een volgende pagina met pijltjes. De vijf hoofdschermen zijn getest zonder verticale of horizontale documentoverloop op 320×568, 360×640, 390×844, 800×1280, 1200×1920 en 1366×768 CSS-pixels, in alle drie dichtheden. Uitgebreide detailvensters en instellingen mogen scrollen. Grote browserlettertypen, sterke zoom en een geopend schermtoetsenbord kunnen de beschikbare ruimte verder beperken.

## Ontwikkelen

Vereist: Node.js 22.12+ (getest met 24) en npm.

```sh
npm ci
npm run dev
```

De ontwikkelserver luistert op poort 5173. Binnen een vertrouwd lokaal netwerk kun je het netwerkadres van je computer op je telefoon openen. Een cloudmachine is niet automatisch via dat adres bereikbaar; gebruik daarvoor de gepubliceerde HTTPS-demo.

```sh
npm run build
npx playwright install chromium
npm test
npm run test:production
```

Met de bestaande cloudbrowser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:production
```

De productietest serveert uitsluitend de gebouwde bestanden onder `/Smart-home-dashboard/`. Hij controleert de echte productiestart, bediening en een zichtbare foutmelding bij geblokkeerd JavaScript. De overige tests controleren alle hoofdschermen en dichtheden, opgeslagen profielen, scènes, rolluikbediening, swipen, waarschuwingen en de deurbel-timer.

## Publiceren

```sh
npm run deploy:pages
```

Dit bouwt de gewone website en een zelfstandige HTML-versie, en publiceert de gegenereerde bestanden naar `gh-pages` van de bestaande origin. Het script wijzigt `main` niet. Een tijdelijke checkout onder `/tmp` bewaart de Pages-geschiedenis; er wordt zonder force gepusht. GitHub voert daarna automatisch `pages build and deployment` uit. Controleer de voltooide publicatie bij GitHub Actions voordat je een nieuwe release als gepubliceerd meldt.

`npm run build:standalone` maakt daarnaast `dist-standalone/index.html` met alle scripts, stijlen en lettertypen ingebed. De gehoste download staat in `download/Mijn-Woning.html`. Sommige Android-bestandsviewers voeren geen JavaScript uit; gebruik op je telefoon bij voorkeur de gewone HTTPS-demo.

## Architectuur en vervolg

- `src/model.ts`: getypeerde apparaatdemo en validatie van eerder opgeslagen gegevens.
- `src/layout.ts`: afzonderlijke, gevalideerde indelingsprofielen voor telefoon en tablet.
- `src/components/LayoutEditor.tsx`: dichtheid, zichtbaarheid en volgorde.
- `src/components/DeviceControls.tsx`: uitgebreide bediening, onafhankelijk van de compacte Home-tegels.
- `src/App.tsx`: schermnavigatie, paginering, simulaties en detailvensters.
- `src/styles.css` en `src/dashboard.css`: centrale CSS-variabelen, kaartstijlen en schermvullende indeling.

Illustraties en lettertypen worden lokaal meegeleverd. Geen externe font- of afbeeldingsdiensten zijn nodig. Woningnaam en apparaatstanden blijven na herladen bewaard; muziek start gepauzeerd. Druksimulaties zijn tijdelijk en gebruiken geen echte waarschuwingsgrenzen.

De oorspronkelijke projectbeschrijving staat in `docs/PROJECT_BRIEF.md`. Een volledige thema-editor, vrije widgetformaten, drag-and-drop, PWA-installatie en live-integraties blijven vervolgstappen. Hue en Shelly vragen bereikbare lokale apparaten en mogelijk een lokale backend; Spotify vraagt veilige OAuth. Remeha- en Eufy-ondersteuning moet afzonderlijk onderzocht worden. Sla nooit echte sleutels op in deze frontend of browseropslag.
