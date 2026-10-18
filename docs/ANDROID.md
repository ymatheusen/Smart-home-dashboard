# Mijn Woning voor Android · lokale Hue- en Shelly-koppeling

## Installeren en koppelen

1. Download `https://ymatheusen.github.io/Smart-home-dashboard/android/Mijn-Woning-0.5.2.apk` op je Android-telefoon of tablet. Gebruik Chrome buiten de ingebouwde chatbrowser. Vanaf 0.5.1 kun je deze versie over de bestaande app installeren; verwijder de app niet. Bij overstappen van 0.5.0 geldt de sleutelwissel hieronder.
2. Open de APK. Android kan vragen of je browser deze app mag installeren. De app wordt handmatig geïnstalleerd en staat niet in de Play Store. Beveiligingscontroles hoeven niet uitgeschakeld te worden.
3. Open het nieuw geïnstalleerde Android-icoon **Mijn Woning**. De eerdere browser-PWA kan daarnaast blijven bestaan; die heeft geen native Hue-koppeling. Browserinstellingen worden niet automatisch naar de Android-app overgezet.
4. Verbind het toestel met hetzelfde thuisnetwerk als de Hue Bridge. Open **Instellingen** en de kaart **Philips Hue**.
5. Kies **Zoek Bridge op mijn wifi**, of vul het lokale IPv4-adres uit de Bridge-informatie in de Hue-app in. Alleen privé-adressen in 10.x, 172.16–31.x en 192.168.x worden geaccepteerd.
6. Controleer de gevonden Bridge. De app controleert het HTTPS-certificaat en de Bridge-identiteit.
7. Druk op de fysieke knop boven op de Bridge en tik binnen 30 seconden op **Knop ingedrukt · koppel nu**. Daarna leest de app de beschikbare apparaten uit. Tijdens deze stap wordt geen lamp of scène aangestuurd.
8. Vink bij **Hue-scènes op Home** je favoriete scènes aan. Sluit Instellingen. Deze scènes verschijnen als snelknoppen op Home.

Een vierkante Hue Bridge met actuele firmware en de lokale CLIP v2-API is vereist. De oude ronde Hue Bridge wordt niet ondersteund. Gastwifi of gescheiden VLANs kunnen lokaal verkeer blokkeren. Als automatische ontdekking niet werkt, blijft handmatig koppelen op IP-adres beschikbaar. Een gewijzigd Bridge-IP vereist in deze eerste versie opnieuw koppelen; een vaste DHCP-toewijzing kan dat voorkomen.

## Scènes en lampen

Maak en bewerk scènes in de officiële Hue-app. Sla ze daar bij een kamer of zone op. De Android-app haalt de op de Bridge opgeslagen scènes op en activeert ze via hun oorspronkelijke resource-ID. Hij maakt geen kopieën en wijzigt of verwijdert je Hue-scènes niet. Losse voorbeeldscènes uit een galerij die nog niet op de Bridge zijn opgeslagen, kunnen niet worden opgehaald.

In Live-modus tonen de snelknoppen je eigen favorieten zonder kamer- of zonenaam. Open bij **Hue-scènes op Home** de icoonkeuze per scène om bijvoorbeeld Filmavond, Lezen of Slapen te kiezen. De keuze blijft op dit apparaat bewaard. Er passen maximaal zes scèneknoppen per pagina; extra scènes zijn bladerbaar. Tik na wijzigingen in de Hue-app op **Lampen en scènes verversen**. Bij zichtbare app wordt de status ook ongeveer elke tien seconden opnieuw uitgelezen.

Tik op de verlichtingstegel voor de lijst met lampen en kamerfilter. Je kunt lampen schakelen en ondersteunde helderheid, wittemperatuur of kleur instellen. Met **Behouden** blijft de bestaande lichtkleur ongemoeid wanneer je alleen de helderheid toepast. De Bridge kan kleuren aanpassen aan het kleurbereik van de lamp.

Een geslaagde opdracht betekent dat de Bridge de opdracht bevestigd heeft. De fysieke reactie van alle lampen moet thuis worden gecontroleerd. Onbereikbare lampen en een onbereikbare Bridge worden niet als succesvol bediend getoond. De overige integraties blijven demo. Demo-modus verstuurt geen licht- of scèneopdrachten.

## Vormgeving en updates · versie 0.5.2

0.5.2 gebruikt dezelfde ondertekeningssleutel als 0.5.1. Installeer de APK over 0.5.1 heen om Hue- en Shelly-koppelingen, eigen namen, scène-iconen en indeling te behouden. De nieuwe vormgeving bevat lokale sfeerbeelden, donkere glastegels, gouden accenten, animatie bij openen en schermwissels en een bewegende navigatie-indicator. Bij Minder beweging worden de effecten uitgeschakeld. Een uitschakelende lamp dimt alleen de achtergrond van zijn tegel; dit verandert de feitelijke apparaatbediening niet.

## Shelly Plus 2PM koppelen · versie 0.5

**Build 0.5.1:** bevat aparte tegels, bediening bij loslaten, bewerkbare namen en Hue-scène-iconen. Deze build gebruikt op verzoek een nieuwe ondertekeningssleutel. Download: https://raw.githubusercontent.com/ymatheusen/Smart-home-dashboard/refs/heads/gh-pages/android/Mijn-Woning-0.5.1-nieuwe-sleutel.apk

Voor de overstap van 0.5.0 naar 0.5.1 moet je de bestaande app **eerst verwijderen**; Android accepteert de nieuwe ondertekening niet als update over de oude app. Noteer vooraf je Bridge- en Shelly-IP-adressen en maak zo nodig schermafbeeldingen van je indeling. Installeer daarna 0.5.1 en koppel Hue en Shelly opnieuw. Bij verwijderen verdwijnen de opgeslagen koppelingen, favorieten, eigen namen en indeling. Dit verandert de configuratie op de Bridge of Shelly-modules niet. Latere builds met dezelfde nieuwe sleutel kunnen wel over 0.5.1 heen worden geïnstalleerd.

1. Verbind met het thuisnetwerk. Open **Instellingen → Shelly Plus 2PM**.
2. Zoek het lokale IP-adres in de Shelly-app bij de apparaatinformatie. Vul een herkenbare naam en het IP-adres in. Voor deze installatie zijn er drie modules: twee rolluikmodules en één lichtmodule met twee kanalen.
3. Laat het wachtwoordvak uit als lokale authenticatie niet aanstaat. Als de module een wachtwoord vraagt, vink je het aan en vul je het **lokale** Shelly-wachtwoord in; gebruikersnaam is `admin`. Je Shelly-cloudaccount is niet nodig.
4. Tik op **Shelly controleren en toevoegen**. Alleen apparaatidentiteit, profiel, configuratie en status worden gelezen. Toevoegen verplaatst geen rolluik en schakelt geen lamp.
5. Herhaal voor de andere modules. De app herkent Gen 2 Plus2PM in het bestaande `cover`- of `switch`-profiel. Hij verandert geen profiel, bedrading, beveiligingen, kalibratie of apparaatconfiguratie.
6. Open **Verlichting** voor Hue-lampen en de twee afzonderlijke Shelly-lichtkanalen. De Plus 2PM is een schakelmodule en ondersteunt geen dimmen. Open bij de opgeslagen module **Namen aanpassen** om de module en kanalen in deze app een eigen naam te geven. Deze namen blijven op dit apparaat bewaard en veranderen de Shelly-configuratie niet. Ontbrekende namen, ook `null`, krijgen een leesbare vervangende naam.
7. Elk rolluik heeft een eigen tegel op Home en Kamers, met open/stop/sluit en na kalibratie een schuif. De schuif verstuurt één positieopdracht bij loslaten; toetsenbordbediening verstuurt bij loslaten van de toets. Afgebroken aanrakingen versturen geen opdracht. Tik op een tegeltitel voor de uitgebreide rolluikbediening. Staan de tegels op een volgende tegelpagina, gebruik dan de pijlen of zet Rolluik via **Indeling** vooraan. Bestaande indelingsvoorkeuren worden behouden.

Procentbediening is alleen zichtbaar wanneer de module `pos_control: true` meldt. 0% betekent gesloten, 100% geopend. De getoonde stand komt van `current_pos`, geen animatie of geschatte looptijd. Kalibreren blijft een handeling in de Shelly-app. Een foutmelding of lopende kalibratie blokkeert bewegingen behalve Stop. Stop blijft ook na een mislukte uitlezing beschikbaar, maar vereist een bereikbare module om effect te hebben.

De status wordt ongeveer elke drie seconden ververst terwijl de app zichtbaar en Shelly Live actief is. Een onbereikbare module toont geen actuele stand en blokkeert gewone opdrachten; de andere modules blijven bruikbaar. Opdrachten worden per module in volgorde afgehandeld, zodat een stopopdracht niet door een eerdere openingsopdracht kan worden ingehaald. Een bevestiging betekent dat de module de opdracht heeft geaccepteerd; de fysieke stand wordt afzonderlijk uitgelezen. Bij een netwerkfout herhaalt de app een opdracht niet zelf. Alleen een uitdrukkelijke authenticatie-afwijzing kan één digest-authenticatiepoging veroorzaken.

Bij een gewijzigd IP-adres of wachtwoord voeg je dezelfde module opnieuw toe; de oorspronkelijke module-ID voorkomt een dubbele koppeling. **Koppeling verwijderen** wist alleen die module uit de app. Hue blijft apart opgeslagen. Shelly Demo verstuurt geen apparaatopdrachten; Hue Demo/Live werkt onafhankelijk. Hue-scènes activeren alleen Hue-apparaten en sturen geen Shelly-rolluiken of lampen aan.

### Lokale Shelly-verbinding

De Plus 2PM gebruikt de lokale HTTP-API op poort 80. Daarom staat Android HTTP-verkeer voor de native module toe. De ingebouwde WebView blijft op `https://localhost` met `allowMixedContent: false`. De native Shelly-module accepteert alleen privé-IPv4-adressen, vaste API-paden en een beperkte lijst opdrachten; geen hostnamen, willekeurige URLs, redirects, proxy of cloudverkeer. De apparaat-ID, generatie en het actuele profiel worden voor bediening opnieuw gecontroleerd. Deze HTTP-identiteit is geen cryptografisch certificaat: gebruik het eigen vertrouwde thuisnetwerk. De bestaande Hue-verbinding blijft HTTPS met dezelfde certificaatcontrole.

Bij ingeschakelde lokale authenticatie ondersteunt de module SHA-256 Digest via de HTTP-challenge of de Shelly RPC-challenge. Er is geen Basic-authenticatie en het wachtwoord wordt niet als platte tekst in HTTP-verzoeken verstuurd. De lokale wachtwoorden staan AES-256-GCM-versleuteld in private Android-opslag met een eigen, niet-exporteerbare Keystore-sleutel. Het wachtwoordveld wordt na toevoegen gewist; native resultaten geven geen wachtwoorden of volledige apparaatconfiguratie terug. Hue-gegevens en Shelly-gegevens gebruiken afzonderlijke opslag en sleutels.

Referentie voor Gen 2 RPC, status en profiel: https://shelly-api-docs.shelly.cloud/gen2/ . De HTTP- en RPC-authenticatie zijn tevens vergeleken met Home Assistant aioshelly; er is geen code uit die bibliotheek overgenomen. De integratie is gecontroleerd met JVM-tests voor profielen, kalibratie, kanalen, digest, fouten en HTTP-verzoeken, plus een browserflow met drie gesimuleerde modules. De werkelijke wifi-verbinding en fysieke rolluiken/lampen moeten thuis worden getest.

## Beveiliging en opslag

- Alleen het ingebouwde dashboard op `https://localhost` mag de native plugin aanroepen. Er is geen cloudbackend, openbare poort of externe toegang nodig.
- De Hue-verbinding gebruikt HTTPS met de Philips/Signify Hue-rootcertificaten en controleert de exacte gecertificeerde Bridge-identiteit. De IP-hostnaam wordt vervangen door de Hue-identiteitscontrole omdat Hue-certificaten de Bridge-ID gebruiken. Certificaatketen- en geldigheidscontrole blijven actief, ook bij de eerste inspectie en het koppelen. Er is geen onbeveiligde HTTP-fallback.
- De app bewaart de Hue-sleutel met AES-256-GCM. De encryptiesleutel is niet exporteerbaar en staat in Android Keystore. De versleutelde gegevens staan in private app-opslag; Android-back-up staat uit.
- API-sleutels, authenticatieresources en legacy sleutel-URL's worden niet aan de webinterface teruggegeven. Favoriete scène-ID's en de Demo/Live-keuze worden lokaal opgeslagen.
- **Ontkoppelen** wist de lokale sleutel uit deze app. Je Hue-configuratie blijft intact. Een eventuele achtergebleven app-autorisatie kan via Hue-beheer ingetrokken worden.
- De APK is een ondertekende releasebuild, zonder Android-debugmodus. De privésleutel voor app-ondertekening staat buiten de repository. Deze sleutel is nodig om later een update over dezelfde app te installeren.

De openbare Hue-rootcertificaten zijn overgenomen uit OpenHue (`openhue/openhue-go`, commit `876da6d4b966086cb539c92dcd6f626473d10287`, `certs.go`), dat de officiële Hue HTTPS-documentatie als bron vermeldt. De Apache-2.0-licentie staat in `docs/licenses/openhue-Apache-2.0.txt`. Bron: https://developers.meethue.com/develop/application-design-guidance/using-https/ . Er is geen TLS-code uit die bibliotheek overgenomen; de Android-module gebruikt standaard Java/Android trust managers met aanvullende identiteitsbinding.

## Zelf bouwen

Vereist: Node.js 22.12+, JDK 21, Android SDK platform 35, build-tools 34.0.0 en de bijbehorende SDK-licenties. Capacitor is vastgelegd op de 7.6.x-lijn via de npm-lockfile. Gradle 8.11.1 wordt met zijn officiële SHA-256 gecontroleerd door de wrapper.

```sh
npm ci
npm run android:sync
```

Stel `JAVA_HOME`, `ANDROID_HOME` en `MW_ANDROID_SIGNING_CONFIG` in. De laatste verwijst naar een privé-JSON-bestand **buiten de checkout**, bijvoorbeeld in een persoonlijke beveiligde configuratiemap. Als het bestand nog niet bestaat, maakt het bouwscript daar een nieuwe ondertekeningssleutel en configuratie met beperkte bestandsrechten. Bewaar beide veilig; commit of publiceer ze niet. Er worden geen Hue-credentials in de build gebruikt.

```sh
npm run android:apk
```

Dit bouwt de Android-webbestanden, synchroniseert Capacitor, voert de native JVM-tests uit, bouwt de release-APK en controleert de APK-handtekening. Resultaat: `artifacts/android/Mijn-Woning.apk` en publieke bestandsmetadata in `artifacts/android/release.json`. De artifacts-map staat buiten Git-tracking. Een Android Studio-project staat in `android/`; synchroniseer eerst de webbestanden.

`npm run deploy:pages` publiceert ook de APK wanneer die lokaal gebouwd is. Zonder nieuwe APK blijft de bestaande Android-download op de Pages-branch behouden. De serviceworker onderschept geen Android-downloads. Native app-updates worden via een nieuwe ondertekende APK geïnstalleerd; PWA-updatemeldingen worden in de Android-app niet gebruikt.

## Gecontroleerd en nog thuis te testen

Gecontroleerd: compilatie van de native module, vijf JVM-tests voor lokale adresvalidatie, resource-ID's, certificaatidentiteit, afgeschermde resources en foutafhandeling; vier modeltests; de koppel- en bedieningsflow in een browser met een gesimuleerde native Bridge; dashboardregressies; APK-ondertekening.

Niet beschikbaar in de cloudomgeving: een fysieke Android-telefoon/tablet en jouw Hue Bridge. Daarom zijn de echte certificaathandshake met jouw firmware, mDNS op je router, Android Keystore op je toestel en de fysieke reactie van je lampen nog niet thuis bevestigd. Begin na koppelen met één herkenbare lamp en één scène. We kunnen vervolgens gericht corrigeren als jouw Bridge of toestel een afwijkende reactie geeft.

### Nieuwe ondertekening van 0.5.1 bewaren

De nieuwe sleutel staat privé buiten de repository in `/workspace/.cache/android-toolchain/signing/mijn-woning.keystore`, met configuratie `/workspace/.cache/android-toolchain/signing/private.json`. Deze paden horen bij de bouwomgeving van deze chat; een andere chat heeft niet automatisch dezelfde bestanden. Een privéback-up staat in `/workspace/shared/downloads/Mijn-Woning-sleutelbackup-PRIVE.zip`. Bewaar deze back-up buiten de tijdelijke bouwomgeving. Deel hem niet via GitHub of andere openbare downloads. Bij herstel naar een ander pad moet het `store`-pad in het configuratiebestand worden aangepast; wachtwoord en alias moeten behouden blijven. Alleen een nieuw sleutelpaar op hetzelfde pad aanmaken levert geen geldige update van deze APK op.
