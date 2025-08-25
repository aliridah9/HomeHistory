"""
Configuration management for real estate data ingestion system.

Loads settings from environment variables with sensible defaults.
Includes region definitions, API endpoints, rate limits, and scraper settings.
"""

import os
from pathlib import Path
from typing import Dict, List, Literal, Optional, Tuple
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator, ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict


class RegionSeed(BaseModel):
    """Geographic region configuration for data collection."""
    
    model_config = ConfigDict(frozen=True)
    
    name: str = Field(..., description="Human-readable region name")
    state: str = Field(..., min_length=2, max_length=2, description="2-letter state code")
    county: Optional[str] = Field(None, description="County name")
    cities: List[str] = Field(default_factory=list, description="Target cities")
    bbox: Optional[Tuple[float, float, float, float]] = Field(
        None, description="Bounding box (west, south, east, north)"
    )
    zip_codes: List[str] = Field(default_factory=list, description="Target ZIP codes")
    
    @field_validator("state")
    @classmethod
    def validate_state(cls, v: str) -> str:
        """Ensure state code is uppercase."""
        return v.upper()


class ScraperSettings(BaseModel):
    """Scraper behavior and rate limiting configuration."""
    
    model_config = ConfigDict(frozen=True)
    
    max_requests_per_second: float = Field(2.0, ge=0.1, le=10.0, description="Global rate limit")
    request_delay_min: float = Field(0.5, ge=0.1, description="Minimum delay between requests")
    request_delay_max: float = Field(1.5, ge=0.5, description="Maximum delay between requests")
    retry_max_attempts: int = Field(3, ge=1, le=10, description="Maximum retry attempts")
    retry_base_delay: float = Field(1.0, ge=0.1, description="Base retry delay in seconds")
    retry_max_delay: float = Field(60.0, ge=1.0, description="Maximum retry delay in seconds")
    
    # Browser settings
    browser_headless: bool = Field(True, description="Run browser in headless mode")
    browser_timeout: int = Field(30, ge=5, le=120, description="Page load timeout seconds")
    user_agent_rotation: bool = Field(True, description="Rotate user agents")
    
    # Content settings
    respect_robots_txt: bool = Field(True, description="Check robots.txt compliance")
    max_concurrent_requests: int = Field(5, ge=1, le=20, description="Concurrent request limit")
    
    @field_validator("request_delay_max")
    @classmethod
    def validate_delay_range(cls, v: float, info) -> float:
        """Ensure max delay is greater than min delay."""
        if 'request_delay_min' in info.data and v <= info.data['request_delay_min']:
            raise ValueError("request_delay_max must be greater than request_delay_min")
        return v


class DatabaseSettings(BaseModel):
    """Database connection and migration settings."""
    
    model_config = ConfigDict(frozen=True)
    
    url: str = Field(..., description="Database connection URL")
    direct_url: Optional[str] = Field(None, description="Direct database URL for writes")
    pool_size: int = Field(10, ge=1, le=50, description="Connection pool size")
    max_overflow: int = Field(20, ge=0, le=100, description="Max overflow connections")
    pool_timeout: int = Field(30, ge=5, le=300, description="Pool timeout seconds")
    echo: bool = Field(False, description="Echo SQL statements")
    
    @property
    def async_url(self) -> str:
        """Get async-compatible database URL."""
        url = self.direct_url or self.url
        parsed = urlparse(url)
        
        if parsed.scheme == "postgresql":
            # Convert to asyncpg
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif parsed.scheme.startswith("postgresql+"):
            return url
        else:
            raise ValueError(f"Unsupported database scheme: {parsed.scheme}")


class Settings(BaseSettings):
    """Main application settings loaded from environment."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="HH_",
        case_sensitive=False,
        extra="ignore"
    )
    
    # API Keys
    attom_api_key: str = Field(..., description="ATTOM API key")
    
    # Database
    database_url: str = Field(..., description="Primary database connection URL")
    direct_url: Optional[str] = Field(None, description="Direct database URL for writes")
    
    # Output
    output_dir: Path = Field(
        default=Path("output"), 
        description="Directory for JSON output files"
    )
    scraper_mode: Literal["json", "db", "both"] = Field(
        default="both", 
        description="Output mode: json files, database, or both"
    )
    
    # Regions
    regions: str = Field(
        default="los_angeles_county,houston_metro,dfw_metro,austin_metro,san_antonio_metro",
        description="Comma-separated list of target regions"
    )
    
    # Network
    http_proxy: Optional[str] = Field(None, description="HTTP proxy URL")
    user_agent_pool_size: int = Field(50, ge=10, le=200, description="User agent pool size")
    
    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="INFO",
        description="Logging level"
    )
    log_file: Optional[Path] = Field(None, description="Log file path")
    
    # Feature flags
    enable_playwright: bool = Field(True, description="Use Playwright for scraping")
    enable_attom_api: bool = Field(True, description="Use ATTOM API")
    enable_crime_data: bool = Field(True, description="Collect crime statistics")
    enable_school_data: bool = Field(True, description="Collect school information")
    
    # Portal-specific flags
    enable_zillow: bool = Field(True, description="Enable Zillow scraping")
    enable_redfin: bool = Field(True, description="Enable Redfin scraping")
    enable_homes: bool = Field(True, description="Enable Homes.com scraping")
    
    # Portal configuration
    enabled_portals: List[str] = Field(
        default_factory=lambda: [s.strip() for s in os.getenv("HH_ENABLED_PORTALS", "redfin,zillow").split(",") if s.strip()],
        description="List of enabled portal scrapers"
    )
    zillow_headless: bool = Field(
        default_factory=lambda: os.getenv("HH_ZILLOW_HEADLESS", "true").lower() == "true",
        description="Run Zillow scraper in headless mode"
    )
    
    @field_validator("output_dir")
    @classmethod
    def create_output_dir(cls, v: Path) -> Path:
        """Ensure output directory exists."""
        v.mkdir(parents=True, exist_ok=True)
        return v
    
    @field_validator("regions")
    @classmethod
    def validate_regions(cls, v: str) -> str:
        """Validate region names."""
        valid_regions = {
            "los_angeles_county",
            "houston_metro", 
            "dfw_metro",
            "austin_metro",
            "san_antonio_metro"
        }
        regions = [r.strip() for r in v.split(",") if r.strip()]
        invalid = set(regions) - valid_regions
        if invalid:
            raise ValueError(f"Invalid regions: {invalid}. Valid: {valid_regions}")
        return v
    
    @property
    def region_list(self) -> List[str]:
        """Get regions as a list."""
        return [r.strip() for r in self.regions.split(",") if r.strip()]
    
    @property
    def database_settings(self) -> DatabaseSettings:
        """Get database configuration."""
        return DatabaseSettings(
            url=self.database_url,
            direct_url=self.direct_url
        )
    
    @property
    def scraper_settings(self) -> ScraperSettings:
        """Get scraper configuration."""
        return ScraperSettings()


# Predefined region configurations
REGION_SEEDS: Dict[str, RegionSeed] = {
    "los_angeles_county": RegionSeed(
        name="Los Angeles County, CA",
        state="CA",
        county="Los Angeles County",
        cities=[
            "Los Angeles", "Long Beach", "Glendale", "Santa Clarita", "Lancaster",
            "Palmdale", "Pomona", "Torrance", "Pasadena", "El Monte", "Downey",
            "Inglewood", "West Covina", "Norwalk", "Burbank", "Compton"
        ],
        bbox=(-118.9448, 33.7037, -117.6462, 34.8233),
        zip_codes=[
            "90210", "90211", "90212", "90213", "90265", "90272", "90290", "90291",
            "90401", "90402", "90403", "90404", "90405", "91301", "91302", "91303"
        ]
    ),
    
    "houston_metro": RegionSeed(
        name="Houston Metro Area, TX",
        state="TX",
        cities=[
            "Houston", "Sugar Land", "The Woodlands", "Pasadena", "Pearland",
            "League City", "Missouri City", "Conroe", "Texas City", "Baytown",
            "Friendswood", "La Porte", "Deer Park", "Stafford", "Katy"
        ],
        bbox=(-95.8274, 29.2698, -94.6767, 30.3554),
        zip_codes=[
            "77001", "77002", "77003", "77004", "77005", "77006", "77007", "77008",
            "77019", "77025", "77027", "77030", "77056", "77057", "77063", "77079"
        ]
    ),
    
    "dfw_metro": RegionSeed(
        name="Dallas-Fort Worth Metro, TX", 
        state="TX",
        cities=[
            "Dallas", "Fort Worth", "Arlington", "Plano", "Garland", "Irving",
            "Grand Prairie", "McKinney", "Frisco", "Richardson", "Lewisville",
            "Allen", "Flower Mound", "Carrollton", "Denton", "Round Rock"
        ],
        bbox=(-97.7431, 32.5507, -96.4637, 33.2148),
        zip_codes=[
            "75201", "75202", "75203", "75204", "75205", "75206", "75207", "75208",
            "75209", "75210", "75211", "75212", "75214", "75215", "75216", "75217"
        ]
    ),
    
    "austin_metro": RegionSeed(
        name="Austin Metro Area, TX",
        state="TX",
        cities=[
            "Austin", "Round Rock", "Cedar Park", "Pflugerville", "Georgetown",
            "Leander", "Hutto", "Manor", "Lago Vista", "Bee Cave", "Lakeway",
            "West Lake Hills", "Rollingwood", "Sunset Valley", "Cedar Creek"
        ],
        bbox=(-98.2023, 30.0077, -97.3439, 30.6281),
        zip_codes=[
            "78701", "78702", "78703", "78704", "78705", "78712", "78717", "78719",
            "78721", "78722", "78723", "78724", "78725", "78726", "78727", "78728"
        ]
    ),
    
    "san_antonio_metro": RegionSeed(
        name="San Antonio Metro Area, TX",
        state="TX",
        cities=[
            "San Antonio", "New Braunfels", "Schertz", "Cibolo", "Universal City",
            "Live Oak", "Selma", "Converse", "Kirby", "Terrell Hills", "Alamo Heights",
            "Olmos Park", "Balcones Heights", "Hill Country Village", "Hollywood Park"
        ],
        bbox=(-98.8694, 29.2097, -98.1142, 29.8032),
        zip_codes=[
            "78201", "78202", "78203", "78204", "78205", "78207", "78208", "78209",
            "78210", "78211", "78212", "78213", "78214", "78215", "78216", "78217"
        ]
    )
}

# User agent pool for rotation
# Portal start URLs for discovery  
START_URLS = {
    "zillow": [
        # CA
        "https://www.zillow.com/los-angeles-ca/",
        "https://www.zillow.com/los-angeles-county-ca/",
        # TX
        "https://www.zillow.com/houston-tx/",
        "https://www.zillow.com/austin-tx/",
        "https://www.zillow.com/dallas-tx/",
        "https://www.zillow.com/fort-worth-tx/",
        "https://www.zillow.com/san-antonio-tx/",
        # User confirmed working
        "https://www.zillow.com/las-vegas-nv/"
    ],
    "redfin": [
        "https://www.redfin.com/county/321/CA/Los-Angeles-County",
        "https://www.redfin.com/city/11203/CA/Los-Angeles",
        "https://www.redfin.com/city/8903/TX/Houston",
        "https://www.redfin.com/city/30818/TX/Austin",
        "https://www.redfin.com/city/30794/TX/Dallas",
        "https://www.redfin.com/city/30827/TX/Fort-Worth",
        "https://www.redfin.com/city/16657/TX/San-Antonio"
    ]
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36", 
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
]


def get_settings() -> Settings:
    """Get application settings instance."""
    return Settings()


def get_region_seed(region_name: str) -> RegionSeed:
    """Get region configuration by name."""
    if region_name not in REGION_SEEDS:
        raise ValueError(f"Unknown region: {region_name}. Available: {list(REGION_SEEDS.keys())}")
    return REGION_SEEDS[region_name]


def get_active_regions(settings: Optional[Settings] = None) -> List[RegionSeed]:
    """Get list of active region configurations."""
    if settings is None:
        settings = get_settings()
    
    return [get_region_seed(name) for name in settings.region_list]


# Global settings instance
settings = get_settings()


__all__ = [
    "Settings",
    "RegionSeed", 
    "ScraperSettings",
    "DatabaseSettings",
    "REGION_SEEDS",
    "USER_AGENTS",
    "settings",
    "get_settings",
    "get_region_seed",
    "get_active_regions",
]
