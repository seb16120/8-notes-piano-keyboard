# Les deux pianos

Un atelier sonore conçu avec Fine Mouche et Astra : deux claviers jouables pour comparer le tempérament égal à une gamme de huit degrés par octave.

- Piano tempéré : 88 touches, de 27,5 à environ 4 186 Hz.
- Gamme des harmoniques 8–16 : 57 touches de 32 à 4 096 Hz, soit sept octaves complètes avec le do final.
- Rapports dans chaque octave : 1, 9/8, 5/4, 11/8, 3/2, 13/8, 7/4, 15/8.
- À partir de 256 Hz : 256, 288, 320, 352, 384, 416, 448, 480, puis 512 Hz.

## Nom et références

« Harmoniques 8–16 » désigne une gamme déjà connue : les huit degrés entre les harmoniques 8 et 16 sont répétés à l’octave. « Puissance 2 » était notre surnom initial ; le dépôt conserve son nom `8-notes-piano-keyboard` et son adresse.

[Bart Hopkin](https://barthopkin.com/otonuton-scales/) décrit cette construction et indique l’avoir rencontrée dans *Sounds of Just Intonation* de Ralph David Hill, qu’il date de 1985. [Dante Rosati](https://www.chrisvaisvil.com/wp-content/uploads/2013/06/Dante_Rosati_on_making_Harmonic_Series_Guitars.pdf) décrit également une guitare utilisant les harmoniques 8–15 dans chaque octave. Ces références attestent des usages de la gamme, sans établir son premier inventeur. Le document original de Hill n’a pas été consulté. Le do à 256 Hz est notre choix de diapason, indépendant de la structure de la gamme.

## Utilisation

Ouvrir index.html ou la page GitHub Pages. Cliquer et maintenir une touche pour jouer ; relâcher pour arrêter. Au clavier : Tab pour choisir, Espace ou Entrée pour jouer. Les claviers défilent horizontalement. Sur écran tactile, utiliser la barre de défilement sous les touches.

Même synthèse sonore pour les deux gammes, timbre clair ou doux, réglage de volume. Les do du clavier à huit degrés sont noirs. Le clavier entendu devient opaque et les touches actives deviennent dorées.

## Correspondances bleues

Le bouton « Correspondances bleues » active la projection silencieuse sur l’autre clavier. Les deux touches qui encadrent la fréquence se partagent l’intensité du bleu selon la distance en cents : interpolation du logarithme de la fréquence, poids dont la somme vaut 1. À mi-chemin acoustique (moyenne géométrique des fréquences), elles reçoivent chacune 50 %. Une hauteur exacte donne une seule touche à 100 %. Hors de l’étendue de l’autre clavier, aucune touche n’est colorée. Les claviers défilent pour montrer les touches concernées.

## MIDI

Importer un fichier .mid ou .midi, ou charger un des deux exemples. Écouter dans l’accordage d’origine ou convertir vers l’autre clavier ; lecture, pause, arrêt, position et suivi automatique des notes sont disponibles. Le halo vert marque la source du MIDI, indépendamment du clavier entendu.

La conversion choisit la touche la plus proche en cents. Elle préserve les rythmes et vélocités, mais peut fusionner des hauteurs distinctes. Les hauteurs hors étendue sont ramenées aux extrémités lors d’une conversion ; la lecture d’origine conserve leurs fréquences sans touche correspondante.

### Accordage explicite des exports

« Exporter le MIDI entendu » produit un fichier SMF format 0 contenant :

- Un marqueur texte : `ASTRA_SCALE=power2;BASE=32;MIDI_BASE=24;RATIOS=1,9/8,5/4,11/8,3/2,13/8,7/4,15/8;VERSION=1`, ou `ASTRA_SCALE=equal`.
- Une table MIDI Tuning Standard Single-note Tuning Change (Universal Real-Time, programme 0) au début du morceau. Fréquences encodées avec une résolution de 1/16384 de demi-ton, erreur maximale d’environ 0,0031 cent.
- La sélection RPN de la banque et du programme d’accordage 0 sur le canal mélodique exporté.

Dans notre encodage des harmoniques 8–16, MIDI 24 = 32 Hz, puis un numéro par degré, jusqu’à MIDI 80 = 4096 Hz. Le do 256 Hz est MIDI 48. Le marqueur permet à notre lecteur d’utiliser les rapports exacts. Une table MTS correspondant à nos 57 hauteurs permet également de reconnaître la gamme sans marqueur. Un lecteur externe doit prendre en charge MIDI Tuning pour restituer ces fréquences ; le marqueur texte seul ne suffit pas à un lecteur générique. L’identifiant technique historique `power2` reste reconnu et exporté pour conserver la compatibilité avec les premiers fichiers.

Exemples créés pour le projet : [tempéré](exemple-tempere.mid) et [harmoniques 8–16](exemple-puissance-2.mid). Ils reprennent la même succession de degrés dans leurs deux accordages. Le second lien conserve son ancien nom de fichier pour rester accessible.

Référence primaire : [MIDI Association, MIDI Tuning](https://midi.org/midi-tuning-updated-specification).

### Portée du lecteur

SMF formats 0 et 1, synchronisation par ticks, changements de tempo, running status, vélocité et pédale de maintien. Maximum 10 Mo, 20 000 notes, une heure et 160 voix simultanées. Le canal de percussion 10 est écarté. Les changements d’instrument et pitch bends ne sont pas reproduits ; les pitch bends sont signalés. Les deux gammes partagent le même son synthétique.

Reconnaissance des marqueurs du projet et des tables MTS Single-note initiales programme 0 correspondant aux deux accordages. Les autres tables MTS sont refusées explicitement. Sans indication reconnue, le tempérament égal est seulement présumé ; l’utilisateur peut corriger la source. Cette reconnaissance porte sur l’accordage, pas sur la tonalité majeure ou mineure du morceau.

Aucune installation, dépendance externe, télémétrie ni microphone. Aucun réglage audio Windows n’est modifié.

## Publication

GitHub Settings → Pages → Deploy from a branch → main → / (root).

## Pour la suite

Une représentation de flûte de Pan à 256–512 Hz reste prévue.

## Vérifications

Tests locaux : fréquences et limites des 88 et 57 touches ; interpolation bleue exacte, à mi-distance et hors étendue ; précision MTS ; export/réimport des deux gammes et des quatre combinaisons source/cible ; fixtures indépendantes pour tempo, pédale et running status ; rejets de fichiers tronqués ; graphe audio simulé pour vérifier les correspondances silencieuses, le défilement et l’annulation de lecture. La qualité sonore perçue reste à apprécier à l’écoute.
