"""
Real estate portal collectors package.

Contains base collector class and specific implementations for
Zillow, Redfin, and Homes.com with ethical scraping practices.
"""

from hh_ingest.portals.base import BaseCollector
from hh_ingest.portals.zillow import ZillowCollector
from hh_ingest.portals.redfin import RedfinCollector  
from hh_ingest.portals.homes import HomesCollector

__all__ = [
    "BaseCollector",
    "ZillowCollector",
    "RedfinCollector", 
    "HomesCollector",
]
