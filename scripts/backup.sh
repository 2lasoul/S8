#!/bin/bash
# Sauvegarde automatique de la base de données Super 8
# À configurer en cron sur le VPS

set -e

# Chargement des variables d'environnement
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Config
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
CONTAINER_NAME="super8_db"
DB_NAME="${DB_NAME:-super8}"
DB_USER="${DB_USER:-super8user}"
DB_PASSWORD="${DB_PASSWORD:-super8pass}"
KEEP_DAYS="${KEEP_DAYS:-7}"  # Nombre de jours de sauvegardes à conserver

# Création du dossier de sauvegardes
mkdir -p "$BACKUP_DIR"

# Nom du fichier avec timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/super8_${TIMESTAMP}.sql.gz"

echo "[$(date)] Sauvegarde en cours → $BACKUP_FILE"

# Dump compressé
docker exec "$CONTAINER_NAME" \
  mysqldump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  | gzip > "$BACKUP_FILE"

echo "[$(date)] Sauvegarde terminée ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Suppression des sauvegardes anciennes
DELETED=$(find "$BACKUP_DIR" -name "super8_*.sql.gz" -mtime +$KEEP_DAYS -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] $DELETED ancienne(s) sauvegarde(s) supprimée(s)"
fi

echo "[$(date)] Sauvegardes disponibles :"
ls -lh "$BACKUP_DIR"/super8_*.sql.gz 2>/dev/null || echo "  Aucune"
