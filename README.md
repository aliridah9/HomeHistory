# HomeHistory Real Estate Data Ingestion System

A production-ready system for ethical real estate data collection and processing, designed to gather comprehensive property information from primary and supplemental sources while respecting terms of service and implementing robust rate limiting.

## 🏗️ Architecture Overview

**hh_ingest** combines data from multiple sources to create comprehensive property reports:

- **Primary Source**: ATTOM Data API for authoritative property records, tax assessments, sales history, and contextual data
- **Supplemental Sources**: Zillow, Redfin, and Homes.com for current listing information
- **Storage Options**: JSON files and/or PostgreSQL database with async SQLAlchemy ORM
- **Geographic Coverage**: Los Angeles County (CA), Houston Metro, DFW, Austin, and San Antonio (TX)

## 🚀 Key Features

### Ethical Data Collection
- **Rate Limiting**: ≤2 requests/second per domain with randomized delays
- **robots.txt Compliance**: Automatic checking and respect for robots.txt directives
- **User Agent Rotation**: Randomized user agents to distribute requests
- **Exponential Backoff**: Intelligent retry logic with jitter
- **ToS Compliance**: Only collects publicly available listing facts

### Robust Architecture  
- **Async/Await**: Full async support for high performance
- **Pydantic Validation**: Strict data validation with comprehensive error handling
- **SQLAlchemy ORM**: Modern async database operations with automatic migrations
- **Rich CLI**: Beautiful command-line interface with progress bars and tables
- **Comprehensive Logging**: Structured logging with configurable levels

### Data Quality
- **Schema Validation**: Comprehensive Pydantic models ensure data consistency
- **Address Normalization**: Intelligent address parsing and standardization
- **Duplicate Detection**: Property matching across sources
- **Data Enrichment**: Combines multiple sources for complete property profiles

## 📦 Installation

### Prerequisites
- Python 3.11+ 
- PostgreSQL 12+ (for database storage)
- Git

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/homehistory/hh-ingest.git
cd hh-ingest

# Install with pip
pip install -e .

# Or install with development dependencies
pip install -e ".[dev,test]"

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database (optional)
hh-ingest init-db

# Test your setup
hh-ingest test-connection
```

### Using Poetry (Alternative)

```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install --with dev,test

# Activate virtual environment
poetry shell

# Run commands
hh-ingest --help
```

## ⚙️ Configuration

Configuration is managed through environment variables and can be overridden via CLI parameters.

### Required Environment Variables

```bash
# ATTOM Data API (Required)
HH_ATTOM_API_KEY=your_attom_api_key_here

# Database (Required for DB storage)
HH_DATABASE_URL=postgresql://user:password@localhost:5432/hh_ingest
HH_DIRECT_URL=postgresql://user:password@localhost:5432/hh_ingest  # For writes

# Storage Configuration
HH_SCRAPER_MODE=both  # Options: json, db, both
HH_OUTPUT_DIR=./output  # Directory for JSON files

# Optional Network Configuration
HH_HTTP_PROXY=http://proxy:8080  # Optional HTTP proxy
HH_LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

### Regional Coverage

Built-in support for major real estate markets:

- **Los Angeles County, CA**: 16 cities, premium ZIP codes
- **Houston Metro, TX**: 15 cities, key suburban areas  
- **Dallas-Fort Worth, TX**: 16 cities, major suburbs
- **Austin Metro, TX**: 15 cities, surrounding areas
- **San Antonio Metro, TX**: 15 cities, metropolitan region

Override regions via environment: `HH_REGIONS=houston_metro,austin_metro`

## 🎯 Usage

### Command Line Interface

The CLI provides several commands for different workflows:

#### Full Data Ingestion
```bash
# Run complete workflow: discover → collect → store
hh-ingest ingest --regions "houston_metro,austin_metro" --max-listings 100

# Store only to JSON files
hh-ingest ingest --mode json --output-dir ./data

# Enable verbose logging
hh-ingest ingest --verbose
```

#### Discovery Only
```bash
# Discover property listings without collecting details
hh-ingest discover --regions "los_angeles_county" --max-per-portal 50

# Save discovered URLs to file
hh-ingest discover --output discovered_urls.json
```

#### Database Management
```bash
# Initialize database tables
hh-ingest init-db

# Force recreation of tables (⚠️ DATA LOSS)
hh-ingest init-db --force

# Test database connection
hh-ingest test-connection
```

#### Configuration Management
```bash
# View current configuration
hh-ingest config

# Show sensitive values (for debugging)
hh-ingest config --show-secrets
```

### Programmatic Usage

```python
import asyncio
from hh_ingest import IngestionOrchestrator, Settings

async def run_ingestion():
    settings = Settings()  # Loads from environment
    
    async with IngestionOrchestrator(settings) as orchestrator:
        # Run full workflow
        summary = await orchestrator.run_full_workflow(
            max_listings_per_portal=50
        )
        
        print(f"Processed {summary['reports_generated']} properties")
        print(f"Duration: {summary['duration_seconds']:.1f} seconds")

# Run the ingestion
asyncio.run(run_ingestion())
```

### Individual Components

```python
from hh_ingest.attom import ATTOMClient
from hh_ingest.portals import ZillowCollector
from hh_ingest.storage import StorageManager

# Use ATTOM API client
async with ATTOMClient(settings) as attom:
    data = await attom.get_comprehensive_data("123 Main St, Houston, TX")

# Use portal collectors
async with ZillowCollector() as zillow:
    listings = await zillow.discover_listings(region_config)

# Use storage manager
storage = StorageManager(settings)
await storage.save_report(report)
```

## 🗃️ Data Models

The system uses comprehensive Pydantic models for data validation:

### Core Models

- **`Address`**: Standardized address with coordinates
- **`PropertyCore`**: Physical characteristics, APN, features
- **`TaxFact`**: Assessment values and tax amounts
- **`SaleRecord`**: Historical sales transactions
- **`Listing`**: Portal listing data with photos and agent info
- **`Report`**: Complete property research report

### Example Report Structure

```python
{
    "id": "uuid",
    "created_at": "2024-01-15T10:30:00Z",
    "core": {
        "address": {
            "full": "123 Main St, Houston, TX 77001",
            "lat": 29.7604,
            "lng": -95.3698
        },
        "beds": 3.0,
        "baths": 2.5,
        "building_sqft": 2500,
        "year_built": 2020
    },
    "tax": {
        "year": 2023,
        "assessed_total": 50000000,  # $500k in cents
        "tax_amount": 1250000       # $12.5k in cents
    },
    "sales": [
        {
            "date": "2020-06-15",
            "price": 45000000,  # $450k in cents
            "buyer": "John Smith",
            "deed_type": "Warranty Deed"
        }
    ],
    "listings": [
        {
            "source": "zillow",
            "url": "https://...",
            "list_price": 52500000,  # $525k in cents
            "status": "For Sale",
            "photos": [...]
        }
    ],
    "schools": [...],
    "crime": {...},
    "source_attribution": ["ATTOM Data", "Zillow"]
}
```

## 🛠️ Development

### Setup Development Environment

```bash
# Clone and install with development dependencies
git clone https://github.com/homehistory/hh-ingest.git
cd hh-ingest
pip install -e ".[dev,test]"

# Install pre-commit hooks
pre-commit install

# Run tests
pytest

# Run tests with coverage
pytest --cov=hh_ingest --cov-report=html

# Format code
black hh_ingest tests
isort hh_ingest tests

# Type checking
mypy hh_ingest
```

### Project Structure

```
hh_ingest/
├── __init__.py              # Package initialization
├── config.py               # Configuration management  
├── schema.py               # Pydantic data models
├── storage.py              # JSON and database storage
├── attom.py                # ATTOM API client and mappers
├── utils.py                # Utility functions
├── ingest.py               # Main orchestration logic
├── cli.py                  # Typer CLI interface
├── portals/                # Real estate portal collectors
│   ├── __init__.py
│   ├── base.py             # Base collector with rate limiting
│   ├── zillow.py           # Zillow collector
│   ├── redfin.py           # Redfin collector
│   └── homes.py            # Homes.com collector
└── permits/                # Municipal data (future)
    ├── __init__.py
    └── socrata.py          # Socrata API collector

tests/                      # Comprehensive test suite
├── test_schema.py          # Model validation tests
├── test_utils.py           # Utility function tests
└── test_mappers.py         # Data mapping tests

alembic/                    # Database migrations
├── env.py                  # Alembic environment
├── script.py.mako          # Migration template
└── versions/               # Migration files
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test categories
pytest -m unit              # Unit tests only
pytest -m integration       # Integration tests only
pytest -k "test_schema"     # Tests matching pattern

# Run with coverage
pytest --cov=hh_ingest --cov-report=term-missing

# Skip slow tests
pytest -m "not slow"
```

### Database Migrations

```bash
# Generate new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Check current version
alembic current
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build Docker image
docker build -t hh-ingest .

# Run with environment file
docker run --env-file .env hh-ingest hh-ingest --help

# Run ingestion workflow
docker run --env-file .env -v $(pwd)/output:/app/output hh-ingest \
    hh-ingest ingest --max-listings 25 --mode json
```

### Docker Compose

```yaml
version: '3.8'
services:
  hh-ingest:
    build: .
    environment:
      - HH_ATTOM_API_KEY=${ATTOM_API_KEY}
      - HH_DATABASE_URL=${DATABASE_URL}
      - HH_SCRAPER_MODE=both
    volumes:
      - ./output:/app/output
    depends_on:
      - postgres
      
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hh_ingest
      POSTGRES_USER: postgres  
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 📊 Performance & Monitoring

### Rate Limiting & Throttling

- **Global Rate Limit**: 2 requests/second per domain
- **Random Delays**: 0.5-1.5 seconds between requests
- **Concurrent Limits**: 5 concurrent requests maximum
- **Exponential Backoff**: 1s → 2s → 4s → 8s → 60s max
- **Circuit Breaker**: Automatic failure detection and recovery

### Monitoring Metrics

The system provides comprehensive logging and metrics:

```bash
# Monitor ingestion progress
hh-ingest ingest --verbose

# Check discovery statistics  
hh-ingest discover --output metrics.json

# Test system health
hh-ingest test-connection
```

### Performance Benchmarks

Typical performance on standard hardware:

- **Discovery**: 100-200 listings/minute per portal
- **Detail Collection**: 50-100 properties/minute
- **Database Storage**: 1000+ records/second
- **JSON Export**: 2000+ records/second

## 🔒 Security & Compliance

### Data Privacy
- Only collects publicly available listing information
- No personal information beyond what's in public listings
- Respects robots.txt and terms of service
- Implements polite crawling practices

### API Security
- Secure API key management via environment variables
- HTTPS-only connections to external APIs
- Request signing and validation where supported
- Rate limiting prevents abuse

### Database Security
- Parameterized queries prevent SQL injection
- Connection pooling with secure defaults  
- Optional SSL/TLS for database connections
- Audit logging for data access

## 🚨 Error Handling

The system implements comprehensive error handling:

### Network Errors
- **Timeout Handling**: Configurable timeouts with graceful degradation
- **Retry Logic**: Exponential backoff with jitter
- **Circuit Breaker**: Automatic failure detection
- **Fallback Strategies**: Multiple data source options

### Data Quality Issues  
- **Validation Errors**: Detailed Pydantic error messages
- **Schema Mismatches**: Automatic data normalization
- **Missing Data**: Graceful handling of incomplete records
- **Duplicate Detection**: Address-based deduplication

### System Recovery
- **Checkpoint/Resume**: Resume interrupted ingestion workflows
- **Health Checks**: Built-in system health monitoring  
- **Alerting**: Configurable error thresholds
- **Rollback**: Database transaction safety

## 📈 Scaling & Production

### Horizontal Scaling

```bash
# Run multiple instances with region splitting
hh-ingest ingest --regions "houston_metro" &
hh-ingest ingest --regions "austin_metro" &
hh-ingest ingest --regions "dfw_metro" &
```

### Production Checklist

- [ ] **Environment Variables**: All required variables set
- [ ] **Database Setup**: PostgreSQL configured and migrations applied
- [ ] **API Keys**: ATTOM API key with sufficient quota
- [ ] **Rate Limits**: Appropriate limits for your infrastructure
- [ ] **Monitoring**: Logging and alerting configured  
- [ ] **Backups**: Database backup strategy implemented
- [ ] **Security**: Network security and access controls
- [ ] **Documentation**: Runbooks and operational procedures

### Resource Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB  
- Storage: 50GB
- Network: 100 Mbps

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 500GB+ SSD
- Network: 1 Gbps

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes with tests**: Ensure all tests pass
4. **Follow code style**: Use black, isort, and mypy
5. **Submit pull request**: With clear description

### Development Workflow

```bash
# Set up development environment
git clone https://github.com/homehistory/hh-ingest.git
cd hh-ingest
pip install -e ".[dev,test]"
pre-commit install

# Make changes and test
black hh_ingest tests
isort hh_ingest tests  
mypy hh_ingest
pytest

# Submit pull request
git push origin feature/amazing-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- **API Documentation**: [docs.homehistory.com](https://docs.homehistory.com)
- **Configuration Guide**: See `.env.example` 
- **Migration Guide**: See `alembic/` directory

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/homehistory/hh-ingest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/homehistory/hh-ingest/discussions)  
- **Email**: support@homehistory.com

### Commercial Support
Enterprise support and custom development services are available. Contact sales@homehistory.com for more information.

---

**Built with ❤️ by the HomeHistory team**
