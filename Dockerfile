# HomeHistory Real Estate Data Ingestion System
# Multi-stage Docker build for production and development

# =============================================================================
# Base Stage - Common dependencies and system setup
# =============================================================================
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Essential build tools
    gcc \
    g++ \
    make \
    # PostgreSQL client libraries
    libpq-dev \
    # SSL/TLS support
    ca-certificates \
    # Playwright browser dependencies
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    # Utilities
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create application user for security
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# Set working directory
WORKDIR /app

# =============================================================================
# Dependencies Stage - Install Python dependencies
# =============================================================================
FROM base AS dependencies

# Copy dependency files
COPY pyproject.toml ./
COPY README.md ./

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -e .

# Install Playwright browsers
RUN playwright install chromium && \
    playwright install-deps chromium

# =============================================================================
# Development Stage - Include development tools
# =============================================================================
FROM dependencies AS development

# Install development dependencies
RUN pip install -e ".[dev,test]"

# Install additional development tools
RUN apt-get update && apt-get install -y \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY . .

# Set ownership of application files
RUN chown -R appuser:appuser /app /opt/playwright

# Switch to application user
USER appuser

# Default command for development
CMD ["hh-ingest", "--help"]

# =============================================================================
# Production Stage - Minimal production image
# =============================================================================
FROM dependencies AS production

# Copy application code
COPY hh_ingest/ ./hh_ingest/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Create output directory
RUN mkdir -p /app/output

# Set ownership of application files
RUN chown -R appuser:appuser /app /opt/playwright

# Switch to application user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD hh-ingest config > /dev/null || exit 1

# Default command
ENTRYPOINT ["hh-ingest"]
CMD ["--help"]

# =============================================================================
# Build Arguments and Labels
# =============================================================================

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Add metadata labels
LABEL org.opencontainers.image.title="HomeHistory Real Estate Data Ingestion" \
    org.opencontainers.image.description="Production-ready real estate data collection system" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.created="${BUILD_DATE}" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.vendor="HomeHistory" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/homehistory/hh-ingest" \
    org.opencontainers.image.source="https://github.com/homehistory/hh-ingest" \
    org.opencontainers.image.documentation="https://github.com/homehistory/hh-ingest/blob/main/README.md"

# =============================================================================
# Usage Examples:
# =============================================================================

# Build production image:
# docker build --target production -t hh-ingest:latest .

# Build development image:
# docker build --target development -t hh-ingest:dev .

# Run with environment file:
# docker run --env-file .env -v $(pwd)/output:/app/output hh-ingest:latest ingest

# Run discovery workflow:
# docker run --env-file .env hh-ingest:latest discover --regions "houston_metro"

# Run with interactive shell (development):
# docker run -it --env-file .env hh-ingest:dev /bin/bash

# Build with metadata:
# docker build \
#   --target production \
#   --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
#   --build-arg VCS_REF=$(git rev-parse HEAD) \
#   --build-arg VERSION=$(cat hh_ingest/__init__.py | grep __version__ | cut -d'"' -f2) \
#   -t hh-ingest:latest .
