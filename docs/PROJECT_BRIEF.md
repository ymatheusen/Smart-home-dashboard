# CODEX PROJECT — PREMIUM SMART HOME DASHBOARD

## 1. Projectdoel

Bouw een complete, hoogwaardige en volledig aanpasbare smart-home-webapp (Progressive Web App) met de naam **Mijn Woning**.

De applicatie moet uiteindelijk mijn centrale smart-homebedieningspaneel worden, ter vervanging van de standaard Google Home-interface.

Het dashboard wordt voornamelijk gebruikt op een **Samsung Galaxy Tab A11+ van 11 inch, VERTICAAL aan de muur gemonteerd (portrait)**.

Ik wil het project eerst op mijn huidige Android-smartphone kunnen bekijken en testen. Later moet dezelfde applicatie uitstekend werken op de Samsung-tablet.

De applicatie moet een moderne, luxe uitstraling hebben die past bij een stijlvol interieur.

**Mijn belangrijkste wensen:**

- Een uitzonderlijk mooi en professioneel ontwerp.
- Volledig aanpasbare kleuren, thema's, widgets en indelingen.
- Eenvoudige bediening via een touchscreen.
- Ondersteuning voor mijn bestaande smart-homeapparaten.
- Geanimeerde, moderne en overzichtelijke bediening.
- Mogelijkheid om automatisch camerabeeld te tonen wanneer iemand aanbelt.
- Uitgebreide informatie over verwarming, waterdruk en andere technische gegevens.
- Eenvoudig uitbreidbaar met toekomstige apparaten.
- Geen Homey of dure extra hardware nodig voor de eerste versie.

**Begin met een volledig functionerende demo.** Echte apparaatkoppelingen komen in een latere fase.

---

## 2. Technologie en architectuur

Gebruik bij voorkeur:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Lucide React voor iconen.
- Framer Motion of Motion voor subtiele animaties.
- Een geschikte bibliotheek voor touchvriendelijke widgets en drag-and-drop.
- LocalStorage of IndexedDB voor instellingen.
- Een PWA-configuratie met manifest en serviceworker.

Bouw het project met een nette, onderhoudbare en modulaire structuur.

Houd de gebruikersinterface gescheiden van de apparaatkoppelingen.

Maak bijvoorbeeld afzonderlijke modules voor:

- Philips Hue.
- Shelly.
- Spotify.
- Remeha.
- Eufy.
- Notificaties.
- Dashboardinstellingen.
- Widgets.
- Thema's.

Gebruik getypeerde interfaces en een uniforme statusstructuur voor apparaten.

De eerste versie werkt volledig met mockdata en simulaties.

Zorg dat ik voor iedere integratie later kan wisselen tussen DEMO en LIVE.

**Belangrijk:** voer geen echte apparatenacties uit zolang een integratie niet daadwerkelijk is ingesteld en getest.

---

# 3. DESIGN — EXTREEM BELANGRIJK

Het ontwerp moet de uitstraling hebben van een premium domotica-bedieningspaneel.

Denk aan de kwaliteit van hoogwaardige dashboards in moderne luxe woningen.

Het moet rustig, elegant, strak en intuïtief zijn.

Geen ouderwetse knoppen, rommelige schermen of standaard admin-dashboard.

### Standaardthema

Gebruik als uitgangspunt:

- Zeer donkere antracietkleurige achtergrond.
- Subtiele kleurverlopen.
- Warme goudkleurige accenten.
- Lichtgrijze secundaire tekst.
- Mooie afgeronde kaarten.
- Subtiele borders en schaduwen.
- Professionele typografie.
- Veel aandacht voor uitlijning en witruimte.
- Grote, duidelijke iconen.
- Verfijnde animaties.

Gebruik design tokens en CSS-variabelen, zodat het hele uiterlijk vanuit één centrale themaconfiguratie kan worden aangepast.

Maak de interface visueel aantrekkelijk, maar houd prestaties op een tablet belangrijker dan zware effecten.

### Thema-editor

Ik wil het ontwerp op ieder moment kunnen veranderen, zonder opnieuw te programmeren.

Maak een instellingenpagina met minimaal:

1. Vrij instelbare accentkleuren.
2. Een kleurenkiezer.
3. Donkere en lichte modus.
4. Meerdere vooraf ontworpen thema's.
5. Instelbare achtergrond.
6. Keuze tussen afgeronde en hoekige kaarten.
7. Kaarttransparantie.
8. Instelbare schaduwen.
9. Verschillende lettergroottes.
10. Verschillende kaartformaten.
11. Optionele animaties.
12. Automatische lichte/donkere modus op basis van tijd.
13. Eigen thema's opslaan.
14. Thema's later opnieuw bewerken.
15. Instellingen terugzetten naar standaardwaarden.

Vooraf ingestelde thema's:

- Midnight Gold.
- Arctic Blue.
- Forest Green.
- Soft Minimal.
- Pure Black.
- Warm Beige.

Laat wijzigingen onmiddellijk zien in een livevoorbeeld.

Bewaar alle instellingen na het afsluiten van de applicatie.

---

# 4. SCHERMINDELING — VERTICALE TABLET

Dit is een heel belangrijk uitgangspunt.

De Samsung Galaxy Tab A11+ komt VERTICAAL tegen de muur.

Ontwerp daarom primair voor een schermresolutie van ongeveer 1200 × 1920 pixels in portrait, met een responsieve lay-out die ook rekening houdt met de werkelijke CSS-viewport.

### Portrait-dashboard

Maak een indeling met:

**Bovenaan:**

- Digitale klok.
- Datum.
- Weersinformatie indien beschikbaar.
- Temperatuur buiten.
- Kleine indicatie van eventuele actieve waarschuwingen.
- Instellingenknop.

**Midden:**

- Smart-homewidgets.
- Bediening per kamer.
- Verlichting.
- Verwarming.
- Rolluiken.
- Spotify.
- Camerategel.
- Scènes.

**Onderaan:**

Een mooie, vaste navigatiebalk met iconen.

Bijvoorbeeld:

Home | Kamers | Klimaat | Camera's | Techniek

De tablet blijft fysiek verticaal gemonteerd. De pagina's kunnen horizontaal wisselen met een swipebeweging of via de navigatie.

Gebruik voor widgets één of twee kolommen, afhankelijk van de beschikbare ruimte.

Grotere widgets mogen de volledige breedte gebruiken.

Maak het hoofdscherm niet te druk. Geef prioriteit aan de belangrijkste bediening.

### Smartphone

Dezelfde applicatie moet uitstekend werken op Android-telefoons.

- Automatisch kleinere indeling.
- Geen horizontaal scrollende content door verkeerde afmetingen.
- Touchvriendelijke bediening.
- Mooie navigatie.
- Volledig werkende instellingen.

### Tabletmodus

Voeg een speciale kioskmodus toe:

- Schermvullende dashboardinterface waar mogelijk.
- Instelbare startpagina.
- Terugkeren naar Home na inactiviteit.
- Optionele klok/screensaver.
- Instelbare helderheidsweergave binnen de mogelijkheden van een PWA.
- Voorbereiding op bewegingsdetectie.
- Ondersteuning voor een toekomstige Android-wrapper of Fully Kiosk-integratie.

Het scherm moet in de toekomst automatisch kunnen activeren wanneer iemand voor de tablet staat.

Maak duidelijk onderscheid tussen functies die met een gewone PWA werken en functies die een aanvullende Android-app of kiosksoftware vereisen.

---

# 5. HOOFDPAGINA — HOME

Maak een prachtig overzicht van mijn woning.

### Welkomstgedeelte

Bovenaan staat een stijlvolle begroeting, bijvoorbeeld:

"Welkom thuis"

Met daaronder tijd, datum en weersinformatie.

Maak de naam van de woning instelbaar.

### Favoriete apparaten

Laat mij zelf kiezen welke apparaten op de hoofdpagina zichtbaar worden.

De widgets moeten kunnen verschillen in formaat:

- Klein.
- Normaal.
- Breed.
- Groot.

Gebruik moderne visuele bediening en animaties.

### Scènes

Maak een compacte rij met instelbare scènes:

- Goedemorgen.
- Overdag.
- Avond.
- Filmavond.
- Welterusten.
- Alles uit.

Iedere scène krijgt een eigen icoon en eventueel een accentkleur.

Bij het activeren van een scène moet er visuele feedback zijn.

In de demo mogen scènes gesimuleerde Hue- en Shelly-apparaten bedienen.

---

# 6. PHILIPS HUE

Ik heb Philips Hue-verlichting met een Hue Bridge en onder andere meerdere slimme GU10-spotjes.

Maak een volledig verlichtingsgedeelte.

### Functionaliteit

- Lampen aan- en uitzetten.
- Helderheid regelen.
- Lichtkleur veranderen.
- Kleurtemperatuur instellen.
- Verlichting per kamer bekijken.
- Lampgroepen aanmaken.
- Scènes selecteren.
- Huidige apparaatstatus zien.
- Favorieten kiezen.
- Individuele lampen bedienen.

Maak moderne lichtwidgets met een mooie visuele helderheidsslider.

Laat de widget subtiel van kleur veranderen om de gekozen lichtkleur weer te geven.

### Echte integratie

Bereid de applicatie voor op de officiële lokale Philips Hue Bridge API.

De integratie moet later veilig geconfigureerd kunnen worden zonder API-sleutels in publieke frontendcode op te slaan.

Houd rekening met de technische beperkingen van een browser, waaronder CORS, HTTPS en lokale netwerktoegang.

Gebruik zo nodig later een kleine lokale backend.

---

# 7. SHELLY — ROLLUIKEN

Ik gebruik Shelly-apparaten, waaronder een Shelly Plus 2PM voor mijn rolluiken.

Ontwerp moderne rolluikwidgets.

### Bediening

- Helemaal openen.
- Helemaal sluiten.
- Stoppen.
- Positie instellen met een slider.
- Visuele indicatie van de openingspositie.
- Apparaatstatus bekijken.
- Online/offlinestatus tonen.

Maak een aantrekkelijke geanimeerde weergave van een rolluik.

Wanneer het rolluik opent of sluit, moet de animatie de gesimuleerde beweging laten zien.

Gebruik voor de toekomstige echte koppeling de geschikte Shelly API.

Houd rekening met Gen2-modellen en statusupdates.

Voorkom tegenstrijdige of ongeldige bedieningscommando's.

---

# 8. SPOTIFY — MUZIEK

Maak een mooie, uitgebreide muziekspeler die onderdeel is van het dashboard.

### Ontwerp

- Albumhoes.
- Titel van het nummer.
- Naam van de artiest.
- Afspeelstatus.
- Voortgangsbalk.
- Afspelen/pauzeren.
- Vorig/volgend nummer.
- Volume.
- Geselecteerd afspeelapparaat.

Maak de albumhoes visueel aantrekkelijk.

Gebruik bijvoorbeeld subtiele achtergrondkleuren die bij de albumhoes passen.

De muziekwidget moet zowel compact als groot weergegeven kunnen worden.

### Spotify-integratie

Bereid ondersteuning voor de officiële Spotify Web API voor.

Gebruik een veilige OAuth-methode met PKCE of een geschikte veilige backend.

Sla tokens niet onveilig op.

Houd rekening met Spotify Premium, apparaatbeschikbaarheid en de actuele API-beperkingen.

De eerste demo gebruikt gesimuleerde muziekgegevens.

Maak duidelijk wanneer de bediening niet echt gekoppeld is.

---

# 9. REMEHA — VERWARMING EN CV-KETEL

Ik gebruik de Remeha Home-app.

Mijn installatie bestaat uit:

- Een Remeha-ketel die in de app wordt aangeduid als NG1 B-MID.
- Een slimme Remeha-thermostaat.

Maak een mooie klimaatpagina.

### Temperatuurwidget

Toon:

- Actuele kamertemperatuur.
- Ingestelde doeltemperatuur.
- Verwarmingsstatus.
- Temperatuurregeling wanneer later ondersteund.
- Eventuele extra sensoren.

Maak een moderne ronde temperatuurregeling, vergelijkbaar met de uitstraling van luxe slimme thermostaten.

Gebruik in de demo duidelijk herkenbare voorbeeldwaarden.

### CV-ketelwidget

Maak een aparte technische kaart voor de cv-ketel.

Toon:

- Ketelstatus.
- CV-waterdruk.
- Eventuele storingen.
- Status van automatisch bijvullen indien beschikbaar.
- Laatste succesvolle gegevensupdate.

De Remeha Home-app geeft momenteel een druk van 1,2 bar aan en noemt dit normaal.

Gebruik dit uitsluitend als herkenbare beginwaarde voor de demo, niet als actuele livewaarde.

### Uitgebreid informatievenster

Wanneer ik op de ketelwidget druk, moet een mooi detailvenster verschijnen.

Daarin wil ik kunnen zien:

- Huidige waterdruk.
- Een visuele drukmeter.
- Normale of afwijkende status.
- Historische waterdruk indien beschikbaar.
- Ketelstoringen.
- Eventuele onderhoudsmeldingen.
- Laatste update.
- Informatie over automatisch bijvullen.

### Waarschuwing bij lage waterdruk

Maak een configureerbare waarschuwingsfunctie.

Wanneer de keteldruk te laag wordt:

- Verschijnt een duidelijke waarschuwing op het dashboard.
- Wordt de technische pagina gemarkeerd.
- Kan later een pushmelding op mijn telefoon worden verzonden.

Gebruik bij voorkeur de werkelijke statusinformatie van Remeha. Maak eventuele waarschuwingsgrenzen instelbaar en gebruik niet zomaar een willekeurige vaste grens.

Maak in de demo een knop waarmee ik een te lage waterdruk kan simuleren.

### Integratie

Onderzoek in een latere fase een geschikte Remeha Home-integratie, bijvoorbeeld via Home Assistant.

Remeha heeft niet noodzakelijk een vrij toegankelijke, officiële publieke API voor al deze gegevens.

Ontwerp daarom een modulaire koppeling zonder te veronderstellen dat elke functie beschikbaar zal zijn.

---

# 10. EUFY — CAMERA'S EN DEURBEL

Ik heb de volgende apparatuur:

- Eufy Video Doorbell S330 Dual, model T8213.
- Eufy HomeBase 3, model S380.

Maak een uitgebreide beveiligingspagina.

### Camerapagina

Ontwerp mooie camerategels.

Functies:

- Livebeeld bekijken wanneer ondersteund.
- Camerabeeld vergroten.
- Volledig scherm.
- Status van de camera.
- Recente gebeurtenissen wanneer beschikbaar.
- Bewegingsmeldingen.
- Mogelijkheid om later extra camera's toe te voegen.

Mijn Eufy-deurbel beschikt over twee cameralenzen.

Maak een interface die beide beelden kan tonen, mits de uiteindelijke integratie ze beschikbaar stelt.

### Automatisch cameravenster bij aanbellen

**DIT IS EEN VAN DE BELANGRIJKSTE FUNCTIES.**

Wanneer iemand aanbelt, wil ik dat op het dashboard automatisch het camerabeeld van de voordeur verschijnt.

Gewenste werking:

1. De Eufy-deurbel registreert dat iemand aanbelt.
2. De applicatie ontvangt de gebeurtenis via een geschikte integratie.
3. Er verschijnt een duidelijk deurbelvenster over het bestaande dashboard.
4. Het beschikbare camerabeeld wordt weergegeven.
5. Indien mogelijk wordt livevideo gestart.
6. Ik kan het venster zelf sluiten.
7. Het venster sluit na een instelbare tijd automatisch.

Standaardtijd: 45 seconden.

Als livevideo niet direct beschikbaar is, toon indien mogelijk eerst een recente snapshot.

Maak ook nette laadstatussen, foutmeldingen en een knop om opnieuw te proberen.

Het deurbelvenster moet optimaal werken op een VERTICALE tablet.

### Automatisch scherm activeren

Bereid een functie voor waarbij het tabletscherm automatisch actief wordt wanneer iemand aanbelt.

Een PWA kan dit mogelijk niet zelfstandig betrouwbaar doen.

Ontwerp daarom een afzonderlijke interface voor toekomstige Android-functionaliteit of kiosksoftware.

Presenteer deze mogelijkheid niet alsof hij al werkt.

### Testfunctie

Maak in de demo een knop:

"Simuleer aanbellen"

Wanneer ik daarop druk, moet de hele deurbelinteractie zichtbaar worden.

Maak een mooie animatie, een voorbeeldcameravenster en een sluitknop.

### Eufy-integratie

Onderzoek later Home Assistant-communityintegraties die de Eufy HomeBase 3 en T8213 ondersteunen.

Controleer afzonderlijk:

- Livebeeld.
- Beelden van beide camera's.
- Deurbelgebeurtenissen.
- Bewegingsdetectie.
- Compatibiliteit met firmware.

Ga niet uit van gegarandeerde ondersteuning.

Gebruik veilige communicatie en voorkom dat camerastreams publiek toegankelijk zijn.

---

# 11. TECHNISCHE PAGINA

Maak een uitgebreide pagina met de naam **Techniek**.

Dit wordt het centrale overzicht van mijn woninginstallaties.

### Overzichtskaarten

Maak minimaal kaarten voor:

**Remeha**

- CV-waterdruk.
- Kamertemperatuur.
- Ketelstatus.
- Eventuele storingen.

**Philips Hue**

- Hue Bridge.
- Verbindingsstatus.
- Aantal gekoppelde lampen.
- Eventuele offline apparaten.

**Shelly**

- Rolluikstatus.
- Verbindingsstatus.
- Laatste succesvolle update.
- Eventuele foutmeldingen.

**Eufy**

- HomeBase-status.
- Deurbelstatus.
- Camerastatus.
- Beschikbare gebeurtenissen.

**Systeem**

- Connectiestatus van de applicatie.
- Beschikbaarheid van integraties.
- Datum en tijd van laatste synchronisatie.
- Algemene waarschuwingen.

### Waarschuwingencentrum

Maak één centrale plek voor alle belangrijke meldingen.

Bijvoorbeeld:

- CV-waterdruk te laag.
- Een smart-homeapparaat is offline.
- Camera niet bereikbaar.
- Hue Bridge niet bereikbaar.
- Integratie kan niet synchroniseren.

Laat me meldingen bekijken, markeren als gelezen en waar passend tijdelijk dempen.

Maak onderscheid tussen informatieve meldingen, waarschuwingen en kritieke storingen.

---

# 12. VOLLEDIGE DASHBOARD-EDITOR

Ik wil mijn eigen dashboard kunnen ontwerpen zonder code te wijzigen.

Dit is een kernfunctie van de applicatie.

### Bewerken

Voeg een bewerkmodus toe.

Hiermee wil ik:

- Widgets toevoegen.
- Widgets verwijderen.
- Widgets verslepen.
- Widgets groter of kleiner maken.
- Widgets dupliceren.
- Widgets per kamer groeperen.
- De volgorde aanpassen.
- Widgets verbergen.
- Widgets op verschillende pagina's plaatsen.

Maak een bibliotheek met beschikbare widgets.

### Widgetinstellingen

Iedere widget moet eigen instellingen hebben.

Bijvoorbeeld:

- Titel.
- Icoon.
- Kleur.
- Achtergrond.
- Afmetingen.
- Gekoppeld apparaat.
- Soort bediening.
- Compacte of uitgebreide weergave.

### Touchbediening

De editor moet prettig functioneren op een smartphone en tablet.

Gebruik aanraakvriendelijke bediening, met voldoende grote knoppen.

Ondersteun naast verslepen ook een alternatieve manier om widgets te verplaatsen, bijvoorbeeld met pijltjes.

### Opslaan

Bewaar alle aanpassingen.

Voeg functies toe om:

- Dashboardinstellingen te exporteren naar JSON.
- Een eerder opgeslagen indeling te importeren.
- De standaardindeling te herstellen.

---

# 13. EXTRA FUNCTIES

Maak ruimte voor toekomstige uitbreidingen.

### Weer

- Huidige buitentemperatuur.
- Weersomstandigheden.
- Weersverwachting.
- Passende weersiconen.

Gebruik later een betrouwbare weer-API.

In de demo mag je voorbeeldwaarden gebruiken.

### Automatiseringen

Maak een pagina of gedeelte waarin ik later zelf automatiseringen kan bekijken.

Voorbeelden:

- Verlichting aan bij beweging.
- Rolluiken sluiten op een ingestelde tijd.
- Verlichting aanpassen aan het tijdstip.
- Cameravenster openen wanneer iemand aanbelt.

De eerste versie hoeft nog geen complete automatiseringsengine te bevatten.

Maak wel een goede uitbreidbare architectuur.

### Aanpasbare pagina's

Ik wil later nieuwe pagina's kunnen maken.

Bijvoorbeeld:

- Woonkamer.
- Slaapkamer.
- Verlichting.
- Beveiliging.
- Energie.
- Techniek.

---

# 14. MELDINGEN EN BETROUWBAARHEID

Maak een centraal notificatiesysteem.

Ondersteun:

- Meldingen binnen de applicatie.
- Waarschuwingsiconen.
- Een meldingengeschiedenis.
- Configureerbare meldingsinstellingen.
- Voorbereiding op pushmeldingen.

Houd er rekening mee dat echte achtergrondmeldingen een geschikte backend, pushinfrastructuur en gebruikersmachtiging kunnen vereisen.

De applicatie moet duidelijk aangeven wanneer gegevens niet actueel zijn.

Wanneer een apparaat offline is, mag de interface niet doen alsof de opdracht succesvol is uitgevoerd.

---

# 15. BEVEILIGING

Smart-homebediening en beveiligingscamera's mogen niet onveilig worden blootgesteld.

Belangrijke eisen:

- Geen wachtwoorden hardcoderen.
- Geen geheime sleutels in frontendcode.
- Veilig omgaan met toegangstokens.
- Geen camerastreams publiek aanbieden.
- Geen onbeveiligde externe toegang tot de woning.
- Gebruik een aparte backend waar nodig.
- Maak duidelijk welke integraties authenticatie vereisen.
- Ondersteun uitsluitend geautoriseerde apparaten.
- Bewaar geen gevoelige gegevens in demo-instellingen.
- Gebruik een veilige toegangsmethode voor eventuele toekomstige externe bediening.

De demo moet zonder echte persoonlijke accounts werken.

---

# 16. EERSTE VERSIE — WAT NU GEBOUWD MOET WORDEN

Bouw eerst een COMPLETE werkende frontend-demo.

Ik wil niet alleen een verzameling ontwerpen of screenshots.

Ik wil een echte interactieve applicatie.

### Minimale werkende functies

- Premium dashboardontwerp.
- Verticale tabletindeling.
- Smartphonevriendelijk.
- Alle hoofdschermen.
- Werkende navigatie.
- Aanpasbare kleurthema's.
- Werkende thema-editor.
- Dashboard-editor.
- Widgets toevoegen en verwijderen.
- Widgets verplaatsen.
- Instellingen opslaan.
- Verlichting simuleren.
- Rolluiken simuleren.
- Spotify-speler simuleren.
- Remeha-waterdruk tonen.
- Lage waterdruk simuleren.
- Eufy-camerapagina tonen.
- Deurbelgebeurtenis simuleren.
- Cameravenster openen en sluiten.
- Technische statuspagina.
- Simulatie van apparaatstoringen.
- Nette foutmeldingen.
- PWA-installatiemogelijkheid.

Maak alle demo-elementen daadwerkelijk interactief.

Geen knoppen die niets doen.

Gebruik realistische maar herkenbaar gesimuleerde gegevens.

### Ontwerpkwaliteit

Besteed extra aandacht aan:

- Micro-animaties.
- Visuele hiërarchie.
- Premium iconografie.
- Subtiele overgangseffecten.
- Mooie kaarten.
- Consistente kleuren.
- Responsieve weergave.
- Vloeiende touchbediening.

Het dashboard moet direct indruk maken wanneer ik het op mijn telefoon open.

---

# 17. TESTEN EN OPLEVERING

Controleer vóór oplevering:

1. Of het project compileert.
2. Of de webapp start.
3. Of de hoofdpagina goed werkt.
4. Of het dashboard verticaal goed wordt weergegeven.
5. Of de mobiele weergave klopt.
6. Of themawijzigingen worden opgeslagen.
7. Of de dashboard-editor werkt.
8. Of de simulaties werken.
9. Of het cameravenster verschijnt na gesimuleerd aanbellen.
10. Of er geen belangrijke fouten in de browserconsole verschijnen.

Voeg waar passend automatische tests toe.

Lever op:

- De complete broncode.
- Een duidelijke README.
- Installatie-instructies.
- Een werkende preview wanneer de omgeving dit ondersteunt.
- Uitleg om de preview op Android te openen.
- Uitleg om de PWA op een tablet te installeren.
- Een overzicht van de architectuur.
- Een duidelijk stappenplan voor de latere echte apparaatkoppelingen.

Geef een eenvoudige manier om de demo via mijn smartphone te testen. Als een publiek bereikbare preview niet rechtstreeks vanuit de ontwikkelomgeving kan worden gemaakt, leg dan uit hoe ik hem veilig kan publiceren.

---

# 18. TOEKOMSTIGE INTEGRATIES

Ontwerp het systeem zodat later echte koppelingen kunnen worden gerealiseerd.

Voorkeursvolgorde:

1. Philips Hue Bridge.
2. Shelly-rolluiken.
3. Spotify.
4. Remeha Home.
5. Eufy HomeBase 3 en deurbel.
6. Meldingen en geavanceerde automatiseringen.

Voor sommige integraties kan later een kleine lokale Home Assistant-server of andere backend nodig zijn.

Houd daar bij het ontwerp rekening mee.

Een Homey is niet vereist.

Maak de eerste versie niet afhankelijk van een draaiende server, behalve van de normale hosting van de webapp.

---

# 19. WERKWIJZE VOOR CODEX

Ik wil dat je dit project daadwerkelijk bouwt.

Begin met de frontend, maak het ontwerp mooi en implementeer vervolgens de interactieve demonstratiefuncties.

Werk zelfstandig met logische ontwerpkeuzes.

Vraag niet vooraf om allerlei aanvullende gegevens die nog niet nodig zijn.

Gebruik waar mogelijk bestaande betrouwbare open-sourcebibliotheken.

Zorg voor overzichtelijke, goed onderhouden code.

Maak geen fictieve API-koppelingen die worden gepresenteerd als liveverbindingen.

Gebruik geen onnodige externe diensten waarvoor ik direct moet betalen.

Wanneer iets technisch nog niet kan, bouw dan de interface alvast goed en documenteer welke onderdelen later nodig zijn.

**BELANGRIJKSTE EINDDOEL:**

Ik wil een prachtig, luxueus, volledig aanpasbaar smart-homedashboard dat primair is ontworpen voor mijn VERTICAAL opgehangen Samsung Galaxy Tab A11+.

Het moet eruitzien en aanvoelen als een professioneel smart-homebedieningspaneel.

Ik wil de eerste werkende versie zo snel mogelijk op mijn Android-telefoon kunnen testen.

**Begin nu met het bouwen van de volledige interactieve demo.**