# Mijn Woning

Een persoonlijk smart-homedashboard in Midnight Gold, ontworpen voor een Android-telefoon en een verticale wandtablet. **De browser-PWA gebruikt demogegevens. De Android-app kan Philips Hue en Shelly Plus 2PM lokaal live koppelen.** De overige apparaten, weergegevens en camerabeelden blijven demo.

## Openen

De gepubliceerde demo staat op **https://ymatheusen.github.io/Smart-home-dashboard/**. GitHub Pages gebruikt de branch `gh-pages`, map `/ (root)`. De broncode staat op `codex/mijn-woning-demo`; deze branch kan niet rechtstreeks als website worden gepubliceerd.

## Android-app met lokale Hue en Shelly · versie 0.5.1

**Nieuwe APK-download (0.5.1):** https://raw.githubusercontent.com/ymatheusen/Smart-home-dashboard/refs/heads/gh-pages/android/Mijn-Woning-0.5.1-nieuwe-sleutel.apk

**Nieuwe ondertekeningssleutel:** verwijder versie 0.5.0 eerst. Installeer daarna 0.5.1 en koppel Hue en Shelly opnieuw. Instellingen, favorieten en indeling uit de oude app worden bij verwijderen gewist. De oudere APK blijft beschikbaar via de oorspronkelijke downloadlink.

De aparte Android-app behoudt het dashboard en kan rechtstreeks op je thuisnetwerk met een Hue Bridge verbinden. Je hebt geen Home Assistant, Hue-ontwikkelaarsaccount of cloudbackend nodig. Koppelen gebeurt in Instellingen via het Bridge-IP en de fysieke koppelknop. De sleutel blijft versleuteld in native app-opslag met Android Keystore.

Je maakt en bewerkt scènes in de Hue-app. De Android-app haalt opgeslagen scènes op, laat je favorieten kiezen en activeert de oorspronkelijke Hue-scène. Lichtbediening ondersteunt aan/uit, helderheid en waar beschikbaar wittemperatuur en kleur. Hue en Shelly hebben elk een eigen Demo/Live-keuze. De Plus 2PM wordt in zijn bestaande profiel herkend: één rolluik of twee afzonderlijke schakelaars. Rolluiken ondersteunen open, stop en sluit, en procentbediening na kalibratie in de Shelly-app. De twee lichtkanalen ondersteunen aan/uit.

De broncode bevat nu aparte rolluiktegels, positiebediening bij loslaten van de schuif, eigen Shelly-namen en instelbare Hue-scène-iconen zonder kamerlabel. Deze wijzigingen zitten in build 0.5.1. Omdat de oorspronkelijke ondertekeningssleutel niet beschikbaar was, is deze build met een nieuwe sleutel ondertekend. Bewaar de nieuwe sleutel en het bijbehorende configuratiebestand privé voor volgende updates.

Zie **[Android installeren, koppelen en bouwen](docs/ANDROID.md)** voor instructies, beveiliging, testresultaten en de nog benodigde thuistest. De browser-PWA blijft beschikbaar en toont een downloadlink naar de Android-app.

## Installeerbare app · versie 0.3

Open de HTTPS-demo in Chrome op je Android-telefoon of tablet. Ga naar **Instellingen → App installeren**. Als de browser nog geen installatieknop aanbiedt: gebruik **⋮ → Toevoegen aan startscherm → Installeren**. Op een laptop kan dit via het installatie-icoon in de adresbalk. Installeren is niet beschikbaar in incognitomodus. In Safari op iOS: **Deel → Zet op beginscherm**.

Open de app één keer met internet en wacht in Instellingen op **Gereed voor offlinegebruik**. Daarna zijn de vijf demoschermen, bediening, lettertypen en illustraties ook na offline herladen of opnieuw openen beschikbaar. Instellingen blijven lokaal op hetzelfde apparaat. Browseropslag is geen back-up en kan door de browser of gebruiker worden gewist.

Een nieuwe versie wordt op de achtergrond klaargezet. Kies **Bijwerken en heropenen** wanneer het uitkomt, of stel de update uit. Instellingen en indeling blijven behouden. In Instellingen kun je ook handmatig **Controleer op updates** kiezen. Volledig sluiten van de app kan een wachtende update bij de volgende start activeren. Open tabbladen van deze app herladen bij activering samen naar de nieuwe versie.

De PWA heeft een eigen app-icoon en opent zonder de gewone browserbalk. Er is geen APK of appstore nodig. Echte apparaatbediening, pushmeldingen, scherm activeren en OS-helderheid zijn hiermee nog niet geïmplementeerd. De zelfstandige HTML-download en de Vite-ontwikkelserver registreren geen serviceworker.

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
npm run test:pwa
npm run test:hue
```

Met de bestaande cloudbrowser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:production
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:pwa
```

De productietest serveert uitsluitend de gebouwde bestanden onder `/Smart-home-dashboard/`. Hij controleert de echte productiestart, bediening en een zichtbare foutmelding bij geblokkeerd JavaScript. De overige tests controleren alle hoofdschermen en dichtheden, opgeslagen profielen, scènes, rolluikbediening, swipen, waarschuwingen en de deurbel-timer.

De PWA-test gebruikt een tijdelijk normaal Chromium-profiel, omdat Chrome installatie in incognito blokkeert. Hij controleert de echte Chrome-installatievoorwaarden, manifest en PNG-iconen, echte serviceworker-installatie en -updates, offline herladen en opnieuw openen, het uitstellen van updates en behoud van instellingen en caches van andere websites. De testserver schakelt HTTP-cache uit, zodat offline succes niet alleen door de gewone browsercache kan komen. Installatie op een fysiek Android-toestel moet de gebruiker zelf afronden.

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
- `src/pwa/`: installatie, offline-status en updates met gebruikerskeuze.
- `src/sw.ts`: vooraf opgeslagen appbestanden en offline navigatie binnen de appscope. Er worden geen externe API- of apparaatantwoorden gecachet.
- `src/styles.css` en `src/dashboard.css`: centrale CSS-variabelen, kaartstijlen en schermvullende indeling.

Illustraties en lettertypen worden lokaal meegeleverd. Geen externe font- of afbeeldingsdiensten zijn nodig. Demo-instellingen blijven na herladen bewaard; live Hue- en Shelly-standen worden opnieuw van de apparaten gelezen; muziek start gepauzeerd. Druksimulaties zijn tijdelijk en gebruiken geen echte waarschuwingsgrenzen.

De oorspronkelijke projectbeschrijving staat in `docs/PROJECT_BRIEF.md`. Een volledige thema-editor, vrije widgetformaten, drag-and-drop en de overige live-integraties blijven vervolgstappen. De Android-app koppelt Hue en Shelly Plus 2PM lokaal; Spotify vraagt veilige OAuth. Remeha- en Eufy-ondersteuning moet afzonderlijk onderzocht worden. Sla nooit echte sleutels op in deze frontend of browseropslag.
