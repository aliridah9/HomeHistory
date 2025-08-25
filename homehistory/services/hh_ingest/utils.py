"""
Utility functions for real estate data ingestion.

Provides common functionality for address normalization, data hashing,
logging setup, and other shared operations across the ingestion system.
"""

import hashlib
import logging
import re
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse

import user_agents
from rich.console import Console
from rich.logging import RichHandler

from hh_ingest.config import Settings, USER_AGENTS
from hh_ingest.schema import Address

# Global console for rich output
console = Console()

# Address normalization patterns
DIRECTION_ABBREV = {
    "north": "N", "south": "S", "east": "E", "west": "W",
    "northeast": "NE", "northwest": "NW", "southeast": "SE", "southwest": "SW",
}

STREET_TYPE_ABBREV = {
    "avenue": "Ave", "boulevard": "Blvd", "circle": "Cir", "court": "Ct",
    "drive": "Dr", "expressway": "Expy", "freeway": "Fwy", "highway": "Hwy",
    "lane": "Ln", "parkway": "Pkwy", "place": "Pl", "road": "Rd",
    "street": "St", "terrace": "Ter", "trail": "Trl", "way": "Way",
}

UNIT_PATTERNS = [
    r'\b(apt|apartment|unit|ste|suite|#)\s*([a-z0-9]+)\b',
    r'\b(building|bldg)\s+([a-z0-9]+)\b',
    r'\b(floor|fl)\s+([0-9]+)\b',
]


def normalize_address(address: str) -> str:
    """
    Normalize address string for consistent matching.
    
    Args:
        address: Raw address string
        
    Returns:
        Normalized address string
    """
    if not address or not isinstance(address, str):
        return ""
    
    # Convert to lowercase and strip
    addr = address.lower().strip()
    
    # Remove extra whitespace
    addr = re.sub(r'\s+', ' ', addr)
    
    # Normalize directions
    for direction, abbrev in DIRECTION_ABBREV.items():
        # Word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(direction) + r'\b'
        addr = re.sub(pattern, abbrev.lower(), addr)
    
    # Normalize street types
    for street_type, abbrev in STREET_TYPE_ABBREV.items():
        pattern = r'\b' + re.escape(street_type) + r'\b'
        addr = re.sub(pattern, abbrev.lower(), addr)
    
    # Normalize unit designations
    for pattern in UNIT_PATTERNS:
        addr = re.sub(pattern, r'\1 \2', addr)
    
    # Remove periods and commas
    addr = re.sub(r'[.,]', '', addr)
    
    # Standardize number formats
    addr = re.sub(r'(\d+)\s*-\s*(\d+)', r'\1-\2', addr)  # "123 - 456" -> "123-456"
    
    # Clean up final spacing
    addr = re.sub(r'\s+', ' ', addr).strip()
    
    return addr


def extract_zip_code(text: str) -> Optional[str]:
    """
    Extract ZIP code from text string.
    
    Args:
        text: Text that may contain ZIP code
        
    Returns:
        ZIP code if found, None otherwise
    """
    if not text:
        return None
    
    # Look for ZIP or ZIP+4 patterns
    zip_pattern = r'\b(\d{5}(?:-\d{4})?)\b'
    match = re.search(zip_pattern, text)
    
    return match.group(1) if match else None


def generate_property_hash(address: Address) -> str:
    """
    Generate consistent hash for property identification.
    
    Args:
        address: Property address
        
    Returns:
        Hex hash string
    """
    # Normalize address for hashing
    normalized = normalize_address(address.full)
    
    # Include coordinates for uniqueness
    hash_input = f"{normalized}|{address.lat:.6f}|{address.lng:.6f}"
    
    return hashlib.sha256(hash_input.encode()).hexdigest()[:16]


def extract_coordinates_from_url(url: str) -> Optional[Tuple[float, float]]:
    """
    Extract latitude and longitude from URL parameters or path.
    
    Args:
        url: URL that may contain coordinates
        
    Returns:
        (lat, lng) tuple if found, None otherwise
    """
    if not url:
        return None
    
    # Common coordinate patterns in URLs
    patterns = [
        r'[@/](-?\d+\.?\d*),(-?\d+\.?\d*)',  # @lat,lng or /lat,lng
        r'lat=(-?\d+\.?\d*)&lng=(-?\d+\.?\d*)',  # lat=...&lng=...
        r'latitude=(-?\d+\.?\d*)&longitude=(-?\d+\.?\d*)',  # Full names
        r'll=(-?\d+\.?\d*),(-?\d+\.?\d*)',  # ll=lat,lng (Google Maps)
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            try:
                lat, lng = float(match.group(1)), float(match.group(2))
                # Basic sanity check for coordinates
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    return (lat, lng)
            except (ValueError, IndexError):
                continue
    
    return None


def clean_price_text(price_text: str) -> Optional[int]:
    """
    Clean and convert price text to integer cents.
    
    Args:
        price_text: Raw price string like "$1,250,000" or "1.25M"
        
    Returns:
        Price in cents, None if invalid
    """
    if not price_text or not isinstance(price_text, str):
        return None
    
    # Remove common formatting
    clean = re.sub(r'[,$]', '', price_text.strip().lower())
    
    # Handle shorthand notations
    multipliers = {'k': 1000, 'm': 1000000, 'b': 1000000000}
    
    for suffix, multiplier in multipliers.items():
        if clean.endswith(suffix):
            try:
                base_value = float(clean[:-1])
                return int(base_value * multiplier * 100)  # Convert to cents
            except ValueError:
                continue
    
    # Try direct numeric conversion
    try:
        # Remove any remaining non-digit characters except decimal point
        numeric = re.sub(r'[^\d.]', '', clean)
        if numeric:
            return int(float(numeric) * 100)  # Convert to cents
    except ValueError:
        pass
    
    return None


def clean_numeric_text(text: str, allow_float: bool = False) -> Optional[float]:
    """
    Extract numeric value from text.
    
    Args:
        text: Text containing numeric value
        allow_float: Whether to return float or int
        
    Returns:
        Numeric value or None if invalid
    """
    if not text or not isinstance(text, str):
        return None
    
    # Remove common formatting
    clean = re.sub(r'[,\s]', '', text.strip())
    
    # Extract first numeric pattern
    if allow_float:
        pattern = r'(\d+\.?\d*)'
    else:
        pattern = r'(\d+)'
    
    match = re.search(pattern, clean)
    if match:
        try:
            value = float(match.group(1))
            return value if allow_float else int(value)
        except ValueError:
            pass
    
    return None


def truncate_text(text: str, max_length: int = 1000, suffix: str = "...") -> str:
    """
    Truncate text to maximum length with suffix.
    
    Args:
        text: Text to truncate
        max_length: Maximum allowed length
        suffix: Suffix to add when truncated
        
    Returns:
        Truncated text
    """
    if not text or len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def is_valid_url(url: str) -> bool:
    """
    Check if URL is valid and has proper scheme.
    
    Args:
        url: URL to validate
        
    Returns:
        True if valid URL
    """
    if not url or not isinstance(url, str):
        return False
    
    try:
        parsed = urlparse(url.strip())
        return bool(parsed.scheme and parsed.netloc)
    except Exception:
        return False


def make_absolute_url(url: str, base_url: str) -> str:
    """
    Convert relative URL to absolute using base URL.
    
    Args:
        url: Possibly relative URL
        base_url: Base URL for resolution
        
    Returns:
        Absolute URL
    """
    if not url:
        return ""
    
    if is_valid_url(url):
        return url
    
    try:
        return urljoin(base_url, url)
    except Exception:
        return url


def get_random_user_agent() -> str:
    """
    Get a random user agent from the pool.
    
    Returns:
        User agent string
    """
    import random
    return random.choice(USER_AGENTS)


def parse_user_agent(ua_string: str) -> Dict[str, Any]:
    """
    Parse user agent string into components.
    
    Args:
        ua_string: User agent string
        
    Returns:
        Dictionary with parsed components
    """
    try:
        ua = user_agents.parse(ua_string)
        return {
            "browser": ua.browser.family,
            "browser_version": ua.browser.version_string,
            "os": ua.os.family, 
            "os_version": ua.os.version_string,
            "device": ua.device.family,
            "is_mobile": ua.is_mobile,
            "is_tablet": ua.is_tablet,
            "is_bot": ua.is_bot,
        }
    except Exception:
        return {"raw": ua_string}


def setup_logging(settings: Settings) -> logging.Logger:
    """
    Set up application logging with rich formatting.
    
    Args:
        settings: Application settings
        
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger("hh_ingest")
    logger.setLevel(getattr(logging, settings.log_level))
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Console handler with Rich formatting
    console_handler = RichHandler(
        console=console,
        rich_tracebacks=True,
        show_path=False,
        show_time=True,
    )
    console_handler.setLevel(getattr(logging, settings.log_level))
    
    # Format for console
    console_format = "%(message)s"
    console_handler.setFormatter(logging.Formatter(console_format))
    logger.addHandler(console_handler)
    
    # File handler if specified
    if settings.log_file and str(settings.log_file) != ".":
        settings.log_file.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(settings.log_file)
        file_handler.setLevel(getattr(logging, settings.log_level))
        
        # More detailed format for file
        file_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        file_handler.setFormatter(logging.Formatter(file_format))
        logger.addHandler(file_handler)
    
    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("playwright").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    
    return logger


def validate_coordinates(lat: float, lng: float) -> bool:
    """
    Validate latitude and longitude values.
    
    Args:
        lat: Latitude
        lng: Longitude
        
    Returns:
        True if coordinates are valid
    """
    try:
        return -90 <= float(lat) <= 90 and -180 <= float(lng) <= 180
    except (ValueError, TypeError):
        return False


def calculate_distance_km(
    lat1: float, lng1: float, lat2: float, lng2: float
) -> float:
    """
    Calculate great circle distance between two points in kilometers.
    
    Args:
        lat1, lng1: First point coordinates
        lat2, lng2: Second point coordinates
        
    Returns:
        Distance in kilometers
    """
    import math
    
    # Convert to radians
    lat1_r, lng1_r = math.radians(lat1), math.radians(lng1)
    lat2_r, lng2_r = math.radians(lat2), math.radians(lng2)
    
    # Haversine formula
    dlat = lat2_r - lat1_r
    dlng = lng2_r - lng1_r
    
    a = (
        math.sin(dlat / 2) ** 2 +
        math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    
    # Earth radius in kilometers
    return 6371 * c


def safe_get_nested(data: Dict[str, Any], path: str, default: Any = None) -> Any:
    """
    Safely get nested dictionary value using dot notation.
    
    Args:
        data: Dictionary to traverse
        path: Dot-separated path like "address.street.name"
        default: Default value if path not found
        
    Returns:
        Value at path or default
    """
    try:
        keys = path.split('.')
        result = data
        
        for key in keys:
            if isinstance(result, dict) and key in result:
                result = result[key]
            elif isinstance(result, list) and key.isdigit():
                idx = int(key)
                if 0 <= idx < len(result):
                    result = result[idx]
                else:
                    return default
            else:
                return default
        
        return result
    except (KeyError, TypeError, ValueError):
        return default


__all__ = [
    "console",
    "normalize_address",
    "extract_zip_code",
    "generate_property_hash",
    "extract_coordinates_from_url",
    "clean_price_text",
    "clean_numeric_text",
    "truncate_text",
    "is_valid_url",
    "make_absolute_url",
    "get_random_user_agent",
    "parse_user_agent",
    "setup_logging",
    "validate_coordinates",
    "calculate_distance_km",
    "safe_get_nested",
]
