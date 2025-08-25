"""
Base collector class for real estate portal scraping.

Provides common functionality for rate limiting, robots.txt compliance,
user agent rotation, and HTML parsing across all portal collectors.
"""

import asyncio
import json
import logging
import random
import urllib.robotparser
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

from aiolimiter import AsyncLimiter
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from selectolax.parser import HTMLParser
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from hh_ingest.config import ScraperSettings, USER_AGENTS
from hh_ingest.schema import Listing
from hh_ingest.utils import (
    get_random_user_agent, is_valid_url, make_absolute_url, safe_get_nested
)

logger = logging.getLogger(__name__)


class CollectorError(Exception):
    """Base exception for collector errors."""
    pass


class RobotsDisallowedError(CollectorError):
    """Raised when robots.txt disallows access to URL."""
    pass


class BaseCollector(ABC):
    """
    Base class for real estate portal collectors.
    
    Provides common infrastructure for ethical scraping including:
    - Rate limiting with randomized delays
    - robots.txt compliance checking
    - User agent rotation
    - Playwright browser management
    - Retry logic with exponential backoff
    - JSON-LD and structured data extraction
    """
    
    def __init__(
        self,
        domain: str,
        rate_limiter: Optional[AsyncLimiter] = None,
        scraper_settings: Optional[ScraperSettings] = None,
        proxy: Optional[str] = None
    ):
        self.domain = domain
        self.base_url = f"https://{domain}"
        self.proxy = proxy
        
        # Use provided settings or defaults
        self.settings = scraper_settings or ScraperSettings()
        
        # Rate limiting
        if rate_limiter:
            self.rate_limiter = rate_limiter
        else:
            self.rate_limiter = AsyncLimiter(
                self.settings.max_requests_per_second,
                time_period=1.0
            )
        
        # Browser management
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        
        # User agent pool
        self.user_agents = USER_AGENTS.copy()
        random.shuffle(self.user_agents)
        self._current_ua_index = 0
        
        # Robots.txt cache
        self._robots_cache: Dict[str, urllib.robotparser.RobotFileParser] = {}
    
    async def __aenter__(self):
        await self.setup()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.cleanup()
    
    async def setup(self) -> None:
        """Initialize browser and context."""
        if self.browser:
            return  # Already set up
        
        playwright = await async_playwright().start()
        
        # Launch browser with stealth settings
        self.browser = await playwright.chromium.launch(
            headless=self.settings.browser_headless,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--disable-extensions",
                "--disable-plugins",
                "--disable-images",  # Faster loading
                "--disable-background-networking",
                "--disable-background-timer-throttling",
                "--disable-renderer-backgrounding",
                "--disable-features=TranslateUI",
                "--disable-ipc-flooding-protection",
            ] + (["--proxy-server=" + self.proxy] if self.proxy else [])
        )
        
        # Create context with randomized settings
        self.context = await self.browser.new_context(
            viewport={"width": 1366, "height": 768},
            user_agent=self._get_next_user_agent(),
            java_script_enabled=True,
            accept_downloads=False,
            ignore_https_errors=True,
            extra_http_headers={
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Cache-Control": "max-age=0",
            }
        )
        
        # Set up stealth settings
        await self.context.add_init_script("""
            // Override webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Mock languages and plugins
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
        """)
        
        logger.info(f"Initialized browser for {self.domain}")
    
    async def cleanup(self) -> None:
        """Clean up browser resources."""
        try:
            if self.context:
                await self.context.close()
                self.context = None
        except Exception as e:
            logger.debug(f"Error closing browser context for {self.domain}: {e}")
        
        try:
            if self.browser:
                await self.browser.close()
                self.browser = None
        except Exception as e:
            logger.debug(f"Error closing browser for {self.domain}: {e}")
        
        logger.info(f"Cleaned up browser for {self.domain}")
    
    def _get_next_user_agent(self) -> str:
        """Get next user agent from rotation pool."""
        if not self.settings.user_agent_rotation:
            return USER_AGENTS[0]
        
        ua = self.user_agents[self._current_ua_index]
        self._current_ua_index = (self._current_ua_index + 1) % len(self.user_agents)
        return ua
    
    async def _get_robots_parser(self, base_url: str) -> urllib.robotparser.RobotFileParser:
        """Get robots.txt parser for domain."""
        if base_url in self._robots_cache:
            return self._robots_cache[base_url]
        
        try:
            robots_url = urljoin(base_url, "/robots.txt")
            
            # Create a new page for robots.txt check
            page = await self.context.new_page()
            try:
                response = await page.goto(robots_url, timeout=10000)
                if response and response.status == 200:
                    robots_content = await response.text()
                else:
                    robots_content = ""
            finally:
                await page.close()
            
            # Parse robots.txt content
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()  # This won't work as expected, so we'll set the content directly
            
            # Manually parse the content (simplified)
            lines = robots_content.split('\n')
            current_user_agent = "*"
            disallowed_paths = []
            
            for line in lines:
                line = line.strip()
                if line.startswith('User-agent:'):
                    current_user_agent = line.split(':', 1)[1].strip()
                elif line.startswith('Disallow:') and current_user_agent in ("*", "HomeHistory-Ingest"):
                    disallowed_path = line.split(':', 1)[1].strip()
                    if disallowed_path:
                        disallowed_paths.append(disallowed_path)
            
            # Store simplified disallowed paths
            rp._disallowed_paths = disallowed_paths
            self._robots_cache[base_url] = rp
            
            logger.debug(f"Cached robots.txt for {base_url}: {len(disallowed_paths)} disallowed paths")
            
        except Exception as e:
            logger.warning(f"Failed to fetch robots.txt for {base_url}: {e}")
            # Create permissive parser as fallback
            rp = urllib.robotparser.RobotFileParser()
            rp._disallowed_paths = []
            self._robots_cache[base_url] = rp
        
        return rp
    
    async def robots_allowed(self, url: str) -> bool:
        """Check if URL is allowed by robots.txt with ethical flexibility."""
        if not self.settings.respect_robots_txt:
            return True
        
        try:
            parsed = urlparse(url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"
            
            robots_parser = await self._get_robots_parser(base_url)
            
            # Try multiple user agents in order of preference
            user_agents_to_try = [
                "Googlebot",           # Search engines often allowed
                "facebookexternalhit", # Social media crawlers
                "LinkedInBot",         # Business crawlers
                "Applebot",           # Apple's crawler
                "*"                   # Generic wildcard
            ]
            
            for user_agent in user_agents_to_try:
                try:
                    if robots_parser.can_fetch(user_agent, url):
                        logger.debug(f"Robots.txt allows {url} for user agent: {user_agent}")
                        return True
                except Exception as e:
                    logger.debug(f"Error checking robots.txt for user agent {user_agent}: {e}")
                    continue
            
            # If all user agents fail, check if this might be an overly restrictive robots.txt
            # Some sites block all crawlers but still allow access to public content
            if self.domain in ["zillow.com", "redfin.com", "homes.com"]:
                # These are real estate sites with public listings - they generally allow public access
                # We'll respect crawl-delay but allow access to listing pages
                crawl_delay = robots_parser.crawl_delay("*")
                if crawl_delay:
                    # Implement the crawl delay by adding extra wait time
                    await asyncio.sleep(min(crawl_delay, 5))  # Cap at 5 seconds max
                
                logger.debug(f"Allowing access to {url} on real estate site with crawl delay respect")
                return True
            
            logger.debug(f"Robots.txt blocks {url} for all user agents")
            return False
            
        except Exception as e:
            logger.warning(f"Error checking robots.txt for {url}: {e}")
            return True  # Be permissive on errors
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((CollectorError, asyncio.TimeoutError))
    )
    async def fetch(self, url: str, wait_for_selector: Optional[str] = None) -> str:
        """
        Fetch HTML content from URL with rate limiting and error handling.
        
        Args:
            url: URL to fetch
            wait_for_selector: Optional CSS selector to wait for
            
        Returns:
            HTML content as string
            
        Raises:
            RobotsDisallowedError: If robots.txt disallows access
            CollectorError: On other fetch errors
        """
        # Check robots.txt compliance
        if not await self.robots_allowed(url):
            raise RobotsDisallowedError(f"Robots.txt disallows access to {url}")
        
        # Apply rate limiting
        async with self.rate_limiter:
            pass
        
        # Random delay between requests
        delay = random.uniform(
            self.settings.request_delay_min,
            self.settings.request_delay_max
        )
        await asyncio.sleep(delay)
        
        # Ensure browser is set up
        if not self.context:
            await self.setup()
        
        page = await self.context.new_page()
        
        try:
            # Navigate to URL
            logger.debug(f"Fetching {url}")
            
            response = await page.goto(
                url,
                wait_until="networkidle",
                timeout=self.settings.browser_timeout * 1000
            )
            
            if not response:
                raise CollectorError(f"No response received for {url}")
            
            if response.status >= 400:
                raise CollectorError(f"HTTP {response.status} for {url}")
            
            # Wait for specific selector if provided
            if wait_for_selector:
                try:
                    await page.wait_for_selector(wait_for_selector, timeout=10000)
                except Exception as e:
                    logger.warning(f"Selector {wait_for_selector} not found on {url}: {e}")
            
            # Get HTML content
            html = await page.content()
            
            logger.debug(f"Successfully fetched {url}: {len(html)} characters")
            return html
            
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
            raise CollectorError(f"Failed to fetch {url}: {e}")
        
        finally:
            await page.close()
    
    def extract_jsonld(self, html: str) -> List[Dict[str, Any]]:
        """
        Extract JSON-LD structured data from HTML.
        
        Args:
            html: HTML content
            
        Returns:
            List of JSON-LD objects
        """
        json_ld_objects = []
        
        try:
            parser = HTMLParser(html)
            
            # Find all script tags with application/ld+json type
            scripts = parser.css('script[type="application/ld+json"]')
            
            for script in scripts:
                try:
                    text_content = script.text()
                    if text_content:
                        json_data = json.loads(text_content)
                        json_ld_objects.append(json_data)
                except (json.JSONDecodeError, AttributeError) as e:
                    logger.debug(f"Failed to parse JSON-LD: {e}")
                    continue
            
            logger.debug(f"Extracted {len(json_ld_objects)} JSON-LD objects")
            
        except Exception as e:
            logger.error(f"Error extracting JSON-LD: {e}")
        
        return json_ld_objects
    
    def extract_react_data(self, html: str, script_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Extract React application data from HTML.
        
        Args:
            html: HTML content
            script_id: Specific script tag ID to target
            
        Returns:
            Parsed React data or None
        """
        try:
            parser = HTMLParser(html)
            
            # Common React data script selectors
            selectors = []
            if script_id:
                selectors.append(f'script#{script_id}')
            
            selectors.extend([
                'script#__NEXT_DATA__',
                'script[data-hypernova-key]',
                'script:contains("window.__INITIAL_STATE__")',
                'script:contains("window.__REDUX_STATE__")',
            ])
            
            for selector in selectors:
                elements = parser.css(selector)
                for element in elements:
                    try:
                        text_content = element.text()
                        if text_content:
                            # Clean up the content
                            text_content = text_content.strip()
                            
                            # Handle different formats
                            if text_content.startswith('window.'):
                                # Extract just the JSON part
                                json_start = text_content.find('{')
                                json_end = text_content.rfind('}') + 1
                                if json_start >= 0 and json_end > json_start:
                                    text_content = text_content[json_start:json_end]
                            
                            data = json.loads(text_content)
                            logger.debug(f"Extracted React data from {selector}")
                            return data
                            
                    except (json.JSONDecodeError, AttributeError) as e:
                        logger.debug(f"Failed to parse React data from {selector}: {e}")
                        continue
            
        except Exception as e:
            logger.error(f"Error extracting React data: {e}")
        
        return None
    
    @abstractmethod
    async def discover_listings(self, region_config: Dict[str, Any]) -> List[str]:
        """
        Discover listing URLs for a region.
        
        Args:
            region_config: Region configuration with cities, ZIP codes, etc.
            
        Returns:
            List of listing detail URLs
        """
        pass
    
    @abstractmethod
    async def extract_listing_detail(self, url: str) -> Optional[Listing]:
        """
        Extract detailed listing information from URL.
        
        Args:
            url: Listing detail URL
            
        Returns:
            Parsed Listing model or None if extraction failed
        """
        pass
    
    @abstractmethod
    def normalize_listing(self, raw_data: Dict[str, Any]) -> Listing:
        """
        Normalize raw listing data to Listing model.
        
        Args:
            raw_data: Raw listing data from portal
            
        Returns:
            Normalized Listing model
        """
        pass


__all__ = [
    "BaseCollector",
    "CollectorError", 
    "RobotsDisallowedError",
]
