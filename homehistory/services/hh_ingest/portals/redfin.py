"""
Redfin collector for property listing data.

Implements discovery and detail extraction for Redfin.com
with focus on parsing Redux state data and API endpoints.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

from selectolax.parser import HTMLParser

from hh_ingest.portals.base import BaseCollector
from hh_ingest.schema import Listing, ListingPhoto
from hh_ingest.utils import (
    clean_numeric_text, clean_price_text, make_absolute_url,
    safe_get_nested, truncate_text
)

logger = logging.getLogger(__name__)


class RedfinCollector(BaseCollector):
    """
    Redfin-specific collector implementation.
    
    Handles Redfin's search results and property detail pages,
    with focus on Redux state data and structured information.
    """
    
    def __init__(self, **kwargs):
        super().__init__("redfin.com", **kwargs)
        
        # Redfin-specific configuration
        self.search_base_url = "https://www.redfin.com/city"
        self.max_pages_per_search = 8  # Redfin typically has fewer pages
    
    async def discover_listings(self, start_urls: List[str]) -> List[str]:
        """
        Discover Redfin listing URLs from start pages.
        
        Args:
            start_urls: List of Redfin city/county URLs to scrape
            
        Returns:
            List of unique listing detail URLs
        """
        listing_urls = set()
        
        logger.info(f"Starting Redfin discovery for {len(start_urls)} start URLs")
        
        for url in start_urls:
            try:
                # Check robots.txt compliance first
                if not await self.robots_allowed(url):
                    logger.info({"source": "redfin", "event": "policy_skip", "reason": "robots_disallowed", "url": url})
                    continue
                
                urls = await self._discover_from_page(url)
                listing_urls.update(urls)
                logger.info(f"Found {len(urls)} listings from {url}")
                
            except Exception as e:
                logger.info({"source": "redfin", "event": "policy_skip", "reason": "blocked_or_error", "url": url, "error": str(e)})
        
        result_list = list(listing_urls)
        logger.info(f"Total unique Redfin listings discovered: {len(result_list)}")
        
        return result_list
    
    async def _discover_from_page(self, url: str) -> List[str]:
        """Discover listings from a city/county page."""
        listing_urls = []
        
        try:
            # Request the city/county page
            html = await self.fetch(url)
            
            # Extract listing links using selectolax
            parser = HTMLParser(html)
            
            # Look for common Redfin listing link patterns
            link_selectors = [
                'a[href*="/home/"]',
                'a[href*="/property/"]',
                'a.HomeCardContainer',
                '.HomeCard a',
                '[data-rf-test-id="property-card"] a'
            ]
            
            for selector in link_selectors:
                links = parser.css(selector)
                for link in links:
                    href = link.attrs.get("href")
                    if href:
                        # Make absolute URL
                        if href.startswith('/'):
                            full_url = f"https://www.redfin.com{href}"
                        elif href.startswith('http'):
                            full_url = href
                        else:
                            continue
                        
                        # Check if it looks like a property detail URL
                        if "/home/" in full_url or "/property/" in full_url:
                            listing_urls.append(full_url)
            
        except Exception as e:
            logger.debug(f"Error discovering from {url}: {e}")
        
        # Remove duplicates
        return list(set(listing_urls))
    
    async def _discover_by_city_state_old(self, city: str, state: str) -> List[str]:
        """Discover listings for a specific city and state."""
        listing_urls = []
        
        # Build Redfin city URL format - try multiple patterns
        city_slug = city.lower().replace(' ', '-').replace(',', '')
        state_upper = state.upper()
        
        # Try multiple Redfin URL formats
        possible_urls = [
            f"https://www.redfin.com/{state_upper}/{city}",  # Format: /TX/Houston
            f"https://www.redfin.com/{state_upper}/{city.replace(' ', '-')}",  # Format: /TX/Sugar-Land
            f"https://www.redfin.com/city/{city_slug}-{state.lower()}",  # Original format
        ]
        
        # Try each URL format until one works
        working_url = None
        for test_url in possible_urls:
            try:
                # Test first page to see if this URL format works
                html = await self.fetch(test_url)
                test_urls = self._extract_listing_urls_from_search(html)
                if test_urls:  # If we got listings, this URL format works
                    working_url = test_url
                    listing_urls.extend(test_urls)
                    logger.debug(f"Found working URL format: {test_url}")
                    break
            except Exception as e:
                logger.debug(f"URL format failed {test_url}: {e}")
                continue
        
        if not working_url:
            logger.warning(f"No working URL format found for {city}, {state}")
            return listing_urls
        
        # Now search additional pages with the working URL format
        for page_num in range(2, self.max_pages_per_search + 1):
            try:
                page_search_url = f"{working_url}?page={page_num}"
                
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
        
        search_url = f"https://www.redfin.com/zipcode/{zip_code}"
        
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
            # First try to get URLs from Redux state data
            redux_data = self.extract_react_data(html)
            if redux_data:
                urls = self._extract_urls_from_redux_data(redux_data)
                listing_urls.extend(urls)
            
            # Fallback to DOM parsing
            if not listing_urls:
                urls = self._extract_urls_from_dom(html)
                listing_urls.extend(urls)
                
        except Exception as e:
            logger.error(f"Error extracting Redfin listing URLs: {e}")
        
        # Clean and validate URLs
        valid_urls = []
        for url in listing_urls:
            if url.startswith('/'):
                url = urljoin(self.base_url, url)
            
            # Check if it looks like a Redfin property detail URL
            if re.search(r'/home/\d+', url):
                valid_urls.append(url)
        
        return list(set(valid_urls))  # Remove duplicates
    
    def _extract_urls_from_redux_data(self, redux_data: Dict[str, Any]) -> List[str]:
        """Extract listing URLs from Redux state data."""
        urls = []
        
        try:
            # Look for homes data in Redux state
            homes_data = (
                safe_get_nested(redux_data, "searchResults.homes") or
                safe_get_nested(redux_data, "homes") or
                safe_get_nested(redux_data, "page.searchResults.homes")
            )
            
            if homes_data and isinstance(homes_data, list):
                for home in homes_data:
                    if isinstance(home, dict):
                        url = home.get("url")
                        if url:
                            urls.append(url)
            
            # Also check for different data structure
            market_data = safe_get_nested(redux_data, "page.market.homes")
            if market_data and isinstance(market_data, list):
                for home in market_data:
                    if isinstance(home, dict):
                        url = home.get("url")
                        if url:
                            urls.append(url)
                            
        except Exception as e:
            logger.debug(f"Error parsing Redux data for URLs: {e}")
        
        return urls
    
    def _extract_urls_from_dom(self, html: str) -> List[str]:
        """Extract listing URLs using DOM parsing."""
        urls = []
        
        try:
            parser = HTMLParser(html)
            
            # Look for common Redfin listing link patterns
            link_selectors = [
                'a[data-rf-test-name="property-card-link"]',
                'a.HomeCardContainer',
                'a[href*="/home/"]',
                '.HomeCard a',
                '[data-rf-test-id="property-card"] a'
            ]
            
            for selector in link_selectors:
                links = parser.css(selector)
                for link in links:
                    href = link.attrs.get("href")
                    if href and "/home/" in href:
                        urls.append(href)
                        
        except Exception as e:
            logger.debug(f"Error parsing DOM for URLs: {e}")
        
        return urls
    
    async def extract_listing_detail(self, url: str) -> Optional[Listing]:
        """
        Extract detailed listing information from Redfin property page.
        
        Args:
            url: Redfin property detail URL
            
        Returns:
            Parsed Listing model or None if extraction failed
        """
        try:
            logger.debug(f"Extracting Redfin listing details from {url}")
            
            # Check robots.txt compliance first
            if not await self.robots_allowed(url):
                logger.info({"source": "redfin", "event": "policy_skip", "reason": "robots_disallowed", "url": url})
                return None
            
            html = await self.fetch(url)
            
            # Try __REDUX_STATE__ extraction first (most reliable for Redfin)
            listing_data = self._extract_from_redux_state(html)
            
            # Fallback to JSON-LD
            if not listing_data:
                json_ld_objects = self.extract_jsonld(html)
                listing_data = self._extract_from_jsonld(json_ld_objects)
            
            if not listing_data:
                logger.info({"source": "redfin", "event": "policy_skip", "reason": "no_data_found", "url": url})
                return None
            
            # Map to Listing schema
            listing = self._map_to_listing(listing_data, url)
            return listing
                
        except Exception as e:
            logger.info({"source": "redfin", "event": "policy_skip", "reason": "extraction_error", "url": url, "error": str(e)})
            return None
    
    def _extract_from_redux_data(self, redux_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract listing data from Redux state data."""
        try:
            # Look for property data in various Redux state locations
            property_data = (
                safe_get_nested(redux_data, "page.property") or
                safe_get_nested(redux_data, "propertyDetails") or
                safe_get_nested(redux_data, "home")
            )
            
            if not property_data:
                return None
            
            # Extract key fields from Redfin's data structure
            listing_data = {
                "source_data": property_data,
                "price": property_data.get("price") or property_data.get("listPrice"),
                "status": property_data.get("homeStatus") or property_data.get("propertyStatus"),
                "beds": property_data.get("beds") or property_data.get("bedrooms"),
                "baths": property_data.get("baths") or property_data.get("bathrooms"),
                "sqft": property_data.get("sqft") or property_data.get("squareFeet"),
                "lot_sqft": property_data.get("lotSize"),
                "year_built": property_data.get("yearBuilt"),
                "description": property_data.get("description") or property_data.get("remarks"),
                "photos": property_data.get("photos", []),
                "price_history": property_data.get("priceHistory", []),
                "dom": property_data.get("daysOnMarket"),
                "agent": property_data.get("listingAgent") or property_data.get("agent")
            }
            
            return listing_data
            
        except Exception as e:
            logger.debug(f"Error extracting from Redux data: {e}")
            return None
    
    def _extract_from_jsonld(self, json_ld_objects: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Extract listing data from JSON-LD structured data."""
        try:
            for json_obj in json_ld_objects:
                # Look for RealEstate or Product schema
                obj_type = json_obj.get("@type", "")
                
                if any(t in obj_type for t in ["House", "SingleFamilyResidence", "Apartment", "Product"]):
                    
                    listing_data = {
                        "source_data": json_obj,
                        "price": safe_get_nested(json_obj, "offers.price") or json_obj.get("price"),
                        "description": json_obj.get("description"),
                        "beds": safe_get_nested(json_obj, "numberOfRooms") or json_obj.get("bedrooms"),
                        "baths": safe_get_nested(json_obj, "numberOfBathroomsTotal") or json_obj.get("bathrooms"),
                        "sqft": safe_get_nested(json_obj, "floorSize.value") or json_obj.get("livingArea"),
                        "photos": json_obj.get("photo", []),
                        "year_built": json_obj.get("yearBuilt")
                    }
                    
                    return listing_data
                    
        except Exception as e:
            logger.debug(f"Error extracting from JSON-LD: {e}")
        
        return None
    
    def _extract_from_dom(self, html: str) -> Optional[Dict[str, Any]]:
        """Extract listing data using DOM parsing as fallback."""
        try:
            parser = HTMLParser(html)
            
            listing_data = {
                "source_data": {"extraction_method": "dom"},
                "photos": []
            }
            
            # Extract price
            price_selectors = [
                '[data-rf-test-id="abp-price"]',
                '.price-section .price',
                '.statsValue',
                '[class*="price"]'
            ]
            
            for selector in price_selectors:
                element = parser.css_first(selector)
                if element and element.text():
                    listing_data["price"] = element.text().strip()
                    break
            
            # Extract basic facts (beds, baths, sqft)
            facts_selectors = [
                '.HomeStats .stat-block',
                '[data-rf-test-id="property-stats"] .stat-block',
                '.home-summary-stats .stat-block'
            ]
            
            facts = {}
            for selector in facts_selectors:
                elements = parser.css(selector)
                for element in elements:
                    label_el = element.css_first('.stat-label')
                    value_el = element.css_first('.stat-value')
                    
                    if label_el and value_el:
                        label = label_el.text().strip().lower()
                        value = value_el.text().strip()
                        
                        if 'bed' in label:
                            facts['beds'] = value
                        elif 'bath' in label:
                            facts['baths'] = value
                        elif 'sq ft' in label or 'sqft' in label:
                            facts['sqft'] = value
                        elif 'lot' in label:
                            facts['lot_sqft'] = value
                        elif 'built' in label or 'year' in label:
                            facts['year_built'] = value
            
            listing_data.update(facts)
            
            # Extract description
            desc_selectors = [
                '[data-rf-test-id="property-description"]',
                '.remarks-section',
                '.home-description'
            ]
            
            for selector in desc_selectors:
                element = parser.css_first(selector)
                if element and element.text():
                    listing_data["description"] = element.text().strip()
                    break
            
            # Extract status
            status_selectors = [
                '.home-status',
                '.property-status',
                '[data-rf-test-id="property-status"]'
            ]
            
            for selector in status_selectors:
                element = parser.css_first(selector)
                if element and element.text():
                    listing_data["status"] = element.text().strip()
                    break
            
            # Extract photos
            photo_selectors = [
                '.MediaCarousel img',
                '.photo-carousel img',
                '.home-photos img'
            ]
            
            for selector in photo_selectors:
                images = parser.css(selector)
                for img in images:
                    src = img.attrs.get("src") or img.attrs.get("data-src")
                    if src and ("redfin.com" in src or src.startswith("/")):
                        listing_data["photos"].append({"url": src})
            
            return listing_data if any(v for k, v in listing_data.items() if k != "photos" and v) else None
            
        except Exception as e:
            logger.debug(f"Error extracting from DOM: {e}")
            return None
    
    def normalize_listing(self, raw_data: Dict[str, Any]) -> Listing:
        """
        Normalize raw Redfin data to standardized Listing model.
        
        Args:
            raw_data: Raw listing data from Redfin
            
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
                    photo_url = photo.get("url") or photo.get("src")
                    if photo_url:
                        photos.append(ListingPhoto(
                            url=make_absolute_url(photo_url, self.base_url),
                            width=clean_numeric_text(str(photo.get("width", "")), allow_float=False),
                            height=clean_numeric_text(str(photo.get("height", "")), allow_float=False)
                        ))
                elif isinstance(photo, str):
                    photos.append(ListingPhoto(url=make_absolute_url(photo, self.base_url)))
                
                # Limit photos
                if len(photos) >= 20:
                    break
        
        # Process price history
        price_history = []
        raw_price_history = raw_data.get("price_history", [])
        
        if isinstance(raw_price_history, list):
            for entry in raw_price_history:
                if isinstance(entry, dict):
                    price_history.append({
                        "date": entry.get("date") or entry.get("timestamp"),
                        "price": entry.get("price"),
                        "event": entry.get("event") or entry.get("eventDescription"),
                        "source": "redfin"
                    })
        
        # Process agent information
        agent_info = None
        raw_agent = raw_data.get("agent")
        
        if isinstance(raw_agent, dict):
            agent_info = {
                "name": raw_agent.get("name") or raw_agent.get("agentName"),
                "phone": raw_agent.get("phone") or raw_agent.get("phoneNumber"),
                "email": raw_agent.get("email"),
                "office": raw_agent.get("brokerName") or raw_agent.get("officeName"),
                "license": raw_agent.get("licenseNumber"),
                "source": "redfin"
            }
        
        # Create listing
        listing = Listing(
            source="redfin",
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
    
    def _extract_from_redux_state(self, html: str) -> Optional[Dict[str, Any]]:
        """Extract listing data from window.__REDUX_STATE__ embedded script."""
        try:
            # Use regex to find __REDUX_STATE__ pattern
            redux_pattern = r'window\.__REDUX_STATE__\s*=\s*({.*?});'
            match = re.search(redux_pattern, html, re.DOTALL)
            
            if match:
                redux_json = match.group(1)
                redux_data = json.loads(redux_json)
                
                # Navigate to property data in Redux state structure
                # Redfin typically stores property data under various paths
                property_data = (
                    safe_get_nested(redux_data, "page.property") or
                    safe_get_nested(redux_data, "propertyDetails") or
                    safe_get_nested(redux_data, "home") or
                    safe_get_nested(redux_data, "listing")
                )
                
                return property_data
                
        except (json.JSONDecodeError, AttributeError) as e:
            logger.debug(f"Error parsing Redux state: {e}")
        
        return None
    
    def _map_to_listing(self, data: Dict[str, Any], url: str) -> Listing:
        """Map Redfin data to Listing schema."""
        def int_or_none(value):
            if value is None:
                return None
            try:
                return int(float(str(value)))
            except (ValueError, TypeError):
                return None
        
        def flt(value):
            if value is None:
                return None
            try:
                return float(str(value))
            except (ValueError, TypeError):
                return None
        
        # Extract basic property info
        beds = flt(data.get("beds") or data.get("bedrooms") or data.get("numBeds"))
        baths = flt(data.get("baths") or data.get("bathrooms") or data.get("numBaths"))
        sqft = int_or_none(data.get("sqft") or data.get("squareFeet") or data.get("livingArea"))
        price = int_or_none(data.get("price") or data.get("listPrice"))
        
        # Extract photos
        photos = []
        raw_photos = data.get("photos", []) or data.get("images", [])
        for photo in raw_photos[:20]:  # Limit to 20 photos
            if isinstance(photo, dict):
                photo_url = photo.get("url") or photo.get("src")
                if photo_url:
                    photos.append(ListingPhoto(url=photo_url))
            elif isinstance(photo, str):
                photos.append(ListingPhoto(url=photo))
        
        # Extract description
        description = data.get("description") or data.get("remarks") or data.get("publicRemarks")
        
        return Listing(
            source="redfin",
            url=url,
            status=data.get("status") or data.get("homeStatus"),
            list_price=price,
            beds=beds,
            baths=baths,
            sqft=sqft,
            lot_sqft=int_or_none(data.get("lotSize")),
            year_built=int_or_none(data.get("yearBuilt")),
            description=description,
            price_history=[],  # Could be extracted if present in Redux data
            agent=data.get("agent") or data.get("listingAgent"),
            photos=photos
        )


__all__ = [
    "RedfinCollector",
]
