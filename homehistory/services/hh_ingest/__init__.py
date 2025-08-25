"""
HomeHistory Real Estate Data Ingestion System

A production-ready system for ingesting real estate data from ATTOM API
and supplemental sources (Zillow, Redfin, Homes.com) with ethical scraping
practices, rate limiting, and comprehensive data validation.
"""

__version__ = "0.1.0"
__author__ = "HomeHistory Team"
__email__ = "dev@homehistory.com"

from hh_ingest.config import Settings
from hh_ingest.schema import (
    Address,
    CrimeStats,
    Hazard,
    Listing,
    ListingPhoto,
    PropertyCore,
    Report,
    SaleRecord,
    School,
    TaxFact,
)

__all__ = [
    "Settings",
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
