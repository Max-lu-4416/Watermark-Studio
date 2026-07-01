# Watermark Studio

Langues : [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | **Français** | [Deutsch](README.de.md)

Watermark Studio est un outil de filigrane d'image entièrement frontend et local. Il permet d'ajouter en lot des filigranes PNG et des filigranes texte à des photos. Tout le traitement se fait dans le navigateur, sans service backend, et vos images ne sont pas téléversées.

## Démo en ligne

[Ouvrir Watermark Studio](https://max-lu-4416.github.io/Watermark-Studio/)

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## Fonctionnalités

- Import par lot d'images JPG, PNG et WEBP.
- Aperçu progressif lors de l'import d'images haute résolution : chaque image apparaît dès qu'elle est traitée.
- Aperçus compressés et miniatures pour réduire les ralentissements avec les grandes photos.
- Miniatures carrées 1:1 avec défilement, sélection multiple, sélection de plage avec Shift, tout sélectionner, annuler la sélection et suppression par lot.
- Chargement du filigrane PNG par défaut et import d'un PNG transparent personnalisé.
- Filigrane texte avec couleur, police, graisse, italique et effets d'ombre / contour.
- Combinaison possible du filigrane PNG et du filigrane texte.
- Quatre dispositions : horizontale, verticale, PNG seul et texte seul.
- Réglage de la taille, de l'opacité, de la marge en pourcentage, de l'inversion et de la position d'ancrage en neuf points.
- Sélecteur graphique de position en neuf points.
- L'aperçu et l'export utilisent la même logique de rendu Canvas.
- Export de l'image courante ou de toutes les images en JPG, PNG ou WEBP.
- Réglage de la qualité, de la résolution du grand côté, du préfixe / suffixe de nom de fichier et de l'espace colorimétrique.
- Export en fichiers séparés ou en archive ZIP.
- Progression d'export par lot et messages d'échec avec le nom de l'image concernée.
- Thèmes sombre et clair.

## Utilisation

1. Ouvrez la démo en ligne ou le fichier local `index.html`.
2. Cliquez sur `+` dans la liste de photos à gauche et sélectionnez une ou plusieurs images.
3. Utilisez le filigrane PNG par défaut ou importez votre propre PNG transparent.
4. Optionnel : saisissez un filigrane texte et configurez son style.
5. Ajustez la taille, l'opacité, la marge, l'inversion, la disposition et la position d'ancrage.
6. Configurez le format, la qualité, la résolution du grand côté, le nommage, l'espace colorimétrique, la portée et le mode d'export.
7. Cliquez sur le bouton d'export pour télécharger l'image traitée ou le ZIP.

## Filigrane par défaut

```text
assets/watermarks/watermark.png
```

Un PNG à fond transparent est recommandé, par exemple une signature, un logo photo ou un filigrane de marque. Si le filigrane par défaut est absent, la page demandera d'importer un PNG. Vous pouvez aussi exporter avec un filigrane texte uniquement.

## Exécution locale

Vous pouvez ouvrir directement `index.html` ou lancer un serveur local :

```bash
python -m http.server 8080
```

Puis ouvrez :

```text
http://localhost:8080
```

## Structure du projet

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

## Fichiers principaux

- `index.html` : Structure de la page et contrôles de formulaire.
- `styles.css` : Thèmes, mise en page, miniatures, formulaires, boutons et styles de focus.
- `js/state.js` : Photos, filigranes, texte, sélection et paramètres d'export.
- `js/ui.js` : Import, miniatures, sélection multiple, liaison des contrôles, progression et rafraîchissement de l'interface.
- `js/canvas-renderer.js` : Rendu d'aperçu, disposition du filigrane et composition PNG / texte.
- `js/watermark-image.js` : Chargement du filigrane par défaut et import du PNG personnalisé.
- `js/export.js` : Chargement des originaux, dimensions d'export, noms de fichiers, sauvegarde et ZIP.
- `tests/watermark-layout.test.js` : Tests des positions en neuf points et des réglages extrêmes.

## Vérifications de développement

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

## Confidentialité

Watermark Studio n'a aucun flux de téléversement côté serveur. Les images importées sont traitées localement dans votre navigateur et ne sont pas envoyées à GitHub ni à aucun autre serveur.
