# 🤠 Sheriff & Smugglers (El Paso Saloon Edition)

**Sheriff & Smugglers** est un jeu de cartes multijoueur en ligne P2P (Peer-to-Peer) standalone, directement jouable dans votre navigateur et inspiré du célèbre jeu de société *Le Shérif de Nottingham*. 

Cette édition se déroule dans l'ambiance poussiéreuse et animée d'un saloon du Far West (El Paso). Incarnez un marchand tentant d'introduire des marchandises (légales ou de contrebande) en négociant, bluffant ou corrompant le Shérif en ville !

---

## 🎮 Démo en Ligne

Jouez directement sur votre navigateur sans aucune installation :
👉 **[Démo en ligne sur GitHub Pages](https://gab371.github.io/sheriff-smugglers/)**

---

## ✨ Fonctionnalités

- **Connexion P2P Standalone** : Fonctionne directement de navigateur à navigateur grâce à **PeerJS**. Pas besoin de base de données ni de serveur de jeu intermédiaire (seul un serveur de signalement public est utilisé pour connecter les pairs).
- **Thème Western immersif** : Graphismes stylisés saloon, effets sonores procéduraux Web Audio (bruit de pièces d'or, fermeture des sacs, coups de marteau du Shérif).
- **Bluff & Négociation** : Modals interactifs pour sceller votre sac en secret, déclarer votre cargaison, offrir des pots-de-vin en pièces d'or ou faire des promesses au Shérif.
- **Journal d'activité & Clavardage** : Discussion instantanée P2P intégrée et journal d'activité pour suivre en temps réel les inspections, les amendes et les passages du Shérif.
- **Comptabilisation Automatisée** : Calcul automatique des scores finaux en fin de partie, incluant les bonus de majorité (Rois et Reines des marchandises).
- **Architecture Extensible** : Conçu pour supporter facilement d'autres decks thématiques à l'avenir (decks futuristes, médiévaux, pirates, etc.).

---

## 🛠️ Installation & Lancement Local

### Prérequis
- **Node.js** (v20 ou supérieur recommandé)
- **npm**

### Lancement du serveur de développement
1. Clonez le dépôt :
   ```bash
   git clone https://github.com/gab371/sheriff-smugglers.git
   cd sheriff-smugglers
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur Vite :
   ```bash
   npm run dev
   ```
4. Ouvrez `http://localhost:5173/` (ou le port indiqué) dans votre navigateur.

*Pour tester le multi-joueur en local, ouvrez simplement un second onglet ou utilisez un navigateur différent pour vous connecter au même code de salon.*

### Compilation pour la production
Pour générer les fichiers optimisés pour le déploiement (dossier `dist/`) :
```bash
npm run build
```

---

## 🏛️ Architecture du Projet

Le projet suit des principes stricts de séparation des responsabilités pour garantir la testabilité et la maintenabilité :
- **`/src/core`** : Moteur de jeu pur (règles de tours, pioches/défausses, cartes, calcul des scores) écrit en TypeScript pur, sans aucune dépendance UI ou réseau.
- **`/src/network`** : Gestionnaire de connexion P2P PeerJS et protocole de messages réseau.
- **`/src/hooks`** : Custom hooks liant l'état de jeu réactif et les événements réseau au cycle de vie de React.
- **`/src/components`** : Composants d'interface (Shadcn UI, plateau de jeu, lobby, modaux).

---

## 📄 Licence

Ce projet est distribué sous licence MIT.
