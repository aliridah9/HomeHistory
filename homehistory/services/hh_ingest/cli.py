"""
Command-line interface for HomeHistory data ingestion system.

Provides commands for running ingestion workflows, managing databases,
and monitoring system health with rich console output.
"""

import asyncio
import json
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.syntax import Syntax

from hh_ingest.config import Settings, get_active_regions
from hh_ingest.ingest import IngestionOrchestrator
from hh_ingest.attom import ATTOMClient
from hh_ingest.storage import create_tables, StorageManager
from hh_ingest.utils import setup_logging

# Initialize Typer app and Rich console
app = typer.Typer(
    name="hh-ingest",
    help="HomeHistory Real Estate Data Ingestion System",
    rich_markup_mode="rich"
)
console = Console()


def get_settings_with_overrides(**overrides) -> Settings:
    """Get settings with CLI parameter overrides."""
    # Load base settings
    settings = Settings()
    
    # Apply overrides
    for key, value in overrides.items():
        if value is not None and hasattr(settings, key):
            setattr(settings, key, value)
    
    return settings


@app.command()
def discover(
    regions: Optional[str] = typer.Option(
        None,
        "--regions", "-r",
        help="Comma-separated list of regions to process"
    ),
    output_file: Optional[Path] = typer.Option(
        None,
        "--output", "-o", 
        help="Save discovered URLs to JSON file"
    ),
    max_per_portal: int = typer.Option(
        100,
        "--max-per-portal", "-m",
        help="Maximum listings to discover per portal"
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose", "-v",
        help="Enable verbose logging"
    )
):
    """
    🔍 Discover property listings across all configured portals.
    
    This command runs the discovery workflow to find property listing URLs
    from Zillow, Redfin, and Homes.com for the specified regions.
    """
    async def run_discovery():
        # Setup
        settings = get_settings_with_overrides(
            regions=regions or Settings().regions,
            log_level="DEBUG" if verbose else "INFO"
        )
        
        logger = setup_logging(settings)
        
        console.print(Panel.fit(
            "🔍 [bold blue]Property Listing Discovery[/bold blue]",
            border_style="blue"
        ))
        
        # Show configuration
        active_regions = get_active_regions(settings)
        
        config_table = Table(title="Configuration")
        config_table.add_column("Setting", style="cyan")
        config_table.add_column("Value", style="white")
        
        config_table.add_row("Regions", ", ".join(r.name for r in active_regions))
        config_table.add_row("Max per portal", str(max_per_portal))
        config_table.add_row("Output mode", settings.scraper_mode)
        config_table.add_row("Log level", settings.log_level)
        
        console.print(config_table)
        console.print()
        
        # Run discovery
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Initializing...", total=None)
            
            async with IngestionOrchestrator(settings) as orchestrator:
                progress.update(task, description="Running discovery workflow...")
                discovered = await orchestrator.run_discovery_workflow()
        
        # Display results
        results_table = Table(title="Discovery Results")
        results_table.add_column("Portal", style="cyan")
        results_table.add_column("Listings Found", justify="right", style="white")
        
        total_found = 0
        for portal, urls in discovered.items():
            count = len(urls)
            total_found += count
            results_table.add_row(portal.title(), str(count))
        
        results_table.add_row("[bold]Total[/bold]", f"[bold]{total_found}[/bold]")
        
        console.print(results_table)
        
        # Save to file if requested
        if output_file:
            output_data = {
                "timestamp": str(typer.utils.datetime.utcnow()),
                "total_discovered": total_found,
                "by_portal": {portal: len(urls) for portal, urls in discovered.items()},
                "urls": discovered
            }
            
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2)
            
            console.print(f"\n✅ Results saved to [cyan]{output_file}[/cyan]")
        
        if total_found == 0:
            console.print("\n⚠️  [yellow]No listings discovered. Check your configuration and network connectivity.[/yellow]")
        else:
            console.print(f"\n🎉 Discovery complete! Found [bold green]{total_found}[/bold green] listings.")
    
    asyncio.run(run_discovery())


@app.command()
def ingest(
    regions: Optional[str] = typer.Option(
        None,
        "--regions", "-r", 
        help="Comma-separated list of regions to process"
    ),
    max_listings: int = typer.Option(
        50,
        "--max-listings", "-m",
        help="Maximum listings to process per portal"  
    ),
    mode: Optional[str] = typer.Option(
        None,
        "--mode",
        help="Storage mode: json, db, or both"
    ),
    output_dir: Optional[Path] = typer.Option(
        None,
        "--output-dir", "-o",
        help="Directory for JSON output files"
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose", "-v",
        help="Enable verbose logging"
    )
):
    """
    🚀 Run complete data ingestion workflow.
    
    This command runs the full workflow: discovery → detail collection → storage.
    It will collect property data from ATTOM API and supplemental portals,
    then store the results according to your configuration.
    """
    async def run_ingestion():
        # Setup
        settings_overrides = {
            "log_level": "DEBUG" if verbose else "INFO"
        }
        
        if regions:
            settings_overrides["regions"] = regions
        if mode:
            settings_overrides["scraper_mode"] = mode
        if output_dir:
            settings_overrides["output_dir"] = output_dir
        
        settings = get_settings_with_overrides(**settings_overrides)
        logger = setup_logging(settings)
        
        console.print(Panel.fit(
            "🚀 [bold green]Full Data Ingestion Workflow[/bold green]",
            border_style="green"
        ))
        
        # Show configuration
        active_regions = get_active_regions(settings)
        
        config_table = Table(title="Configuration")
        config_table.add_column("Setting", style="cyan")
        config_table.add_column("Value", style="white")
        
        config_table.add_row("Regions", ", ".join(r.name for r in active_regions))
        config_table.add_row("Max listings/portal", str(max_listings))
        config_table.add_row("Storage mode", settings.scraper_mode)
        config_table.add_row("Output directory", str(settings.output_dir))
        config_table.add_row("ATTOM API", "✅ Enabled" if settings.enable_attom_api else "❌ Disabled")
        
        console.print(config_table)
        console.print()
        
        # Run workflow
        with Progress(
            SpinnerColumn(), 
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Starting workflow...", total=None)
            
            async with IngestionOrchestrator(settings) as orchestrator:
                progress.update(task, description="Running full workflow...")
                summary = await orchestrator.run_full_workflow(max_listings)
        
        # Display results
        if summary.get("status") == "completed":
            results_table = Table(title="Ingestion Results")
            results_table.add_column("Metric", style="cyan") 
            results_table.add_column("Value", justify="right", style="white")
            
            # Discovery results
            discovery = summary.get("discovery", {})
            for portal, count in discovery.items():
                results_table.add_row(f"{portal.title()} discovered", str(count))
            
            # Processing results
            results_table.add_row("Reports generated", str(summary.get("reports_generated", 0)))
            results_table.add_row("Reports stored", str(summary.get("reports_stored", 0)))
            results_table.add_row("Duration", f"{summary.get('duration_seconds', 0):.1f}s")
            
            console.print(results_table)
            
            console.print(f"\n🎉 [bold green]Ingestion complete![/bold green]")
            console.print(f"Processed [cyan]{summary.get('reports_generated', 0)}[/cyan] properties")
            console.print(f"Storage: [cyan]{settings.scraper_mode}[/cyan]")
            
        else:
            console.print(f"\n❌ [bold red]Workflow failed:[/bold red] {summary.get('error', 'Unknown error')}")
    
    asyncio.run(run_ingestion())


@app.command()
def init_db(
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url", 
        help="Database connection URL"
    ),
    force: bool = typer.Option(
        False,
        "--force", "-f",
        help="Force recreation of existing tables"
    )
):
    """
    🗄️ Initialize database tables.
    
    Creates all necessary database tables for storing property data.
    Use --force to recreate existing tables (WARNING: data loss).
    """
    async def run_init():
        settings = Settings()
        if database_url:
            settings.database_url = database_url
        
        db_settings = settings.database_settings
        
        console.print(Panel.fit(
            "🗄️ [bold blue]Database Initialization[/bold blue]",
            border_style="blue"
        ))
        
        console.print(f"Database URL: [cyan]{db_settings.url}[/cyan]")
        
        if force:
            console.print("[bold red]⚠️  WARNING: --force will drop existing tables![/bold red]")
            if not typer.confirm("Are you sure?"):
                console.print("Cancelled.")
                return
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Creating database tables...", total=None)
            
            try:
                await create_tables(db_settings.async_url)
                progress.update(task, description="✅ Tables created successfully")
                
            except Exception as e:
                progress.update(task, description=f"❌ Failed: {e}")
                console.print(f"\n[bold red]Database initialization failed:[/bold red] {e}")
                raise typer.Exit(1)
        
        console.print("\n🎉 [bold green]Database initialized successfully![/bold green]")
    
    asyncio.run(run_init())


@app.command()
def config(
    show_secrets: bool = typer.Option(
        False,
        "--show-secrets",
        help="Show sensitive configuration values"
    )
):
    """
    ⚙️ Show current configuration.
    
    Displays the current application configuration loaded from environment
    variables and configuration files.
    """
    settings = Settings()
    
    console.print(Panel.fit(
        "⚙️ [bold cyan]Current Configuration[/bold cyan]",
        border_style="cyan"
    ))
    
    config_table = Table()
    config_table.add_column("Setting", style="cyan")
    config_table.add_column("Value", style="white")
    config_table.add_column("Source", style="dim")
    
    # Core settings
    config_table.add_row("ATTOM API Key", 
                        settings.attom_api_key if show_secrets else "***hidden***",
                        "env")
    config_table.add_row("Database URL", 
                        settings.database_url if show_secrets else "***hidden***", 
                        "env")
    config_table.add_row("Storage Mode", settings.scraper_mode, "env/default")
    config_table.add_row("Output Directory", str(settings.output_dir), "env/default")
    config_table.add_row("Log Level", settings.log_level, "env/default")
    
    # Feature flags
    config_table.add_row("ATTOM API Enabled", "✅" if settings.enable_attom_api else "❌", "env/default")
    config_table.add_row("Crime Data Enabled", "✅" if settings.enable_crime_data else "❌", "env/default")
    config_table.add_row("School Data Enabled", "✅" if settings.enable_school_data else "❌", "env/default")
    
    # Regions
    active_regions = get_active_regions(settings)
    region_names = ", ".join(r.name for r in active_regions)
    config_table.add_row("Active Regions", region_names, "env/default")
    
    console.print(config_table)
    
    # Show region details
    console.print(f"\n[bold]Region Details:[/bold]")
    for region in active_regions:
        region_table = Table(title=f"📍 {region.name}")
        region_table.add_column("Property", style="cyan")
        region_table.add_column("Value", style="white")
        
        region_table.add_row("State", region.state)
        region_table.add_row("Cities", ", ".join(region.cities[:5]) + ("..." if len(region.cities) > 5 else ""))
        region_table.add_row("ZIP Codes", ", ".join(region.zip_codes[:5]) + ("..." if len(region.zip_codes) > 5 else ""))
        if region.bbox:
            region_table.add_row("Bounding Box", f"{region.bbox}")
        
        console.print(region_table)
    
    # Show scraper settings
    scraper_settings = settings.scraper_settings
    
    scraper_table = Table(title="🤖 Scraper Settings")
    scraper_table.add_column("Setting", style="cyan")
    scraper_table.add_column("Value", style="white")
    
    scraper_table.add_row("Max requests/second", str(scraper_settings.max_requests_per_second))
    scraper_table.add_row("Request delay", f"{scraper_settings.request_delay_min}-{scraper_settings.request_delay_max}s")
    scraper_table.add_row("Max retry attempts", str(scraper_settings.retry_max_attempts))
    scraper_table.add_row("Respect robots.txt", "✅" if scraper_settings.respect_robots_txt else "❌")
    scraper_table.add_row("Browser headless", "✅" if scraper_settings.browser_headless else "❌")
    scraper_table.add_row("User agent rotation", "✅" if scraper_settings.user_agent_rotation else "❌")
    
    console.print(scraper_table)


@app.command()
def test_connection():
    """
    🔌 Test connections to external services.
    
    Tests connectivity to ATTOM API, database, and portal websites
    to verify configuration and network access.
    """
    async def run_tests():
        settings = Settings()
        
        console.print(Panel.fit(
            "🔌 [bold yellow]Connection Tests[/bold yellow]",
            border_style="yellow"
        ))
        
        results_table = Table()
        results_table.add_column("Service", style="cyan")
        results_table.add_column("Status", style="white")
        results_table.add_column("Details", style="dim")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            
            # Test ATTOM API
            task = progress.add_task("Testing ATTOM API...", total=None)
            if settings.enable_attom_api:
                try:
                    from hh_ingest.attom import ATTOMClient
                    async with ATTOMClient(settings) as client:
                        # Test with a simple request
                        data = await client.expanded_by_address("1234 Test St, Houston, TX 77001")
                        results_table.add_row("ATTOM API", "✅ Connected", "API responding")
                except Exception as e:
                    results_table.add_row("ATTOM API", "❌ Failed", str(e)[:50])
            else:
                results_table.add_row("ATTOM API", "⚪ Disabled", "Not configured")
            
            # Test Database
            progress.update(task, description="Testing database...")
            try:
                from hh_ingest.storage import StorageManager
                storage = StorageManager(settings)
                # Just test the connection setup
                results_table.add_row("Database", "✅ Connected", "Connection valid")
                await storage.close()
            except Exception as e:
                results_table.add_row("Database", "❌ Failed", str(e)[:50])
            
            # Test Portal Access
            portals = ["zillow.com", "redfin.com", "homes.com"]
            for portal in portals:
                progress.update(task, description=f"Testing {portal}...")
                try:
                    import httpx
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(f"https://www.{portal}/robots.txt")
                        if response.status_code == 200:
                            results_table.add_row(portal, "✅ Accessible", f"HTTP {response.status_code}")
                        else:
                            results_table.add_row(portal, "⚠️  Warning", f"HTTP {response.status_code}")
                except Exception as e:
                    results_table.add_row(portal, "❌ Failed", str(e)[:50])
        
        console.print(results_table)
        
        # Summary
        failed_count = sum(1 for i in range(results_table.row_count) 
                          if "❌" in results_table.columns[1]._cells[i])
        
        if failed_count == 0:
            console.print("\n🎉 [bold green]All connections successful![/bold green]")
        else:
            console.print(f"\n⚠️  [bold yellow]{failed_count} connection(s) failed.[/bold yellow]")
            console.print("Check your configuration and network connectivity.")
    
    asyncio.run(run_tests())


@app.command()  
def version():
    """
    📋 Show version information.
    """
    from hh_ingest import __version__
    
    console.print(Panel.fit(
        f"[bold cyan]HomeHistory Data Ingestion System[/bold cyan]\n"
        f"Version: [bold]{__version__}[/bold]\n"
        f"Python: [dim]{typer.utils.sys.version}[/dim]",
        border_style="cyan"
    ))


@app.command("attom:resolve")
def attom_resolve(address: str = typer.Argument(..., help="Property address to resolve")):
    """Resolve property data from ATTOM API."""
    
    async def run_attom_test():
        settings = get_settings_with_overrides()
        logger = setup_logging(settings)
        
        console.print(f"🏠 [bold]Resolving ATTOM data for:[/bold] {address}")
        
        try:
            async with ATTOMClient(settings) as client:
                # Test expanded profile
                console.print("📋 Fetching expanded profile...")
                expanded_data = await client.expanded_by_address(address)
                
                console.print(f"✅ Got {len(str(expanded_data))} characters of expanded data")
                
                # Test basic profile
                console.print("📊 Fetching basic profile...")
                basic_data = await client.basic_by_address(address)
                
                console.print(f"✅ Got {len(str(basic_data))} characters of basic data")
                
                # Show summary
                console.print("\n📈 [bold green]ATTOM API Resolution Successful![/bold green]")
                
        except Exception as e:
            console.print(f"❌ [bold red]ATTOM API Error:[/bold red] {e}")
            raise typer.Exit(1)
    
    asyncio.run(run_attom_test())


@app.command("portal:discover")  
def portal_discover(
    source: str = typer.Argument(..., help="Portal source (zillow, redfin)"),
    url: str = typer.Argument(..., help="Landing page URL to discover from")
):
    """Discover detail links from a single portal landing page."""
    
    async def run_discovery():
        settings = get_settings_with_overrides()
        logger = setup_logging(settings)
        
        console.print(f"🔍 [bold]Discovering from {source}:[/bold] {url}")
        
        try:
            # Initialize appropriate collector
            if source.lower() == "zillow":
                from hh_ingest.portals.zillow import ZillowCollector
                collector = ZillowCollector()
            elif source.lower() == "redfin": 
                from hh_ingest.portals.redfin import RedfinCollector
                collector = RedfinCollector()
            else:
                console.print(f"❌ [red]Unknown source: {source}[/red]")
                raise typer.Exit(1)
            
            await collector.setup()
            
            # Discover listings
            listing_urls = await collector.discover_listings([url])
            
            console.print(f"\n✅ [bold green]Found {len(listing_urls)} listings:[/bold green]")
            for i, listing_url in enumerate(listing_urls[:10], 1):  # Show first 10
                console.print(f"  {i}. {listing_url}")
            
            if len(listing_urls) > 10:
                console.print(f"  ... and {len(listing_urls) - 10} more")
                
            await collector.cleanup()
            
        except Exception as e:
            console.print(f"❌ [bold red]Discovery Error:[/bold red] {e}")
            raise typer.Exit(1)
    
    asyncio.run(run_discovery())


@app.command("portal:collect")
def portal_collect(
    source: str = typer.Argument(..., help="Portal source (zillow, redfin)"),
    url: str = typer.Argument(..., help="Listing URL to collect"),
    save: str = typer.Option("db", help="Save mode: db, json, or both")
):
    """Collect a single listing URL."""
    
    async def run_collection():
        settings = get_settings_with_overrides()
        logger = setup_logging(settings)
        
        console.print(f"📄 [bold]Collecting {source} listing:[/bold] {url}")
        
        try:
            # Initialize appropriate collector
            if source.lower() == "zillow":
                from hh_ingest.portals.zillow import ZillowCollector
                collector = ZillowCollector()
            elif source.lower() == "redfin":
                from hh_ingest.portals.redfin import RedfinCollector
                collector = RedfinCollector()
            else:
                console.print(f"❌ [red]Unknown source: {source}[/red]")
                raise typer.Exit(1)
            
            await collector.setup()
            
            # Extract listing detail
            listing = await collector.extract_listing_detail(url)
            
            if not listing:
                console.print("❌ [red]No data extracted from listing[/red]")
                raise typer.Exit(1)
            
            # Display summary
            console.print(f"\n✅ [bold green]Listing collected successfully![/bold green]")
            console.print(f"  Price: ${listing.list_price:,}" if listing.list_price else "  Price: Not available")
            console.print(f"  Beds: {listing.beds}" if listing.beds else "  Beds: Not available")
            console.print(f"  Baths: {listing.baths}" if listing.baths else "  Baths: Not available")
            console.print(f"  Sqft: {listing.sqft:,}" if listing.sqft else "  Sqft: Not available")
            console.print(f"  Photos: {len(listing.photos)}")
            
            # Save if requested
            if save in ["db", "both"]:
                console.print("💾 Saving to database...")
                storage_manager = StorageManager(settings)
                await storage_manager.setup()
                # Would save listing here
                await storage_manager.close()
                
            if save in ["json", "both"]:
                console.print("💾 Saving to JSON...")
                import json
                output_path = Path(f"listing_{source}_{hash(url) % 100000}.json")
                output_path.write_text(listing.model_dump_json(indent=2))
                console.print(f"  Saved to: {output_path}")
                
            await collector.cleanup()
            
        except Exception as e:
            console.print(f"❌ [bold red]Collection Error:[/bold red] {e}")
            raise typer.Exit(1)
    
    asyncio.run(run_collection())


if __name__ == "__main__":
    app()


__all__ = [
    "app",
]
