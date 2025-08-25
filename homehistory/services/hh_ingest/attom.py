"""
ATTOM Data API client and mappers.

Provides async client for ATTOM API endpoints and mapper functions
to convert API responses into standardized Pydantic models.
"""

import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from hh_ingest.config import Settings
from hh_ingest.schema import (
    Address, CrimeStats, PropertyCore, SaleRecord, School, TaxFact
)
from hh_ingest.utils import (
    clean_numeric_text, clean_price_text, safe_get_nested, validate_coordinates
)

logger = logging.getLogger(__name__)


class ATTOMAPIError(Exception):
    """Custom exception for ATTOM API errors."""
    pass


class ATTOMClient:
    """
    Async client for ATTOM Data API.
    
    Handles authentication, rate limiting, and error handling
    for all ATTOM API endpoints used in property research.
    """
    
    BASE_URL = "https://api.gateway.attomdata.com/propertyapi/v1.0.0"
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.api_key = settings.attom_api_key
        
        # Create async HTTP client
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={
                "apikey": self.api_key,
                "Accept": "application/json",
                "User-Agent": "HomeHistory-Ingest/1.0"
            },
            timeout=30.0,
            follow_redirects=True
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
    async def _request(
        self, method: str, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make authenticated request to ATTOM API with retry logic.
        
        Args:
            method: HTTP method
            endpoint: API endpoint path
            params: Query parameters
            
        Returns:
            JSON response data
            
        Raises:
            ATTOMAPIError: On API errors
        """
        try:
            response = await self.client.request(
                method, endpoint, params=params
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Check for API-specific errors
            if "error" in data:
                raise ATTOMAPIError(f"ATTOM API error: {data['error']}")
            
            return data
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                # Rate limit exceeded
                logger.warning("ATTOM API rate limit exceeded, retrying...")
                raise ATTOMAPIError("Rate limit exceeded")
            elif e.response.status_code == 401:
                raise ATTOMAPIError("Invalid ATTOM API key")
            elif e.response.status_code >= 500:
                raise ATTOMAPIError(f"ATTOM API server error: {e.response.status_code}")
            else:
                raise ATTOMAPIError(f"ATTOM API error: {e.response.status_code}")
        
        except httpx.RequestError as e:
            raise ATTOMAPIError(f"ATTOM API request failed: {e}")
    
    async def expanded_by_address(self, address: str) -> Dict[str, Any]:
        """
        Get expanded property profile by address.
        
        Args:
            address: Full property address
            
        Returns:
            Expanded property data
        """
        params = {"address": address}
        data = await self._request("GET", "/property/expandedprofile", params)
        logger.debug(f"ATTOM expanded data for {address}: {len(data.get('property', []))} records")
        return data
    
    async def sales_by_address(self, address1: str, address2: str) -> Dict[str, Any]:
        """
        Get sales history by address components.
        
        Args:
            address1: Street address (e.g., "600 Congress Ave")
            address2: City, state, zip (e.g., "Austin, TX 78701")
            
        Returns:
            Sales history data
        """
        params = {
            "address1": address1,
            "address2": address2
        }
        
        data = await self._request("GET", "/saleshistory/detail", params)
        logger.debug(f"ATTOM sales data for {address1}, {address2}: {len(data.get('saleshistory', []))} records")
        
        return data
    
    async def basic_by_address(self, address: str) -> Dict[str, Any]:
        """
        Get basic property profile by address.
        
        Args:
            address: Full property address
            
        Returns:
            Basic property data
        """
        params = {"address": address}
        data = await self._request("GET", "/property/basicprofile", params)
        logger.debug(f"ATTOM basic data for {address}: {len(data.get('property', []))} records")
        return data
    
    async def valuation_by_address(self, address: str) -> Dict[str, Any]:
        """
        Get property valuation by address.
        
        Args:
            address: Full property address
            
        Returns:
            Valuation data
        """
        params = {
            "address": address,
            "pageSize": "10"
        }
        
        data = await self._request("GET", "/valuation", params)
        logger.debug(f"ATTOM valuation data for {address}: {len(data.get('valuation', []))} records")
        
        return data
    
    async def schools_crime_by_point(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Get schools and crime data by coordinates.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Combined schools and crime data
        """
        if not validate_coordinates(lat, lng):
            raise ValueError(f"Invalid coordinates: {lat}, {lng}")
        
        params = {
            "latitude": lat,
            "longitude": lng,
            "radius": 2.0  # 2 mile radius
        }
        
        # Get schools data
        schools_data = await self._request("GET", "/school", params)
        
        # Get crime data (may not be available for all areas)
        try:
            crime_data = await self._request("GET", "/crimedata", params)
        except ATTOMAPIError as e:
            logger.warning(f"Crime data not available for {lat}, {lng}: {e}")
            crime_data = {}
        
        logger.debug(
            f"ATTOM contextual data for {lat}, {lng}: "
            f"{len(schools_data.get('school', []))} schools, "
            f"{len(crime_data.get('crimedata', []))} crime records"
        )
        
        return {
            "schools": schools_data,
            "crime": crime_data
        }
    
    async def get_comprehensive_data(self, address: str) -> Dict[str, Any]:
        """
        Get comprehensive property data from all relevant endpoints.
        
        Args:
            address: Full property address
            
        Returns:
            Combined data from all endpoints
        """
        logger.info(f"Fetching comprehensive ATTOM data for: {address}")
        
        # Start with expanded profile to get coordinates
        expanded_data = await self.expanded_by_address(address)
        
        # Extract coordinates from expanded data if available
        coords = None
        properties = expanded_data.get("property", [])
        if properties:
            prop = properties[0]  # Take first result
            lat = safe_get_nested(prop, "location.latitude")
            lng = safe_get_nested(prop, "location.longitude")
            
            if lat is not None and lng is not None:
                try:
                    coords = (float(lat), float(lng))
                except (ValueError, TypeError):
                    pass
        
        # Get sales history
        sales_data = await self.sales_by_address(address)
        
        # Get valuation data
        valuation_data = await self.valuation_by_address(address)
        
        # Get contextual data if coordinates available
        contextual_data = {}
        if coords:
            try:
                contextual_data = await self.schools_crime_by_point(*coords)
            except Exception as e:
                logger.warning(f"Failed to get contextual data for {coords}: {e}")
        
        return {
            "expanded": expanded_data,
            "sales": sales_data,
            "valuation": valuation_data,
            "contextual": contextual_data,
            "coordinates": coords
        }


# Mapper functions to convert ATTOM API responses to our models

def map_address_from_attom(property_data: Dict[str, Any]) -> Optional[Address]:
    """
    Map ATTOM property data to Address model.
    
    Args:
        property_data: ATTOM property record
        
    Returns:
        Address model or None if insufficient data
    """
    try:
        address_info = property_data.get("address", {})
        location_info = property_data.get("location", {})
        
        # Extract address components
        street = address_info.get("line1", "")
        city = address_info.get("locality", "")
        state = address_info.get("countrySubdivision", "")
        zip_code = address_info.get("postal1", "")
        
        # Extract coordinates
        lat = location_info.get("latitude")
        lng = location_info.get("longitude")
        
        if not all([street, city, state, zip_code, lat is not None, lng is not None]):
            logger.warning("Incomplete address data from ATTOM")
            return None
        
        # Build full address
        full_address = f"{street}, {city}, {state} {zip_code}"
        
        return Address(
            full=full_address,
            street=street,
            city=city,
            state=state,
            zip=zip_code,
            lat=float(lat),
            lng=float(lng)
        )
        
    except Exception as e:
        logger.error(f"Failed to map ATTOM address data: {e}")
        return None


def map_property_core_from_attom(property_data: Dict[str, Any]) -> Optional[PropertyCore]:
    """
    Map ATTOM property data to PropertyCore model.
    
    Args:
        property_data: ATTOM property record
        
    Returns:
        PropertyCore model or None if insufficient data
    """
    try:
        address = map_address_from_attom(property_data)
        if not address:
            return None
        
        # Extract property characteristics
        building_info = property_data.get("building", {})
        lot_info = property_data.get("lot", {})
        assessment_info = property_data.get("assessment", {})
        
        # Get APN from various possible locations
        parcel_apn = (
            property_data.get("identifier", {}).get("apn") or
            assessment_info.get("apn") or
            safe_get_nested(property_data, "lot.apn")
        )
        
        # Property type
        property_type = building_info.get("propertyType") or building_info.get("propertyUseStandardized")
        
        # Physical characteristics
        year_built = clean_numeric_text(str(building_info.get("yearBuilt", "")), allow_float=False)
        beds = clean_numeric_text(str(building_info.get("rooms", {}).get("beds", "")), allow_float=True)
        baths = clean_numeric_text(str(building_info.get("rooms", {}).get("baths", "")), allow_float=True)
        stories = clean_numeric_text(str(building_info.get("stories", "")), allow_float=True)
        
        # Square footages
        building_sqft = clean_numeric_text(
            str(building_info.get("size", {}).get("livingSize", "")), 
            allow_float=False
        )
        lot_sqft = clean_numeric_text(
            str(lot_info.get("lotSizeSquareFeet", "")),
            allow_float=False
        )
        
        # Additional features
        features = {}
        
        # Building features
        if building_info.get("construction"):
            features["construction"] = building_info["construction"]
        if building_info.get("heating"):
            features["heating"] = building_info["heating"]
        if building_info.get("cooling"):
            features["cooling"] = building_info["cooling"]
        if building_info.get("interiorFeatures"):
            features["interior_features"] = building_info["interiorFeatures"]
        if building_info.get("exteriorFeatures"):
            features["exterior_features"] = building_info["exteriorFeatures"]
        
        # Lot features
        if lot_info.get("poolType"):
            features["pool"] = lot_info["poolType"]
        if lot_info.get("parkingSpaces"):
            features["parking_spaces"] = lot_info["parkingSpaces"]
        
        return PropertyCore(
            address=address,
            parcel_apn=parcel_apn,
            property_type=property_type,
            year_built=year_built,
            beds=beds,
            baths=baths,
            stories=stories,
            building_sqft=building_sqft,
            lot_sqft=lot_sqft,
            features=features
        )
        
    except Exception as e:
        logger.error(f"Failed to map ATTOM property core data: {e}")
        return None


def map_tax_fact_from_attom(property_data: Dict[str, Any]) -> Optional[TaxFact]:
    """
    Map ATTOM property data to TaxFact model.
    
    Args:
        property_data: ATTOM property record
        
    Returns:
        TaxFact model or None if insufficient data
    """
    try:
        assessment_info = property_data.get("assessment", {})
        tax_info = assessment_info.get("tax", {})
        
        # Get assessment year
        year = clean_numeric_text(str(assessment_info.get("assessmentYear", "")), allow_float=False)
        if not year:
            year = datetime.now().year - 1  # Default to last year
        
        # Get assessed values (convert to cents)
        assessed_land = clean_price_text(str(assessment_info.get("land", {}).get("assessedValue", "")))
        assessed_building = clean_price_text(str(assessment_info.get("building", {}).get("assessedValue", "")))
        assessed_total = clean_price_text(str(assessment_info.get("assessedValue", "")))
        
        # Get tax amount
        tax_amount = clean_price_text(str(tax_info.get("taxAmount", "")))
        
        # Need at least some data to create record
        if not any([assessed_land, assessed_building, assessed_total, tax_amount]):
            return None
        
        return TaxFact(
            year=int(year),
            assessed_land=assessed_land,
            assessed_building=assessed_building,
            assessed_total=assessed_total,
            tax_amount=tax_amount
        )
        
    except Exception as e:
        logger.error(f"Failed to map ATTOM tax data: {e}")
        return None


def map_sale_records_from_attom(sales_data: Dict[str, Any]) -> List[SaleRecord]:
    """
    Map ATTOM sales history to SaleRecord models.
    
    Args:
        sales_data: ATTOM sales history response
        
    Returns:
        List of SaleRecord models
    """
    records = []
    
    try:
        sales_history = sales_data.get("saleshistory", [])
        
        for sale in sales_history:
            # Parse sale date
            sale_date_str = sale.get("saleSearchDate") or sale.get("recordingDate")
            if not sale_date_str:
                continue
            
            try:
                # Handle different date formats
                if "T" in sale_date_str:
                    sale_date = datetime.fromisoformat(sale_date_str.replace("Z", "+00:00")).date()
                else:
                    sale_date = datetime.strptime(sale_date_str[:10], "%Y-%m-%d").date()
            except ValueError:
                logger.warning(f"Invalid sale date format: {sale_date_str}")
                continue
            
            # Get sale price (convert to cents)
            price = clean_price_text(str(sale.get("saleAmount", "")))
            
            record = SaleRecord(
                sale_date=sale_date,
                price=price,
                deed_type=sale.get("deedType"),
                buyer=sale.get("buyerName"),
                seller=sale.get("sellerName"),
                loan_type=safe_get_nested(sale, "loan.loanType"),
                lender=safe_get_nested(sale, "loan.lenderName")
            )
            
            records.append(record)
            
    except Exception as e:
        logger.error(f"Failed to map ATTOM sales data: {e}")
    
    return records


def map_crime_stats_from_attom(crime_data: Dict[str, Any]) -> Optional[CrimeStats]:
    """
    Map ATTOM crime data to CrimeStats model.
    
    Args:
        crime_data: ATTOM crime data response
        
    Returns:
        CrimeStats model or None if insufficient data
    """
    try:
        crime_records = crime_data.get("crimedata", [])
        if not crime_records:
            return None
        
        # ATTOM typically returns aggregate stats
        crime_info = crime_records[0]  # Take first record
        
        violent_per_1k = clean_numeric_text(
            str(crime_info.get("violentCrimePer1000", "")), 
            allow_float=True
        )
        property_per_1k = clean_numeric_text(
            str(crime_info.get("propertyCrimePer1000", "")), 
            allow_float=True
        )
        
        # Trends may not always be available
        trend_1y = clean_numeric_text(
            str(crime_info.get("crimeTrend1Year", "")), 
            allow_float=True
        )
        trend_5y = clean_numeric_text(
            str(crime_info.get("crimeTrend5Year", "")), 
            allow_float=True
        )
        
        if not any([violent_per_1k, property_per_1k]):
            return None
        
        return CrimeStats(
            violent_per_1k=violent_per_1k,
            property_per_1k=property_per_1k,
            trend_1y=trend_1y,
            trend_5y=trend_5y
        )
        
    except Exception as e:
        logger.error(f"Failed to map ATTOM crime data: {e}")
        return None


def map_schools_from_attom(schools_data: Dict[str, Any], property_coords: Optional[Tuple[float, float]] = None) -> List[School]:
    """
    Map ATTOM school data to School models.
    
    Args:
        schools_data: ATTOM school data response
        property_coords: Property coordinates for distance calculation
        
    Returns:
        List of School models
    """
    schools = []
    
    try:
        school_records = schools_data.get("school", [])
        
        for school_info in school_records:
            name = school_info.get("schoolName")
            if not name:
                continue
            
            # School level and grades
            level = school_info.get("schoolType") or school_info.get("schoolLevel")
            grades = school_info.get("gradesServed")
            
            # Calculate distance if coordinates available
            distance_km = None
            if property_coords and school_info.get("location"):
                school_lat = school_info["location"].get("latitude")
                school_lng = school_info["location"].get("longitude")
                
                if school_lat and school_lng:
                    try:
                        from hh_ingest.utils import calculate_distance_km
                        distance_km = calculate_distance_km(
                            property_coords[0], property_coords[1],
                            float(school_lat), float(school_lng)
                        )
                    except (ValueError, TypeError):
                        pass
            
            # Collect ratings from various sources
            ratings = {}
            if school_info.get("rating"):
                ratings["attom"] = school_info["rating"]
            if school_info.get("testScore"):
                ratings["test_score"] = school_info["testScore"]
            if school_info.get("parentRating"):
                ratings["parent"] = school_info["parentRating"]
            
            school = School(
                name=name,
                level=level,
                grades=grades,
                distance_km=distance_km,
                ratings=ratings
            )
            
            schools.append(school)
            
    except Exception as e:
        logger.error(f"Failed to map ATTOM school data: {e}")
    
    return schools


__all__ = [
    "ATTOMClient",
    "ATTOMAPIError",
    "map_address_from_attom",
    "map_property_core_from_attom", 
    "map_tax_fact_from_attom",
    "map_sale_records_from_attom",
    "map_crime_stats_from_attom",
    "map_schools_from_attom",
]
