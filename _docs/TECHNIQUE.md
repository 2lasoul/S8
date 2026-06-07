# Archives Super 8 — Documentation technique

> Stack et architecture du projet

---

## Environnements

| Fichier | Usage |
|---------|-------|
| `docker-compose.yml` | Développement local (mode dev, hot reload, polling fichiers) |
| `docker-compose.prod.yml` | Production VPS (build optimisé, standalone, utilisateur non-root) |
| `app/Dockerfile.dev` | Image dev — `npm run dev` |
| `app/Dockerfile.prod` | Image prod — build multi-étapes, image finale ~150MB |

---

## Stack technique

| Couche | Choix | Raison |
|--------|-------|--------|
| Framework | Next.js 15 (App Router) | Routes API intégrées, SSR/Client mixte, TypeScript natif |
| Base de données | MySQL 8 | Fiable, JSON natif pour les tableaux de tags |
| Driver DB | `mysql2` (pool de connexions) | Async/await natif, performant |
| Auth | Cookie session (famille) + JWT httpOnly (admin) | Simple, sans dépendance lourde |
| JWT | `jsonwebtoken` | Standard, léger |
| Player vidéo | `<video>` natif (MP4) + `<iframe>` (YouTube/Vimeo) | Pas de dépendance externe |
| Styles | Inline styles React | Zéro dépendance CSS, co-localisation avec le composant |
| Conteneurisation | Docker Compose | App + DB + Nginx vidéos |
| Vidéos | Nginx alpine dédié | Range requests, CORS, séparation des responsabilités |

---

## Structure du projet

```
_WEBV2/
├── app/                          # Code Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Layout racine
│   │   │   ├── page.tsx          # Page d'accueil publique (/)
│   │   │   ├── login/page.tsx    # Connexion famille
│   │   │   ├── film/[id]/        # Page film publique
│   │   │   ├── admin/            # Interface d'administration
│   │   │   │   ├── page.tsx      # Liste des films
│   │   │   │   ├── login/        # Connexion admin
│   │   │   │   ├── film/[id]/    # Éditeur de segments
│   │   │   │   ├── referentiel/  # Gestion référentiel
│   │   │   │   └── components/   # FilmForm
│   │   │   ├── api/              # Routes API Next.js
│   │   │   │   ├── auth/         # POST famille, POST/DELETE admin
│   │   │   │   ├── films/        # CRUD films + segments
│   │   │   │   └── referentiel/  # CRUD + cooccurrences
│   │   │   └── components/       # Composants publics partagés
│   │   │       ├── Frise.tsx
│   │   │       ├── FilmGrid.tsx
│   │   │       ├── SearchBar.tsx
│   │   │       ├── SegmentResults.tsx
│   │   │       └── VideoLightbox.tsx  # hors CDC
│   │   ├── lib/
│   │   │   ├── db.ts             # Pool MySQL (connexion partagée)
│   │   │   ├── auth.ts           # Helpers cookies famille + JWT admin
│   │   │   ├── films.ts          # Requêtes DB films (slugify, couverture, branches)
│   │   │   └── segments.ts       # Requêtes DB segments (anti-chevauchement, sync ref)
│   │   └── middleware.ts         # Protection routes (famille + admin)
│   ├── Dockerfile.dev
│   ├── next.config.ts            # Polling fichiers + proxy /videos/*
│   ├── package.json
│   └── tsconfig.json
├── db/
│   └── init.sql                  # Création des 3 tables au 1er démarrage
├── nginx/
│   └── videos.conf               # Range requests + CORS pour les MP4
├── videos/                       # Fichiers MP4 (hors Git)
├── _docs/                        # Documentation
├── docker-compose.yml
├── .env                          # Config locale (hors Git)
└── .env.example                  # Modèle à commiter
```

---

## Modèle de données

### Table `films`
- **PK** : `id` VARCHAR(120) — slug généré depuis le titre (`slugify()`)
- Champs notables : `duree` INT (secondes), `fichier_url` (local ou YouTube/Vimeo), `poster_url` auto-calculée pour YouTube
- Calculés à la requête : `couverture` (%), `branches` (union des branches de tous les segments)

### Table `segments`
- **PK** : `id` CHAR(36) — UUID v4
- **FK** : `film_id` → `films.id` ON DELETE CASCADE
- Tags stockés en JSON : `personnes`, `evenements`, `lieux`, `branches`
- **Contrainte anti-chevauchement** vérifiée côté serveur à chaque CREATE et UPDATE

### Table `referentiel`
- **PK** : `id` INT AUTO_INCREMENT
- **UNIQUE** : `(categorie, valeur)`
- `couleur` VARCHAR(7) — uniquement pour les branches
- `branche` VARCHAR(255) — association personne↔branche (ajout hors CDC)
- Sync automatique via `INSERT IGNORE` à chaque sauvegarde de segment

---

## Points techniques notables

### Authentification
```
Famille  : cookie "super8_famille" = "1"  (30 jours)
Admin    : cookie "super8_admin"   = JWT  (7 jours)
```
Le middleware Next.js (`src/middleware.ts`) intercepte toutes les requêtes avant le rendu. Les routes API publiques (`/api/auth/*`) sont exemptées. Les routes de modification (`POST/PATCH/DELETE` sur films, segments, referentiel) vérifient **en plus** le cookie admin dans les route handlers.

### Slugification des IDs de films
```typescript
// "Été 1972 — La Marquèze" → "ete-1972-la-marqueze"
slugify(titre: string): string
```
Le slug est la PK — il est généré à la création et n'est jamais régénéré automatiquement en modification.

### Anti-chevauchement de segments
```sql
SELECT id FROM segments
WHERE film_id = ? AND id != ? AND tc_debut < ? AND tc_fin > ?
-- nouveau.tc_debut < existant.tc_fin ET nouveau.tc_fin > existant.tc_debut
```
Vérifié côté serveur (lib/segments.ts) — une erreur `OVERLAP` est renvoyée au client avec HTTP 409.

### Couverture d'annotation
```sql
COALESCE(ROUND(SUM(s.tc_fin - s.tc_debut) / f.duree * 100), 0) AS couverture
```
Calculée à chaque requête GET `/api/films`, non stockée en base.

### Recherche par tags (page d'accueil)
La recherche est en deux temps :
1. `GET /api/referentiel` → autocomplétion côté client (filtrée en temps réel, debounce 250ms)
2. `GET /api/films?personne=X` → films filtrés via sous-requête SQL `WHERE film_id IN (SELECT DISTINCT film_id FROM segments WHERE JSON_CONTAINS(...))`
3. `GET /api/segments?personne=X` → segments précis pour la liste sous la frise

L'URL est mise à jour (`?personne=Jean+Dupont`) via `router.replace` pour permettre le partage. Les paramètres sont lus au chargement via `useSearchParams` (Suspense boundary requis avec Next.js 15).

### Génération de miniature *(hors CDC)*
Composant `ThumbnailPicker` — capture canvas côté client :
1. Un `<video>` réel est rendu dans le DOM (masqué) avec `preload="auto"`
2. À `loadeddata`, seek successif aux timecodes 25%, 50%, 75% de la durée
3. Chaque frame est capturée via `canvas.getContext("2d").drawImage(video, 0, 0)`
4. L'utilisateur sélectionne une frame → `POST /api/films/:id/thumbnail`
5. Serveur : décode le base64, écrit le PNG dans `public/thumbnails/[id].png`, met à jour `poster_url` en DB
6. Servi par Next.js via `/thumbnails/[id].png`

Volume Docker dédié : `./thumbnails` → `/app/public/thumbnails` (exclu du Git sauf `.gitkeep`).
Ne fonctionne que pour les MP4 locaux (cross-origin bloque la capture canvas sur YouTube/Vimeo).

### Lightbox vidéo *(hors CDC)*
Composant `VideoLightbox` — overlay modal avec backdrop blur :
- **MP4** : balise `<video>` avec seek au `tc_debut` via `loadedmetadata`
- **YouTube** : embed avec paramètre `?start={secondes}&autoplay=1`
- **Vimeo** : embed avec `?autoplay=1#t={secondes}s`
- Fermeture : touche Échap, clic sur le fond, bouton ✕
- Lien "Ouvrir le film ↗" vers `/film/:id` sans perdre la recherche
- Scroll du body bloqué pendant l'ouverture (`overflow: hidden`)

### Co-occurrences
La route `GET /api/referentiel/cooccurrences?valeur=X&categorie=Y` :
1. Récupère tous les segments contenant X (dans n'importe quel champ JSON)
2. Compte les autres valeurs présentes dans ces mêmes segments
3. Filtre : seuil minimum 3 co-occurrences, triées par fréquence
4. Le TagInput déclenche la requête avec un debounce de 600ms

### Proxy vidéos
```typescript
// next.config.ts
rewrites: [{ source: "/videos/:path*", destination: "http://videos/videos/:path*" }]
```
Le container Nginx `videos` n'est pas exposé publiquement — l'app proxie `/videos/*` en interne via le réseau Docker. Support des Range requests pour le seek sans téléchargement complet.

### Polling fichiers (dev Windows)
```typescript
// next.config.ts
watchOptions: { poll: 1000, aggregateTimeout: 300 }
```
Nécessaire sous Windows + Docker : les événements `inotify` ne remontent pas dans le container. Le polling surveille les fichiers **existants** — les nouveaux fichiers nécessitent encore un `docker restart super8_app`.

---

## Variables d'environnement

| Variable | Usage |
|----------|-------|
| `DB_HOST/PORT/NAME/USER/PASSWORD` | Connexion MySQL |
| `DB_ROOT_PASSWORD` | Init Docker MySQL |
| `ADMIN_PASSWORD` | Mot de passe interface `/admin` |
| `FAMILLE_PASSWORD` | Mot de passe accès public |
| `JWT_SECRET` | Signature JWT admin (`openssl rand -hex 32`) |
| `APP_PORT` | Port exposé (défaut 3000) |

---

## Commandes utiles

```bash
# Démarrage (1ère fois)
docker compose up --build

# Démarrage normal
docker compose up -d

# Redémarrer l'app (après ajout de nouveaux fichiers)
docker restart super8_app

# Voir les logs
docker logs super8_app -f

# Accès MySQL
docker exec -it super8_db mysql -usuper8user -psuper8pass super8

# Backup base de données (manuel)
docker exec super8_db mysqldump -u root -prootpassword super8 --no-tablespaces > backup.sql

# Synchroniser la base VPS → local (depuis le VPS)
docker exec super8_db mysqldump -u root -prootpassword super8 --no-tablespaces --default-character-set=utf8mb4 > /root/S8/dump.sql
# Puis en local (PowerShell)
Get-Content dump.sql | docker exec -i super8_db mysql -u root -prootpassword --default-character-set=utf8mb4 super8

# Backup via script (compressé + rotation automatique)
bash scripts/backup.sh

# Restauration
bash scripts/restore.sh backups/super8_20260601_020000.sql.gz
```
