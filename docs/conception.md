# You Are The Hero : conception

You Are The Hero est une application mobile de livres dont vous êtes le héros, avec un rôle Créateur pour écrire des histoires interactives et un rôle Joueur pour les parcourir. Le rendu du projet a lieu le jeudi 1er octobre 2026 au soir. Ce document fige le périmètre, le modèle de données et le contrat d'API du projet ; toute modification du schéma ou du contrat passe par une pull request relue par les deux membres de l'équipe.

---

## 1. Périmètre

Le projet dispose de trois jours et demi avant le rendu ; tout ce qui n'est pas dans le MVP reste du bonus.

### MVP (obligatoire pour jeudi)
- Inscription et connexion. Le rôle **Joueur** ou **Créateur** est choisi à l'inscription et ne change plus. On arrive ensuite dans une navigation différente selon le rôle.
- **Créateur**
  - CRUD des histoires, avec publication et dépublication.
  - Caractéristiques libres du héros (type `number` ou `text`).
  - Ennemis.
  - Objets de l'histoire (CRUD), avec des effets à l'usage facultatifs pour les consommables.
  - Scènes : texte et image de fond (photo ou galerie).
  - Choix entre scènes, avec condition et effets. Une condition ou un effet peut porter sur une stat ou sur un objet.
  - Effets à l'arrivée sur une scène : gagner ou perdre des stats ou des objets.
  - Combat sur une scène : un ennemi, une scène de victoire, une scène de défaite.
  - Validation avant publication.
- **Joueur**
  - Bibliothèque des histoires publiées, avec **recherche et filtre par genre**.
  - Jouer, avec des choix conditionnels et des combats.
  - Inventaire : voir ses objets, utiliser un consommable (en combat aussi), et voir à chaque étape ce qui a changé.
  - Progression sauvegardée pour chaque histoire, plusieurs parties en parallèle.
  - Selfie du héros.
- **Dark mode** : bascule dans le profil, choix enregistré.
- Icône et splash screen personnalisés, contraste AA, test VoiceOver.

### Bonus (dans cet ordre, seulement si le MVP est fini)
1. Favoris.
2. Avis (une note de 1 à 5 et un commentaire, une fois l'histoire terminée).
3. Vue en arbre de l'histoire dans l'éditeur.
4. Détection automatique du visage pour le selfie.
5. Autoriser le créateur à jouer ses propres histoires (`/play` ouvert au propriétaire).

---

## 2. Stack

| Couche | Choix |
|---|---|
| Front | Expo SDK 57, Expo Router (routes dans `src/app/`), TypeScript strict |
| Modules Expo | `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `expo-secure-store` (token), `@react-native-async-storage/async-storage` (thème) |
| Back | Node 22, Fastify 5, TypeScript, Drizzle ORM, Zod (via `fastify-type-provider-zod`), `@fastify/swagger` |
| Base | PostgreSQL 16 dans Docker |
| Auth | `@fastify/jwt` (un seul token valable 7 jours, rôle dans le payload), mots de passe hachés avec `argon2` |
| Images | `@fastify/multipart` : les fichiers sont écrits dans `api/uploads/` et servis par `@fastify/static` sous `/uploads/...`. Taille max 5 Mo, jpeg ou png. Le front compresse avant l'envoi (1280 px de large, qualité 0,7) |

Le choix de Fastify et Drizzle s'appuie sur une stack déjà utilisée par B sur un projet précédent, avec génération automatique d'une documentation Swagger. Expo Go suffit pour développer et faire la démo : tous les modules Expo utilisés (`expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `expo-secure-store`) y sont inclus, sans besoin d'un development build.

> Front : on installe avec `npx expo install <package>`, jamais avec `npm install`.
> Démo : l'API tourne en Docker sur un Mac et le téléphone passe par le Wi-Fi.
> Mettre `EXPO_PUBLIC_API_URL=http://<IP-du-Mac>:3000` dans `.env`, qui est gitignoré (un `.env.example` est commité).

---

## 3. Modèle de données (validé)

| Table | Champs |
|---|---|
| **users** | id (uuid), email (unique), password_hash, display_name, role (`PLAYER` / `CREATOR`), avatar_url (nullable : selfie par défaut du héros), created_at |
| **stories** | id, author_id → users, title, summary, genre, cover_url, start_scene_id → scenes (nullable), attack_stat_id → stat_definitions (nullable), hp_stat_id → stat_definitions (nullable), published (bool), published_at, created_at, updated_at |
| **stat_definitions** | id, story_id, name, type (`number` / `text`), default_value (texte, converti selon le type), min, max, sort_order |
| **enemies** | id, story_id, name, image_url, attack (int), hp (int) |
| **items** | id, story_id, name, description, image_url, use_effects (jsonb, nullable : si renseigné, l'objet est un consommable), sort_order |
| **scenes** | id, story_id, title, text, background_url, is_ending, enemy_id → enemies (nullable), win_scene_id → scenes (nullable), lose_scene_id → scenes (nullable), on_enter_effects (jsonb, `[]` par défaut), sort_order |
| **choices** | id, from_scene_id → scenes, to_scene_id → scenes, label, condition (jsonb, nullable), effects (jsonb, `[]` par défaut), sort_order |
| **saves** | id, user_id, story_id, current_scene_id, stats (jsonb `{ statId: valeur }`), hero_face_url, history (jsonb, ids de scènes), inventory (jsonb `{ itemId: quantité }`), combat (jsonb, nullable), status (`IN_PROGRESS` / `FINISHED` / `DEAD`), updated_at. **Unique (user_id, story_id)** |
| **favorites** | user_id, story_id, created_at. Clé primaire (user_id, story_id) |
| **reviews** | id, user_id, story_id, rating (1 à 5), comment, created_at. Unique (user_id, story_id) |

Les ennemis utilisent des colonnes `attack` et `hp` dédiées plutôt qu'un champ JSON : le combat ne porte que sur ces deux valeurs.

**Formats JSON**
- `condition`, typée :
  - `{ "type": "stat", "statId": "<uuid>", "op": ">=" | "<=" | "==", "value": 5 }`
  - `{ "type": "item", "itemId": "<uuid>", "op": "has" | "not_has" }`
- `effects`, `on_enter_effects` et `use_effects` ont le même format, une liste d'effets typés :
  - `{ "type": "stat", "statId": "<uuid>", "delta": -2 }`
  - `{ "type": "item", "itemId": "<uuid>", "qty": 1 }` (une quantité négative retire l'objet)
  - Un même module back les valide (Zod) et les applique : `engine/effects.ts`.
- Les objets sont référencés par **id**, comme les stats.
- `combat` : `{ "enemyId": "<uuid>", "enemyHp": 8, "log": ["..."] }`
- Les stats sont référencées par **id** et jamais par nom : renommer « Force » ne casse rien.
- Seules les stats de type `number` servent dans les conditions, les effets et le combat.

**Suppressions**
- Supprimer une histoire supprime en cascade tout ce qui en dépend : stats, ennemis, scènes, choix, saves, favoris, avis.
- Supprimer une scène supprime aussi les choix qui y mènent. Les champs `start_scene_id`, `win_scene_id` et `lose_scene_id` qui la visaient passent à `NULL`.
- Supprimer un ennemi remet `enemy_id` à `NULL` sur les scènes concernées.
- `DELETE /me/items/:itemId` renvoie `409 { usedIn: [...] }` si l'objet apparaît dans une condition ou un effet (choix, scène ou autre objet). C'est la même logique que pour les stats.
- Supprimer une stat met `stories.attack_stat_id` et `stories.hp_stat_id` à `NULL` (`ON DELETE SET NULL`).
  - `DELETE /me/stats/:statId` renvoie `409 { usedIn: [...] }` si la stat est utilisée dans une condition ou un effet, puisque le JSON n'est protégé par aucune contrainte de base. On cherche partout : choix, `on_enter_effects` des scènes, `use_effects` des objets.
- `saves.current_scene_id` : `ON DELETE CASCADE`, par sécurité.
- **Une histoire publiée n'est pas modifiable.** Toutes les routes d'édition `/me/...` renvoient `409` tant qu'elle est publiée : il faut d'abord la dépublier.
  - `unpublish` **supprime explicitement** les saves de l'histoire. La cascade ne joue qu'à la suppression de l'histoire, pas à la dépublication.

**Images** : le back ne stocke et ne renvoie que des **chemins relatifs** (`/uploads/abc.jpg`).
- Le front construit l'URL complète à un seul endroit, avec `assetUrl()` dans `src/services/client.ts` à partir de `EXPO_PUBLIC_API_URL`.
- Changer d'IP le jour J ne casse donc aucune image.

---

## 4. Règles du jeu (appliquées par le serveur)

Le moteur tourne **côté back**. Le front affiche l'état que l'API renvoie et ne calcule rien. Un joueur ne peut donc pas tricher, et les règles ne sont écrites qu'une fois.

1. **Démarrer une partie**
   - Les stats sont initialisées avec leur `default_value`. Les stats de type `text` (ex. Nom) sont saisies par le joueur.
   - Le joueur arrive sur `start_scene_id`. L'inventaire démarre vide, et les `on_enter_effects` de la scène de départ s'appliquent.
   - Si une partie existait déjà sur cette histoire, elle est réinitialisée.
2. **Choix** : ils sont **tous renvoyés**.
   - Un choix dont la condition n'est pas remplie a `locked: true` et un `conditionLabel` (ex. « Force 5 requise »). Il s'affiche grisé.
   - La validation impose au moins un choix **sans condition** sur chaque scène qui n'est ni une fin ni un combat. Le joueur ne peut donc jamais rester bloqué.
   - Le serveur refuse un choix verrouillé avec `422`.
3. **Choisir**
   - Le serveur vérifie que le choix part bien de la scène courante et que sa condition est remplie.
   - Il applique les `effects`, en bornant chaque stat entre son min et son max. Une quantité d'objet ne descend jamais sous 0, et un objet à 0 disparaît de l'inventaire.
   - Il déplace le joueur sur `to_scene_id` et l'ajoute à `history`.
   - Il applique ensuite les `on_enter_effects` de la scène d'arrivée, **seulement à la première visite** (on s'appuie sur `history`). Sinon, une boucle entre deux scènes permettrait de farmer des objets à l'infini.
3 bis. **Utiliser un objet** (`POST /play/:storyId/use { itemId }`)
   - Possible seulement si la partie est `IN_PROGRESS`, que l'objet est dans l'inventaire et qu'il a des `use_effects`. Sinon, `422`.
   - Le serveur applique les `use_effects`, puis retire 1 exemplaire de l'objet.
   - On peut aussi l'utiliser **pendant un combat**, par exemple une potion. Dans ce cas, `combat.heroHp` est la valeur de la stat PV, pas un compteur à part.
3 ter. **Ce qui a changé** : toute réponse du moteur renvoie `changes`, c'est-à-dire les effets réellement appliqués par cette action. Exemples : `+1 Clé rouillée`, `-2 PV`, `Force 5 → 6`. Un effet sans conséquence, comme un gain de PV déjà au max, n'y figure pas.
4. **Mort** : si des effets font tomber la stat `hp_stat_id` à 0 ou moins, la partie passe en `DEAD`. C'est vrai pour les effets d'un choix, d'une arrivée sur une scène (`on_enter_effects`) ou d'un objet utilisé hors combat. En combat, c'est la règle du point 6 qui s'applique.
   - Les effets sont bornés entre min et max **avant** ce test. Si le min des PV était supérieur à 0, le héros ne pourrait donc jamais mourir. La validation impose que la stat PV ait un min de 0 ou pas de min (voir plus bas).
5. **Fin** : arriver sur une scène `is_ending` passe la partie en `FINISHED`.
6. **Combat** : si la scène a un `enemy_id`, c'est une scène de combat.
   - Une scène de combat **n'a pas de choix**. À la fin du combat, le joueur part directement sur `win_scene_id` ou `lose_scene_id` : des choix sur cette scène ne s'afficheraient donc jamais.
   - Dans l'éditeur, la section « Choix » est masquée dès qu'un ennemi est sélectionné.
   - `POST /me/scenes/:sceneId/choices` renvoie `422` sur une scène de combat, et `PATCH /me/scenes/:sceneId` avec un `enemyId` renvoie `422` si la scène a déjà des choix.
   - Le joueur a une seule action, « Attaquer ».
   - Chaque tour, le serveur calcule `stat d'attaque du héros + 1d6` contre `attack de l'ennemi + 1d6`. Le plus faible perd 2 PV. En cas d'égalité, personne ne perd rien.
   - Si l'ennemi tombe à 0 PV, le joueur part sur `win_scene_id`. La récompense (objet, stat) se règle dans les `on_enter_effects` de la scène de victoire, sans champ en plus.
   - Si le héros tombe à 0 PV :
     - avec une scène de défaite, il **garde 1 PV** et part sur `lose_scene_id` ;
     - sans scène de défaite, la partie passe en `DEAD`.
   - Un log texte des tours est renvoyé pour l'affichage.

**Validation avant publication** (côté A, renvoie `422` avec la liste des erreurs)
- Une scène de départ est définie.
- L'histoire a au moins une scène `is_ending`.
- Toute scène qui n'est pas une fin a au moins un choix ou un combat.
- Toute scène de combat a une scène de victoire, et l'histoire a une stat d'attaque et une stat de PV.
- Toute scène qui n'est ni une fin ni un combat a au moins un choix sans condition.
- Aucune scène de combat n'a de choix.
- La stat PV (`hp_stat_id`) est de type `number` et a un min de 0 ou pas de min. Sinon le héros ne peut pas mourir.
- La valeur par défaut de la stat PV est supérieure à 0. Sinon le héros est mort dès le départ.
- Une scène `is_ending` n'a pas d'ennemi. Sinon on ne saurait pas s'il faut terminer la partie ou lancer le combat.
- Tout `statId` et tout `itemId` cité dans une condition ou un effet existe bien dans l'histoire. Les stats citées par un effet ou une condition sont de type `number`.
- Aucune scène n'est inaccessible depuis le départ. C'est un avertissement, pas une erreur.

---

## 5. Répartition

Chacun fait le **back et le front** de ses fonctionnalités. B pose le socle back (Docker, authentification, schéma) dès lundi soir, une base dont dépend le reste de l'équipe.

### A : Créateur (Loreleï)

| Tâche | Back | Front | Poids |
|---|:-:|:-:|:-:|
| CRUD des histoires : front complet. Back : publication, dépublication, verrou `409` (le CRUD back de base est écrit par B comme module d'exemple) | ✅ | ✅ | 2 |
| Éditeur de caractéristiques, avec le choix de la stat d'attaque et de la stat de PV | ✅ | ✅ | 3 |
| CRUD des ennemis | ✅ | ✅ | 2 |
| CRUD des objets (nom, image, description, effets à l'usage) | ✅ | ✅ | 2 |
| Éditeur d'effets et de conditions typés (stat ou objet), réutilisé pour les choix, les `on_enter_effects` et les `use_effects` | | ✅ | 2 |
| Éditeur de scènes et de choix (destination, condition, effets). Section « Choix » masquée sur une scène de combat | ✅ | ✅ | 5 |
| Configuration d'un combat sur une scène (ennemi, victoire, défaite) | ✅ | ✅ | 2 |
| **Photo ou galerie** pour le décor, compression, route `POST /uploads` | ✅ | ✅ | 3 |
| Validation avant publication, avec ses tests Vitest (un test par règle) | ✅ | | 3 |
| **Thème clair et sombre**, bascule dans le profil, persistance AsyncStorage, composants UI communs (`Button`, `Card`, `Input`, `Screen`) | | ✅ | 3 |
| Icône et splash screen dans `app.json` | | ✅ | 1 |
| **Total** | | | **28** |

### B : Joueur, auth et moteur (Jean-Baptiste)

| Tâche | Back | Front | Poids |
|---|:-:|:-:|:-:|
| Socle back : Docker Compose, squelette Fastify, schéma Drizzle complet, migrations, **seed de démo** (images dans `api/seed-assets/`, commité, copiées vers `api/uploads/` par le seed) | ✅ | | 3 |
| **Module d'exemple** : back du CRUD `/me/stories` (routes, service, schemas, `assertOwner`), à recopier par A | ✅ | | 1 |
| Auth JWT, rôles, écrans de connexion et d'inscription, redirection selon le rôle, client API commun | ✅ | ✅ | 4 |
| Bibliothèque des histoires publiées, **recherche et filtre par genre**, fiche d'une histoire | ✅ | ✅ | 3 |
| **Repo et CI/CD** : création du repo, invitation, protection des branches, workflows `mobile` et `api`, image Docker sur GHCR (section 11) | | | 2 |
| **Moteur de jeu** : affichage d'une scène, conditions, effets, fin, mort. Tests Vitest : conditions, effets bornés, mort, combat avec un dé injectable pour des tests reproductibles | ✅ | ✅ | 6 |
| Combat au tour par tour | ✅ | ✅ | 4 |
| Sauvegarde et reprise, écran « Mes parties » | ✅ | ✅ | 2 |
| Inventaire dans le moteur : effets typés, `on_enter_effects` à la première visite, `POST /use` (en combat aussi), `changes`, avec leurs tests. Côté front : panneau inventaire et affichage des changements | ✅ | ✅ | 4 |
| **Selfie du héros** : caméra frontale, recadrage en cercle. Enregistré sur le profil (`users.avatar_url`) et repris par défaut dans chaque partie | ✅ | ✅ | 3 |
| Favoris (bonus 1) et avis (bonus 2) | ✅ | ✅ | 2 à 3 |
| **Total** | | | **34 à 35** |

### Code partagé : qui l'écrit, qui l'utilise
- **B** écrit :
  - le plugin d'auth back (`app.authenticate`, `app.requireRole('CREATOR')`),
  - le client API front (`src/services/client.ts`, qui ajoute le token et gère les erreurs),
  - le `AuthProvider`,
  - le seed.
  - A utilise tout ça.
- **A** écrit :
  - le `ThemeProvider`, les composants UI et la route `POST /uploads` (avec `src/services/uploads.ts`),
  - la page Profil (bascule du thème, déconnexion), commune aux deux rôles.
  - B utilise tout ça, notamment l'upload pour le selfie.
- **Les deux** : accessibilité de leurs propres écrans (`accessibilityLabel`, `accessibilityRole`, cibles d'au moins 44 x 44), puis un test VoiceOver croisé jeudi matin.

---

## 6. Navigation (Expo Router)

```
src/app/
├── _layout.tsx                 # AuthProvider + ThemeProvider, redirection selon le rôle (Stack.Protected)
├── (auth)/login.tsx            # B
├── (auth)/register.tsx         # B (choix du rôle)
├── (player)/_layout.tsx        # B : Tabs
│   ├── index.tsx               #   Bibliothèque (recherche, genre)
│   ├── saves.tsx               #   Mes parties
│   ├── favorites.tsx           #   Favoris (bonus)
│   └── profile.tsx             #   → composant Profil de A
├── (player)/story/[id].tsx     # B : fiche de l'histoire (Commencer / Reprendre, avis)
├── (player)/play/[storyId].tsx # B : écran de jeu (scène, choix, combat, inventaire et changements)
├── (player)/selfie.tsx         # B : caméra frontale
├── (creator)/_layout.tsx       # A : Tabs
│   ├── index.tsx               #   Mes histoires
│   └── profile.tsx             #   → composant Profil de A
└── (creator)/story/[id]/       # A : Stack d'édition
    ├── index.tsx               #   infos, couverture, publication
    ├── stats.tsx
    ├── enemies.tsx
    ├── items.tsx               #   objets
    ├── scenes.tsx
    └── scene/[sceneId].tsx     #   texte, décor, choix, combat
```

Règles du cours à respecter :
- **aucun `fetch` dans un composant** : on passe par services, puis hooks, puis composants ;
- **aucun texte codé en dur** : les libellés vont dans `src/i18n/fr.ts`, avec une clé par écran.

```
src/
├── services/   client.ts (B), auth.ts, stories.ts, play.ts (B) | creator.ts, uploads.ts (A)
├── hooks/      useAuth, useStories, useGame (B) | useMyStories, useSceneEditor, useTheme (A)
├── components/ ui/ (A) | game/ (B) | editor/ (A)
├── theme/      (A)
├── i18n/fr.ts  (chacun ses clés)
└── types/api.ts (chacun tape son domaine, à partir du contrat de la section 7)
```

---

## 7. Contrat d'API (à figer lundi soir)

Base : `http://<IP>:3000`. Doc Swagger sur `/docs`.
- Les erreurs ont toutes la forme `{ "error": { "code": "...", "message": "..." } }`.
- `401` : pas de token. `403` : mauvais rôle, ou histoire d'un autre auteur. `404` : ressource introuvable. `422` : validation.

```
# Auth (B)
POST   /auth/register         { email, password, displayName, role } → { token, user }
POST   /auth/login            { email, password }                    → { token, user }
GET    /auth/me                                                      → user
PATCH  /auth/me               { displayName?, avatarUrl? }           → user

# Bibliothèque (B), réservée aux PLAYER
GET    /stories?q=&genre=     histoires publiées → [{ id, title, summary, genre, coverUrl, author, avgRating, isFavorite }]
GET    /stories/:id           détail publié + définitions de stats + état de ma partie
PUT    /stories/:id/favorite  (bonus)
DELETE /stories/:id/favorite  (bonus)
GET    /me/favorites          (bonus)
GET    /stories/:id/reviews   (bonus)
POST   /stories/:id/reviews   { rating, comment }  (bonus, seulement si ma partie est FINISHED)

# Création (A), réservée aux CREATOR propriétaires de l'histoire
GET    /me/stories                           mes histoires, brouillons compris
POST   /me/stories                           { title, summary, genre, coverUrl? }
GET    /me/stories/:id                       histoire complète (stats, ennemis, scènes, choix)
PATCH  /me/stories/:id                       { ..., startSceneId, attackStatId, hpStatId }
DELETE /me/stories/:id
POST   /me/stories/:id/publish               → 200, ou 422 { errors: [...], warnings: [...] }
POST   /me/stories/:id/unpublish
POST   /me/stories/:id/stats                 { name, type, defaultValue, min?, max? }
PATCH  /me/stats/:statId      DELETE /me/stats/:statId
POST   /me/stories/:id/enemies               { name, imageUrl?, attack, hp }
PATCH  /me/enemies/:enemyId   DELETE /me/enemies/:enemyId
POST   /me/stories/:id/items                 { name, description?, imageUrl?, useEffects? }
PATCH  /me/items/:itemId      DELETE /me/items/:itemId
POST   /me/stories/:id/scenes                { title, text, backgroundUrl?, isEnding, enemyId?, winSceneId?, loseSceneId?, onEnterEffects? }
PATCH  /me/scenes/:sceneId    DELETE /me/scenes/:sceneId
POST   /me/scenes/:sceneId/choices           { toSceneId, label, condition?, effects? }
PATCH  /me/choices/:choiceId  DELETE /me/choices/:choiceId
# toute route d'édition /me/... → 409 si l'histoire est publiée
# DELETE /me/stats/:statId → 409 { usedIn: [...] } si la stat est utilisée
# DELETE /me/items/:itemId → 409 { usedIn: [...] } si l'objet est utilisé
# POST /me/scenes/:sceneId/choices → 422 si la scène est une scène de combat
# PATCH /me/scenes/:sceneId { enemyId } → 422 si la scène a déjà des choix

# Upload (A), pour tout utilisateur connecté
POST   /uploads               multipart, champ "file" → { url }

# Jeu (B), réservé aux PLAYER
GET    /me/saves                             mes parties → [{ story, status, updatedAt }]
POST   /play/:storyId/start   { textStats?: { statId: "valeur" }, heroFaceUrl? } → GameState   (users.avatar_url par défaut)
GET    /play/:storyId                        → GameState
POST   /play/:storyId/choose  { choiceId }   → GameState
POST   /play/:storyId/combat  { action: "attack" } → GameState
POST   /play/:storyId/use     { itemId }     → GameState
PATCH  /play/:storyId/hero    { heroFaceUrl } → GameState   (photo différente pour cette histoire seulement)
DELETE /play/:storyId                        abandonner la partie
```

```ts
// Toutes les URL d'image sont des chemins relatifs : "/uploads/abc.jpg"
type GameState = {
  storyId: string;
  status: 'IN_PROGRESS' | 'FINISHED' | 'DEAD';
  scene: { id: string; title: string; text: string; backgroundUrl: string | null; isEnding: boolean };
  choices: { id: string; label: string; locked: boolean; conditionLabel: string | null }[]; // vide pendant un combat
  stats: { id: string; name: string; type: 'number' | 'text'; value: number | string }[];
  heroFaceUrl: string | null;
  inventory: { id: string; name: string; imageUrl: string | null; description: string | null; qty: number; usable: boolean }[];
  changes: { label: string; kind: 'stat' | 'item'; delta: number }[];  // effets appliqués par la dernière action
  combat: null | {
    enemy: { name: string; imageUrl: string | null; attack: number; hpMax: number };
    enemyHp: number;
    heroHp: number;
    log: string[];                                   // ex. "Tu fais 9, le gobelin 6 : il perd 2 PV"
  };
};
```

---

## 8. Conventions back (pour qu'on écrive le même Fastify)

```
api/
├── src/
│   ├── app.ts                 # enregistre les plugins et les modules
│   ├── server.ts
│   ├── plugins/               # auth.ts (B), errors.ts (B), swagger.ts (B)
│   ├── db/                    # index.ts (client Drizzle), schema/*.ts, seed.ts (B)
│   └── modules/
│       ├── auth/  catalog/  play/  favorites/  reviews/   (B)
│       └── creator/  uploads/                             (A)
│           ├── routes.ts      # déclare les routes, avec leurs schémas Zod
│           ├── service.ts     # logique métier + requêtes Drizzle
│           └── schemas.ts     # schémas Zod d'entrée et de sortie
├── drizzle/                   # migrations générées (commitées)
├── uploads/                   # gitignoré
├── Dockerfile
└── .env.example
docker-compose.yml             # à la racine : postgres + api
```

- Pas de requête Drizzle dans `routes.ts` : on passe toujours par `service.ts`.
- Une route protégée s'écrit ainsi : `{ preHandler: [app.authenticate, app.requireRole('CREATOR')] }`.
- On vérifie toujours que l'histoire appartient bien à l'utilisateur, avec un helper commun `assertOwner(storyId, userId)`, sinon on renvoie `403`.
- Pour modifier le schéma : on édite `db/schema`, on lance `npm run db:generate` puis `npm run db:migrate`, et on commite la migration. **Toute modification du schéma passe par une PR relue par l'autre.**
- Commandes :
  - `docker compose up -d db` puis, dans `api/`, `npm run dev` ;
  - ou tout en Docker : `docker compose up`.
- Seed : `npm run db:seed` crée `joueur@demo.fr` et `auteur@demo.fr` (mot de passe `demo1234`), ainsi qu'une histoire de démo complète avec un combat. Chacun peut ainsi développer sans attendre l'autre.

---

## 9. Planning

| Quand | A : Loreleï | B : Jean-Baptiste | Jalon |
|---|---|---|---|
| **Lun 28 soir** | A clone le repo une fois la structure prête (section 10), thème et composants UI, layouts `(creator)`, vérifier Expo Go SDK 57 sur son téléphone | Structure complète du repo (template Expo neuf + `api/`), puis `develop` et protections, workflows CI. Docker, Fastify, schéma Drizzle complet, migration, seed, plugin d'auth et routes d'auth, module d'exemple `/me/stories`, vérifier Expo Go SDK 57 sur son téléphone | Contrat figé, `docker compose up` fonctionne des deux côtés, Expo Go OK (sinon development build) |
| **Mar 29** | CRUD des histoires (front), stats, ennemis et objets (back et front), route d'upload, photo et galerie | Écrans d'auth, client API, redirection selon le rôle, bibliothèque et recherche, `start` et `choose` côté back, avec les effets typés et `on_enter_effects` | Se connecter dans chaque rôle, créer une histoire avec sa couverture |
| **Mer 30** | Éditeur de scènes et de choix (avec les choix verrouillés), éditeur d'effets et de conditions stat ou objet, configuration des combats | Écran de jeu, saves, « Mes parties », combat, inventaire, `/use` et `changes`, selfie | **Soir : jouer dans l'app une histoire créée dans l'app** |
| **Jeu 01 matin** | Validation de publication, puis dark mode et persistance, icône et splash, contraste | Favoris, puis avis si le temps le permet | Test VoiceOver croisé |
| **Jeu 01 aprem** | Tests croisés, histoire de démo, répétition | Tests croisés, README (installation et lancement), répétition | Merge de `develop` dans `main`, rendu |

> Le jalon de mercredi soir est le plus important : c'est là que les deux moitiés du projet se branchent l'une à l'autre.
> S'il glisse, les bonus sautent, pas le MVP.

---

## 10. Règles de travail

- **Git**
  - Une branche par fonctionnalité : `feat/a-scene-editor`, `feat/b-combat`.
  - Une PR vers `develop`, relue par l'autre, et on merge au moins une fois par jour.
  - Chacun commite avec son propre compte.
- **Avant chaque PR**
  - Front : `npx expo lint` et `npx tsc --noEmit`.
  - Back : `npm run typecheck` et `npm test` dans `api/`.
  - La CI relance tout ça de toute façon : une PR rouge ne se merge pas.
- **Tests croisés** : A joue les histoires, B en crée.
- **Repo**
  - Repo public : https://github.com/nextquest-team/YouAreTheHero, dans l'organisation nextquest-team. A et B en sont tous les deux administrateurs.
  - Pas de `.env` commité. Le `.gitignore` couvre `.env`, `api/.env`, `api/uploads/` et les `node_modules`.
  - Pas de fichiers de configuration personnels d'éditeur ou d'outil, en dehors de `.vscode`.
- **Mise en place du repo, lundi soir**
  - B pose la structure initiale (template Expo SDK 57, puis `api/`, Docker et CI), crée `develop` comme branche par défaut et active les protections (section 11).
  - A clone le repo :
    ```bash
    git clone https://github.com/nextquest-team/YouAreTheHero.git
    cd YouAreTheHero && npm install
    ```
  - Ensuite, tout passe par une PR vers `develop`.

---

## 11. CI/CD

Juste ce qu'il faut pour 3 jours et demi, pas plus.

**Protection de `main` et `develop`** (Settings, puis Rules, puis Rulesets)
- On passe forcément par une PR, relue et approuvée par l'autre.
- Les checks `mobile` et `api` doivent être verts.
- Pas de force-push, pas de suppression de la branche.
- Les règles s'appliquent **aussi aux admins**. Sans ça, les deux administrateurs pourraient les contourner.
- `develop` est la branche par défaut, donc les PR la ciblent automatiquement. Le jeudi, une PR fusionne `develop` dans `main`.

**`.github/workflows/mobile.yml`**, sur chaque PR et chaque push vers `develop` ou `main`
- `actions/setup-node` en Node 22, avec le cache npm.
- `npm ci`, `npx expo lint`, `npx tsc --noEmit`.

**`.github/workflows/api.yml`**, mêmes déclencheurs, lancé dans `api/`
- Un service `postgres:16-alpine`, avec un health check.
- `npm ci`, `npm run typecheck`, `npm run db:migrate` (vérifie que les migrations commitées passent sur une base vide), `npm test`, puis `docker build`.

**Pas de filtre `paths`** sur ces deux workflows.
- Un check obligatoire qui n'est pas lancé à cause d'un filtre de chemins laisse la PR bloquée sur « en attente » sans fin.
- Les deux workflows tournent en quelques minutes, donc autant les lancer à chaque fois.

**CD : `.github/workflows/release-api.yml`**, sur chaque push vers `main`
- Il construit l'image de l'API et la publie sur GHCR (`ghcr.io/nextquest-team/youarethehero-api`), avec `GITHUB_TOKEN` et la permission `packages: write`.
- Aucun secret à configurer.
- **Pas de déploiement** : la démo tourne en local. Pas d'EAS non plus : il faudrait un compte Expo, et le barème ne le demande pas.

**En plus**
- `.github/pull_request_template.md` : ce que fait la PR, comment la tester, et la case « lint et typecheck OK ».
- Au premier `git push`, on vérifie qu'aucun secret ne traîne : `.env` n'est jamais commité, seul `.env.example` l'est.

---

## 12. Barème : où on prend chaque point

| Critère | Pts | Où |
|---|:-:|---|
| Architecture | 2 | API Fastify en modules, Drizzle, Swagger, Docker. Front en services, hooks et composants. CI (lint, typecheck, migrations, tests), branches protégées, image publiée sur GHCR |
| Auth et rôles | 4 | JWT, rôle choisi à l'inscription, deux navigations distinctes, routes protégées au back comme au front |
| CRUD | 4 | Histoires, stats, ennemis, objets, scènes, choix : 6 entités, avec les 4 opérations complètes |
| Composant natif | 3 | Caméra : décor des scènes (A) et selfie du héros (B), avec la galerie en complément |
| Navigation | 2 | Stack racine, Tabs par rôle, Stack d'édition et de jeu |
| Accessibilité | 1 | Contraste AA vérifié dans les deux thèmes, labels, test VoiceOver |
| Splash et icône | 1 | `app.json` (A) |
| Soutenance | 2 | Démo : créer une scène avec une photo, la jouer, gagner un combat, reprendre une partie |
| Dark mode | 1,5 | Bascule et persistance (A) |
| Bonus au choix | 1,5 | Recherche et filtre (MVP), puis favoris, puis avis (B) |

---

## 13. Risques

| Risque | Parade |
|---|---|
| L'éditeur de scènes est le plus gros morceau | Formulaire en liste simple, avec des sélecteurs pour la destination et la stat. La vue en arbre reste un bonus |
| Le combat retarde le jalon de mercredi | Le moteur de choix d'abord, le combat ensuite. Le seed contient déjà un combat, donc B peut le coder sans attendre l'éditeur |
| Le téléphone ne joint pas l'API le jour J | IP du Mac dans `.env`, même Wi-Fi, port 3000 ouvert. En secours, partage de connexion depuis le téléphone |
| Un désaccord sur le schéma en cours de route | Schéma figé lundi soir. Toute modification passe par une PR relue par les deux |
| Stats de type texte dans un combat | Seules les stats `number` peuvent être choisies comme stat d'attaque ou de PV |
