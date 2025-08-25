"""
Storage layer for real estate data with JSON and PostgreSQL support.

Provides unified interface for persisting property reports to JSON files
and/or PostgreSQL database using SQLAlchemy ORM with async support.
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Union

import orjson
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, 
    String, Text, UniqueConstraint, select, text
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from hh_ingest.config import Settings
from hh_ingest.schema import (
    Listing, ListingPhoto, PropertyCore, Report, SaleRecord, TaxFact
)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base."""
    pass


class Property(Base):
    """Core property record with unique address constraints."""
    
    __tablename__ = "properties"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    # Address fields for indexing and uniqueness
    street: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(10), nullable=False)
    
    # Coordinates
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Optional APN for additional uniqueness
    parcel_apn: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # Relationships
    core_facts: Mapped[Optional["PropertyCoreFacts"]] = relationship(
        "PropertyCoreFacts", 
        back_populates="property",
        cascade="all, delete-orphan"
    )
    tax_facts: Mapped[Optional["PropertyTaxFacts"]] = relationship(
        "PropertyTaxFacts", 
        back_populates="property",
        cascade="all, delete-orphan"
    )
    sale_records: Mapped[List["PropertySaleRecord"]] = relationship(
        "PropertySaleRecord",
        back_populates="property", 
        cascade="all, delete-orphan"
    )
    listings: Mapped[List["PropertyListing"]] = relationship(
        "PropertyListing",
        back_populates="property",
        cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        UniqueConstraint("street", "city", "state", "zip_code", name="uq_property_address"),
        UniqueConstraint("parcel_apn", name="uq_property_apn"),
        Index("idx_property_coords", "lat", "lng"),
        Index("idx_property_state_city", "state", "city"),
        Index("idx_property_updated", "updated_at"),
        Index("idx_property_apn", "parcel_apn"),
    )


class PropertyCoreFacts(Base):
    """Core property characteristics stored as JSONB."""
    
    __tablename__ = "facts_core"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("properties.id", ondelete="CASCADE"),
        unique=True
    )
    
    # Core data as JSONB for flexibility
    core: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    property: Mapped["Property"] = relationship(
        "Property", 
        back_populates="core_facts"
    )
    
    __table_args__ = (
        Index("idx_core_facts_property", "property_id"),
        Index("idx_core_facts_jsonb", "core", postgresql_using="gin"),
    )


class PropertyTaxFacts(Base):
    """Latest tax assessment data stored as JSONB."""
    
    __tablename__ = "tax_facts"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("properties.id", ondelete="CASCADE"),
        unique=True
    )
    
    # Tax data as JSONB
    tax: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    property: Mapped["Property"] = relationship(
        "Property", 
        back_populates="tax_facts"
    )
    
    __table_args__ = (
        Index("idx_tax_facts_property", "property_id"),
        Index("idx_tax_facts_jsonb", "tax", postgresql_using="gin"),
    )


class PropertySaleRecord(Base):
    """Historical sales transactions."""
    
    __tablename__ = "sale_records"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("properties.id", ondelete="CASCADE")
    )
    
    # Sale details
    sale_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # price in cents
    deed_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    buyer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    seller: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    loan_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    lender: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    property: Mapped["Property"] = relationship(
        "Property", 
        back_populates="sale_records"
    )
    
    __table_args__ = (
        UniqueConstraint(
            "property_id", "sale_date", "price", 
            name="uq_sale_record"
        ),
        Index("idx_sale_records_property", "property_id"),
        Index("idx_sale_records_date", "sale_date"),
        Index("idx_sale_records_price", "price"),
    )


class PropertyListing(Base):
    """Property listings from real estate portals."""
    
    __tablename__ = "listings"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("properties.id", ondelete="CASCADE")
    )
    
    # Listing identification
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(2000), nullable=False)
    
    # Listing details
    status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    list_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # price in cents
    dom: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # days on market
    
    # Property specs from listing
    beds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baths: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sqft: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    lot_sqft: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    year_built: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Rich content
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price_history: Mapped[dict] = mapped_column(JSONB, default=list)
    agent: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Status tracking
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # Relationships
    property: Mapped["Property"] = relationship(
        "Property", 
        back_populates="listings"
    )
    photos: Mapped[List["PropertyListingPhoto"]] = relationship(
        "PropertyListingPhoto",
        back_populates="listing",
        cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        UniqueConstraint("source", "url", name="uq_listing_source_url"),
        Index("idx_listings_property", "property_id"),
        Index("idx_listings_source", "source"),
        Index("idx_listings_price", "list_price"),
        Index("idx_listings_updated", "updated_at"),
        Index("idx_listings_active", "is_active"),
    )


class PropertyListingPhoto(Base):
    """Photos associated with property listings."""
    
    __tablename__ = "listing_photos"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("listings.id", ondelete="CASCADE")
    )
    
    url: Mapped[str] = mapped_column(String(2000), nullable=False)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    listing: Mapped["PropertyListing"] = relationship(
        "PropertyListing", 
        back_populates="photos"
    )
    
    __table_args__ = (
        UniqueConstraint("listing_id", "url", name="uq_listing_photo_url"),
        Index("idx_listing_photos_listing", "listing_id"),
        Index("idx_listing_photos_order", "order_index"),
    )


class StorageManager:
    """Unified storage manager for JSON and database persistence."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.engine = None
        self.session_factory = None
        
        if settings.scraper_mode in ("db", "both"):
            self._setup_database()
    
    def _setup_database(self) -> None:
        """Initialize async database engine and session factory."""
        db_settings = self.settings.database_settings
        
        self.engine = create_async_engine(
            db_settings.async_url,
            pool_size=db_settings.pool_size,
            max_overflow=db_settings.max_overflow,
            pool_timeout=db_settings.pool_timeout,
            echo=db_settings.echo,
        )
        
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    
    async def save_report(self, report: Report) -> str:
        """Save report to configured storage backends."""
        results = []
        
        if self.settings.scraper_mode in ("json", "both"):
            json_path = await self._save_to_json(report)
            results.append(f"JSON: {json_path}")
        
        if self.settings.scraper_mode in ("db", "both"):
            db_id = await self._save_to_database(report)
            results.append(f"DB: {db_id}")
        
        return " | ".join(results)
    
    async def _save_to_json(self, report: Report) -> Path:
        """Save report as JSON file."""
        # Generate filename based on address and timestamp
        address_hash = abs(hash(report.primary_address)) % 10000
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"report_{address_hash:04d}_{timestamp}.json"
        
        output_path = self.settings.output_dir / filename
        
        # Convert to JSON-serializable dict
        report_dict = report.model_dump(mode="json")
        
        # Write with orjson for performance
        with open(output_path, "wb") as f:
            f.write(orjson.dumps(report_dict, option=orjson.OPT_INDENT_2))
        
        return output_path
    
    async def _save_to_database(self, report: Report) -> uuid.UUID:
        """Save report to PostgreSQL database with upsert logic."""
        if not self.session_factory:
            raise RuntimeError("Database not initialized")
        
        async with self.session_factory() as session:
            # Find or create property record
            property_record = await self._upsert_property(session, report)
            
            # Update related records
            await self._upsert_core_facts(session, property_record.id, report.core)
            
            if report.tax:
                await self._upsert_tax_facts(session, property_record.id, report.tax)
            
            if report.sales:
                await self._upsert_sale_records(session, property_record.id, report.sales)
            
            if report.listings:
                await self._upsert_listings(session, property_record.id, report.listings)
            
            await session.commit()
            return property_record.id
    
    async def _upsert_property(self, session: AsyncSession, report: Report) -> Property:
        """Find existing property or create new one."""
        addr = report.core.address
        
        # Try to find by address
        stmt = select(Property).where(
            Property.street == addr.street,
            Property.city == addr.city,
            Property.state == addr.state,
            Property.zip_code == addr.zip,
        )
        result = await session.execute(stmt)
        property_record = result.scalar_one_or_none()
        
        if property_record:
            # Update timestamps and coordinates
            property_record.lat = addr.lat
            property_record.lng = addr.lng
            property_record.last_seen_at = datetime.utcnow()
            if report.core.parcel_apn:
                property_record.parcel_apn = report.core.parcel_apn
        else:
            # Create new property
            property_record = Property(
                street=addr.street,
                city=addr.city,
                state=addr.state,
                zip_code=addr.zip,
                lat=addr.lat,
                lng=addr.lng,
                parcel_apn=report.core.parcel_apn,
            )
            session.add(property_record)
            await session.flush()  # Get the ID
        
        return property_record
    
    async def _upsert_core_facts(
        self, session: AsyncSession, property_id: uuid.UUID, core: PropertyCore
    ) -> None:
        """Upsert core property facts."""
        stmt = select(PropertyCoreFacts).where(
            PropertyCoreFacts.property_id == property_id
        )
        result = await session.execute(stmt)
        facts = result.scalar_one_or_none()
        
        core_dict = core.model_dump(mode="json")
        
        if facts:
            facts.core = core_dict
            facts.updated_at = datetime.utcnow()
        else:
            facts = PropertyCoreFacts(
                property_id=property_id,
                core=core_dict
            )
            session.add(facts)
    
    async def _upsert_tax_facts(
        self, session: AsyncSession, property_id: uuid.UUID, tax: TaxFact
    ) -> None:
        """Upsert tax assessment facts."""
        stmt = select(PropertyTaxFacts).where(
            PropertyTaxFacts.property_id == property_id
        )
        result = await session.execute(stmt)
        facts = result.scalar_one_or_none()
        
        tax_dict = tax.model_dump(mode="json")
        
        if facts:
            facts.tax = tax_dict
            facts.updated_at = datetime.utcnow()
        else:
            facts = PropertyTaxFacts(
                property_id=property_id,
                tax=tax_dict
            )
            session.add(facts)
    
    async def _upsert_sale_records(
        self, session: AsyncSession, property_id: uuid.UUID, sales: List[SaleRecord]
    ) -> None:
        """Upsert sale records."""
        for sale in sales:
            stmt = select(PropertySaleRecord).where(
                PropertySaleRecord.property_id == property_id,
                PropertySaleRecord.sale_date == sale.date,
                PropertySaleRecord.price == sale.price
            )
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if not existing:
                record = PropertySaleRecord(
                    property_id=property_id,
                    sale_date=sale.date,
                    price=sale.price,
                    deed_type=sale.deed_type,
                    buyer=sale.buyer,
                    seller=sale.seller,
                    loan_type=sale.loan_type,
                    lender=sale.lender
                )
                session.add(record)
    
    async def _upsert_listings(
        self, session: AsyncSession, property_id: uuid.UUID, listings: List[Listing]
    ) -> None:
        """Upsert property listings and photos."""
        for listing in listings:
            stmt = select(PropertyListing).where(
                PropertyListing.source == listing.source,
                PropertyListing.url == listing.url
            )
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                # Update existing listing
                existing.property_id = property_id
                existing.status = listing.status
                existing.list_price = listing.list_price
                existing.dom = listing.dom
                existing.beds = listing.beds
                existing.baths = listing.baths
                existing.sqft = listing.sqft
                existing.lot_sqft = listing.lot_sqft
                existing.year_built = listing.year_built
                existing.description = listing.description
                existing.price_history = listing.price_history
                existing.agent = listing.agent
                existing.is_active = True
                existing.last_seen_at = datetime.utcnow()
                
                listing_record = existing
            else:
                # Create new listing
                listing_record = PropertyListing(
                    property_id=property_id,
                    source=listing.source,
                    url=listing.url,
                    status=listing.status,
                    list_price=listing.list_price,
                    dom=listing.dom,
                    beds=listing.beds,
                    baths=listing.baths,
                    sqft=listing.sqft,
                    lot_sqft=listing.lot_sqft,
                    year_built=listing.year_built,
                    description=listing.description,
                    price_history=listing.price_history,
                    agent=listing.agent,
                )
                session.add(listing_record)
                await session.flush()  # Get the ID
            
            # Handle photos
            await self._upsert_listing_photos(session, listing_record.id, listing.photos)
    
    async def _upsert_listing_photos(
        self, session: AsyncSession, listing_id: uuid.UUID, photos: List[ListingPhoto]
    ) -> None:
        """Upsert listing photos."""
        for i, photo in enumerate(photos):
            stmt = select(PropertyListingPhoto).where(
                PropertyListingPhoto.listing_id == listing_id,
                PropertyListingPhoto.url == photo.url
            )
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if not existing:
                photo_record = PropertyListingPhoto(
                    listing_id=listing_id,
                    url=photo.url,
                    width=photo.width,
                    height=photo.height,
                    order_index=i
                )
                session.add(photo_record)
    
    async def close(self) -> None:
        """Close database connections."""
        if self.engine:
            await self.engine.dispose()


async def create_tables(database_url: str) -> None:
    """Create all database tables."""
    engine = create_async_engine(database_url)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()


__all__ = [
    "Base",
    "Property",
    "PropertyCoreFacts", 
    "PropertyTaxFacts",
    "PropertySaleRecord",
    "PropertyListing",
    "PropertyListingPhoto",
    "StorageManager",
    "create_tables",
]
