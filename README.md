# 🤠 Sheriff & Smugglers (El Paso Saloon Edition)

[![Deploy to GitHub Pages](https://github.com/gab371/sheriff-smugglers/actions/workflows/deploy.yml/badge.svg)](https://github.com/gab371/sheriff-smugglers/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Sheriff & Smugglers** est un jeu de cartes multijoueur en ligne P2P (Peer-to-Peer) standalone, directement jouable dans votre navigateur et inspiré du célèbre jeu de société *Le Shérif de Nottingham*. 

Cette édition se déroule dans l'ambiance poussiéreuse et animée d'un saloon du Far West (El Paso). Incarnez un marchand tentant d'introduire des marchandises (légales ou de contrebande) en négociant, bluffant ou corrompant le Shérif en ville !

---

## 🎮 Démo en Ligne

Jouez directement sur votre navigateur sans aucune installation :
👉 **[Jouer à la démo en ligne](https://gab371.github.io/sheriff-smugglers/)**

---

## ✨ Fonctionnalités Clés

- **Connexion P2P via [`p2play-core`](https://github.com/gab371/p2play-core)** (≥ v0.6.0) : PeerJS, lobby partagé, chat, journal, présence / reconnexion, et partage de lien de salon (`RoomCodeBadge`).
- **Thème Western immersif** : Graphismes stylisés saloon, effets sonores Web Audio (bruit de pièces d'or, fermeture des sacs, coups de marteau du Shérif).
- **Bluff & Négociation** : Modals interactifs pour sceller votre sac en secret, déclarer votre cargaison, offrir des pots-de-vin en pièces d'or ou faire des promesses au Shérif.
- **Journal d'activité & Clavardage** : Panels partagés `p2play-core/chat` pour suivre inspections, amendes et discussions P2P.
- **Comptabilisation Automatisée** : Calcul automatique des scores finaux en fin de partie, incluant les bonus de majorité (Barons et Trafiquants des marchandises).
- **Architecture Extensible** : Conçu pour supporter facilement d'autres decks thématiques à l'avenir (decks futuristes, médiévaux, pirates, etc.).
- **Hub P2Play** : Build lib (`dist.zip`) montable dans [hub-p2play](https://github.com/gab371/hub-p2play) sans iFrame.

---

## 🛠️ Lancement Local

### Prérequis
- **Node.js** (v20 ou supérieur recommandé)
- **npm**

### Instructions

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/gab371/sheriff-smugglers.git
   cd sheriff-smugglers
   ```
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
4. **Ouvrir dans le navigateur** :
   Ouvrez `http://localhost:5173/` (ou le port indiqué par Vite).
   *Pour tester à deux sur la même machine, ouvrez un deuxième onglet ou un autre navigateur.*

5. **Compiler pour la production** :
   ```bash
   npm run build
   ```

---

## 🏛️ Architecture du Projet

Le projet suit des principes stricts de séparation des responsabilités pour garantir la testabilité et la maintenabilité :
- **`/src/core`** : Moteur de jeu pur (règles de tours, pioches/défausses, cartes, calcul des scores) écrit en TypeScript pur, sans aucune dépendance UI ou réseau.
- **Réseau** : [`p2play-core`](https://github.com/gab371/p2play-core) (`usePeer`, `P2PlayLobby`, présence, chat) — pas de `PeerManager` local.
- **`/src/hooks`** : Custom hooks liant l'état de jeu réactif et les événements réseau au cycle de vie de React.
- **`/src/components`** : Composants d'interface (plateau de jeu, lobby connecté, modaux de décision).

Dépendance typique :
```json
"p2play-core": "github:gab371/p2play-core#v0.6.0"
```

---

## 📄 Licence

Ce projet est distribué sous licence MIT.
