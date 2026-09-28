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

Le périmètre, le modèle de données, les règles du jeu et le contrat d'API sont décrits dans [docs/conception.md](docs/conception.md).

## Prérequis

- Node 22 et npm
- Docker (Docker Desktop ou Colima)
- L'application **Expo Go** (SDK 57) sur le téléphone

## Installation

```bash
git clone https://github.com/nextquest-team/YouAreTheHero.git
cd YouAreTheHero
npm install
cp .env.example .env
```

Dans `.env`, `EXPO_PUBLIC_API_URL` doit pointer vers l'adresse IP du Mac qui fait tourner l'API. Le téléphone doit être sur le même réseau Wi-Fi.

## Lancer l'application

```bash
npx expo start
```

Scanner le QR code avec l'appareil photo (iOS) ou avec Expo Go (Android).

## Vérifications avant une PR

```bash
npx expo lint
npx tsc --noEmit
```

La CI relance ces commandes sur chaque PR. Une PR dont les checks sont rouges ne peut pas être fusionnée.

## Organisation du dépôt

- `src/app/` : les écrans (routage par fichiers d'Expo Router)
- `src/services/`, `src/hooks/`, `src/components/` : appels à l'API, logique et composants. Aucun `fetch` dans un composant.
- `src/i18n/fr.ts` : tous les textes de l'interface
- `api/` : l'API Fastify
- `.github/workflows/` : la CI (`mobile`, `api`) et la publication de l'image de l'API

## Workflow Git

- `develop` est la branche par défaut : toutes les PR la ciblent.
- Une branche par fonctionnalité : `feat/a-...` pour le créateur, `feat/b-...` pour le joueur.
- Chaque PR est relue et approuvée par l'autre membre du binôme, avec les checks `mobile` et `api` au vert.
- `develop` est fusionnée dans `main` par une PR au moment du rendu.
