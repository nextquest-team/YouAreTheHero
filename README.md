# You Are The Hero

Application mobile de « livres dont vous êtes le héros ».

- Un **créateur** écrit des histoires : scènes, choix, caractéristiques du héros, ennemis et objets.
- Un **joueur** les parcourt, avec des choix conditionnels, des combats, un inventaire et des parties sauvegardées.

## Stack

| Couche | Technologies |
|---|---|
| Mobile | Expo SDK 57, Expo Router, TypeScript strict |
| API | Node 22, Fastify 5, Drizzle ORM, Zod, JWT |
| Base de données | PostgreSQL 16 (Docker) |

Le dépôt est un monorepo à deux projets : `mobile/` (l'application Expo) et `api/` (l'API Fastify), chacun avec son propre `package.json`.

Le périmètre, le modèle de données, les règles du jeu et le contrat d'API sont décrits dans [docs/conception.md](docs/conception.md).

## Prérequis

- Node 22 et npm
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
docker compose up -d db
cp api/.env.example api/.env
cd api && npm install && npm run db:migrate && npm run db:seed && npm run dev
```

Ou entièrement en Docker :

```bash
docker compose up --build
docker compose exec api node dist/db/seed.js
```

La documentation Swagger de l'API est servie sur `/docs` (`http://localhost:3000/docs`).

`npm run db:seed` (idempotent) crée deux comptes de démonstration, mot de passe `demo1234` :

- `auteur@demo.fr` (créateur) : autrice d'une histoire publiée et jouable, « La Crypte du Roi Oublié », et d'un brouillon, « Le Phare des Brumes ».
- `joueur@demo.fr` (joueur) : pour parcourir l'histoire publiée.

## Vérifications avant une PR

```bash
cd mobile && npx expo lint && npx tsc --noEmit
```

La CI relance ces commandes sur chaque PR. Une PR dont les checks sont rouges ne peut pas être fusionnée.

## Organisation du dépôt

- `mobile/` : l'application Expo
  - `mobile/src/app/` : les écrans (routage par fichiers d'Expo Router)
  - `mobile/src/services/`, `mobile/src/hooks/`, `mobile/src/components/` : appels à l'API, logique et composants. Aucun `fetch` dans un composant.
  - `mobile/src/i18n/fr.ts` : tous les textes de l'interface
- `api/` : l'API Fastify
- `.github/workflows/` : la CI (`mobile`, `api`) et la publication de l'image de l'API

## Workflow Git

- `develop` est la branche par défaut : toutes les PR la ciblent.
- Une branche par fonctionnalité : `feat/a-...` pour le créateur, `feat/b-...` pour le joueur.
- Chaque PR est relue et approuvée par l'autre membre du binôme, avec les checks `mobile` et `api` au vert.
- `develop` est fusionnée dans `main` par une PR au moment du rendu.
