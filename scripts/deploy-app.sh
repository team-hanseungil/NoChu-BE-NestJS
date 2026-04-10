#!/bin/bash
set -e

IMAGE="ghcr.io/team-hanseungil/nochu-be-nestjs:latest"
COMPOSE_FILE="/opt/nochu/docker-compose.app.yml"
CONTAINER="nochu-app"

echo "Pulling latest image: $IMAGE"
docker pull "$IMAGE"

echo "Restarting container..."
docker compose -f "$COMPOSE_FILE" up -d

timeout 60 bash -c "until [ \"\$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER)\" = \"healthy\" ]; do sleep 2; done"

echo "Deploy complete on $(hostname)"
