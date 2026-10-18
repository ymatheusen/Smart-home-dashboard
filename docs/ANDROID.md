# Mijn Woning voor Android · lokale Hue-koppeling

## Installeren en koppelen

1. Download `https://github.com/ymatheusen/Smart-home-dashboard/raw/refs/heads/gh-pages/android/Mijn-Woning.apk` op je Android-telefoon of tablet. De downloadpagina staat op `/Smart-home-dashboard/android/`.
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

In Live-modus tonen de snelknoppen je eigen favorieten met kamer- of zonenaam. Er passen maximaal zes scèneknoppen per pagina; extra scènes zijn bladerbaar. Tik na wijzigingen in de Hue-app op **Lampen en scènes verversen**. Bij zichtbare app wordt de status ook ongeveer elke tien seconden opnieuw uitgelezen.

Tik op de verlichtingstegel voor de lijst met lampen en kamerfilter. Je kunt lampen schakelen en ondersteunde helderheid, wittemperatuur of kleur instellen. Met **Behouden** blijft de bestaande lichtkleur ongemoeid wanneer je alleen de helderheid toepast. De Bridge kan kleuren aanpassen aan het kleurbereik van de lamp.

Een geslaagde opdracht betekent dat de Bridge de opdracht bevestigd heeft. De fysieke reactie van alle lampen moet thuis worden gecontroleerd. Onbereikbare lampen en een onbereikbare Bridge worden niet als succesvol bediend getoond. De overige integraties blijven demo. Demo-modus verstuurt geen licht- of scèneopdrachten.

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
