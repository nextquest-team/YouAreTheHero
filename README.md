# You Are The Hero

Application mobile de « livres dont vous êtes le héros ».

- Un **créateur** écrit des histoires : scènes, choix, caractéristiques du héros, ennemis et objets, avec une médiathèque pour ses images. Une histoire peut être avec ou sans combats.
- Un **joueur** les parcourt, avec des choix conditionnels, des combats, un inventaire et des parties sauvegardées. Il peut prendre un selfie comme portrait de son héros, mettre des histoires en favoris, consulter la page d'un auteur et laisser un avis sur une histoire qu'il a terminée.

## Stack

| Couche | Technologies |
|---|---|
| Mobile | Expo SDK 57, Expo Router, TypeScript strict |
| API | Node 22, Fastify 5, Drizzle ORM, Zod, JWT |
| Base de données | PostgreSQL 16 (Docker) |

Le dépôt est un monorepo à deux projets : `mobile/` (l'application Expo) et `api/` (l'API Fastify), chacun avec son propre `package.json`.

Le périmètre, le modèle de données, les règles du jeu et le contrat d'API sont décrits dans [docs/conception.md](docs/conception.md).

## Prérequis

- Node 22.12 ou plus, et npm
- Docker (Docker Desktop ou Colima)
- L'application **Expo Go** (SDK 57) sur le téléphone

## Installation

```bash
git clone https://github.com/nextquest-team/YouAreTheHero.git
cd YouAreTheHero
cd mobile && npm install && cp .env.example .env
```

Dans `mobile/.env`, `EXPO_PUBLIC_API_URL` doit pointer vers l'adresse IP du Mac qui fait tourner l'API. Le téléphone doit être sur le même réseau Wi-Fi.

## Lancer l'application

```bash
cd mobile && npx expo start
```

Scanner le QR code avec l'appareil photo (iOS) ou avec Expo Go (Android).

## API

```bash
docker compose up -d --wait db
cp api/.env.example api/.env
cd api && npm install && npm run db:migrate && npm run db:seed && npm run dev
```

Ou entièrement en Docker :

```bash
docker compose up --build
docker compose exec api node dist/db/seed.js
```

La documentation Swagger de l'API est servie sur `/docs` (`http://localhost:3000/docs`).

### Remettre la base à zéro avec les données de démo

```bash
cd api && npm run db:reset
```

Ou, si l'API tourne dans Docker (le conteneur applique déjà les migrations au démarrage) : `docker compose up -d --build api && docker compose exec api node dist/db/seed.js`.

`db:reset` applique les migrations puis lance `db:seed`, qui **vide entièrement la base** (comptes, parties et avis compris) avant de réinsérer les données de démo. Deux comptes, mot de passe `demo1234` :

- `joueur@demo.fr` (joueur) : pour parcourir le catalogue et jouer.
- `auteur@demo.fr` (créateur) : auteur de toutes les histoires ci-dessous, qu'on retrouve dans l'éditeur.

| Histoire | Genre | Combats | Statut |
| --- | --- | --- | --- |
| La Crypte du Roi Oublié | Fantasy | oui | publiée |
| Les Pirates de la Mer d'Encre | Aventure | oui (3 combats, dont 2 défaites non mortelles) | publiée |
| Les Lettres de la rue Lepic | Romance | non | publiée |
| Un été à Lisbonne | Romance | non | publiée |
| Station Borealis | Science-fiction | non | publiée |
| Le Kouign-amann de Mamie Rose | Tranche de vie | non | publiée |
| Le Phare des Brumes | Mystère | non | brouillon |
| Le Tombeau de la Reine Grise | Fantasy | oui | brouillon, prêt à publier |

Les histoires du seed sont dans `api/src/db/seed-stories/` (une par fichier, à ajouter dans `index.ts`).

## Vérifications avant une PR

```bash
cd mobile && npx expo lint && npx tsc --noEmit
cd api && npm run typecheck && npm test
```

Les tests de l'API utilisent la base `hero_test`, créée automatiquement au premier démarrage du volume Postgres. Si elle manque, la créer avec `docker compose exec db createdb -U hero hero_test`.

La CI relance ces commandes sur chaque PR. Une PR dont les checks sont rouges ne peut pas être fusionnée.

## Organisation du dépôt

- `mobile/` : l'application Expo
  - `mobile/src/app/` : les écrans (routage par fichiers d'Expo Router)
  - `mobile/src/services/`, `mobile/src/hooks/`, `mobile/src/components/` : appels à l'API, logique et composants. Aucun `fetch` dans un composant.
  - `mobile/src/i18n/fr.ts` : tous les textes de l'interface
- `api/` : l'API Fastify
  - `api/src/modules/` : un module par domaine (`auth`, `catalog`, `play`, `creator`, `uploads`, `favorites`, `reviews`)
  - `api/src/engine/` : le moteur de jeu (conditions, effets, combats)
  - `api/src/db/` : le schéma Drizzle et le seed (`seed-stories/`, une histoire par fichier) ; `api/drizzle/` : les migrations ; `api/seed-assets/` : les images du seed
- `tools/illustrations/` : les scripts Python qui dessinent les illustrations des histoires du seed (`pip install pillow`, puis `python3 export.py`, qui les exporte dans `api/seed-assets/`)
- `docs/conception.md` : la conception (périmètre, modèle de données, règles, contrat d'API)
- `.github/workflows/` : la CI (`mobile`, `api`) et la publication de l'image de l'API

## Workflow Git

- `develop` est la branche par défaut : toutes les PR la ciblent.
- Une branche par fonctionnalité : `feat/a-...` pour le créateur, `feat/b-...` pour le joueur.
- Chaque PR est relue et approuvée par l'autre membre du binôme, avec les checks `mobile` et `api` au vert.
- `develop` est fusionnée dans `main` par une PR au moment du rendu.
