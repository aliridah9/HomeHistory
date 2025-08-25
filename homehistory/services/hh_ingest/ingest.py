"""
Main ingestion orchestrator for real estate data collection.

Coordinates data collection from ATTOM API and supplemental portals,
with comprehensive property research workflow and storage management.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple
from collections import defaultdict

from aiolimiter import AsyncLimiter
from tqdm.asyncio import tqdm

from hh_ingest.config import Settings, START_URLS, get_active_regions, ScraperSettings
from hh_ingest.schema import (
    Address, Hazard, Listing, PropertyCore, Report, SaleRecord, 
    School, TaxFact, CrimeStats
)
from hh_ingest.storage import StorageManager
from hh_ingest.attom import (
    ATTOMClient, map_address_from_attom, map_property_core_from_attom,
    map_tax_fact_from_attom, map_sale_records_from_attom,
    map_crime_stats_from_attom, map_schools_from_attom
)
from hh_ingest.portals import ZillowCollector, RedfinCollector, HomesCollector
from hh_ingest.utils import generate_property_hash, normalize_address, setup_logging

logger = logging.getLogger(__name__)


class IngestionError(Exception):
    """Base exception for ingestion errors."""
    pass


class PropertyProcessor:
    """
    Processes individual properties through the complete research workflow.
    """
    
    def __init__(
        self, 
        attom_client: ATTOMClient,
        collectors: Dict[str, any],
        settings: Settings
    ):
        self.attom_client = attom_client
        self.collectors = collectors
        self.settings = settings
    
    async def process_address(self, address: str) -> Optional[Report]:
        """
        Complete property research workflow for a single address.
        
        Args:
            address: Property address to research
            
        Returns:
            Complete property report or None if processing failed
        """
        try:
            logger.info(f"Processing property: {address}")
            
            # Step 1: Get comprehensive ATTOM data
            attom_data = None
            property_core = None
            
            if self.settings.enable_attom_api:
                try:
                    attom_data = await self.attom_client.get_comprehensive_data(address)
                    property_core = self._extract_property_core_from_attom(attom_data)
                    
                    if not property_core:
                        logger.warning(f"Failed to extract property core from ATTOM for {address}")
                        return None
                        
                except Exception as e:
                    logger.error(f"ATTOM API error for {address}: {e}")
                    return None
            else:
                logger.info("ATTOM API disabled, skipping primary data collection")
                return None
            
            # Step 2: Get supplemental listing data from portals
            listings = await self._collect_portal_listings(property_core.address)
            
            # Step 3: Extract additional data from ATTOM
            tax_fact = None
            sale_records = []
            crime_stats = None
            schools = []
            
            if attom_data:
                # Tax assessment data
                expanded_data = attom_data.get("expanded", {})
                properties = expanded_data.get("property", [])
                if properties:
                    tax_fact = map_tax_fact_from_attom(properties[0])
                
                # Sales history
                sales_data = attom_data.get("sales", {})
                sale_records = map_sale_records_from_attom(sales_data)
                
                # Contextual data (crime and schools)
                contextual_data = attom_data.get("contextual", {})
                if contextual_data:
                    # Crime statistics
                    if self.settings.enable_crime_data:
                        crime_data = contextual_data.get("crime", {})
                        crime_stats = map_crime_stats_from_attom(crime_data)
                    
                    # School information
                    if self.settings.enable_school_data:
                        schools_data = contextual_data.get("schools", {})
                        coords = attom_data.get("coordinates")
                        schools = map_schools_from_attom(schools_data, coords)
            
            # Step 4: Create comprehensive report
            report = Report(
                core=property_core,
                tax=tax_fact,
                sales=sale_records,
                listings=listings,
                crime=crime_stats,
                schools=schools,
                hazards=None,  # Could be enhanced with additional APIs
                source_attribution=self._build_source_attribution(attom_data, listings)
            )
            
            logger.info(
                f"Completed property research for {address}: "
                f"{len(listings)} listings, {len(sale_records)} sales, "
                f"{len(schools)} schools"
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to process property {address}: {e}")
            return None
    
    def _extract_property_core_from_attom(self, attom_data: Dict) -> Optional[PropertyCore]:
        """Extract PropertyCore from ATTOM comprehensive data."""
        try:
            expanded_data = attom_data.get("expanded", {})
            properties = expanded_data.get("property", [])
            
            if not properties:
                logger.warning("No property data in ATTOM response")
                return None
            
            # Use first property result
            return map_property_core_from_attom(properties[0])
            
        except Exception as e:
            logger.error(f"Failed to extract property core from ATTOM: {e}")
            return None
    
    async def _collect_portal_listings(self, address: Address) -> List[Listing]:
        """Collect listings from all available portals."""
        listings = []
        
        # We have the property address, so we could search each portal
        # For now, we'll simulate the discovery process
        # In production, you'd want more sophisticated address matching
        
        for source, collector in self.collectors.items():
            try:
                logger.debug(f"Searching {source} for property at {address.full}")
                
                # This is simplified - in reality you'd need to search the portal
                # and match results to the specific address
                # For now, we'll skip portal collection in this method
                # and rely on the separate discovery workflow
                
            except Exception as e:
                logger.warning(f"Failed to collect {source} listings for {address.full}: {e}")
        
        return listings
    
    def _build_source_attribution(
        self, 
        attom_data: Optional[Dict], 
        listings: List[Listing]
    ) -> List[str]:
        """Build list of data sources used in report."""
        sources = []
        
        if attom_data:
            sources.append("ATTOM Data")
        
        portal_sources = {listing.source for listing in listings}
        for source in portal_sources:
            sources.append(source.title())
        
        return sources


class IngestionOrchestrator:
    """
    Main orchestrator for real estate data ingestion workflow.
    
    Coordinates discovery, detail collection, and storage across
    all data sources with proper rate limiting and error handling.
    """
    
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or Settings()
        self.logger = setup_logging(self.settings)
        
        # Initialize storage manager
        self.storage_manager = StorageManager(self.settings)
        
        # Rate limiters for different domains
        scraper_settings = self.settings.scraper_settings
        self.rate_limiters = {
            "zillow.com": AsyncLimiter(
                scraper_settings.max_requests_per_second, 
                time_period=1.0
            ),
            "redfin.com": AsyncLimiter(
                scraper_settings.max_requests_per_second, 
                time_period=1.0
            ),
            "homes.com": AsyncLimiter(
                scraper_settings.max_requests_per_second, 
                time_period=1.0
            ),
        }
        
        # Initialize collectors
        self.collectors = {}
        self.attom_client = None
        
    async def __aenter__(self):
        await self.setup()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.cleanup()
    
    async def setup(self) -> None:
        """Initialize all clients and collectors."""
        logger.info("Setting up ingestion orchestrator...")
        
        # Initialize ATTOM client
        if self.settings.enable_attom_api:
            self.attom_client = ATTOMClient(self.settings)
            await self.attom_client.__aenter__()
        
        # Initialize portal collectors
        scraper_settings = self.settings.scraper_settings
        
        self.collectors = {}
        
        # Only initialize enabled portals based on configuration
        if "zillow" in self.settings.enabled_portals and self.settings.enable_zillow:
            self.collectors["zillow"] = ZillowCollector(
                rate_limiter=self.rate_limiters["zillow.com"],
                scraper_settings=scraper_settings,
                proxy=self.settings.http_proxy
            )
        
        if "redfin" in self.settings.enabled_portals and self.settings.enable_redfin:
            self.collectors["redfin"] = RedfinCollector(
                rate_limiter=self.rate_limiters["redfin.com"],
                scraper_settings=scraper_settings,
                proxy=self.settings.http_proxy
            )
        
        if "homes" in self.settings.enabled_portals and self.settings.enable_homes:
            self.collectors["homes"] = HomesCollector(
                rate_limiter=self.rate_limiters["homes.com"],
                scraper_settings=scraper_settings,
                proxy=self.settings.http_proxy
            )
        
        # Setup collectors
        for collector in self.collectors.values():
            await collector.setup()
        
        logger.info("Orchestrator setup complete")
    
    async def cleanup(self) -> None:
        """Clean up all resources."""
        logger.info("Cleaning up orchestrator...")
        
        # Cleanup collectors
        for collector in self.collectors.values():
            await collector.cleanup()
        
        # Cleanup ATTOM client
        if self.attom_client:
            await self.attom_client.__aexit__(None, None, None)
        
        # Cleanup storage
        await self.storage_manager.close()
        
        logger.info("Orchestrator cleanup complete")
    
    async def run_discovery_workflow(self) -> Dict[str, List[str]]:
        """
        Run discovery workflow using configured start URLs.
        
        Returns:
            Dictionary mapping portal names to discovered listing URLs
        """
        logger.info("Starting discovery workflow...")
        
        all_listings = defaultdict(list)
        
        # Discover from each enabled portal using predefined start URLs
        for portal_name, collector in self.collectors.items():
            if portal_name not in START_URLS:
                logger.warning(f"No start URLs configured for {portal_name}, skipping")
                continue
                
            try:
                logger.info(f"Running {portal_name} discovery")
                start_urls = START_URLS[portal_name]
                
                listing_urls = await collector.discover_listings(start_urls)
                all_listings[portal_name].extend(listing_urls)
                
                logger.info(f"Discovered {len(listing_urls)} listings from {portal_name}")
                
            except Exception as e:
                logger.error(f"Discovery failed for {portal_name}: {e}")
        
        # Log summary
        total_discovered = sum(len(urls) for urls in all_listings.values())
        logger.info(f"Discovery complete: {total_discovered} total listings discovered")
        
        for portal, urls in all_listings.items():
            logger.info(f"  {portal}: {len(urls)} listings")
        
        return dict(all_listings)
    
    async def run_detail_collection_workflow(
        self, 
        discovered_listings: Dict[str, List[str]],
        max_per_portal: Optional[int] = None
    ) -> List[Report]:
        """
        Collect detailed information for discovered listings.
        
        Args:
            discovered_listings: Output from discovery workflow
            max_per_portal: Maximum listings to process per portal
            
        Returns:
            List of complete property reports
        """
        logger.info("Starting detail collection workflow...")
        
        # Collect detailed listings from portals
        all_listings = []
        
        for portal_name, urls in discovered_listings.items():
            if not urls:
                continue
            
            collector = self.collectors[portal_name]
            
            # Limit URLs if specified
            if max_per_portal:
                urls = urls[:max_per_portal]
            
            logger.info(f"Collecting {len(urls)} listings from {portal_name}")
            
            # Process URLs with progress bar
            semaphore = asyncio.Semaphore(self.settings.scraper_settings.max_concurrent_requests)
            
            async def process_url(url: str) -> Optional[Listing]:
                async with semaphore:
                    try:
                        return await collector.extract_listing_detail(url)
                    except Exception as e:
                        logger.warning(f"Failed to extract {url}: {e}")
                        return None
            
            portal_listings = []
            tasks = [process_url(url) for url in urls]
            
            results = await tqdm.gather(
                *tasks, 
                desc=f"Collecting {portal_name}", 
                leave=False,
                return_exceptions=True
            )
            
            for result in results:
                if isinstance(result, Listing):
                    portal_listings.append(result)
                elif isinstance(result, Exception):
                    logger.warning(f"Task failed: {result}")
            
            all_listings.extend(portal_listings)
            logger.info(f"Collected {len(portal_listings)} valid listings from {portal_name}")
        
        # Now process unique addresses through comprehensive research
        logger.info("Processing unique addresses for comprehensive research...")
        
        # Group listings by normalized address
        address_groups = defaultdict(list)
        for listing in all_listings:
            # Use listing URL as a proxy for address matching
            # In production, you'd want more sophisticated address normalization
            address_key = listing.url.split('/')[-2] if '/' in listing.url else listing.url
            address_groups[address_key].append(listing)
        
        logger.info(f"Found {len(address_groups)} unique addresses")
        
        # Process each address group
        reports = []
        property_processor = PropertyProcessor(
            self.attom_client, 
            self.collectors, 
            self.settings
        )
        
        # For demo purposes, we'll create reports from the listings we have
        # In production, you'd extract addresses and run full ATTOM research
        
        for address_key, listings in list(address_groups.items())[:10]:  # Limit for demo
            try:
                # Create a basic report from the listings
                # This is simplified - normally you'd run the full ATTOM workflow
                
                if not listings:
                    continue
                
                primary_listing = listings[0]
                
                # Create minimal property core (would normally come from ATTOM)
                address = Address(
                    full=f"Property from {primary_listing.source}",
                    street="Unknown Street", 
                    city="Unknown City",
                    state="TX",  # Default for demo
                    zip="00000",
                    lat=29.7604,  # Houston coords for demo
                    lng=-95.3698
                )
                
                property_core = PropertyCore(
                    address=address,
                    parcel_apn=None,
                    property_type="Single Family",
                    year_built=primary_listing.year_built,
                    beds=primary_listing.beds,
                    baths=primary_listing.baths,
                    building_sqft=primary_listing.sqft,
                    lot_sqft=primary_listing.lot_sqft,
                    features={}
                )
                
                report = Report(
                    core=property_core,
                    tax=None,
                    sales=[],
                    listings=listings,
                    crime=None,
                    schools=[],
                    hazards=None,
                    source_attribution=[listing.source for listing in listings]
                )
                
                reports.append(report)
                
            except Exception as e:
                logger.error(f"Failed to create report for {address_key}: {e}")
        
        logger.info(f"Created {len(reports)} property reports")
        return reports
    
    async def run_full_workflow(
        self, 
        max_listings_per_portal: Optional[int] = 50
    ) -> Dict[str, any]:
        """
        Run complete ingestion workflow: discovery -> detail -> storage.
        
        Args:
            max_listings_per_portal: Limit listings per portal for testing
            
        Returns:
            Workflow summary statistics
        """
        start_time = datetime.utcnow()
        logger.info("Starting full ingestion workflow...")
        
        try:
            # Step 1: Discovery
            logger.info("=" * 50)
            logger.info("STEP 1: DISCOVERY")
            logger.info("=" * 50)
            
            discovered_listings = await self.run_discovery_workflow()
            
            if not any(discovered_listings.values()):
                logger.warning("No listings discovered, workflow complete")
                return {"status": "no_listings_found"}
            
            # Step 2: Detail Collection
            logger.info("=" * 50)
            logger.info("STEP 2: DETAIL COLLECTION") 
            logger.info("=" * 50)
            
            reports = await self.run_detail_collection_workflow(
                discovered_listings, 
                max_per_portal=max_listings_per_portal
            )
            
            if not reports:
                logger.warning("No reports generated, workflow complete")
                return {"status": "no_reports_generated"}
            
            # Step 3: Storage
            logger.info("=" * 50)
            logger.info("STEP 3: STORAGE")
            logger.info("=" * 50)
            
            stored_reports = []
            for report in tqdm(reports, desc="Storing reports"):
                try:
                    result = await self.storage_manager.save_report(report)
                    stored_reports.append(result)
                    logger.debug(f"Stored report: {result}")
                except Exception as e:
                    logger.error(f"Failed to store report: {e}")
            
            # Step 4: Summary
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            summary = {
                "status": "completed",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(), 
                "duration_seconds": duration,
                "discovery": {
                    portal: len(urls) for portal, urls in discovered_listings.items()
                },
                "reports_generated": len(reports),
                "reports_stored": len(stored_reports),
                "storage_mode": self.settings.scraper_mode,
                "regions_processed": len(get_active_regions(self.settings))
            }
            
            logger.info("=" * 50)
            logger.info("WORKFLOW COMPLETE")
            logger.info("=" * 50)
            logger.info(f"Duration: {duration:.1f} seconds")
            logger.info(f"Reports generated: {len(reports)}")
            logger.info(f"Reports stored: {len(stored_reports)}")
            logger.info(f"Storage mode: {self.settings.scraper_mode}")
            
            return summary
            
        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            return {"status": "failed", "error": str(e)}


__all__ = [
    "IngestionOrchestrator",
    "PropertyProcessor",
    "IngestionError",
]
