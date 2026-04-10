#!/bin/bash
set -e

IMAGE="ghcr.io/team-hanseungil/nochu-be-nestjs:latest"
COMPOSE_FILE="/opt/nochu/docker-compose.app.yml"

echo "Pulling latest image: $IMAGE"
docker pull "$IMAGE"

echo "Updating app-1..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps app-1
timeout 60 bash -c "until [ \"\$(docker inspect --format='{{.State.Health.Status}}' nochu-app-1)\" = \"healthy\" ]; do sleep 2; done"
echo "app-1 healthy"

echo "Updating app-2..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps app-2
timeout 60 bash -c "until [ \"\$(docker inspect --format='{{.State.Health.Status}}' nochu-app-2)\" = \"healthy\" ]; do sleep 2; done"
echo "app-2 healthy"

echo "Deploy complete on $(hostname)"
