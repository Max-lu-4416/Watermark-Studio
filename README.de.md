# Watermark Studio

Sprachen: [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | **Deutsch**

Watermark Studio ist ein rein frontendbasiertes, lokal ausgeführtes Bild-Wasserzeichen-Tool. Es kann PNG-Wasserzeichen und Text-Wasserzeichen stapelweise auf Fotos anwenden. Die gesamte Bildverarbeitung findet im Browser statt. Es ist kein Backend erforderlich, und deine Bilder werden nicht hochgeladen.

## Online-Demo

[Watermark Studio öffnen](https://max-lu-4416.github.io/Watermark-Studio/)

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## Funktionen

- Stapelimport von JPG-, PNG- und WEBP-Bildern.
- Fortschreitende Vorschau beim Import hochauflösender Bilder: Jedes Bild erscheint, sobald es verarbeitet wurde.
- Komprimierte Vorschaubilder und Miniaturen reduzieren Verzögerungen bei großen Fotos.
- Quadratische 1:1-Miniaturen mit Scrollen, Mehrfachauswahl, Shift-Bereichsauswahl, Alles auswählen, Auswahl aufheben und Stapellöschung.
- Laden des Standard-PNG-Wasserzeichens und Upload eigener transparenter PNG-Wasserzeichen.
- Text-Wasserzeichen mit Farbe, Schriftart, Schriftstärke, Kursivstil und Schatten- / Kontureffekten.
- PNG-Wasserzeichen und Text-Wasserzeichen können kombiniert werden.
- Vier Anordnungen: horizontal, vertikal, nur PNG und nur Text.
- Anpassbare Größe, Deckkraft, prozentualer Rand, Invertierung und Neun-Punkt-Ankerposition.
- Grafischer Neun-Punkt-Positionswähler.
- Vorschau und Export verwenden dieselbe Canvas-Renderlogik.
- Export des aktuellen Bildes oder aller Bilder als JPG, PNG oder WEBP.
- Konfiguration von Qualität, Langkantenauflösung, Dateinamenpräfix / -suffix und Farbraum.
- Export als einzelne Dateien oder ZIP-Paket.
- Fortschritt beim Stapelexport und Fehlermeldungen mit dem betroffenen Bildnamen.
- Dunkles und helles Theme.

## Verwendung

1. Öffne die Online-Demo oder die lokale Datei `index.html`.
2. Klicke in der linken Fotoliste auf `+` und wähle ein oder mehrere Bilder aus.
3. Verwende das Standard-PNG-Wasserzeichen oder lade ein eigenes transparentes PNG hoch.
4. Optional: Gib ein Text-Wasserzeichen ein und konfiguriere den Stil.
5. Passe Größe, Deckkraft, Rand, Invertierung, Anordnung und Ankerposition an.
6. Konfiguriere Format, Qualität, Langkantenauflösung, Benennung, Farbraum, Exportumfang und Ausgabemodus.
7. Klicke auf Exportieren, um das verarbeitete Bild oder ZIP-Paket herunterzuladen.

## Standard-Wasserzeichen

```text
assets/watermarks/watermark.png
```

Empfohlen wird ein PNG mit transparentem Hintergrund, z. B. eine Signatur, ein Fotologo oder ein Markenwasserzeichen. Wenn das Standard-Wasserzeichen fehlt, fordert die Seite zum Hochladen eines PNG auf. Du kannst auch nur mit Text-Wasserzeichen exportieren.

## Lokal ausführen

Du kannst `index.html` direkt öffnen oder einen lokalen Server starten:

```bash
python -m http.server 8080
```

Danach öffnen:

```text
http://localhost:8080
```

## Projektstruktur

```text
Watermark-Studio/
|-- index.html
|-- styles.css
|-- README.md
|-- README.zh-CN.md
|-- README.zh-TW.md
|-- README.ja.md
|-- README.ko.md
|-- README.es.md
|-- README.fr.md
|-- README.de.md
|-- assets/
|   `-- watermarks/
|       `-- watermark.png
|-- js/
|   |-- main.js
|   |-- state.js
|   |-- ui.js
|   |-- canvas-renderer.js
|   |-- watermark-image.js
|   `-- export.js
`-- tests/
    `-- watermark-layout.test.js
```

## Wichtige Dateien

- `index.html`: Seitenstruktur und Formularsteuerelemente.
- `styles.css`: Themes, Layout, Miniaturen, Formulare, Buttons und Fokusstile.
- `js/state.js`: Bilder, Wasserzeichen, Text-Wasserzeichen, Auswahlstatus und Exporteinstellungen.
- `js/ui.js`: Import, Miniaturen, Mehrfachauswahl, Steuerungsbindung, Exportfortschritt und UI-Aktualisierung.
- `js/canvas-renderer.js`: Vorschau-Rendering, Wasserzeichen-Layout und PNG- / Text-Komposition.
- `js/watermark-image.js`: Laden des Standard-Wasserzeichens und Upload eigener PNG-Wasserzeichen.
- `js/export.js`: Laden der Originalbilder, Exportgrößen, Dateinamen, Speichern und ZIP-Erstellung.
- `tests/watermark-layout.test.js`: Tests für Neun-Punkt-Positionen und extreme Einstellungen.

## Entwicklungschecks

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

## Datenschutz

Watermark Studio hat keinen serverseitigen Upload-Ablauf. Importierte Bilder werden lokal im Browser verarbeitet und nicht zu GitHub oder einem anderen Server hochgeladen.
