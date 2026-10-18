# Mijn Woning

Interactief Home-concept voor een persoonlijk smart-homedashboard. Ontworpen voor Android-telefoon en een verticaal gemonteerde tablet. Standaardstijl: Midnight Gold.

## Lokaal starten

Vereist: Node.js 22.12+ (getest met 24) en npm.

```sh
npm ci
npm run dev
```

Vite meldt het lokale adres. Gebruik op je telefoon, binnen hetzelfde vertrouwde netwerk, het netwerkadres van de ontwikkelmachine met poort 5173. Een cloudmachine is niet automatisch via dat adres bereikbaar. Publiceer voor een externe telefoontest de statische `dist`-map bij een HTTPS-host na `npm run build`. Het project bevat uitsluitend demogegevens. Er is geen backend nodig.

```sh
npm run build
npx playwright install chromium
npm test
# Of gebruik een bestaande Chromium-installatie:
# PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

## In deze eerste ontwerpversie

- Responsieve Home-pagina, klok en datum.
- Zes scènes die demoverlichting en rolluikstanden aanpassen.
- Verlichting aan/uit, helderheid en kleurtemperatuur.
- Thermostaatdoel aanpassen en voorbeeldketelgegevens bekijken.
- Rolluik openen, stoppen, sluiten en positie instellen.
- Gesimuleerde muziekbediening, nummerkeuze, voortgang en volume. Er wordt geen audio afgespeeld.
- Geïllustreerde voordeur en deurbelvenster dat na 45 seconden sluit.
- Woningnaam en apparaatinstellingen worden lokaal opgeslagen.
- Toetsenbordbediening, gelabelde invoervelden en respect voor verminderde beweging.

**Alle apparaatwaarden, weergegevens en camerabeelden zijn gesimuleerd. Er worden geen echte apparaten aangestuurd.** Klok en datum gebruiken de tijdzone van het apparaat. Muziek start na herladen gepauzeerd.

## Opbouw en vervolgstappen

`src/model.ts` bevat het getypeerde demomodel en validatie van opgeslagen instellingen. `src/App.tsx` bevat de Home-interface en interacties. `src/styles.css` bevat centrale CSS-variabelen en responsieve stijlen. De illustraties worden lokaal met CSS getekend; Lettertypen worden lokaal meegeleverd, zonder externe fontverzoeken.

Deze eerste versie is bedoeld voor beoordeling van het ontwerp. De volledige thema- en dashboard-editor, overige pagina's, PWA-installatie/offlinewerking en echte integraties volgen na bevestiging. Navigatie naar Kamers en Techniek is daarom gemarkeerd als ‘Later’. Klimaat en Camera openen nu detailvensters.

Voor latere livekoppelingen blijft een aparte adapterlaag nodig. Hue en Shelly vereisen bereikbare lokale apparaten en mogelijk een lokale backend; Spotify vereist veilige OAuth. Ondersteuning van Remeha en Eufy moet afzonderlijk onderzocht worden. Bewaar daarvoor geen sleutels in deze frontend of browseropslag.

## Zelfstandig HTML-bestand

`npm run build:standalone` maakt `dist-standalone/index.html`. Dit bestand bevat de volledige demo inclusief scripts, stijlen en lettertypen. Er zijn geen externe bestanden of accounts nodig. Open het na downloaden in een browser die lokale HTML met JavaScript ondersteunt. Sommige Android-bestandsviewers ondersteunen geen JavaScript; gebruik dan de gehoste versie via GitHub Pages. Lokale opslag is afhankelijk van de browser en hoe het bestand geopend wordt.

## GitHub Pages

De broncode wordt aangeboden op de branch `codex/mijn-woning-demo`. De publiceerbare demo staat op `gh-pages`. Om die bereikbaar te maken: open de repository op GitHub → Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` → `/ (root)` → Save.

De verwachte URL na succesvolle activering is `https://ymatheusen.github.io/Smart-home-dashboard/`. Het inschakelen vereist repositorybeheerrechten. GitHub Pages-beschikbaarheid voor private repositories hangt af van het GitHub-abonnement; maak een repository niet zomaar openbaar.

De `gh-pages`-branch bevat alleen de zelfstandige demo en `.nojekyll`; ververs deze na een nieuwe `npm run build:standalone`. Publicatie van de Codex-cloudomgeving staat los van websitehosting.
