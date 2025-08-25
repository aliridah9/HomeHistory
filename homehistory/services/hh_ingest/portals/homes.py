"""
Homes.com collector for property listing data.

Implements discovery and detail extraction for Homes.com
with focus on parsing JSON-LD structured data and DOM content.
"""

import logging
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse, quote

from selectolax.parser import HTMLParser

from hh_ingest.portals.base import BaseCollector
from hh_ingest.schema import Listing, ListingPhoto
from hh_ingest.utils import (
    clean_numeric_text, clean_price_text, make_absolute_url,
    safe_get_nested, truncate_text
)

logger = logging.getLogger(__name__)


class HomesCollector(BaseCollector):
    """
    Homes.com-specific collector implementation.
    
    Handles Homes.com search results and property detail pages,
    with focus on JSON-LD structured data and clean DOM parsing.
    """
    
    def __init__(self, **kwargs):
        super().__init__("homes.com", **kwargs)
        
        # Homes.com-specific configuration
        self.search_base_url = "https://www.homes.com"
        self.max_pages_per_search = 15  # Homes.com can have more pages
    
    async def discover_listings(self, region_config: Dict[str, Any]) -> List[str]:
        """
        Discover Homes.com listing URLs for a region.
        
        Args:
            region_config: Region configuration with cities and ZIP codes
            
        Returns:
            List of unique listing detail URLs
        """
        listing_urls = set()
        
        logger.info(f"Starting Homes.com discovery for region: {region_config.get('name')}")
        
        # Search by cities
        for city in region_config.get("cities", []):
            state = region_config.get("state", "")
            
            try:
                urls = await self._discover_by_city_state(city, state)
                listing_urls.update(urls)
                logger.info(f"Found {len(urls)} listings for {city}, {state}")
                
            except Exception as e:
                logger.error(f"Failed to discover listings for {city}, {state}: {e}")
        
        # Search by ZIP codes as additional coverage
        for zip_code in region_config.get("zip_codes", [])[:5]:  # Limit ZIP searches
            try:
                urls = await self._discover_by_zip(zip_code)
                listing_urls.update(urls)
                logger.info(f"Found {len(urls)} listings for ZIP {zip_code}")
                
            except Exception as e:
                logger.error(f"Failed to discover listings for ZIP {zip_code}: {e}")
        
        result_list = list(listing_urls)
        logger.info(f"Total unique Homes.com listings discovered: {len(result_list)}")
        
        return result_list
    
    async def _discover_by_city_state(self, city: str, state: str) -> List[str]:
        """Discover listings for a specific city and state."""
        listing_urls = []
        
        # Build Homes.com search URL format
        city_encoded = quote(city.replace(' ', '+'))
        state_encoded = quote(state)
        search_url = f"{self.search_base_url}/for-sale/{city_encoded}-{state_encoded}/"
        
        for page_num in range(1, self.max_pages_per_search + 1):
            try:
                if page_num > 1:
                    page_search_url = f"{search_url}pg-{page_num}/"
                else:
                    page_search_url = search_url
                
                html = await self.fetch(page_search_url)
                page_urls = self._extract_listing_urls_from_search(html)
                
                if not page_urls:
                    logger.debug(f"No more listings on page {page_num} for {city}, {state}")
                    break
                
                listing_urls.extend(page_urls)
                logger.debug(f"Found {len(page_urls)} listings on page {page_num} for {city}, {state}")
                
            except Exception as e:
                logger.warning(f"Failed to fetch page {page_num} for {city}, {state}: {e}")
                break
        
        return listing_urls
    
    async def _discover_by_zip(self, zip_code: str) -> List[str]:
        """Discover listings for a specific ZIP code."""
        listing_urls = []
        
        search_url = f"{self.search_base_url}/for-sale/{zip_code}/"
        
        try:
            html = await self.fetch(search_url)
            listing_urls = self._extract_listing_urls_from_search(html)
            
        except Exception as e:
            logger.warning(f"Failed to search ZIP {zip_code}: {e}")
        
        return listing_urls
    
    def _extract_listing_urls_from_search(self, html: str) -> List[str]:
        """Extract listing URLs from search results HTML."""
        listing_urls = []
        
        try:
            # Try DOM parsing - Homes.com typically has cleaner HTML structure
            urls = self._extract_urls_from_dom(html)
            listing_urls.extend(urls)
            
            # Also try structured data if available
            json_ld_objects = self.extract_jsonld(html)
            if json_ld_objects:
                structured_urls = self._extract_urls_from_jsonld(json_ld_objects)
                listing_urls.extend(structured_urls)
                
        except Exception as e:
            logger.error(f"Error extracting Homes.com listing URLs: {e}")
        
        # Clean and validate URLs
        valid_urls = []
        for url in listing_urls:
            if url.startswith('/'):
                url = urljoin(self.base_url, url)
            
            # Check if it looks like a Homes.com property detail URL
            if re.search(r'/property/.*?/\d+', url) or "/for-sale/" in url and url.count('/') >= 5:
                valid_urls.append(url)
        
        return list(set(valid_urls))  # Remove duplicates
    
    def _extract_urls_from_jsonld(self, json_ld_objects: List[Dict[str, Any]]) -> List[str]:
        """Extract listing URLs from JSON-LD structured data."""
        urls = []
        
        try:
            for json_obj in json_ld_objects:
                # Look for ItemList or listings collection
                if json_obj.get("@type") == "ItemList":
                    items = json_obj.get("itemListElement", [])
                    for item in items:
                        url = item.get("url")
                        if url:
                            urls.append(url)
                
                # Also check for individual properties
                elif "RealEstate" in str(json_obj.get("@type", "")):
                    url = json_obj.get("url")
                    if url:
                        urls.append(url)
                        
        except Exception as e:
            logger.debug(f"Error parsing JSON-LD for URLs: {e}")
        
        return urls
    
    def _extract_urls_from_dom(self, html: str) -> List[str]:
        """Extract listing URLs using DOM parsing."""
        urls = []
        
        try:
            parser = HTMLParser(html)
            
            # Look for common Homes.com listing link patterns
            link_selectors = [
                '.property-card a[href*="/property/"]',
                '.listing-card a[href*="/for-sale/"]',
                'a[data-testid="property-card-link"]',
                '.search-result-item a',
                '.property-listing a'
            ]
            
            for selector in link_selectors:
                links = parser.css(selector)
                for link in links:
                    href = link.attrs.get("href")
                    if href and ("/property/" in href or "/for-sale/" in href):
                        urls.append(href)
            
            # Also look for any links that contain property-specific patterns
            all_links = parser.css('a[href]')
            for link in all_links:
                href = link.attrs.get("href", "")
                if re.search(r'/property/[\w-]+/\d+', href):
                    urls.append(href)
                        
        except Exception as e:
            logger.debug(f"Error parsing DOM for URLs: {e}")
        
        return urls
    
    async def extract_listing_detail(self, url: str) -> Optional[Listing]:
        """
        Extract detailed listing information from Homes.com property page.
        
        Args:
            url: Homes.com property detail URL
            
        Returns:
            Parsed Listing model or None if extraction failed
        """
        try:
            logger.debug(f"Extracting Homes.com listing details from {url}")
            
            html = await self.fetch(url)
            
            # Try multiple extraction strategies
            listing_data = None
            
            # Strategy 1: JSON-LD structured data (Homes.com often has good structured data)
            json_ld_objects = self.extract_jsonld(html)
            if json_ld_objects:
                listing_data = self._extract_from_jsonld(json_ld_objects)
            
            # Strategy 2: DOM parsing
            if not listing_data:
                listing_data = self._extract_from_dom(html)
            
            # Strategy 3: Try React/JavaScript data
            if not listing_data:
                react_data = self.extract_react_data(html)
                if react_data:
                    listing_data = self._extract_from_react_data(react_data)
            
            if listing_data:
                listing = self.normalize_listing(listing_data)
                listing.url = url  # Ensure URL is set correctly
                return listing
            else:
                logger.warning(f"Failed to extract any data from {url}")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting Homes.com listing from {url}: {e}")
            return None
    
    def _extract_from_jsonld(self, json_ld_objects: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Extract listing data from JSON-LD structured data."""
        try:
            for json_obj in json_ld_objects:
                obj_type = json_obj.get("@type", "")
                
                # Look for real estate property types
                if any(t in str(obj_type) for t in ["House", "SingleFamilyResidence", "Apartment", "Residence"]):
                    
                    listing_data = {
                        "source_data": json_obj,
                        "price": safe_get_nested(json_obj, "offers.price") or json_obj.get("price"),
                        "description": json_obj.get("description"),
                        "beds": (
                            json_obj.get("numberOfRooms") or 
                            json_obj.get("bedrooms") or
                            safe_get_nested(json_obj, "bed.numberOfRooms")
                        ),
                        "baths": (
                            json_obj.get("numberOfBathroomsTotal") or
                            json_obj.get("bathrooms") or
                            safe_get_nested(json_obj, "bathroom.numberOfRooms")
                        ),
                        "sqft": (
                            safe_get_nested(json_obj, "floorSize.value") or
                            json_obj.get("livingArea") or
                            json_obj.get("floorSize")
                        ),
                        "year_built": json_obj.get("yearBuilt"),
                        "photos": json_obj.get("photo", []) or json_obj.get("image", []),
                        "address": json_obj.get("address")
                    }
                    
                    return listing_data
                    
        except Exception as e:
            logger.debug(f"Error extracting from JSON-LD: {e}")
        
        return None
    
    def _extract_from_react_data(self, react_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract listing data from React/JavaScript data."""
        try:
            # Look for property data in common locations
            property_data = (
                safe_get_nested(react_data, "property") or
                safe_get_nested(react_data, "listing") or
                safe_get_nested(react_data, "home")
            )
            
            if not property_data:
                return None
            
            listing_data = {
                "source_data": property_data,
                "price": property_data.get("price") or property_data.get("listPrice"),
                "status": property_data.get("status") or property_data.get("listingStatus"),
                "beds": property_data.get("bedrooms") or property_data.get("beds"),
                "baths": property_data.get("bathrooms") or property_data.get("baths"),
                "sqft": property_data.get("squareFeet") or property_data.get("livingArea"),
                "lot_sqft": property_data.get("lotSize") or property_data.get("lotSizeSquareFeet"),
                "year_built": property_data.get("yearBuilt"),
                "description": property_data.get("description") or property_data.get("remarks"),
                "photos": property_data.get("photos", []),
                "dom": property_data.get("daysOnMarket")
            }
            
            return listing_data
            
        except Exception as e:
            logger.debug(f"Error extracting from React data: {e}")
            return None
    
    def _extract_from_dom(self, html: str) -> Optional[Dict[str, Any]]:
        """Extract listing data using DOM parsing."""
        try:
            parser = HTMLParser(html)
            
            listing_data = {
                "source_data": {"extraction_method": "dom"},
                "photos": []
            }
            
            # Extract price
            price_selectors = [
                '.price',
                '.listing-price',
                '[data-testid="property-price"]',
                '.property-price',
                '.price-display'
            ]
            
            for selector in price_selectors:
                element = parser.css_first(selector)
                if element and element.text():
                    price_text = element.text().strip()
                    if '$' in price_text:
                        listing_data["price"] = price_text
                        break
            
            # Extract property details
            detail_selectors = [
                '.property-details .detail-item',
                '.listing-details .detail',
                '.property-facts .fact',
                '.home-details .detail-row'
            ]
            
            details = {}
            for selector in detail_selectors:
                elements = parser.css(selector)
                for element in elements:
                    text = element.text().strip().lower()
                    
                    # Extract beds
                    bed_match = re.search(r'(\d+)\s*bed', text)
                    if bed_match:
                        details['beds'] = bed_match.group(1)
                    
                    # Extract baths
                    bath_match = re.search(r'(\d+(?:\.\d+)?)\s*bath', text)
                    if bath_match:
                        details['baths'] = bath_match.group(1)
                    
                    # Extract sqft
                    sqft_match = re.search(r'([\d,]+)\s*sq\s*ft', text)
                    if sqft_match:
                        details['sqft'] = sqft_match.group(1)
                    
                    # Extract year built
                    year_match = re.search(r'built\s*:?\s*(\d{4})', text) or re.search(r'(\d{4})\s*built', text)
                    if year_match:
                        details['year_built'] = year_match.group(1)
            
            listing_data.update(details)
            
            # Extract description
            desc_selectors = [
                '.property-description',
                '.listing-description', 
                '.description-text',
                '[data-testid="property-description"]',
                '.remarks'
            ]
            
            for selector in desc_selectors:
                element = parser.css_first(selector)
                if element and element.text():
                    listing_data["description"] = element.text().strip()
                    break
            
            # Extract status
            status_selectors = [
                '.listing-status',
                '.property-status',
                '.status-badge',
                '[data-testid="listing-status"]'
            ]
            
            for selector in status_selectors:
                element = parser.css_first(selector)
                if element and element.text():
                    listing_data["status"] = element.text().strip()
                    break
            
            # Extract photos
            photo_selectors = [
                '.property-photos img',
                '.photo-gallery img',
                '.listing-images img',
                '.image-carousel img'
            ]
            
            for selector in photo_selectors:
                images = parser.css(selector)
                for img in images:
                    src = img.attrs.get("src") or img.attrs.get("data-src")
                    if src:
                        # Skip small thumbnails or icons
                        if not any(skip in src.lower() for skip in ["icon", "logo", "thumb", "small"]):
                            listing_data["photos"].append({"url": src})
            
            return listing_data if any(v for k, v in listing_data.items() if k not in ["photos", "source_data"] and v) else None
            
        except Exception as e:
            logger.debug(f"Error extracting from DOM: {e}")
            return None
    
    def normalize_listing(self, raw_data: Dict[str, Any]) -> Listing:
        """
        Normalize raw Homes.com data to standardized Listing model.
        
        Args:
            raw_data: Raw listing data from Homes.com
            
        Returns:
            Normalized Listing model
        """
        # Extract price and convert to cents
        price_text = str(raw_data.get("price", ""))
        list_price = clean_price_text(price_text)
        
        # Extract numeric fields
        beds = clean_numeric_text(str(raw_data.get("beds", "")), allow_float=True)
        baths = clean_numeric_text(str(raw_data.get("baths", "")), allow_float=True)
        sqft = clean_numeric_text(str(raw_data.get("sqft", "")), allow_float=False)
        lot_sqft = clean_numeric_text(str(raw_data.get("lot_sqft", "")), allow_float=False)
        year_built = clean_numeric_text(str(raw_data.get("year_built", "")), allow_float=False)
        dom = clean_numeric_text(str(raw_data.get("dom", "")), allow_float=False)
        
        # Handle description
        description = raw_data.get("description", "")
        if isinstance(description, str):
            description = truncate_text(description, max_length=5000)
        else:
            description = None
        
        # Process photos
        photos = []
        raw_photos = raw_data.get("photos", [])
        
        if isinstance(raw_photos, list):
            for photo in raw_photos:
                if isinstance(photo, dict):
                    photo_url = photo.get("url") or photo.get("src") or photo.get("contentUrl")
                    if photo_url:
                        photos.append(ListingPhoto(
                            url=make_absolute_url(photo_url, self.base_url),
                            width=clean_numeric_text(str(photo.get("width", "")), allow_float=False),
                            height=clean_numeric_text(str(photo.get("height", "")), allow_float=False)
                        ))
                elif isinstance(photo, str):
                    photos.append(ListingPhoto(url=make_absolute_url(photo, self.base_url)))
                
                # Limit photos
                if len(photos) >= 25:
                    break
        
        # Process price history (if available)
        price_history = []
        raw_price_history = raw_data.get("price_history", [])
        
        if isinstance(raw_price_history, list):
            for entry in raw_price_history:
                if isinstance(entry, dict):
                    price_history.append({
                        "date": entry.get("date"),
                        "price": entry.get("price"),
                        "event": entry.get("event") or "price_change",
                        "source": "homes"
                    })
        
        # Process agent information (if available)
        agent_info = None
        raw_agent = raw_data.get("agent")
        
        if isinstance(raw_agent, dict):
            agent_info = {
                "name": raw_agent.get("name"),
                "phone": raw_agent.get("phone") or raw_agent.get("telephone"),
                "email": raw_agent.get("email"),
                "office": raw_agent.get("company") or raw_agent.get("affiliation"),
                "source": "homes"
            }
        
        # Create listing
        listing = Listing(
            source="homes",
            url="",  # Will be set by caller
            status=raw_data.get("status"),
            list_price=list_price,
            dom=dom,
            beds=beds,
            baths=baths,
            sqft=sqft,
            lot_sqft=lot_sqft,
            year_built=year_built,
            description=description,
            price_history=price_history,
            agent=agent_info,
            photos=photos
        )
        
        return listing


__all__ = [
    "HomesCollector",
]
