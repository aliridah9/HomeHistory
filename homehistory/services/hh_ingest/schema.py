"""
Pydantic data models for real estate data ingestion.

These models define the structure for property data, listings, tax records,
sales history, crime statistics, school information, and environmental hazards.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, ConfigDict


class Address(BaseModel):
    """Standardized address representation."""
    
    model_config = ConfigDict(
        str_strip_whitespace=True,
        frozen=True,
        extra="forbid"
    )
    
    full: str = Field(..., min_length=1, max_length=500, description="Complete address string")
    street: str = Field(..., min_length=1, max_length=200, description="Street address")
    city: str = Field(..., min_length=1, max_length=100, description="City name")
    state: str = Field(..., min_length=2, max_length=2, description="2-letter state code")
    zip: str = Field(..., min_length=5, max_length=10, description="ZIP or ZIP+4 code")
    lat: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    lng: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    
    @field_validator("state")
    @classmethod
    def validate_state(cls, v: str) -> str:
        """Ensure state code is uppercase."""
        return v.upper()
    
    @field_validator("zip")
    @classmethod
    def validate_zip(cls, v: str) -> str:
        """Normalize ZIP code format."""
        # Remove any non-digits and ensure proper format
        digits_only = ''.join(filter(str.isdigit, v))
        if len(digits_only) >= 5:
            if len(digits_only) >= 9:
                return f"{digits_only[:5]}-{digits_only[5:9]}"
            return digits_only[:5]
        return v


class PropertyCore(BaseModel):
    """Core property characteristics and features."""
    
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid"
    )
    
    address: Address
    parcel_apn: Optional[str] = Field(None, max_length=50, description="Assessor's Parcel Number")
    property_type: Optional[str] = Field(None, max_length=100, description="Property type classification")
    year_built: Optional[int] = Field(None, ge=1800, le=2030, description="Year of construction")
    beds: Optional[float] = Field(None, ge=0, le=50, description="Number of bedrooms")
    baths: Optional[float] = Field(None, ge=0, le=50, description="Number of bathrooms")
    stories: Optional[float] = Field(None, ge=1, le=20, description="Number of stories")
    building_sqft: Optional[int] = Field(None, ge=0, description="Building square footage")
    lot_sqft: Optional[int] = Field(None, ge=0, description="Lot square footage")
    features: Dict[str, Any] = Field(default_factory=dict, description="Additional property features")


class TaxFact(BaseModel):
    """Tax assessment and payment information."""
    
    model_config = ConfigDict(extra="forbid")
    
    year: int = Field(..., ge=1990, le=2030, description="Tax assessment year")
    assessed_land: Optional[int] = Field(None, ge=0, description="Land assessed value in cents")
    assessed_building: Optional[int] = Field(None, ge=0, description="Building assessed value in cents")
    assessed_total: Optional[int] = Field(None, ge=0, description="Total assessed value in cents")
    tax_amount: Optional[int] = Field(None, ge=0, description="Annual tax amount in cents")


class SaleRecord(BaseModel):
    """Historical sale transaction record."""
    
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid"
    )
    
    sale_date: date = Field(..., description="Sale transaction date")
    price: Optional[int] = Field(None, ge=0, description="Sale price in cents")
    deed_type: Optional[str] = Field(None, max_length=100, description="Type of deed/transaction")
    buyer: Optional[str] = Field(None, max_length=200, description="Buyer name")
    seller: Optional[str] = Field(None, max_length=200, description="Seller name")
    loan_type: Optional[str] = Field(None, max_length=100, description="Financing type")
    lender: Optional[str] = Field(None, max_length=200, description="Lending institution")


class ListingPhoto(BaseModel):
    """Property listing photograph metadata."""
    
    model_config = ConfigDict(extra="forbid")
    
    url: str = Field(..., min_length=1, max_length=2000, description="Photo URL")
    width: Optional[int] = Field(None, ge=1, description="Image width in pixels")
    height: Optional[int] = Field(None, ge=1, description="Image height in pixels")


class Listing(BaseModel):
    """Property listing from real estate portals."""
    
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid"
    )
    
    source: Literal["zillow", "redfin", "homes"] = Field(..., description="Listing source portal")
    url: str = Field(..., min_length=1, max_length=2000, description="Listing detail URL")
    status: Optional[str] = Field(None, max_length=100, description="Listing status")
    list_price: Optional[int] = Field(None, ge=0, description="Current list price in cents")
    dom: Optional[int] = Field(None, ge=0, description="Days on market")
    beds: Optional[float] = Field(None, ge=0, le=50, description="Number of bedrooms")
    baths: Optional[float] = Field(None, ge=0, le=50, description="Number of bathrooms")
    sqft: Optional[int] = Field(None, ge=0, description="Living square footage")
    lot_sqft: Optional[int] = Field(None, ge=0, description="Lot square footage")
    year_built: Optional[int] = Field(None, ge=1800, le=2030, description="Year built")
    description: Optional[str] = Field(None, max_length=10000, description="Property description")
    price_history: List[Dict[str, Any]] = Field(default_factory=list, description="Price change history")
    agent: Optional[Dict[str, Any]] = Field(None, description="Listing agent information")
    photos: List[ListingPhoto] = Field(default_factory=list, description="Property photos")


class CrimeStats(BaseModel):
    """Local crime statistics and trends."""
    
    model_config = ConfigDict(extra="forbid")
    
    violent_per_1k: Optional[float] = Field(None, ge=0, description="Violent crimes per 1,000 residents")
    property_per_1k: Optional[float] = Field(None, ge=0, description="Property crimes per 1,000 residents")
    trend_1y: Optional[float] = Field(None, description="1-year trend percentage change")
    trend_5y: Optional[float] = Field(None, description="5-year trend percentage change")


class School(BaseModel):
    """School information and ratings."""
    
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid"
    )
    
    name: str = Field(..., min_length=1, max_length=200, description="School name")
    level: Optional[str] = Field(None, max_length=50, description="School level (elementary, middle, high)")
    grades: Optional[str] = Field(None, max_length=20, description="Grade range served")
    distance_km: Optional[float] = Field(None, ge=0, description="Distance from property in kilometers")
    ratings: Dict[str, Any] = Field(default_factory=dict, description="School ratings from various sources")


class Hazard(BaseModel):
    """Environmental and natural hazard information."""
    
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid"
    )
    
    flood_zone: Optional[str] = Field(None, max_length=10, description="FEMA flood zone designation")
    fema_panel: Optional[str] = Field(None, max_length=20, description="FEMA flood map panel ID")
    fire_score: Optional[float] = Field(None, ge=0, le=10, description="Wildfire risk score (0-10)")
    quake_mmi: Optional[float] = Field(None, ge=1, le=12, description="Earthquake MMI intensity")


class Report(BaseModel):
    """Complete property research report."""
    
    model_config = ConfigDict(extra="forbid")
    
    # Core identification
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Unique report identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Report creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    # Property data
    core: PropertyCore = Field(..., description="Core property information")
    tax: Optional[TaxFact] = Field(None, description="Latest tax assessment data")
    sales: List[SaleRecord] = Field(default_factory=list, description="Historical sales records")
    listings: List[Listing] = Field(default_factory=list, description="Current and recent listings")
    
    # Contextual data
    crime: Optional[CrimeStats] = Field(None, description="Local crime statistics")
    schools: List[School] = Field(default_factory=list, description="Nearby schools")
    hazards: Optional[Hazard] = Field(None, description="Environmental hazard assessments")
    
    # Metadata
    source_attribution: List[str] = Field(
        default_factory=list, 
        description="Data sources used in this report"
    )
    
    def update_timestamp(self) -> None:
        """Update the last modified timestamp."""
        self.updated_at = datetime.utcnow()
    
    def add_source(self, source: str) -> None:
        """Add a data source attribution."""
        if source not in self.source_attribution:
            self.source_attribution.append(source)
            self.update_timestamp()
    
    @property
    def primary_address(self) -> str:
        """Get the primary address string."""
        return self.core.address.full
    
    @property
    def coordinate_pair(self) -> tuple[float, float]:
        """Get lat/lng as a tuple."""
        return (self.core.address.lat, self.core.address.lng)


# Export all models
__all__ = [
    "Address",
    "PropertyCore", 
    "TaxFact",
    "SaleRecord",
    "ListingPhoto",
    "Listing",
    "CrimeStats",
    "School",
    "Hazard",
    "Report",
]
