# syntax=docker/dockerfile:1

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit

COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS python-builder

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/* \
    && python -m venv "$VIRTUAL_ENV"

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/app/data/huggingface
ENV TRANSFORMERS_CACHE=/app/data/huggingface

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 appuser

COPY --from=python-builder /opt/venv /opt/venv

COPY backend/app ./backend/app
COPY backend/__init__.py ./backend/__init__.py
COPY --from=frontend-builder /app/frontend/out ./frontend/out
COPY start.sh ./start.sh

RUN mkdir -p /app/data/uploads /app/data/chroma_db /app/data/huggingface \
    && chown -R appuser:appuser /app \
    && chmod +x start.sh

USER appuser

EXPOSE 7860

CMD ["./start.sh"]
