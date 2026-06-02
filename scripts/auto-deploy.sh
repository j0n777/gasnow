#!/bin/bash
# Auto-deploy gasnow: git pull + rebuild Docker se houver mudanças no repositório.
# Cron: toda segunda-feira às 02:00 UTC
# Cron: 0 2 * * 1 /home/docker-sites/gasnow2.0/scripts/auto-deploy.sh >> /var/log/gasnow-deploy.log 2>&1

REPO="/home/docker-sites/gasnow2.0"
COMPOSE="$REPO/docker-compose.yml"
LOG_PREFIX="$(date '+%Y-%m-%d %H:%M')"

cd "$REPO" || { echo "$LOG_PREFIX — ERRO: diretório não encontrado"; exit 1; }

git fetch origin main --quiet

UPSTREAM_COMMITS=$(git log HEAD..origin/main --oneline 2>/dev/null | wc -l)

if [ "$UPSTREAM_COMMITS" -gt 0 ]; then
  echo "$LOG_PREFIX — $UPSTREAM_COMMITS novo(s) commit(s) detectado(s), iniciando deploy..."
  git pull origin main
  docker compose -f "$COMPOSE" up -d --build
  echo "$LOG_PREFIX — deploy concluído OK"
else
  echo "$LOG_PREFIX — nenhuma mudança no git, nada a fazer"
fi
