"""
Tests for Pydantic schema models.

Validates data model serialization, validation, and business logic.
"""

import pytest
from datetime import date, datetime
from pydantic import ValidationError

from hh_ingest.schema import (
    Address, PropertyCore, TaxFact, SaleRecord, ListingPhoto, Listing,
    CrimeStats, School, Hazard, Report
)


class TestAddress:
    """Test Address model validation and normalization."""
    
    def test_valid_address(self):
        """Test creating a valid address."""
        address = Address(
            full="123 Main St, Houston, TX 77001",
            street="123 Main St",
            city="Houston", 
            state="tx",  # Should be normalized to uppercase
            zip="77001",
            lat=29.7604,
            lng=-95.3698
        )
        
        assert address.state == "TX"  # Should be normalized
        assert address.zip == "77001"
        assert address.lat == 29.7604
        assert address.lng == -95.3698
    
    def test_address_zip_normalization(self):
        """Test ZIP code normalization."""
        # Test ZIP+4 format
        address = Address(
            full="123 Main St, Houston, TX 77001-1234",
            street="123 Main St",
            city="Houston",
            state="TX", 
            zip="770011234",  # Should be normalized to ZIP+4
            lat=29.7604,
            lng=-95.3698
        )
        
        assert address.zip == "77001-1234"
    
    def test_invalid_coordinates(self):
        """Test invalid coordinate validation."""
        with pytest.raises(ValidationError):
            Address(
                full="123 Main St, Houston, TX 77001",
                street="123 Main St", 
                city="Houston",
                state="TX",
                zip="77001",
                lat=91.0,  # Invalid latitude > 90
                lng=-95.3698
            )
    
    def test_address_immutability(self):
        """Test that address is immutable (frozen)."""
        address = Address(
            full="123 Main St, Houston, TX 77001",
            street="123 Main St",
            city="Houston",
            state="TX",
            zip="77001", 
            lat=29.7604,
            lng=-95.3698
        )
        
        with pytest.raises(ValidationError):
            address.state = "CA"  # Should fail - frozen model


class TestPropertyCore:
    """Test PropertyCore model validation."""
    
    def test_valid_property_core(self):
        """Test creating a valid property core."""
        address = Address(
            full="123 Main St, Houston, TX 77001",
            street="123 Main St",
            city="Houston",
            state="TX",
            zip="77001",
            lat=29.7604,
            lng=-95.3698
        )
        
        property_core = PropertyCore(
            address=address,
            parcel_apn="12345678",
            property_type="Single Family Residential",
            year_built=2020,
            beds=3.0,
            baths=2.5,
            stories=2.0,
            building_sqft=2500,
            lot_sqft=8000,
            features={"pool": True, "garage": "2-car"}
        )
        
        assert property_core.beds == 3.0
        assert property_core.baths == 2.5
        assert property_core.year_built == 2020
        assert property_core.features["pool"] is True
    
    def test_property_core_validation_ranges(self):
        """Test property core field validation ranges."""
        address = Address(
            full="123 Main St, Houston, TX 77001",
            street="123 Main St",
            city="Houston",
            state="TX",
            zip="77001",
            lat=29.7604,
            lng=-95.3698
        )
        
        # Test invalid year built
        with pytest.raises(ValidationError):
            PropertyCore(
                address=address,
                year_built=1700  # Too old
            )
        
        # Test invalid beds count
        with pytest.raises(ValidationError):
            PropertyCore(
                address=address,
                beds=-1  # Negative beds
            )


class TestListing:
    """Test Listing model validation."""
    
    def test_valid_listing(self):
        """Test creating a valid listing."""
        photos = [
            ListingPhoto(url="https://example.com/photo1.jpg", width=1024, height=768),
            ListingPhoto(url="https://example.com/photo2.jpg")
        ]
        
        listing = Listing(
            source="zillow",
            url="https://www.zillow.com/homedetails/123-Main-St/12345_zpid/",
            status="For Sale",
            list_price=50000000,  # $500,000 in cents
            dom=45,
            beds=3.0,
            baths=2.5,
            sqft=2500,
            lot_sqft=8000,
            year_built=2020,
            description="Beautiful home in great location",
            price_history=[
                {"date": "2024-01-15", "price": 52000000, "event": "price_cut"}
            ],
            agent={"name": "Jane Smith", "phone": "555-1234"},
            photos=photos
        )
        
        assert listing.source == "zillow"
        assert listing.list_price == 50000000
        assert len(listing.photos) == 2
        assert listing.photos[0].width == 1024
    
    def test_listing_source_validation(self):
        """Test listing source validation."""
        with pytest.raises(ValidationError):
            Listing(
                source="invalid_source",  # Must be zillow, redfin, or homes
                url="https://example.com",
                status="For Sale"
            )


class TestReport:
    """Test complete Report model."""
    
def create_sample_address(self) -> Address:
        """Create a sample address for testing."""
        return Address(
            full="123 Main St, Houston, TX 77001",
            street="123 Main St",
            city="Houston",
            state="TX",
            zip="77001",
            lat=29.7604,
            lng=-95.3698
        )
    
    def test_report_creation_and_methods(self):
        """Test report creation and utility methods."""
        address = Address(
            full="123 Main St, Houston, TX 77001",
            street="123 Main St",
            city="Houston",
            state="TX",
            zip="77001",
            lat=29.7604,
            lng=-95.3698
        )
        
        property_core = PropertyCore(
            address=address,
            property_type="Single Family",
            year_built=2020,
            beds=3.0,
            baths=2.0,
            building_sqft=2000,
            lot_sqft=6000
        )
        
        tax_fact = TaxFact(
            year=2023,
            assessed_total=30000000,  # $300,000 in cents
            tax_amount=900000  # $9,000 in cents
        )
        
        sales = [
            SaleRecord(
                sale_date=date(2020, 6, 15),
                price=28000000,  # $280,000 in cents
                buyer="John Doe",
                seller="Jane Smith"
            )
        ]
        
        listings = [
            Listing(
                source="zillow",
                url="https://www.zillow.com/test/",
                status="For Sale",
                list_price=32000000  # $320,000 in cents
            )
        ]
        
        report = Report(
            core=property_core,
            tax=tax_fact,
            sales=sales,
            listings=listings,
            source_attribution=["ATTOM Data", "Zillow"]
        )
        
        # Test properties
        assert report.primary_address == "123 Main St, Houston, TX 77001"
        assert report.coordinate_pair == (29.7604, -95.3698)
        assert len(report.sales) == 1
        assert len(report.listings) == 1
        assert "ATTOM Data" in report.source_attribution
        
        # Test methods
        original_timestamp = report.updated_at
        report.update_timestamp()
        assert report.updated_at > original_timestamp
        
        report.add_source("Redfin")
        assert "Redfin" in report.source_attribution
        assert len(report.source_attribution) == 3


class TestDataValidation:
    """Test data validation and edge cases."""
    
    def test_price_validation(self):
        """Test price field validation (should be in cents)."""
        listing = Listing(
            source="zillow",
            url="https://example.com/listing",
            list_price=0  # Valid minimum
        )
        assert listing.list_price == 0
        
        # Test negative price validation
        with pytest.raises(ValidationError):
            Listing(
                source="zillow", 
                url="https://example.com/listing",
                list_price=-1000  # Invalid negative price
            )
    
    def test_year_built_validation(self):
        """Test year built validation ranges."""
        # Valid years
        for year in [1800, 1950, 2024, 2030]:
            listing = Listing(
                source="homes",
                url="https://example.com/listing", 
                year_built=year
            )
            assert listing.year_built == year
        
        # Invalid years
        with pytest.raises(ValidationError):
            Listing(
                source="homes",
                url="https://example.com/listing",
                year_built=1700  # Too old
            )
        
        with pytest.raises(ValidationError):
            Listing(
                source="homes", 
                url="https://example.com/listing",
                year_built=2031  # Too new
            )
    
    def test_string_length_validation(self):
        """Test string field length validation."""
        # Test maximum description length
        long_description = "x" * 10001  # Exceeds 10000 char limit
        
        with pytest.raises(ValidationError):
            Listing(
                source="redfin",
                url="https://example.com/listing",
                description=long_description
            )
    
    def test_required_field_validation(self):
        """Test required field validation."""
        # Address requires all core fields
        with pytest.raises(ValidationError):
            Address(
                street="123 Main St",
                city="Houston",
                # Missing state, zip, lat, lng, full
            )
        
        # Listing requires source and URL
        with pytest.raises(ValidationError):
            Listing(
                # Missing source
                url="https://example.com/listing"
            )


if __name__ == "__main__":
    pytest.main([__file__])
