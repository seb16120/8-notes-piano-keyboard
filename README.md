# Les deux pianos

Un atelier sonore conçu avec Fine Mouche et Astra : deux claviers jouables pour comparer le tempérament égal à une gamme de huit degrés par octave.

- Piano tempéré : 88 touches, de 27,5 à environ 4 186 Hz.
- Gamme « puissance 2 » : 57 touches de 32 à 4 096 Hz, soit sept octaves complètes avec le do final.
- Rapports dans chaque octave : 1, 9/8, 5/4, 11/8, 3/2, 13/8, 7/4, 15/8.
- À partir de 256 Hz : 256, 288, 320, 352, 384, 416, 448, 480, puis 512 Hz.

## Utilisation

Ouvrir index.html ou la page GitHub Pages. Cliquer et maintenir une touche pour jouer ; relâcher pour arrêter. Au clavier : Tab pour choisir, Espace ou Entrée pour jouer. Les claviers défilent horizontalement. Sur écran tactile, utiliser la barre de défilement sous les touches.

Même synthèse sonore pour les deux gammes, timbre clair ou doux, réglage de volume. Les do du clavier à huit degrés sont noirs. Le dernier clavier joué devient opaque et les touches actives deviennent dorées.

Aucune installation, dépendance externe, télémétrie ni microphone. Aucun réglage audio Windows n’est modifié.

## Publication

GitHub Settings → Pages → Deploy from a branch → main → / (root).

## Portée de la V1

Cette version est limitée au jeu direct. L’import MIDI et sa conversion sont prévus pour une version suivante, ainsi qu’une représentation de flûte de Pan à 256–512 Hz. Le nom « puissance 2 » désigne le projet : les degrés de la gamme ne sont pas tous des puissances de deux.

## Vérifications

Tests locaux des 88 et 57 touches, des limites de fréquence, des références 256 Hz et 440 Hz, de la sélection et de l’arrêt des notes. La qualité sonore perçue dépend des haut-parleurs et reste à apprécier à l’écoute.
