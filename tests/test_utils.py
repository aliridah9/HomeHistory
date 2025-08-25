"""
Tests for utility functions.

Tests address normalization, price parsing, URL validation, and other utilities.
"""

import pytest
from hh_ingest.schema import Address
from hh_ingest.utils import (
    normalize_address, extract_zip_code, generate_property_hash,
    extract_coordinates_from_url, clean_price_text, clean_numeric_text,
    truncate_text, is_valid_url, make_absolute_url,
    validate_coordinates, calculate_distance_km, safe_get_nested
)


class TestAddressNormalization:
    """Test address normalization functions."""
    
    def test_normalize_address_basic(self):
        """Test basic address normalization."""
        # Test direction abbreviations
        result = normalize_address("123 North Main Street")
        assert "n main st" in result.lower()
        
        # Test street type abbreviations  
        result = normalize_address("456 Oak Avenue")
        assert "oak ave" in result.lower()
        
        # Test multiple normalizations
        result = normalize_address("789 South Park Boulevard, Unit 123")
        expected_parts = ["s", "park", "blvd", "unit", "123"]
        for part in expected_parts:
            assert part in result.lower()
    
    def test_normalize_address_whitespace(self):
        """Test whitespace normalization."""
        result = normalize_address("  123   Main    St  ")
        assert result == "123 main st"
        
        result = normalize_address("456\tOak\nAve")
        assert result == "456 oak ave"
    
    def test_normalize_address_empty(self):
        """Test empty/invalid input handling."""
        assert normalize_address("") == ""
        assert normalize_address(None) == ""
        assert normalize_address(123) == ""  # Non-string input
    
    def test_extract_zip_code(self):
        """Test ZIP code extraction."""
        # Standard ZIP
        assert extract_zip_code("Houston, TX 77001") == "77001"
        
        # ZIP+4 format
        assert extract_zip_code("123 Main St, Houston, TX 77001-1234") == "77001-1234"
        
        # No ZIP code
        assert extract_zip_code("Just some random text") is None
        assert extract_zip_code("") is None
        assert extract_zip_code(None) is None


class TestPropertyHashing:
    """Test property hashing functions."""
    
    def test_generate_property_hash(self):
        """Test property hash generation."""
        address1 = Address(
            full="123 Main St, Houston, TX 77001",
            street="123 Main St",
            city="Houston",
            state="TX",
            zip="77001",
            lat=29.7604,
            lng=-95.3698
        )
        
        address2 = Address(
            full="123 Main St, Houston, TX 77001",  # Same address
            street="123 Main St",
            city="Houston", 
            state="TX",
            zip="77001",
            lat=29.7604,
            lng=-95.3698
        )
        
        address3 = Address(
            full="456 Oak Ave, Houston, TX 77002",  # Different address
            street="456 Oak Ave",
            city="Houston",
            state="TX",
            zip="77002",
            lat=29.7500,
            lng=-95.3600
        )
        
        hash1 = generate_property_hash(address1)
        hash2 = generate_property_hash(address2)
        hash3 = generate_property_hash(address3)
        
        # Same address should generate same hash
        assert hash1 == hash2
        
        # Different addresses should generate different hashes
        assert hash1 != hash3
        
        # Hash should be reasonable length
        assert len(hash1) == 16  # Truncated to 16 chars
        assert isinstance(hash1, str)


class TestCoordinateExtraction:
    """Test coordinate extraction from URLs."""
    
    def test_extract_coordinates_from_url(self):
        """Test coordinate extraction from various URL formats."""
        # Google Maps style
        url1 = "https://maps.google.com/@29.7604,-95.3698,17z"
        coords1 = extract_coordinates_from_url(url1)
        assert coords1 == (29.7604, -95.3698)
        
        # Parameter style
        url2 = "https://example.com/map?lat=30.2672&lng=-97.7431"
        coords2 = extract_coordinates_from_url(url2)
        assert coords2 == (30.2672, -97.7431)
        
        # Full parameter names
        url3 = "https://example.com/search?latitude=32.7767&longitude=-96.7970"
        coords3 = extract_coordinates_from_url(url3)
        assert coords3 == (32.7767, -96.7970)
        
        # ll parameter (Google Maps)
        url4 = "https://maps.google.com/?ll=29.4241,-98.4936"
        coords4 = extract_coordinates_from_url(url4)
        assert coords4 == (29.4241, -98.4936)
        
        # No coordinates
        url5 = "https://example.com/page"
        coords5 = extract_coordinates_from_url(url5)
        assert coords5 is None
        
        # Invalid coordinates (out of range)
        url6 = "https://example.com/@200.0,-300.0"
        coords6 = extract_coordinates_from_url(url6)
        assert coords6 is None


class TestPriceParsing:
    """Test price and numeric parsing functions."""
    
    def test_clean_price_text(self):
        """Test price text cleaning and conversion to cents."""
        # Standard formats
        assert clean_price_text("$500,000") == 50000000  # $500k in cents
        assert clean_price_text("$1,250,000") == 125000000  # $1.25M in cents
        assert clean_price_text("750000") == 75000000  # No formatting
        
        # Shorthand notations
        assert clean_price_text("$1.5M") == 150000000  # $1.5M in cents
        assert clean_price_text("750K") == 75000000  # $750k in cents
        assert clean_price_text("$2.25m") == 225000000  # Case insensitive
        
        # Edge cases
        assert clean_price_text("") is None
        assert clean_price_text(None) is None
        assert clean_price_text("invalid text") is None
        assert clean_price_text(123) is None  # Non-string
    
    def test_clean_numeric_text(self):
        """Test numeric text extraction."""
        # Integer extraction
        assert clean_numeric_text("3 bedrooms") == 3
        assert clean_numeric_text("2,500 sqft") == 2500
        assert clean_numeric_text("Year: 2020") == 2020
        
        # Float extraction
        assert clean_numeric_text("2.5 baths", allow_float=True) == 2.5
        assert clean_numeric_text("3.0", allow_float=True) == 3.0
        
        # Force integer
        assert clean_numeric_text("2.5 baths", allow_float=False) == 2
        
        # Invalid input
        assert clean_numeric_text("") is None
        assert clean_numeric_text("no numbers here") is None
        assert clean_numeric_text(None) is None


class TestTextProcessing:
    """Test text processing utilities."""
    
    def test_truncate_text(self):
        """Test text truncation."""
        # Normal truncation
        long_text = "This is a very long piece of text that needs to be truncated"
        result = truncate_text(long_text, max_length=20)
        assert len(result) == 20
        assert result.endswith("...")
        
        # Text shorter than limit
        short_text = "Short text"
        result = truncate_text(short_text, max_length=20)
        assert result == short_text  # No truncation needed
        
        # Custom suffix
        result = truncate_text(long_text, max_length=20, suffix=" [more]")
        assert result.endswith(" [more]")
        assert len(result) == 20
        
        # Empty text
        assert truncate_text("", max_length=10) == ""
        assert truncate_text(None, max_length=10) is None


class TestURLValidation:
    """Test URL validation and manipulation."""
    
    def test_is_valid_url(self):
        """Test URL validation."""
        # Valid URLs
        assert is_valid_url("https://www.example.com") is True
        assert is_valid_url("http://example.com/path") is True
        assert is_valid_url("https://example.com/path?param=value") is True
        
        # Invalid URLs
        assert is_valid_url("not a url") is False
        assert is_valid_url("ftp://example.com") is True  # FTP is valid
        assert is_valid_url("") is False
        assert is_valid_url(None) is False
        assert is_valid_url(123) is False  # Non-string
    
    def test_make_absolute_url(self):
        """Test relative URL to absolute conversion."""
        base_url = "https://example.com"
        
        # Relative URLs
        assert make_absolute_url("/path", base_url) == "https://example.com/path"
        assert make_absolute_url("page.html", base_url) == "https://example.com/page.html"
        
        # Already absolute URLs
        absolute_url = "https://other.com/page"
        assert make_absolute_url(absolute_url, base_url) == absolute_url
        
        # Empty/invalid input
        assert make_absolute_url("", base_url) == ""
        assert make_absolute_url(None, base_url) == ""


class TestGeographicFunctions:
    """Test geographic calculation functions."""
    
    def test_validate_coordinates(self):
        """Test coordinate validation."""
        # Valid coordinates
        assert validate_coordinates(29.7604, -95.3698) is True
        assert validate_coordinates(0, 0) is True  # Equator/Prime Meridian
        assert validate_coordinates(90, 180) is True  # Extremes
        assert validate_coordinates(-90, -180) is True  # Other extremes
        
        # Invalid coordinates
        assert validate_coordinates(91, 0) is False  # Lat too high
        assert validate_coordinates(-91, 0) is False  # Lat too low
        assert validate_coordinates(0, 181) is False  # Lng too high
        assert validate_coordinates(0, -181) is False  # Lng too low
        
        # Invalid types
        assert validate_coordinates("invalid", 0) is False
        assert validate_coordinates(None, 0) is False
    
    def test_calculate_distance_km(self):
        """Test distance calculation between coordinates."""
        # Houston to Dallas (approximately 362 km)
        houston_lat, houston_lng = 29.7604, -95.3698
        dallas_lat, dallas_lng = 32.7767, -96.7970
        
        distance = calculate_distance_km(houston_lat, houston_lng, dallas_lat, dallas_lng)
        assert isinstance(distance, float)
        assert 350 < distance < 380  # Approximate range
        
        # Same point should have zero distance
        distance_same = calculate_distance_km(houston_lat, houston_lng, houston_lat, houston_lng)
        assert distance_same < 0.001  # Essentially zero (accounting for float precision)


class TestDataAccessors:
    """Test safe data access utilities."""
    
    def test_safe_get_nested(self):
        """Test safe nested dictionary access."""
        data = {
            "level1": {
                "level2": {
                    "value": "found"
                },
                "list": [
                    {"item": "first"},
                    {"item": "second"}
                ]
            }
        }
        
        # Valid paths
        assert safe_get_nested(data, "level1.level2.value") == "found"
        assert safe_get_nested(data, "level1.list.0.item") == "first"
        assert safe_get_nested(data, "level1.list.1.item") == "second"
        
        # Invalid paths
        assert safe_get_nested(data, "nonexistent.path") is None
        assert safe_get_nested(data, "level1.level2.nonexistent") is None
        assert safe_get_nested(data, "level1.list.10.item") is None  # Out of range
        
        # Custom default
        assert safe_get_nested(data, "nonexistent", default="default_value") == "default_value"
        
        # Edge cases
        assert safe_get_nested({}, "any.path") is None
        assert safe_get_nested(None, "any.path") is None
        assert safe_get_nested(data, "") is None


if __name__ == "__main__":
    pytest.main([__file__])
