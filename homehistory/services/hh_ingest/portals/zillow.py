"""
Zillow collector for property listing data.

Implements discovery and detail extraction for Zillow.com
with focus on parsing structured data and handling dynamic content.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse, parse_qs

from selectolax.parser import HTMLParser

from hh_ingest.portals.base import BaseCollector
from hh_ingest.schema import Listing, ListingPhoto
from hh_ingest.utils import (
    clean_numeric_text, clean_price_text, make_absolute_url, 
    safe_get_nested, truncate_text
)

logger = logging.getLogger(__name__)


class ZillowCollector(BaseCollector):
    """
    Zillow-specific collector implementation.
    
    Handles Zillow's search results and property detail pages,
    with special attention to __NEXT_DATA__ React hydration data.
    """
    
    def __init__(self, **kwargs):
        super().__init__("zillow.com", **kwargs)
        
        # Zillow-specific configuration - Updated URL format based on user discovery
        self.search_base_url = "https://www.zillow.com"  # Base URL, specific format per city
        self.max_pages_per_search = 10  # Limit for ethical scraping
    
    async def discover_listings(self, start_urls: List[str]) -> List[str]:
        """
        Discover Zillow listing URLs from start pages.
        
        Args:
            start_urls: List of Zillow city/area URLs to scrape
            
        Returns:
            List of unique listing detail URLs
        """
        listing_urls = set()
        
        logger.info(f"Starting Zillow discovery for {len(start_urls)} start URLs")
        
        for url in start_urls:
            try:
                # Check robots.txt compliance first
                if not await self.robots_allowed(url):
                    logger.info({"source": "zillow", "event": "policy_skip", "reason": "robots_disallowed", "url": url})
                    continue
                
                urls = await self._discover_from_page(url)
                listing_urls.update(urls)
                logger.info(f"Found {len(urls)} listings from {url}")
                
            except Exception as e:
                logger.info({"source": "zillow", "event": "policy_skip", "reason": "blocked_or_error", "url": url, "error": str(e)})
        
        result_list = list(listing_urls)
        logger.info(f"Total unique Zillow listings discovered: {len(result_list)}")
        
        return result_list
    
    async def _discover_from_page(self, url: str) -> List[str]:
        """Discover listings from a single page using Playwright."""
        listing_urls = []
        
        try:
            page = await self.context.new_page()
            
            try:
                # Navigate to page and wait for network idle
                await page.goto(url, wait_until="networkidle", timeout=30000)
                
                # Check if page loaded properly (not blocked/empty)
                title = await page.title()
                if not title or "blocked" in title.lower() or "error" in title.lower():
                    logger.info({"source": "zillow", "event": "policy_skip", "reason": "blocked_or_empty", "url": url})
                    return []
                
                # Extract listing detail links
                hrefs = await page.evaluate("""
                    Array.from(document.querySelectorAll('a[href]')).map(el => el.getAttribute('href'))
                """)
                
                # Filter and normalize URLs
                for href in hrefs or []:
                    if not href:
                        continue
                        
                    # Make absolute URL
                    if href.startswith('/'):
                        full_url = f"https://www.zillow.com{href}"
                    elif href.startswith('http'):
                        full_url = href
                    else:
                        continue
                    
                    # Check if it's a listing detail URL
                    if "/homedetails/" in full_url or "/b/" in full_url:
                        listing_urls.append(full_url)
                
            finally:
                await page.close()
                
        except Exception as e:
            logger.info({"source": "zillow", "event": "policy_skip", "reason": "page_error", "url": url, "error": str(e)})
        
        # Remove duplicates
        return list(set(listing_urls))
    
    def _extract_listing_urls_from_search(self, html: str) -> List[str]:
        """Extract listing URLs from search results HTML."""
        listing_urls = []
        
        try:
            # First try to get URLs from React data
            react_data = self.extract_react_data(html, "__NEXT_DATA__")
            if react_data:
                urls = self._extract_urls_from_react_data(react_data)
                listing_urls.extend(urls)
            
            # Fallback to DOM parsing
            if not listing_urls:
                urls = self._extract_urls_from_dom(html)
                listing_urls.extend(urls)
                
        except Exception as e:
            logger.error(f"Error extracting listing URLs: {e}")
        
        # Clean and validate URLs
        valid_urls = []
        for url in listing_urls:
            if url.startswith('/'):
                url = urljoin(self.base_url, url)
            
            # Check if it looks like a property detail URL
            if re.search(r'/homedetails/.*?/\d+_zpid', url):
                valid_urls.append(url)
        
        return list(set(valid_urls))  # Remove duplicates
    
    def _extract_urls_from_react_data(self, react_data: Dict[str, Any]) -> List[str]:
        """Extract listing URLs from Next.js data."""
        urls = []
        
        try:
            # Navigate the React data structure
            props = safe_get_nested(react_data, "props.pageProps")
            if not props:
                return urls
            
            # Look for search results
            search_results = (
                safe_get_nested(props, "searchPageState.cat1.searchResults.listResults") or
                safe_get_nested(props, "searchResults.listResults") or
                safe_get_nested(props, "cat1.searchResults.listResults")
            )
            
            if search_results:
                for result in search_results:
                    detail_url = result.get("detailUrl")
                    if detail_url:
                        urls.append(detail_url)
                        
        except Exception as e:
            logger.debug(f"Error parsing React data for URLs: {e}")
        
        return urls
    
    def _extract_urls_from_dom(self, html: str) -> List[str]:
        """Extract listing URLs using DOM parsing."""
        urls = []
        
        try:
            parser = HTMLParser(html)
            
            # Look for common Zillow listing link patterns
            link_selectors = [
                'a[data-test="property-card-link"]',
                'a[class*="PropertyCard"]',
                'a[href*="/homedetails/"]',
                '.property-card-link a',
                '.list-card-link'
            ]
            
            for selector in link_selectors:
                links = parser.css(selector)
                for link in links:
                    href = link.attrs.get("href")
                    if href and "/homedetails/" in href:
                        urls.append(href)
                        
        except Exception as e:
            logger.debug(f"Error parsing DOM for URLs: {e}")
        
        return urls
    
    async def extract_listing_detail(self, url: str) -> Optional[Listing]:
        """
        Extract detailed listing information from Zillow property page.
        
        Args:
            url: Zillow property detail URL
            
        Returns:
            Parsed Listing model or None if extraction failed
        """
        try:
            logger.debug(f"Extracting Zillow listing details from {url}")
            
            # Check robots.txt compliance first
            if not await self.robots_allowed(url):
                logger.info({"source": "zillow", "event": "policy_skip", "reason": "robots_disallowed", "url": url})
                return None
            
            page = await self.context.new_page()
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                
                # Check if page loaded properly
                title = await page.title()
                if not title or "blocked" in title.lower() or "error" in title.lower():
                    logger.info({"source": "zillow", "event": "policy_skip", "reason": "blocked_or_empty", "url": url})
                    return None
                
                # Try JSON-LD extraction first
                listing_data = await self._extract_from_jsonld_page(page)
                
                # Fallback to __NEXT_DATA__ extraction
                if not listing_data:
                    listing_data = await self._extract_from_next_data_page(page)
                
                if not listing_data:
                    logger.info({"source": "zillow", "event": "policy_skip", "reason": "no_data_found", "url": url})
                    return None
                
                # Map to Listing schema
                listing = self._map_to_listing(listing_data, url)
                return listing
                
            finally:
                await page.close()
                
        except Exception as e:
            logger.info({"source": "zillow", "event": "policy_skip", "reason": "extraction_error", "url": url, "error": str(e)})
            return None
    
    def _extract_from_nextjs_data(self, react_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract listing data from Next.js hydration data."""
        try:
            # Navigate to property data
            props = safe_get_nested(react_data, "props.pageProps")
            if not props:
                return None
            
            # Look for property data in various locations
            property_data = (
                safe_get_nested(props, "componentProps.gdpClientCache") or
                safe_get_nested(props, "gdpClientCache") or
                safe_get_nested(props, "property")
            )
            
            if not property_data:
                return None
            
            # Find the actual property record
            property_info = None
            if isinstance(property_data, dict):
                # Look for property by ZPID or other identifiers
                for key, value in property_data.items():
                    if isinstance(value, dict) and ("price" in value or "homeStatus" in value):
                        property_info = value
                        break
            
            if not property_info:
                return None
            
            # Extract key fields
            listing_data = {
                "source_data": property_info,
                "price": property_info.get("price"),
                "status": property_info.get("homeStatus"),
                "beds": property_info.get("bedrooms"),
                "baths": property_info.get("bathrooms"),
                "sqft": property_info.get("livingArea"),
                "lot_sqft": property_info.get("lotAreaValue"),
                "year_built": property_info.get("yearBuilt"),
                "description": property_info.get("description"),
                "photos": property_info.get("photos", []),
                "price_history": property_info.get("priceHistory", []),
                "agent": property_info.get("attributionInfo")
            }
            
            return listing_data
            
        except Exception as e:
            logger.debug(f"Error extracting from Next.js data: {e}")
            return None
    
    def _extract_from_jsonld(self, json_ld_objects: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Extract listing data from JSON-LD structured data."""
        try:
            for json_obj in json_ld_objects:
                # Look for Product or RealEstate schema
                obj_type = json_obj.get("@type", "")
                
                if "Product" in obj_type or "House" in obj_type or "SingleFamilyResidence" in obj_type:
                    listing_data = {
                        "source_data": json_obj,
                        "price": safe_get_nested(json_obj, "offers.price"),
                        "description": json_obj.get("description"),
                        "beds": safe_get_nested(json_obj, "numberOfRooms"),
                        "baths": safe_get_nested(json_obj, "numberOfBathroomsTotal"),
                        "sqft": safe_get_nested(json_obj, "floorSize.value"),
                        "photos": json_obj.get("photo", [])
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
                '[data-testid="price"]',
                '.ds-price .ds-value',
                '.ds-home-details-chip .ds-value',
                '[class*="price"]'
            ]
            
            for selector in price_selectors:
                element = parser.css_first(selector)
                if element and element.text():
                    listing_data["price"] = element.text().strip()
                    break
            
            # Extract basic facts
            facts_selectors = [
                '[data-testid="bed-bath-item"]',
                '.ds-bed-bath-living-area span',
                '[data-testid="sqft-item"]'
            ]
            
            facts_text = []
            for selector in facts_selectors:
                elements = parser.css(selector)
                for element in elements:
                    if element.text():
                        facts_text.append(element.text().strip())
            
            # Parse facts
            facts_combined = " ".join(facts_text)
            
            # Look for beds/baths pattern
            bed_match = re.search(r'(\d+)\s*bd', facts_combined, re.I)
            if bed_match:
                listing_data["beds"] = bed_match.group(1)
            
            bath_match = re.search(r'(\d+(?:\.\d+)?)\s*ba', facts_combined, re.I)
            if bath_match:
                listing_data["baths"] = bath_match.group(1)
            
            sqft_match = re.search(r'([\d,]+)\s*sqft', facts_combined, re.I)
            if sqft_match:
                listing_data["sqft"] = sqft_match.group(1)
            
            # Extract description
            desc_selectors = [
                '[data-testid="description-text"]',
                '.ds-home-details-description',
                '.home-summary-description'
            ]
            
            for selector in desc_selectors:
                element = parser.css_first(selector)
                if element and element.text():
                    listing_data["description"] = element.text().strip()
                    break
            
            # Extract photos
            photo_selectors = [
                '[data-testid="media-stream"] img',
                '.media-stream img',
                '.ds-media-col img'
            ]
            
            for selector in photo_selectors:
                images = parser.css(selector)
                for img in images:
                    src = img.attrs.get("src") or img.attrs.get("data-src")
                    if src and "zillow.com" in src:
                        listing_data["photos"].append({"url": src})
            
            return listing_data if any(v for v in listing_data.values() if v) else None
            
        except Exception as e:
            logger.debug(f"Error extracting from DOM: {e}")
            return None
    
    def normalize_listing(self, raw_data: Dict[str, Any]) -> Listing:
        """
        Normalize raw Zillow data to standardized Listing model.
        
        Args:
            raw_data: Raw listing data from Zillow
            
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
            for i, photo in enumerate(raw_photos):
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
                
                # Limit photos to avoid excessive data
                if len(photos) >= 20:
                    break
        
        # Process price history
        price_history = []
        raw_price_history = raw_data.get("price_history", [])
        
        if isinstance(raw_price_history, list):
            for entry in raw_price_history:
                if isinstance(entry, dict):
                    price_history.append({
                        "date": entry.get("date"),
                        "price": entry.get("price"),
                        "event": entry.get("event") or entry.get("priceChangeType"),
                        "source": "zillow"
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
                "license": raw_agent.get("agentLicenseNumber"),
                "source": "zillow"
            }
        
        # Create listing
        listing = Listing(
            source="zillow",
            url="",  # Will be set by caller
            status=raw_data.get("status"),
            list_price=list_price,
            dom=clean_numeric_text(str(raw_data.get("dom", "")), allow_float=False),
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
    
    async def _extract_from_jsonld_page(self, page) -> Optional[Dict[str, Any]]:
        """Extract listing data from JSON-LD scripts on page."""
        try:
            # Find all JSON-LD script tags
            scripts = await page.evaluate("""
                Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
                    .map(script => script.textContent)
            """)
            
            for script_content in scripts or []:
                try:
                    data = json.loads(script_content)
                    # Look for real estate listing data
                    if isinstance(data, dict) and data.get("@type") in ["House", "SingleFamilyResidence", "Residence", "RealEstateListing"]:
                        return data
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get("@type") in ["House", "SingleFamilyResidence", "Residence", "RealEstateListing"]:
                                return item
                except json.JSONDecodeError:
                    continue
                    
        except Exception as e:
            logger.debug(f"Error extracting JSON-LD: {e}")
        
        return None
    
    async def _extract_from_next_data_page(self, page) -> Optional[Dict[str, Any]]:
        """Extract listing data from __NEXT_DATA__ script on page."""
        try:
            next_data = await page.evaluate("""
                (() => {
                    const script = document.getElementById('__NEXT_DATA__');
                    return script ? JSON.parse(script.textContent) : null;
                })()
            """)
            
            if next_data:
                # Navigate to property data in Next.js structure
                return safe_get_nested(next_data, "props.pageProps.property") or \
                       safe_get_nested(next_data, "props.pageProps.listing") or \
                       safe_get_nested(next_data, "props.initialReduxState.property")
                       
        except Exception as e:
            logger.debug(f"Error extracting __NEXT_DATA__: {e}")
        
        return None
    
    def _map_to_listing(self, data: Dict[str, Any], url: str) -> Listing:
        """Map extracted data to Listing schema following specification."""
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
        
        def safe_dict(value):
            return value if isinstance(value, dict) else {}
        
        # Extract price (handle offers structure)
        list_price = None
        offers = data.get("offers", {})
        if offers:
            list_price = int_or_none(offers.get("price"))
        if not list_price:
            list_price = int_or_none(data.get("price"))
        
        # Extract photos
        photos = []
        images = data.get("image", [])
        if not isinstance(images, list):
            images = [images] if images else []
        
        for img in images:
            if isinstance(img, dict):
                photo_url = img.get("contentUrl") or img.get("url")
                if photo_url:
                    photos.append(ListingPhoto(url=photo_url))
        
        # Extract price history if available
        price_history = []
        # This would need to be extracted from the specific data structure
        
        # Extract agent info
        agent_data = data.get("seller") or data.get("agent")
        agent = safe_dict(agent_data) if agent_data else None
        
        return Listing(
            source="zillow",
            url=url,
            status=offers.get("availability") or data.get("availability"),
            list_price=list_price,
            beds=flt(data.get("numberOfRooms") or data.get("numberOfBedrooms")),
            baths=flt(data.get("numberOfBathroomsTotal")),
            sqft=int_or_none(safe_get_nested(data, "floorSize.value")),
            lot_sqft=int_or_none(safe_get_nested(data, "lotSize.value")),
            year_built=int_or_none(data.get("yearBuilt")),
            description=data.get("description"),
            price_history=price_history,
            agent=agent,
            photos=photos
        )


__all__ = [
    "ZillowCollector",
]
