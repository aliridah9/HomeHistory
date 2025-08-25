# HomeHistory Real Estate Data Ingestion - Makefile
# Provides common development, testing, and deployment commands

.PHONY: help install install-dev test test-unit test-integration test-cov lint format type-check clean build docker-build docker-run setup-dev setup-db docs

# Default target
help: ## Show this help message
	@echo "HomeHistory Real Estate Data Ingestion System"
	@echo "============================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# =============================================================================
# Installation & Setup
# =============================================================================

install: ## Install the package in production mode
	pip install -e .

install-dev: ## Install with development dependencies  
	pip install -e ".[dev,test]"
	pre-commit install

setup-dev: install-dev ## Complete development environment setup
	@echo "Setting up development environment..."
	cp env.example .env || true
	@echo "✅ Development environment ready!"
	@echo "📝 Edit .env file with your configuration"
	@echo "🗄️  Run 'make setup-db' to initialize database"

setup-db: ## Initialize database and run migrations
	@echo "Initializing database..."
	alembic upgrade head
	@echo "✅ Database initialized"

# =============================================================================
# Testing
# =============================================================================

test: ## Run all tests
	pytest

test-unit: ## Run unit tests only
	pytest -m "unit or (not integration and not slow)"

test-integration: ## Run integration tests only
	pytest -m "integration"

test-slow: ## Run all tests including slow ones
	pytest -m ""

test-cov: ## Run tests with coverage report
	pytest --cov=hh_ingest --cov-report=html --cov-report=term-missing
	@echo "📊 Coverage report generated in htmlcov/"

test-watch: ## Run tests in watch mode
	pytest --verbose --tb=short --looponfail

# =============================================================================
# Code Quality
# =============================================================================

lint: ## Run all linters
	flake8 hh_ingest tests
	black --check hh_ingest tests
	isort --check-only hh_ingest tests
	mypy hh_ingest

format: ## Format code with black and isort
	black hh_ingest tests
	isort hh_ingest tests
	@echo "✨ Code formatted"

type-check: ## Run type checking with mypy
	mypy hh_ingest

check-all: format lint type-check test ## Run all quality checks

# =============================================================================
# Development Commands
# =============================================================================

discover: ## Run discovery workflow with sample data
	hh-ingest discover --regions "houston_metro" --max-per-portal 10 --verbose

ingest-sample: ## Run sample ingestion workflow
	hh-ingest ingest --regions "austin_metro" --max-listings 5 --verbose

test-connection: ## Test connections to external services
	hh-ingest test-connection

config: ## Show current configuration
	hh-ingest config

# =============================================================================
# Database Management  
# =============================================================================

db-init: ## Initialize database tables
	hh-ingest init-db

db-migrate: ## Generate and apply database migrations
	alembic revision --autogenerate -m "Auto migration"
	alembic upgrade head

db-upgrade: ## Apply pending database migrations
	alembic upgrade head

db-downgrade: ## Rollback last database migration
	alembic downgrade -1

db-reset: ## Reset database (⚠️  DATA LOSS)
	@echo "⚠️  This will DELETE ALL DATA in the database!"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		hh-ingest init-db --force; \
		echo "🗄️  Database reset complete"; \
	else \
		echo "❌ Operation cancelled"; \
	fi

# =============================================================================
# Build & Deployment
# =============================================================================

clean: ## Clean build artifacts and cache
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf htmlcov/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

build: clean ## Build distribution packages
	python -m build

upload-test: build ## Upload to TestPyPI
	python -m twine upload --repository testpypi dist/*

upload: build ## Upload to PyPI
	python -m twine upload dist/*

# =============================================================================
# Docker Commands
# =============================================================================

docker-build: ## Build Docker image
	docker build -t hh-ingest:latest .

docker-build-dev: ## Build Docker image for development
	docker build -t hh-ingest:dev --target development .

docker-run: ## Run Docker container
	docker run --env-file .env -v $(PWD)/output:/app/output hh-ingest:latest

docker-run-sample: docker-build ## Build and run sample ingestion
	docker run --env-file .env -v $(PWD)/output:/app/output \
		hh-ingest:latest hh-ingest ingest --regions "houston_metro" --max-listings 5

docker-shell: ## Run Docker container with interactive shell
	docker run -it --env-file .env -v $(PWD)/output:/app/output \
		--entrypoint /bin/bash hh-ingest:latest

# =============================================================================
# Documentation
# =============================================================================

docs: ## Generate documentation (placeholder)
	@echo "📚 Documentation generation not implemented yet"
	@echo "📖 See README.md for current documentation"

docs-serve: ## Serve documentation locally (placeholder)
	@echo "📚 Documentation serving not implemented yet"

# =============================================================================
# Performance & Monitoring
# =============================================================================

benchmark: ## Run performance benchmarks
	@echo "🏃‍♂️ Running performance benchmarks..."
	time hh-ingest discover --regions "austin_metro" --max-per-portal 25 --output /tmp/benchmark.json
	@echo "📊 Benchmark complete"

profile: ## Run ingestion with profiling
	python -m cProfile -o profile.stats -m hh_ingest.cli ingest --regions "houston_metro" --max-listings 10
	@echo "📈 Profile data saved to profile.stats"
	@echo "   View with: python -m pstats profile.stats"

# =============================================================================
# Maintenance
# =============================================================================

update-deps: ## Update all dependencies
	pip install --upgrade pip setuptools wheel
	pip install --upgrade -e ".[dev,test]"
	pre-commit autoupdate

security-check: ## Run security vulnerability scan
	pip-audit
	safety check
	bandit -r hh_ingest/

pre-commit-all: ## Run pre-commit on all files
	pre-commit run --all-files

# =============================================================================
# Environment-specific Commands
# =============================================================================

dev-start: ## Start development environment
	@echo "🚀 Starting development environment..."
	@echo "📝 Make sure .env is configured"
	@echo "🗄️  Database: make setup-db"
	@echo "🧪 Tests: make test"
	@echo "🔍 Sample run: make ingest-sample"

prod-deploy: check-all build ## Deploy to production
	@echo "🚀 Production deployment checklist:"
	@echo "✅ All tests passed"
	@echo "✅ Code quality checks passed"
	@echo "✅ Build artifacts created"
	@echo "📦 Ready for deployment"

staging-deploy: test-cov build ## Deploy to staging
	@echo "🔧 Staging deployment ready"
	@echo "📊 Coverage report available in htmlcov/"

# =============================================================================
# Information
# =============================================================================

info: ## Show project information
	@echo "HomeHistory Real Estate Data Ingestion System"
	@echo "============================================="
	@echo ""
	@echo "📁 Project structure:"
	@echo "   hh_ingest/     - Main package"
	@echo "   tests/         - Test suite"
	@echo "   alembic/       - Database migrations"
	@echo ""
	@echo "🔧 Key commands:"
	@echo "   make setup-dev - Set up development environment"
	@echo "   make test      - Run test suite"
	@echo "   make ingest-sample - Run sample data collection"
	@echo ""
	@echo "📖 Documentation:"
	@echo "   README.md      - Main documentation"
	@echo "   env.example    - Configuration reference"
	@echo ""
	@echo "🌐 Links:"
	@echo "   Repository: https://github.com/homehistory/hh-ingest"
	@echo "   Issues:     https://github.com/homehistory/hh-ingest/issues"

version: ## Show version information
	@python -c "from hh_ingest import __version__; print(f'hh-ingest version: {__version__}')"
	@python --version
	@pip --version

# =============================================================================
# Aliases (for convenience)
# =============================================================================

t: test ## Alias for test
f: format ## Alias for format  
l: lint ## Alias for lint
i: install-dev ## Alias for install-dev
c: clean ## Alias for clean
b: build ## Alias for build
d: docker-build ## Alias for docker-build
