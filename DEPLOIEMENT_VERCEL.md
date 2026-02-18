# Guide de Déploiement Vercel

Ce document explique comment déployer cette application sur Vercel.

## Option 1 : Déploiement via l'Interface Vercel (Recommandé pour les débutants)

### Étape 1 : Créer un compte Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Sign Up"
3. Connectez-vous avec votre compte GitHub

### Étape 2 : Importer le projet
1. Une fois connecté, cliquez sur le bouton "Add New..." puis "Project"
2. Autorisez Vercel à accéder à vos repositories GitHub si demandé
3. Sélectionnez le repository `VIVID-CVUS/CVUS`
4. Cliquez sur "Import"

### Étape 3 : Configurer le projet
- Vercel détectera automatiquement qu'il s'agit d'un projet Vite
- Les paramètres suivants seront configurés automatiquement grâce au fichier `vercel.json` :
  - **Build Command**: `npm run build:vercel`
  - **Output Directory**: `dist`
  - **Install Command**: `npm install`

### Étape 4 : Variables d'environnement (si nécessaire)
Si vous utilisez des variables d'environnement (fichier `.env`), ajoutez-les dans les paramètres :
1. Allez dans l'onglet "Environment Variables"
2. Ajoutez vos variables une par une

### Étape 5 : Déployer
1. Cliquez sur "Deploy"
2. Attendez que le déploiement se termine (environ 1-2 minutes)
3. Votre application sera disponible sur une URL du type : `https://votre-projet.vercel.app`

## Option 2 : Déploiement via CLI Vercel (Pour les utilisateurs avancés)

### Étape 1 : Installer Vercel CLI
```bash
npm install -g vercel
```

### Étape 2 : Se connecter à Vercel
```bash
vercel login
```
Suivez les instructions pour vous connecter avec votre compte GitHub.

### Étape 3 : Déployer depuis le terminal

#### Déploiement de test (preview)
```bash
cd /chemin/vers/CVUS
vercel
```

#### Déploiement en production
```bash
vercel --prod
```

### Étape 4 : Configuration lors du premier déploiement
Le CLI vous posera quelques questions :
- **Set up and deploy**: Choisissez "Y" (Yes)
- **Which scope**: Sélectionnez votre compte
- **Link to existing project**: Choisissez "N" (No) si c'est la première fois
- **What's your project's name**: Appuyez sur Enter pour accepter le nom par défaut
- **In which directory is your code located**: Appuyez sur Enter (racine du projet)

Vercel utilisera automatiquement la configuration du fichier `vercel.json`.

## Déploiements Automatiques

Une fois votre projet configuré sur Vercel :
- **Chaque push sur la branche principale** déclenchera automatiquement un déploiement en production
- **Chaque pull request** créera automatiquement un déploiement de prévisualisation

## Configuration des Variables d'Environnement

Si votre application utilise des variables d'environnement (ex: clés API EmailJS) :

### Via l'interface web :
1. Allez dans les paramètres de votre projet sur Vercel
2. Sélectionnez "Settings" > "Environment Variables"
3. Ajoutez vos variables :
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`
   - etc.

### Via CLI :
```bash
vercel env add VITE_EMAILJS_SERVICE_ID
```

## Domaine Personnalisé

Pour utiliser votre propre nom de domaine :
1. Allez dans les paramètres du projet sur Vercel
2. Cliquez sur "Domains"
3. Ajoutez votre domaine
4. Suivez les instructions pour configurer les DNS

## Dépannage

### Le build échoue
- Vérifiez que toutes les dépendances sont listées dans `package.json`
- Consultez les logs de build sur Vercel pour identifier l'erreur

### Les routes ne fonctionnent pas
- Le fichier `vercel.json` contient déjà la configuration pour gérer les routes SPA
- Vérifiez qu'il n'a pas été modifié

### Les variables d'environnement ne sont pas prises en compte
- Assurez-vous qu'elles commencent par `VITE_` pour être accessibles côté client
- Re-déployez après avoir ajouté des variables d'environnement

## Support

- [Documentation Vercel](https://vercel.com/docs)
- [Forum Vercel](https://github.com/vercel/vercel/discussions)
