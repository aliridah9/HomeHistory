"""
Socrata API collector for municipal open data.

Provides foundation for collecting building permits, code violations,
and other municipal data from Socrata-powered open data portals.
"""

import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class SocrataCollector:
    """
    Base collector for Socrata open data portals.
    
    This is a scaffold for future integration with city open data APIs
    for permits, violations, and other municipal property records.
    """
    
    def __init__(self, base_url: str, app_token: Optional[str] = None):
        """
        Initialize Socrata collector.
        
        Args:
            base_url: Base URL of the Socrata portal (e.g., "data.cityofhouston.org")
            app_token: Optional Socrata app token for higher rate limits
        """
        self.base_url = base_url.rstrip("/")
        self.app_token = app_token
        
        # HTTP client setup
        headers = {
            "User-Agent": "HomeHistory-Ingest/1.0",
            "Accept": "application/json"
        }
        
        if app_token:
            headers["X-App-Token"] = app_token
        
        self.client = httpx.AsyncClient(
            base_url=f"https://{self.base_url}",
            headers=headers,
            timeout=30.0
        )
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
    
    async def close(self) -> None:
        """Close HTTP client."""
        await self.client.aclose()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    async def query_dataset(
        self, 
        dataset_id: str, 
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Query a Socrata dataset with optional filters.
        
        Args:
            dataset_id: Socrata dataset identifier (4x4 format like "abcd-1234")
            filters: Optional query filters using SoQL syntax
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            List of records from the dataset
        """
        try:
            # Build query parameters
            params = {
                "$limit": limit,
                "$offset": offset,
                "$order": ":updated_at DESC"
            }
            
            # Add filters if provided
            if filters:
                for key, value in filters.items():
                    if key.startswith("$"):
                        # SoQL system parameter
                        params[key] = value
                    else:
                        # Regular field filter
                        params[key] = value
            
            # Make request
            response = await self.client.get(f"/resource/{dataset_id}.json", params=params)
            response.raise_for_status()
            
            data = response.json()
            logger.debug(f"Retrieved {len(data)} records from {dataset_id}")
            
            return data
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Socrata API error for {dataset_id}: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Failed to query Socrata dataset {dataset_id}: {e}")
            raise
    
    async def search_by_address(
        self,
        dataset_id: str,
        address: str,
        address_field: str = "address"
    ) -> List[Dict[str, Any]]:
        """
        Search dataset records by address.
        
        Args:
            dataset_id: Socrata dataset identifier
            address: Address to search for
            address_field: Name of the address field in the dataset
            
        Returns:
            List of matching records
        """
        # Use SoQL text search
        filters = {
            "$q": address,  # Full-text search
            f"{address_field}": {"$like": f"%{address}%"}  # Address field search
        }
        
        return await self.query_dataset(dataset_id, filters)
    
    async def search_by_coordinates(
        self,
        dataset_id: str,
        lat: float,
        lng: float,
        radius_meters: float = 500,
        location_field: str = "location"
    ) -> List[Dict[str, Any]]:
        """
        Search dataset records by geographic coordinates.
        
        Args:
            dataset_id: Socrata dataset identifier
            lat: Latitude
            lng: Longitude
            radius_meters: Search radius in meters
            location_field: Name of the location field in the dataset
            
        Returns:
            List of matching records within radius
        """
        # Use SoQL geographic search
        filters = {
            "$where": f"within_circle({location_field}, {lat}, {lng}, {radius_meters})"
        }
        
        return await self.query_dataset(dataset_id, filters)


# City-specific configurations
CITY_CONFIGS = {
    "houston": {
        "base_url": "data.houstontx.gov",
        "datasets": {
            "building_permits": "4k4z-y8vz",
            "code_violations": "qqqq-yyyy",  # Example IDs - would need actual ones
            "construction_projects": "xxxx-zzzz"
        }
    },
    "austin": {
        "base_url": "data.austintexas.gov", 
        "datasets": {
            "building_permits": "3syk-w9eu",
            "code_violations": "dddd-eeee",
            "demolition_permits": "ffff-gggg"
        }
    },
    "dallas": {
        "base_url": "www.dallasopendata.com",
        "datasets": {
            "building_permits": "hhhh-iiii",
            "code_enforcement": "jjjj-kkkk"
        }
    },
    "san_antonio": {
        "base_url": "data.sanantonio.gov",
        "datasets": {
            "building_permits": "llll-mmmm",
            "code_violations": "nnnn-oooo"
        }
    }
}


async def get_permits_for_address(
    city: str, 
    address: str, 
    app_token: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get building permits for an address from city open data.
    
    Args:
        city: City identifier (houston, austin, dallas, san_antonio)
        address: Property address
        app_token: Optional Socrata app token
        
    Returns:
        List of permit records
        
    Example:
        permits = await get_permits_for_address("houston", "123 Main St")
    """
    if city not in CITY_CONFIGS:
        raise ValueError(f"Unsupported city: {city}. Available: {list(CITY_CONFIGS.keys())}")
    
    config = CITY_CONFIGS[city]
    permits_dataset = config["datasets"].get("building_permits")
    
    if not permits_dataset:
        logger.warning(f"No building permits dataset configured for {city}")
        return []
    
    async with SocrataCollector(config["base_url"], app_token) as collector:
        return await collector.search_by_address(permits_dataset, address)


__all__ = [
    "SocrataCollector",
    "CITY_CONFIGS",
    "get_permits_for_address",
]
