FROM node:22-alpine AS web-builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    INDEPORA_STATIC_DIR=/app/web \
    INDEPORA_COOKIE_SECURE=true
WORKDIR /app
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api/alembic.ini ./alembic.ini
COPY apps/api/migrations ./migrations
COPY apps/api/indepora ./indepora
COPY --from=web-builder /web/out ./web
EXPOSE 8000
CMD ["sh", "-c", "alembic -c /app/alembic.ini upgrade head && exec uvicorn indepora.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --no-access-log"]
