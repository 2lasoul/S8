#!/bin/bash
# Restauration d'une sauvegarde Super 8
# Usage : ./restore.sh backups/super8_20260601_020000.sql.gz

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

CONTAINER_NAME="super8_db"
DB_NAME="${DB_NAME:-super8}"
DB_USER="${DB_USER:-super8user}"
DB_PASSWORD="${DB_PASSWORD:-super8pass}"

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage : $0 <fichier_backup.sql.gz>"
  echo ""
  echo "Sauvegardes disponibles :"
  ls -lh "$SCRIPT_DIR/../backups"/super8_*.sql.gz 2>/dev/null || echo "  Aucune"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Erreur : fichier '$BACKUP_FILE' introuvable."
  exit 1
fi

echo "[$(date)] Restauration depuis : $BACKUP_FILE"
echo "⚠️  Cela va écraser la base de données actuelle. Continuer ? (oui/non)"
read -r CONFIRM

if [ "$CONFIRM" != "oui" ]; then
  echo "Annulé."
  exit 0
fi

gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" \
  mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"

echo "[$(date)] Restauration terminée."
