# Archives Super 8 — Avancement du projet

> Dernière mise à jour : juin 2026

---

## ✅ Fait

### Infrastructure & déploiement
- [x] Docker Compose local (Windows) : `app` + `db` + `videos`
- [x] Container Next.js (Node 20, mode dev avec polling fichiers)
- [x] Container MySQL 8 avec init SQL automatique
- [x] Container Nginx pour les vidéos MP4 (Range requests + CORS)
- [x] Fichier `.env` / `.env.example`
- [x] `.gitignore` (exclut `.env`, `videos/`, `node_modules/`, `.next/`)
- [x] Déploiement fonctionnel sur VPS Hostinger
- [x] Repo Git configuré

### Authentification (section 1.2 CDC)
- [x] Mot de passe famille — cookie session 30 jours
- [x] Mot de passe admin — JWT httpOnly 7 jours
- [x] Middleware Next.js protégeant toutes les routes
- [x] Page `/login` (interface publique)
- [x] Page `/admin/login`
- [x] Les deux sessions coexistent indépendamment

### Base de données (section 3 CDC)
- [x] Table `films` — tous les champs du CDC
- [x] Table `segments` — tous les champs, contrainte anti-chevauchement côté serveur
- [x] Table `referentiel` — avec colonne `branche` supplémentaire (association personne/branche, hors CDC)
- [x] Couverture calculée à la requête (non stockée)
- [x] Branches d'un film calculées depuis ses segments

### API (section 6 CDC)
- [x] `POST /api/auth/famille`
- [x] `POST/DELETE /api/auth`
- [x] `GET/POST /api/films`
- [x] `GET/PATCH/DELETE /api/films/:id`
- [x] `GET/POST /api/films/:id/segments`
- [x] `PATCH/DELETE /api/segments/:id`
- [x] `GET/POST /api/referentiel`
- [x] `PATCH/DELETE /api/referentiel/:id`
- [x] `GET /api/referentiel/cooccurrences`

### Interface d'administration (section 5 CDC)
- [x] **Liste des films** `/admin` — compteurs, barre de couverture, badges statut
- [x] **Génération de miniature** *(hors CDC)* — bouton 🖼 sur les films MP4, choix parmi 3 frames (25%/50%/75%), sauvegarde dans `public/thumbnails/`, mise à jour `poster_url`
- [x] **Formulaire film** — slug auto, détection durée via `<video>`, validation
- [x] **Éditeur de segments** `/admin/film/:id`
  - [x] Layout 3 colonnes : segments existants / player / formulaire
  - [x] Player MP4 custom (-5s / ▶ / +5s / scrubber)
  - [x] Timeline visuelle colorée par index de segment
  - [x] Clic zone non annotée → pré-remplit le formulaire
  - [x] Formulaire segment avec boutons ⏱ Ici
  - [x] TagInput avec autocomplétion depuis le référentiel
  - [x] Suggestions par co-occurrence (seuil 3, badge ↔ Nx)
  - [x] Segment actif mis en évidence (opacité + bordure colorée)
  - [x] Tags par catégorie colorés (bleu/vert/orange/couleur branche)
  - [x] Anti-chevauchement vérifié côté serveur
  - [x] Sync référentiel automatique à la sauvegarde
- [x] **Référentiel** `/admin/referentiel`
  - [x] 4 onglets avec compteurs
  - [x] Ajout / édition inline / suppression avec confirmation
  - [x] Color picker pour les branches
  - [x] Association personne ↔ branche (hors CDC, ajout custom)

### Interface publique (section 4 CDC)
- [x] **Page d'accueil** `/`
  - [x] Frise chronologique avec détection de lanes (anti-chevauchement visuel)
  - [x] Blocs colorés par branche, opacité réduite si filtrés
  - [x] Filtres par branche (chips colorés)
  - [x] Tooltip au survol (titre, période, durée)
  - [x] Grille de cartes films (poster YouTube auto, barre de couverture, tags branches)
  - [x] **Barre de recherche** avec autocomplétion depuis le référentiel (personnes, lieux, événements, branches)
  - [x] Badge catégorie coloré dans les suggestions (Personne / Lieu / Événement / Branche)
  - [x] Message "aucun résultat" si la valeur ne correspond à aucun tag
  - [x] Filtre actif affiché avec badge + bouton réinitialiser
  - [x] **URL partageable** — filtres encodés dans l'URL (`?personne=Jean+Dupont`)
  - [x] **Liste des segments correspondants** sous la frise (timecode, titre, tags, bouton ▶ Lire)
  - [x] **Lightbox vidéo** *(hors CDC)* — lecture du segment au bon timecode sans quitter la page de recherche (fermeture Échap / clic fond / ✕, lien "Ouvrir le film ↗")
- [x] **Page film** `/film/:id`
  - [x] Player MP4 custom (-10s / ▶ / +10s / scrubber)
  - [x] Bouton plein écran ⛶
  - [x] Hauteur vidéo adaptative : 65vh panneau fermé, 80vh panneau ouvert
  - [x] Ratio natif 4:3 respecté (Super 8 1440×1080)
  - [x] Embed YouTube / Vimeo (`<iframe>`)
  - [x] Barre de segments colorée sous le scrubber (masquée si panneau ouvert)
  - [x] Capture de frame 📷 (MP4 uniquement)
  - [x] Panneau annotations latéral (320px, scrollable, hauteur contrainte)
  - [x] Segment actif mis en évidence + scroll centré automatique
  - [x] Tags par catégorie en 3 blocs distincts (personnes / lieux+événements / branches) + note
  - [x] Annotation active sous la vidéo masquée si panneau ouvert
  - [x] Séquences non annotées affichées dans le panneau

---

## 🔄 En cours / Partiellement fait

- [ ] **Frise avec filtre actif** — les films sans résultat s'estompent mais la période de la frise ne se recadre pas encore sur les résultats (section 4.2 CDC)

---

## ❌ Reste à faire

### Interface publique
- [x] **Filtre avancé** — panneau avec 3 champs (personne + lieu + événement), ET logique, autocomplétion depuis le référentiel, badges actifs supprimables individuellement, URL partageable multi-paramètres
- [x] **Recadrage de la frise** — quand un filtre est actif, la frise se recadre sur la période des films correspondants, films hors fenêtre masqués, indicateur de période affichée ⚠️ *à tester avec plus de données*
- [ ] **Paramètre `#segment-id`** dans l'URL pour ouvrir le panneau annotations au bon segment

### Interface d'administration
- [ ] **Indicateur couverture complète** ✓ dans l'éditeur (badge déjà prévu, à vérifier)
- [ ] **Bouton ⏱ Auto** dans le formulaire film — détection durée pour les fichiers locaux (fonctionne pour YouTube, à tester pour MP4 locaux)

### Déploiement
- [x] **Dockerfile de production** — build multi-étapes (deps → builder → runner), image standalone légère, utilisateur non-root, `docker-compose.prod.yml` dédié
- [x] **Thumbnails en prod** — servis par Nginx (comme les vidéos), proxiés via `/thumbnails/*`, volume monté en lecture seule dans le container Nginx
- [x] **HTTPS / reverse proxy** — Caddy installé sur le VPS, certificat Let's Encrypt automatique, domaine `filmsuper8.duckdns.org` (DuckDNS), redirection HTTP → HTTPS
- [x] **Script de sauvegarde** `scripts/backup.sh` — dump MySQL compressé (.sql.gz), rotation automatique (7 jours par défaut), script de restauration inclus
- [ ] **Cron automatique** sur le VPS (à configurer manuellement via `crontab -e`)

### Hors CDC (idées)
- [ ] Responsive mobile (le CDC indique "pas une priorité")
- [ ] Export des annotations (CSV ou JSON)

---

## 📊 Couverture CDC estimée

| Section | Couverture |
|---------|-----------|
| 1. Vision & auth | ✅ 100% |
| 2. Infrastructure | ✅ 95% (prod Dockerfile manquant) |
| 3. Modèle de données | ✅ 100% |
| 4. Interface publique | ✅ 100% |
| 5. Interface admin | ✅ 90% |
| 6. Routes API | ✅ 100% |
| 7. Gestion vidéos | ✅ 90% |
| 8. Déploiement | ✅ 100% |
