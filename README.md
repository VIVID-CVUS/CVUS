# Demo CVUS - Application de Démonstration GE HealthCare

Application React TypeScript développée pour GE HealthCare permettant la gestion et la présentation de produits d'échographie cardiovasculaire avec génération de rapports personnalisés.

## Table des matières

- [Prérequis](#prérequis)
- [Installation pour les développeurs](#installation-pour-les-développeurs)
- [Configuration du projet](#configuration-du-projet)
- [Commandes de développement](#commandes-de-développement)
- [Architecture du projet](#architecture-du-projet)
- [Guide utilisateur](#guide-utilisateur)
- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Déploiement](#déploiement)

## Prérequis

### Pour les développeurs

Avant de commencer, assurez-vous d'avoir installé les éléments suivants sur votre système :

- **Node.js** (version 18.0 ou supérieure)
  - Télécharger depuis [nodejs.org](https://nodejs.org/)
  - Vérifier l'installation : `node --version`

- **npm** (généralement inclus avec Node.js)
  - Vérifier l'installation : `npm --version`

- **Git** (pour le contrôle de version)
  - Télécharger depuis [git-scm.com](https://git-scm.com/)

## Installation pour les développeurs

### 1. Cloner le repository

```bash
git clone <url-du-repository>
cd Demo_CVUS-main
```

### 2. Installer les dépendances

```bash
npm install
```

Cette commande installera automatiquement toutes les dépendances listées dans le `package.json`, incluant :

**Dépendances principales :**
- React 19.0.0
- TypeScript
- Tailwind CSS 4.1.4
- Vite (build tool)
- EmailJS (envoi d'emails)
- jsPDF (génération PDF)
- xlsx (export Excel)
- html2canvas (capture d'écran)

**Dépendances de développement :**
- ESLint (linting)
- TypeScript compiler
- Vite plugins

### 3. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet (optionnel) :

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_USER_ID=your_user_id
```

## Configuration du projet

### Structure des fichiers de configuration

- **`vite.config.ts`** : Configuration Vite avec Tailwind CSS
- **`tsconfig.json`** : Configuration TypeScript
- **`tailwind.config.js`** : Configuration Tailwind CSS
- **`eslint.config.js`** : Configuration ESLint
- **`postcss.config.js`** : Configuration PostCSS

### Configuration EmailJS (optionnel)

Pour activer l'envoi d'emails, configurez EmailJS :

1. Créer un compte sur [EmailJS](https://www.emailjs.com/)
2. Configurer un service email
3. Créer un template d'email
4. Mettre à jour les identifiants dans le code ou les variables d'environnement

## Commandes de développement

### Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build de production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`

### Linting du code

```bash
npm run lint
```

### Prévisualiser le build de production

```bash
npm run preview
```

### Déployer sur GitHub Pages

```bash
npm run deploy
```

### Servir les fichiers de production localement

```bash
npm run serve
```

## Architecture du projet

```
src/
├── components/
│   ├── Actions/          # Boutons d'action (export, email)
│   ├── Auth/             # Système d'authentification
│   ├── Client/           # Composants client (infos, sélection)
│   ├── data/             # Données JSON (produits, commerciaux)
│   ├── Layout/           # Composants de mise en page
│   ├── Tables/           # Tableaux avec commentaires
│   └── type/             # Définitions TypeScript
├── contexts/             # Contextes React (Auth)
├── services/             # Services (export, données)
├── assets/               # Images et ressources statiques
├── App.tsx               # Composant principal
└── main.tsx              # Point d'entrée
```

### Composants principaux

- **App.tsx** : Composant racine gérant l'état global
- **FormContainer** : Layout principal du formulaire
- **ProductSelect** : Sélection des produits d'échographie
- **ClientInfo** : Formulaire d'informations client
- **TableWithComments** : Tableaux interactifs avec commentaires
- **EmailBodyEditor** : Éditeur de corps d'email
- **ActionButtons** : Boutons d'export et d'envoi

## Guide utilisateur

### Connexion

1. Ouvrir l'application dans un navigateur web
2. Saisir les identifiants de connexion
3. Cliquer sur "Se connecter"

### Utilisation de l'application

#### 1. Sélection du produit

- Choisir le type de produit d'échographie dans la liste déroulante
- Les données correspondantes se chargeront automatiquement

#### 2. Informations client

- Remplir les informations du client :
  - Nom et prénom
  - Établissement
  - Adresse email
  - Téléphone
- Sélectionner le commercial assigné

#### 3. Configuration des produits

- Cocher les cases pour indiquer :
  - **Présenté** : Produit montré au client
  - **Apprécié** : Produit apprécié par le client
  - **Souhaité** : Produit souhaité par le client
- Ajouter des commentaires personnalisés dans la colonne dédiée

#### 4. Personnalisation de l'email

- Modifier le corps de l'email dans l'éditeur
- Personnaliser le message selon le contexte de la démonstration

#### 5. Export et envoi

- **Export Excel** : Générer un fichier .xlsx avec toutes les données
- **Export PDF** : Créer un rapport PDF formaté
- **Envoyer par email** : Envoyer directement le rapport au client

### Conseils d'utilisation

- Sauvegarder régulièrement en exportant les données
- Vérifier les informations client avant l'envoi
- Personnaliser les commentaires pour chaque démonstration
- Utiliser la prévisualisation avant l'envoi final

## Fonctionnalités

### Gestion des données

- Interface de sélection multi-produits
- Tableaux interactifs avec cases à cocher
- Système de commentaires par ligne
- Sauvegarde automatique des sélections

### Export et communication

- Export Excel avec formatage professionnel
- Génération PDF avec logo GE HealthCare
- Envoi d'emails automatisé via EmailJS
- Prévisualisation avant envoi

### Interface utilisateur

- Design moderne avec Tailwind CSS
- Interface responsive pour tous les appareils
- Système d'authentification sécurisé
- Navigation intuitive

## Technologies utilisées

### Frontend

- **React 19** : Framework JavaScript
- **TypeScript** : Typage statique
- **Tailwind CSS 4** : Framework CSS utilitaire
- **Vite** : Outil de build et développement

### Bibliothèques

- **EmailJS** : Envoi d'emails côté client
- **jsPDF** : Génération de documents PDF
- **xlsx** : Manipulation de fichiers Excel
- **html2canvas** : Capture d'écran HTML
- **file-saver** : Téléchargement de fichiers

### Outils de développement

- **ESLint** : Linting et formatage
- **PostCSS** : Traitement CSS
- **TypeScript Compiler** : Compilation TypeScript

## Déploiement

### Déploiement sur Vercel (Recommandé)

Le projet est configuré pour un déploiement simple sur Vercel :

#### Méthode 1 : Via l'interface Vercel (le plus simple)

1. Créer un compte sur [vercel.com](https://vercel.com)
2. Cliquer sur "Add New Project"
3. Importer le repository GitHub
4. Vercel détectera automatiquement la configuration Vite
5. Cliquer sur "Deploy"

#### Méthode 2 : Via CLI Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter à Vercel
vercel login

# Déployer le projet
vercel

# Pour le déploiement en production
vercel --prod
```

Le fichier `vercel.json` est déjà configuré pour gérer correctement le routing SPA.

### Déploiement automatique sur GitHub Pages

```bash
npm run deploy
```

### Déploiement manuel

1. Construire le projet :
   ```bash
   npm run build
   ```

2. Déployer le contenu du dossier `dist/` sur votre serveur web

### Configuration serveur

- Configurer le serveur pour servir les fichiers statiques
- Assurer la redirection des routes vers `index.html` (SPA)
- Configurer HTTPS pour la sécurité

## Support technique

Pour toute question technique ou problème :

1. Vérifier les logs de la console du navigateur
2. S'assurer que toutes les dépendances sont installées
3. Vérifier la configuration EmailJS si l'envoi d'emails ne fonctionne pas
4. Consulter la documentation des technologies utilisées

## Contribution

Pour contribuer au projet :

1. Créer une branche feature
2. Développer et tester les modifications
3. Respecter les conventions de code (ESLint)
4. Créer une pull request avec description détaillée

---

**Développé pour GE HealthCare** - Application de démonstration d'échographie cardiovasculaire
